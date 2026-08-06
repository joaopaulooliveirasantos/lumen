import { describe, expect, it } from "vitest";
import { CnbbSaintClient } from "../src/integrations/cnbbSaintClient";
import type { CnbbContent } from "../src/integrations/cnbbClient";

const sundayDetails = `<div><div style="font-size: 26px;"><b>18º Domingo  do Tempo Comum</b>, Ano A</div></div>`;
const weekdayWithSaintDetails = `<div><div style="font-size: 26px;"><b>São João Maria Vianney, presbítero</b>, Memória</div><div style="font-size: 20px;">18ª Semana  do Tempo Comum</div></div>`;

function makeContent(details: string): CnbbContent {
  return {
    date: "2026-08-04",
    filename: "x.htm",
    title: "Tempo Comum",
    color: "branco",
    details,
    leituras: "",
    body: "",
  };
}

describe("CnbbSaintClient", () => {
  it("retorna lista vazia em domingos sem santo especifico", async () => {
    const client = new CnbbSaintClient(undefined, {
      getContentByDate: async () => makeContent(sundayDetails),
    });

    const result = await client.getByDate("2026-08-02");

    expect(result).toEqual([]);
  });

  it("retorna o nome do santo em dias de memoria/festa", async () => {
    const client = new CnbbSaintClient(undefined, {
      getContentByDate: async () => makeContent(weekdayWithSaintDetails),
    });

    const result = await client.getByDate("2026-08-04");

    expect(result).toEqual(["São João Maria Vianney, presbítero"]);
  });
});
