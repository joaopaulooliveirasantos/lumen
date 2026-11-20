import { describe, expect, it } from "vitest";
import { buildRosarySteps } from "../src/services/rosary";
import { getPlanStatus, resolveReference, type BibleBookLoader } from "../src/services/readingPlans";
import { readingPlans } from "../src/data/readingPlans";
import { pickBestVoice, rankVoices } from "../src/services/ttsVoiceRanking";
import type { BibleBook } from "../src/types/bible";

describe("rosary", () => {
  it.each(["gozosos", "dolorosos", "gloriosos", "luminosos"] as const)("monta 79 passos sequenciais (%s)", (group) => {
    const steps = buildRosarySteps(group);
    expect(steps).toHaveLength(79);
    expect(steps.map((s) => s.ordem)).toEqual(Array.from({ length: 79 }, (_, i) => i + 1));
    expect(steps.filter((s) => s.titulo === "Ave Maria")).toHaveLength(53);
  });
});

describe("planos de leitura", () => {
  it("carrega os planos com capa e dias consistentes", () => {
    expect(readingPlans.length).toBeGreaterThan(0);
    for (const plan of readingPlans) {
      expect(plan.capa.imagem).toBeTruthy();
      expect(plan.dias).toHaveLength(plan.duracaoDias);
    }
  });

  it("calcula o status do plano", () => {
    const plan = readingPlans[0];
    expect(getPlanStatus(plan, undefined)).toEqual({ status: "nao-iniciado", diasConcluidos: 0, proximoDia: 1 });
    const parcial = getPlanStatus(plan, { planoId: plan.id, diasConcluidos: [1, 3], iniciadoEm: "x" });
    expect(parcial).toEqual({ status: "em-andamento", diasConcluidos: 2, proximoDia: 2 });
    const todos = Array.from({ length: plan.duracaoDias }, (_, i) => i + 1);
    expect(getPlanStatus(plan, { planoId: plan.id, diasConcluidos: todos, iniciadoEm: "x" }).status).toBe("concluido");
  });
});

describe("resolveReference", () => {
  const book: BibleBook = {
    nome: "Livro",
    capitulos: [
      { capitulo: 1, versiculos: [1, 2, 3].map((n) => ({ versiculo: n, texto: `1:${n}` })) },
      { capitulo: 2, versiculos: [1, 2, 3].map((n) => ({ versiculo: n, texto: `2:${n}` })) },
    ],
  };
  const loader: BibleBookLoader = async (_t, nome) => (nome === "Livro" ? book : undefined);

  it("recorta versículos dentro de um capítulo", async () => {
    const result = await resolveReference(
      { livro: "Livro", capituloInicio: 1, versiculoInicio: 2, versiculoFim: 3 },
      "ave-maria",
      loader,
    );
    expect(result).toEqual([{ livro: "Livro", capitulo: 1, versiculos: [{ versiculo: 2, texto: "1:2" }, { versiculo: 3, texto: "1:3" }] }]);
  });

  it("atravessa capítulos e respeita o fim", async () => {
    const result = await resolveReference(
      { livro: "Livro", capituloInicio: 1, versiculoInicio: 3, capituloFim: 2, versiculoFim: 1 },
      "ave-maria",
      loader,
    );
    expect(result.map((p) => [p.capitulo, p.versiculos.map((v) => v.versiculo)])).toEqual([
      [1, [3]],
      [2, [1]],
    ]);
  });

  it("retorna vazio para livro inexistente", async () => {
    expect(await resolveReference({ livro: "Nada", capituloInicio: 1 }, "paulus", loader)).toEqual([]);
  });
});

describe("ranking de vozes", () => {
  it("ignora vozes não portuguesas e prioriza pt-BR enhanced masculina", () => {
    const ranked = rankVoices([
      { identifier: "en", name: "English", language: "en-US" },
      { identifier: "pt-pt", name: "Joana", language: "pt-PT" },
      { identifier: "pt-br", name: "Ricardo", language: "pt-BR", quality: "enhanced" },
    ]);
    expect(ranked[0].voice.identifier).toBe("pt-br");
    expect(ranked.find((r) => r.voice.identifier === "en")?.eligible).toBe(false);
    expect(pickBestVoice(ranked)?.identifier).toBe("pt-br");
    expect(pickBestVoice(rankVoices([{ identifier: "en", name: "E", language: "en" }]))).toBeNull();
  });
});
