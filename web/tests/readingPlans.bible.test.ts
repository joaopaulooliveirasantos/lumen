// @vitest-environment node
// Substitui mobile/scripts/validate-reading-plans.js: toda referência de todo plano de leitura precisa
// resolver para um trecho não vazio nas duas traduções. `resolveReference` devolve [] em silêncio
// quando o nome do livro ou o intervalo não bate, o que mostraria uma leitura em branco no app.
// Lê os mesmos JSONs de lumen/biblias que o gerador usa para publicar na VPS.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { TRANSLATION_SOURCES, type RawBibleData } from "../../scripts/bible/build-bible-assets.mjs";
import { readingPlans } from "../src/data/readingPlans";
import { resolveReference, type BibleBookLoader } from "../src/services/readingPlans";
import type { BibleBook } from "../src/types/bible";
import type { BibleTranslationId } from "../src/types/settings";

const biblesDir = new URL("../../biblias/", import.meta.url);

const booksByTranslation = new Map<string, Map<string, BibleBook>>(
  TRANSLATION_SOURCES.map((source) => {
    const data = JSON.parse(readFileSync(new URL(source.arquivo.replace(/ /g, "%20"), biblesDir), "utf8")) as RawBibleData;
    const books = [...data.antigoTestamento, ...data.novoTestamento].map((b) => [b.nome, b as BibleBook] as const);
    return [source.id, new Map(books)];
  }),
);

// Lacunas reais de conteúdo entre as traduções (não são typos). Só é ignorada a falha que bater
// exatamente com plano, dia, tradução e referência; qualquer outra, mesmo no mesmo livro, quebra o teste.
const KNOWN_GAPS = [
  {
    // A Pastoral (Paulus) só traz 10 capítulos de Ester, sem os acréscimos gregos que a Ave Maria
    // numera como 11–16. Nessa tradução, este trecho do dia 227 fica sem texto.
    key: 'paulus|biblia-em-um-ano|227|{"livro":"Ester","capituloInicio":14,"capituloFim":16}',
  },
];
const knownGapKeys = new Set(KNOWN_GAPS.map((g) => g.key));

const loader: BibleBookLoader = async (translation, nome) => booksByTranslation.get(translation)?.get(nome);

describe("planos de leitura contra as Bíblias", () => {
  it.each(TRANSLATION_SOURCES.map((s) => s.id as BibleTranslationId))(
    "toda referência resolve para um trecho não vazio (%s)",
    async (translation) => {
      const failures: string[] = [];
      let total = 0;
      for (const plan of readingPlans) {
        for (const dia of plan.dias) {
          for (const ref of dia.referencias) {
            total++;
            const passages = await resolveReference(ref, translation, loader);
            const key = `${translation}|${plan.id}|${dia.dia}|${JSON.stringify(ref)}`;
            if (passages.length === 0 && !knownGapKeys.has(key)) failures.push(key);
          }
        }
      }
      expect(total).toBeGreaterThan(0);
      expect(failures).toEqual([]);
    },
    60_000,
  );
});
