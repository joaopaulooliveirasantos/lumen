import { describe, expect, it } from "vitest";
import { BOOK_ABBREVIATIONS, BOOK_SECTIONS, bookAbbreviation, bookNumber } from "../src/data/bibleBooks";

describe("siglas e seções dos livros", () => {
  it("tem uma sigla única para cada um dos 73 livros", () => {
    expect(BOOK_ABBREVIATIONS).toHaveLength(73);
    expect(new Set(BOOK_ABBREVIATIONS).size).toBe(73);
  });

  it("cada livro está em exatamente uma seção", () => {
    const all = BOOK_SECTIONS.flatMap((s) => s.livros).sort((a, b) => a - b);
    expect(all).toEqual(Array.from({ length: 73 }, (_, i) => i + 1));
  });

  it("lê o número e a sigla a partir do slug do índice", () => {
    expect(bookNumber("01-genesis")).toBe(1);
    expect(bookAbbreviation("01-genesis")).toBe("Gn");
    expect(bookAbbreviation("50-sao-joao")).toBe("Jo");
    expect(bookAbbreviation("69-i-sao-joao")).toBe("1Jo");
    expect(bookAbbreviation("73-apocalipse")).toBe("Ap");
    expect(bookNumber("sem-numero")).toBeNull();
    expect(bookNumber("99-inexistente")).toBeNull();
  });
});
