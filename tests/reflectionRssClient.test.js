"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const reflectionRssClient_1 = require("../src/integrations/reflectionRssClient");
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
(0, vitest_1.describe)("ReflectionRssClient", () => {
    (0, vitest_1.it)("seleciona o item da data solicitada", async () => {
        const client = new reflectionRssClient_1.ReflectionRssClient({
            get: async () => ({ data: sampleRss }),
        });
        const result = await client.getByDate("2026-07-28");
        (0, vitest_1.expect)(result).not.toBeNull();
        (0, vitest_1.expect)(result?.title).toContain("2026-07-28");
        (0, vitest_1.expect)(result?.audioUrl).toBe("https://cdn.exemplo.com/audio-2807.mp3");
    });
    (0, vitest_1.it)("retorna primeiro item quando nao encontra data", async () => {
        const client = new reflectionRssClient_1.ReflectionRssClient({
            get: async () => ({ data: sampleRss }),
        });
        const result = await client.getByDate("2026-08-10");
        (0, vitest_1.expect)(result?.title).toContain("2026-07-28");
    });
});
