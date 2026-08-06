import { describe, expect, it } from "vitest";
import { PprSaintClient } from "../src/integrations/pprSaintClient";

function page(title: string): string {
  return `<html><body><div class="liturgy-color-and-title"><div class="liturgy-color green"></div><div class="liturgy-title" data-liturgy-target="title">${title}</div></div></body></html>`;
}

describe("PprSaintClient", () => {
  it("retorna lista vazia em domingos sem santo especifico", async () => {
    const client = new PprSaintClient(undefined, {
      getPageHtmlByDate: async () => page("18º Domingo do Tempo Comum"),
    });

    const result = await client.getByDate("2026-08-02");

    expect(result).toEqual([]);
  });

  it("retorna o nome do santo em dias de memoria/festa/solenidade", async () => {
    const client = new PprSaintClient(undefined, {
      getPageHtmlByDate: async () => page("São João Maria Vianney, presbítero, Memória"),
    });

    const result = await client.getByDate("2026-08-04");

    expect(result).toEqual(["São João Maria Vianney, presbítero"]);
  });
});
