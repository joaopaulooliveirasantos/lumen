import { describe, expect, it } from "vitest";
import { LiturgyClient } from "../src/integrations/liturgyClient";

const sampleEvangelizo = `
Terça-feira da 17ª semana do Tempo Comum
<br /><br />
Livro de Jeremias <font dir="ltr">14,17-22.</font>
<br />
Texto da primeira leitura linha 1.<br />
Texto da primeira leitura linha 2.
<br /><br /><br />
Livro dos Salmos <font dir="ltr">79(78),8.9.11.13.</font>
<br />
Refrao do salmo<br />
Verso A<br />
Verso B
<br /><br /><br />
Evangelho segundo São Mateus <font dir="ltr">13,36-43.</font>
<br />
Texto do evangelho.
<br /><br /><br />
`;

describe("LiturgyClient - Evangelizo", () => {
  it("converte retorno texto do Evangelizo para payload estruturado", async () => {
    const client = new LiturgyClient({
      get: async () => ({ data: sampleEvangelizo }),
    } as never);

    const result = (await client.getByDate("2026-07-28")) as {
      data: string;
      liturgia: string;
      cor: string;
      primeiraLeitura: { referencia: string; titulo: string; texto: string };
      salmo: { referencia: string; refrao: string; texto: string };
      segundaLeitura: unknown;
      evangelho: { referencia: string; titulo: string; texto: string };
    };

    expect(result.data).toBe("28/07/2026");
    expect(result.cor).toBe("Verde");
    expect(result.primeiraLeitura.referencia).toContain("14,17-22");
    expect(result.salmo.refrao).toBe("Refrao do salmo");
    expect(result.evangelho.referencia).toContain("13,36-43");
    expect(result.segundaLeitura).toBeNull();
  });
});
