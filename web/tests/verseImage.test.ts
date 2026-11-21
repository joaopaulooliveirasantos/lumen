import { describe, expect, it } from "vitest";
import { composeVerseText, fitText, formatReference, formatVerseList, wrapLines } from "../src/services/verseImage";

// Medida simples: cada caractere ocupa metade do tamanho da fonte.
const measureAt = (size: number) => (s: string) => s.length * size * 0.5;

describe("imagem de versículos", () => {
  it("formata a referência no padrão da CNBB", () => {
    expect(formatReference("Jo", 3, [16])).toBe("Jo 3,16");
    expect(formatReference("Jo", 3, [17, 16])).toBe("Jo 3,16-17");
    expect(formatVerseList([1, 2, 3, 5, 7, 8])).toBe("1-3.5.7-8");
  });

  it("numera os versículos em sobrescrito só quando há mais de um", () => {
    expect(composeVerseText([{ versiculo: 16, texto: " Deus amou o mundo " }])).toBe("Deus amou o mundo");
    expect(composeVerseText([{ versiculo: 16, texto: "A" }, { versiculo: 17, texto: "B" }])).toBe("¹⁶ A ¹⁷ B");
  });

  it("quebra as linhas pela largura", () => {
    expect(wrapLines("um dois tres quatro", 10, (s) => s.length)).toEqual(["um dois", "tres", "quatro"]);
  });

  it("usa a maior fonte que cabe e corta com reticências o que não cabe nem no mínimo", () => {
    const short = fitText("Deus é amor", { width: 900, height: 600 }, measureAt);
    expect(short.size).toBe(64);
    expect(short.lines).toEqual(["Deus é amor"]);

    const long = fitText("palavra ".repeat(2000), { width: 900, height: 600 }, measureAt);
    expect(long.size).toBe(30);
    expect(long.lines.length).toBe(Math.floor(600 / (30 * 1.42)));
    expect(long.lines.at(-1)?.endsWith("…")).toBe(true);
    expect(long.lines.every((l) => measureAt(30)(l) <= 900)).toBe(true);
  });
});
