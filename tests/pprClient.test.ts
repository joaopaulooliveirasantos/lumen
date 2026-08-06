import { describe, expect, it } from "vitest";
import { PprClient } from "../src/integrations/pprClient";

describe("PprClient", () => {
  it("converte a data ISO para o formato DD-MM-YYYY usado na URL", async () => {
    let capturedUrl: string | undefined;

    const client = new PprClient({
      get: async (url: string) => {
        capturedUrl = url;
        return { data: "<html></html>" };
      },
    } as never);

    await client.getPageHtmlByDate("2026-08-04");

    expect(capturedUrl).toBe("https://padrepauloricardo.org/liturgia/04-08-2026");
  });

  it("normaliza o HTML retornado para NFC", async () => {
    const nfdHtml = "<p>Salvação</p>".normalize("NFD");

    const client = new PprClient({
      get: async () => ({ data: nfdHtml }),
    } as never);

    const html = await client.getPageHtmlByDate("2026-08-04");

    expect(html).toBe(html.normalize("NFC"));
    expect(html).toContain("Salvação");
  });
});
