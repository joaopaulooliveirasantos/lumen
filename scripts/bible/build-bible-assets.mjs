#!/usr/bin/env node
/**
 * Gera os arquivos estáticos das Bíblias servidos pela VPS (Fase 3 da migração do frontend).
 *
 * Saída (padrão: lumen/dist-biblias/biblias):
 *   manifest.json                       lista de traduções e versão atual (cache curto)
 *   <traducao>/<versao>/index.json      livros, testamento e versículos por capítulo (imutável)
 *   <traducao>/<versao>/<slug>.json     um livro inteiro, no formato BibleBook (imutável)
 * Cada .json ganha um irmão .json.gz para o `gzip_static` do Nginx.
 *
 * A versão é um hash do conteúdo da tradução: só muda se algum texto mudar, e versões antigas
 * podem ficar no servidor sem conflito (o app só rebaixa o que mudou).
 *
 * Uso: node scripts/bible/build-bible-assets.mjs [--out <pasta>]
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

export const SCHEMA_VERSION = 1;

export const TRANSLATION_SOURCES = [
  { id: "ave-maria", nome: "Ave Maria", editora: "Ave Maria Editora", arquivo: "ave maria/bibliaAveMaria.json" },
  { id: "paulus", nome: "Bíblia Pastoral", editora: "Paulus Editora", arquivo: "paulus/bibliaPastoralPaulus.json" },
];

const EXPECTED_BOOKS = { antigoTestamento: 46, novoTestamento: 27 };

export function slugify(nome, position) {
  const ascii = nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${String(position).padStart(2, "0")}-${ascii}`;
}

/** Lança um erro descrevendo cada problema estrutural encontrado. */
export function validateBible(data, label, expected = EXPECTED_BOOKS) {
  const problems = [];
  const names = new Set();
  for (const testamento of ["antigoTestamento", "novoTestamento"]) {
    const books = data[testamento];
    if (!Array.isArray(books)) {
      problems.push(`${testamento} ausente`);
      continue;
    }
    if (expected[testamento] !== undefined && books.length !== expected[testamento]) {
      problems.push(`${testamento}: ${books.length} livros (esperado ${expected[testamento]})`);
    }
    for (const book of books) {
      if (!book.nome) problems.push(`${testamento}: livro sem nome`);
      if (names.has(book.nome)) problems.push(`livro duplicado: ${book.nome}`);
      names.add(book.nome);
      if (!Array.isArray(book.capitulos) || book.capitulos.length === 0) {
        problems.push(`${book.nome}: sem capítulos`);
        continue;
      }
      book.capitulos.forEach((chapter, i) => {
        if (chapter.capitulo !== i + 1) problems.push(`${book.nome}: capítulo ${chapter.capitulo} fora de sequência`);
        if (!Array.isArray(chapter.versiculos) || chapter.versiculos.length === 0) {
          problems.push(`${book.nome} ${chapter.capitulo}: sem versículos`);
          return;
        }
        for (const verse of chapter.versiculos) {
          if (!Number.isInteger(verse.versiculo) || typeof verse.texto !== "string" || !verse.texto.trim()) {
            problems.push(`${book.nome} ${chapter.capitulo}:${verse.versiculo}: versículo inválido`);
          }
        }
      });
    }
  }
  if (problems.length > 0) {
    throw new Error(`Bíblia ${label} inválida:\n  - ${problems.join("\n  - ")}`);
  }
}

/** Monta índice e livros de uma tradução, sem tocar no disco. */
export function buildTranslationAssets(source, data, expected) {
  validateBible(data, source.id, expected);

  const ordered = [
    ...data.antigoTestamento.map((book) => ({ testamento: "antigoTestamento", book })),
    ...data.novoTestamento.map((book) => ({ testamento: "novoTestamento", book })),
  ];

  const hash = createHash("sha256");
  const books = ordered.map(({ testamento, book }, i) => {
    const slug = slugify(book.nome, i + 1);
    const json = JSON.stringify({ nome: book.nome, capitulos: book.capitulos });
    hash.update(slug).update("\0").update(json).update("\0");
    return { slug, testamento, book, json };
  });
  const versao = hash.digest("hex").slice(0, 12);

  const index = {
    schema: SCHEMA_VERSION,
    id: source.id,
    versao,
    livros: books.map(({ slug, testamento, book, json }) => ({
      slug,
      nome: book.nome,
      testamento,
      versiculosPorCapitulo: book.capitulos.map((c) => c.versiculos.length),
      bytes: Buffer.byteLength(json),
    })),
  };

  return { versao, index, books: books.map(({ slug, json }) => ({ slug, json })) };
}

function writeWithGzip(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
  writeFileSync(`${path}.gz`, gzipSync(content, { level: 9 }));
}

export function buildAll({ biblesDir, outDir }) {
  rmSync(outDir, { recursive: true, force: true });
  const manifest = { schema: SCHEMA_VERSION, geradoEm: new Date().toISOString(), traducoes: [] };
  let totalRaw = 0;
  let totalGz = 0;

  for (const source of TRANSLATION_SOURCES) {
    const data = JSON.parse(readFileSync(join(biblesDir, source.arquivo), "utf8"));
    const { versao, index, books } = buildTranslationAssets(source, data);
    const base = join(outDir, source.id, versao);

    writeWithGzip(join(base, "index.json"), JSON.stringify(index));
    for (const { slug, json } of books) {
      writeWithGzip(join(base, `${slug}.json`), json);
      totalRaw += Buffer.byteLength(json);
      totalGz += gzipSync(json, { level: 9 }).length;
    }

    manifest.traducoes.push({ id: source.id, nome: source.nome, editora: source.editora, versao, livros: books.length });
    console.log(`${source.id}: versão ${versao}, ${books.length} livros`);
  }

  writeWithGzip(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`Total dos livros: ${(totalRaw / 1e6).toFixed(1)} MB (${(totalGz / 1e6).toFixed(1)} MB com gzip)`);
  console.log(`Saída: ${outDir}`);
  return manifest;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
  const outArg = process.argv.indexOf("--out");
  const outDir = outArg > -1 ? resolve(process.argv[outArg + 1]) : join(repoRoot, "dist-biblias", "biblias");
  try {
    buildAll({ biblesDir: join(repoRoot, "biblias"), outDir });
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
