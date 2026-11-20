import { describe, expect, it } from "vitest";
import { buildLiturgyTracks, splitForSpeech } from "../src/services/liturgyTracks";
import { clampFontScale } from "../src/state/AppState";
import type { DailyLiturgyPayload } from "../src/types/liturgy";

const payload = (segunda: boolean): DailyLiturgyPayload => ({
  data: "20/11/2026",
  liturgia: "Sexta-feira",
  cor: "Verde",
  primeiraLeitura: { referencia: "Ap 10,8-11", titulo: "Leitura do Apocalipse", texto: "Texto 1." },
  salmo: { referencia: "Sl 118", refrao: "Refrão", texto: "Salmo." },
  segundaLeitura: segunda ? { referencia: "Rm 1,1", titulo: "Leitura de Romanos", texto: "Texto 2." } : null,
  evangelho: { referencia: "Lc 19,45-48", titulo: "Evangelho segundo Lucas", texto: "Evangelho." },
  reflexao: { titulo: "Reflexão", autor: "Autor", fonte: "Fonte", texto: "Homilia.", audioUrl: null },
});

describe("faixas da liturgia", () => {
  it("monta as faixas na ordem, com 2ª leitura só quando existe", () => {
    expect(buildLiturgyTracks(payload(false)).map((t) => t.key)).toEqual(["leitura1", "salmo", "evangelho", "homilia"]);
    expect(buildLiturgyTracks(payload(true)).map((t) => t.key)).toEqual(["leitura1", "salmo", "leitura2", "evangelho", "homilia"]);
  });

  it("inclui as aclamações na fala e a referência no texto compartilhado", () => {
    const [leitura] = buildLiturgyTracks(payload(false));
    expect(leitura.speech).toContain("Palavra do Senhor. Graças a Deus.");
    expect(leitura.share).toContain("Ap 10,8-11");
    const homilia = buildLiturgyTracks(payload(false)).at(-1)!;
    expect(homilia.share).toContain("Fonte");
  });
});

describe("divisão do texto para o TTS", () => {
  it("não divide textos curtos e normaliza espaços", () => {
    expect(splitForSpeech("  Uma  frase.\n\nOutra. ")).toEqual(["Uma frase. Outra."]);
    expect(splitForSpeech("   ")).toEqual([]);
  });

  it("divide textos longos em fim de frase, sem passar do limite e sem perder texto", () => {
    const sentence = "Bem-aventurados os que choram, porque serão consolados. ";
    const text = sentence.repeat(90); // ~5000 caracteres, acima do limite do Android
    const chunks = splitForSpeech(text, 3500);
    expect(chunks.length).toBe(2);
    expect(chunks.every((c) => c.length <= 3500)).toBe(true);
    expect(chunks[0].endsWith(".")).toBe(true);
    expect(chunks.join(" ")).toBe(text.trim());
  });

  it("corta em espaço quando não há pontuação", () => {
    const chunks = splitForSpeech("palavra ".repeat(100), 50);
    expect(chunks.every((c) => c.length <= 50 && !c.startsWith(" "))).toBe(true);
    expect(chunks.join(" ").split(" ")).toHaveLength(100);
  });
});

describe("tamanho do texto", () => {
  it("limita entre 90% e 150%", () => {
    expect(clampFontScale(0.5)).toBe(0.9);
    expect(clampFontScale(1.234)).toBe(1.23);
    expect(clampFontScale(2)).toBe(1.5);
  });
});
