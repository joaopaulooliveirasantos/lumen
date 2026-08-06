import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { URL } from "node:url";
import { getDailyLiturgy } from "./serverless/getDailyLiturgy";
import { getSaintOfDay } from "./serverless/getSaintOfDay";
import { getSaintStory } from "./serverless/getSaintStory";

const port = Number(process.env.PORT ?? 3333);
const PRIVACY_POLICY_PATH = join(process.cwd(), "src", "static", "privacy-policy.html");

const server = createServer(async (req, res) => {
  if (!req.url) {
    res.statusCode = 400;
    res.end("Bad request");
    return;
  }

  const parsedUrl = new URL(req.url, `http://localhost:${port}`);

  if (req.method === "GET" && parsedUrl.pathname === "/privacy-policy") {
    try {
      const html = await readFile(PRIVACY_POLICY_PATH, "utf-8");
      res.statusCode = 200;
      res.setHeader("content-type", "text/html; charset=utf-8");
      res.end(html);
    } catch {
      res.statusCode = 500;
      res.setHeader("content-type", "text/plain; charset=utf-8");
      res.end("Erro ao carregar a pagina.");
    }
    return;
  }

  if (req.method === "GET" && parsedUrl.pathname === "/api/liturgia") {
    const date = parsedUrl.searchParams.get("date") ?? undefined;
    const type = parsedUrl.searchParams.get("type") ?? undefined;

    const response =
      type === "saint"
        ? await getSaintOfDay({ query: { date } })
        : type === "saint-story"
          ? await getSaintStory({ query: { date } })
          : await getDailyLiturgy({ query: { date } });

    res.statusCode = response.statusCode;
    for (const [key, value] of Object.entries(response.headers)) {
      res.setHeader(key, value);
    }
    res.end(response.body);
    return;
  }

  res.statusCode = 404;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify({ error: "Rota nao encontrada." }));
});

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API de liturgia ouvindo em http://localhost:${port}`);
});
