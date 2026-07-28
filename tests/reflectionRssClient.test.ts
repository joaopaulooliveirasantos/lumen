import { describe, expect, it } from "vitest";
import { ReflectionRssClient } from "../src/integrations/reflectionRssClient";

const sampleRss = `
<rss>
  <channel>
    <item>
      <title>Reflexao de 2026-07-28</title>
      <description><![CDATA[Texto da reflexao do dia.]]></description>
      <pubDate>Tue, 28 Jul 2026 08:00:00 GMT</pubDate>
      <enclosure url="https://cdn.exemplo.com/audio-2807.mp3" type="audio/mpeg" />
    </item>
    <item>
      <title>Reflexao de 2026-07-27</title>
      <description>Texto anterior</description>
    </item>
  </channel>
</rss>
`;

describe("ReflectionRssClient", () => {
  it("seleciona o item da data solicitada", async () => {
    const client = new ReflectionRssClient({
      get: async () => ({ data: sampleRss }),
    } as never);

    const result = await client.getByDate("2026-07-28");

    expect(result).not.toBeNull();
    expect(result?.title).toContain("2026-07-28");
    expect(result?.audioUrl).toBe("https://cdn.exemplo.com/audio-2807.mp3");
  });

  it("retorna primeiro item quando nao encontra data", async () => {
    const client = new ReflectionRssClient({
      get: async () => ({ data: sampleRss }),
    } as never);

    const result = await client.getByDate("2026-08-10");

    expect(result?.title).toContain("2026-07-28");
  });
});
