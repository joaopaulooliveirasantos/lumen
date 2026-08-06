import { describe, expect, it } from "vitest";
import { CnbbClient } from "../src/integrations/cnbbClient";

describe("CnbbClient", () => {
  it("envia os headers de Origin/Referer exigidos pela API e retorna o content", async () => {
    let capturedHeaders: Record<string, string> | undefined;

    const client = new CnbbClient({
      get: async (_url: string, options: { headers: Record<string, string> }) => {
        capturedHeaders = options.headers;
        return { data: { content: { date: "2026-08-02", filename: "x", title: "t", color: "verde", details: "d", leituras: "l", body: "b" } } };
      },
    } as never);

    await client.getContentByDate("2026-08-02");

    expect(capturedHeaders?.Origin).toBe("https://liturgiadiaria.edicoescnbb.com.br");
    expect(capturedHeaders?.Referer).toBe("https://liturgiadiaria.edicoescnbb.com.br/");
  });

  it("normaliza campos de texto para NFC (a API as vezes devolve NFD)", async () => {
    // A API as vezes devolve texto em NFD ("c" + acento combinavel em vez de "ç" precomposto)
    const nfdBody = "Palavra da Salvação.".normalize("NFD");

    const client = new CnbbClient({
      get: async () => ({
        data: {
          content: {
            date: "2026-08-02",
            filename: "x",
            title: "t",
            color: "verde",
            details: "d",
            leituras: "l",
            body: nfdBody,
          },
        },
      }),
    } as never);

    const content = await client.getContentByDate("2026-08-02");

    expect(content.body).toBe(content.body.normalize("NFC"));
    expect(content.body).toContain("Palavra da Salvação.");
  });

  it("lanca erro quando a resposta nao tem o campo content", async () => {
    const client = new CnbbClient({
      get: async () => ({ data: {} }),
    } as never);

    await expect(client.getContentByDate("2026-08-02")).rejects.toThrow("content");
  });
});
