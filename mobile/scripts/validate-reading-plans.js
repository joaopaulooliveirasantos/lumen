#!/usr/bin/env node
/**
 * Valida que toda BibleReference de todo plano de leitura (mobile/src/data/readingPlans.ts
 * e os arquivos que ele importa) resolve para um trecho não vazio em ambas as
 * traduções bundladas no app (Ave Maria e Paulus).
 *
 * Por que isso importa: `resolveReference` (mobile/src/services/readingPlans.ts) retorna
 * silenciosamente `[]` quando o nome do livro não bate exatamente ou o capítulo/versículo
 * está fora do range — isso não quebra o app, só mostra uma tela de leitura em branco
 * para o usuário, sem nenhum aviso. Com centenas de referências por plano, um único
 * typo de nome de livro passa despercebido sem essa validação.
 *
 * Uso: node mobile/scripts/validate-reading-plans.js
 * (roda com o Node puro do sistema — usa o compilador `typescript`, já presente como
 * devDependency, para transpilar os .ts em memória; não precisa de ts-node/tsx.)
 */
"use strict";

const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const MOBILE_ROOT = path.resolve(__dirname, "..");
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp"];

const moduleCache = new Map();

function resolveRelative(fromDir, request) {
  let resolved = path.resolve(fromDir, request);
  const candidates = [
    resolved,
    `${resolved}.ts`,
    `${resolved}.tsx`,
    path.join(resolved, "index.ts"),
    path.join(resolved, "index.tsx"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return resolved;
}

function loadTsModule(absPath) {
  if (moduleCache.has(absPath)) return moduleCache.get(absPath);

  const source = fs.readFileSync(absPath, "utf8");
  const { outputText } = ts.transpileModule(source, {
    fileName: absPath,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2019,
      esModuleInterop: true,
    },
  });

  const mod = { exports: {} };
  moduleCache.set(absPath, mod.exports); // set before executing, in case of cycles

  const dirname = path.dirname(absPath);
  const customRequire = (request) => {
    if (IMAGE_EXTENSIONS.some((ext) => request.endsWith(ext))) {
      return { __isStubbedAsset: true, source: request };
    }
    if (request.startsWith(".")) {
      const resolved = resolveRelative(dirname, request);
      if (resolved.endsWith(".ts") || resolved.endsWith(".tsx")) {
        return loadTsModule(resolved).exports;
      }
      if (resolved.endsWith(".json")) {
        return require(resolved);
      }
      // Non-TS relative module (shouldn't normally happen for data/type files).
      return require(resolved);
    }
    return require(request);
  };

  const fn = new Function("exports", "require", "module", "__filename", "__dirname", outputText);
  fn(mod.exports, customRequire, mod, absPath, dirname);
  moduleCache.set(absPath, mod.exports);
  return mod;
}

// ---------------------------------------------------------------------------
// Bíblia bundlada (as duas traduções) — mesma fonte usada por getBibleData().
// ---------------------------------------------------------------------------
const BIBLE_SOURCES = {
  "ave-maria": path.join(MOBILE_ROOT, "..", "biblias", "ave maria", "bibliaAveMaria.json"),
  paulus: path.join(MOBILE_ROOT, "..", "biblias", "paulus", "bibliaPastoralPaulus.json"),
};

function loadBibleData(translation) {
  const raw = fs.readFileSync(BIBLE_SOURCES[translation], "utf8");
  return JSON.parse(raw);
}

function findBook(bibleData, nome) {
  return (
    bibleData.antigoTestamento.find((b) => b.nome === nome) ??
    bibleData.novoTestamento.find((b) => b.nome === nome)
  );
}

// Mirrors resolveReference() in mobile/src/services/readingPlans.ts.
function resolveReference(bibleData, reference) {
  const book = findBook(bibleData, reference.livro);
  if (!book) return [];

  const capituloFim = reference.capituloFim ?? reference.capituloInicio;
  const passages = [];

  for (const chapter of book.capitulos) {
    if (chapter.capitulo < reference.capituloInicio || chapter.capitulo > capituloFim) continue;

    const isFirstChapter = chapter.capitulo === reference.capituloInicio;
    const isLastChapter = chapter.capitulo === capituloFim;
    const minVerse = isFirstChapter && reference.versiculoInicio !== undefined ? reference.versiculoInicio : 1;
    const maxVerse =
      isLastChapter && reference.versiculoFim !== undefined ? reference.versiculoFim : Number.MAX_SAFE_INTEGER;

    const versiculos = chapter.versiculos.filter((v) => v.versiculo >= minVerse && v.versiculo <= maxVerse);
    if (versiculos.length > 0) passages.push({ capitulo: chapter.capitulo, versiculos });
  }

  return passages;
}

// ---------------------------------------------------------------------------
// Exceções conhecidas: lacunas reais de conteúdo entre as duas traduções
// bundladas (não são erros de transcrição/typo, não dá pra "consertar"
// ajustando a referência — a tradução simplesmente não tem esses capítulos).
// Cada entrada precisa do motivo documentado. Uma falha só é ignorada aqui
// se bater exatamente com plano+dia+tradução+livro+capítulos — qualquer
// outra falha (inclusive uma nova lacuna no mesmo livro) ainda quebra o CI.
// ---------------------------------------------------------------------------
const KNOWN_GAPS = [
  {
    plano: "biblia-em-um-ano",
    dia: 227,
    traducao: "paulus",
    livro: "Ester",
    capituloInicio: 14,
    capituloFim: 16,
    motivo:
      'A tradução Paulus só traz 10 capítulos de Ester (sem os acréscimos deuterocanônicos gregos que a Ave Maria numera como 11-16). Para quem lê nessa tradução, este trecho específico do dia 227 fica sem texto — o botão "Ester 14–16" ainda abre a tela da Bíblia normalmente.',
  },
];

function isKnownGap(failure) {
  return KNOWN_GAPS.some(
    (g) =>
      g.plano === failure.plano &&
      g.dia === failure.dia &&
      g.traducao === failure.traducao &&
      g.livro === failure.referencia.livro &&
      g.capituloInicio === failure.referencia.capituloInicio &&
      g.capituloFim === failure.referencia.capituloFim,
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
  const readingPlansPath = path.join(MOBILE_ROOT, "src", "data", "readingPlans.ts");
  const { readingPlans } = loadTsModule(readingPlansPath).exports;

  if (!Array.isArray(readingPlans) || readingPlans.length === 0) {
    console.error("Nenhum plano encontrado em src/data/readingPlans.ts — algo está errado no loader.");
    process.exit(1);
  }

  const translations = Object.keys(BIBLE_SOURCES);
  const bibleByTranslation = Object.fromEntries(translations.map((t) => [t, loadBibleData(t)]));

  const failures = [];
  let totalRefs = 0;

  for (const plan of readingPlans) {
    if (!Array.isArray(plan.dias)) {
      failures.push({ plano: plan.id, erro: `plano sem array "dias" válido` });
      continue;
    }
    for (const day of plan.dias) {
      for (const ref of day.referencias ?? []) {
        totalRefs += 1;
        for (const translation of translations) {
          const passages = resolveReference(bibleByTranslation[translation], ref);
          if (passages.length === 0) {
            failures.push({
              plano: plan.id,
              dia: day.dia,
              referencia: ref,
              traducao: translation,
              erro: "resolveReference retornou vazio (nome de livro ou capítulo/versículo inválido)",
            });
          }
        }
      }
    }
  }

  const knownFailures = failures.filter(isKnownGap);
  const newFailures = failures.filter((f) => !isKnownGap(f));

  console.log(`Planos verificados: ${readingPlans.length}`);
  console.log(`Referências verificadas: ${totalRefs} (× ${translations.length} traduções)`);

  if (knownFailures.length > 0) {
    console.log(`\n${knownFailures.length} lacuna(s) conhecida(s) e documentada(s) (não quebram o build):`);
    for (const f of knownFailures) {
      const gap = KNOWN_GAPS.find(
        (g) => g.plano === f.plano && g.dia === f.dia && g.traducao === f.traducao && g.livro === f.referencia.livro,
      );
      console.log(`  - [${f.plano} / dia ${f.dia} / ${f.traducao}] ${f.referencia.livro}: ${gap.motivo}`);
    }
  }

  if (newFailures.length > 0) {
    console.error(`\n${newFailures.length} FALHA(S) NOVA(S) ENCONTRADA(S):\n`);
    for (const f of newFailures) {
      console.error(JSON.stringify(f));
    }
    process.exit(1);
  }

  console.log("\nOK — todas as referências resolvem em ambas as traduções (fora as lacunas conhecidas acima).");
}

main();
