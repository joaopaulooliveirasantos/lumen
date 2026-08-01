import axios, { type AxiosInstance } from "axios";
import { config } from "../config";

function decodeEntities(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function cleanText(input: string): string {
  return decodeEntities(input.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());
}

export class SaintClient {
  private readonly http: AxiosInstance;

  constructor(httpClient?: AxiosInstance) {
    this.http = httpClient ?? axios.create({ timeout: 8000 });
  }

  async getByDate(isoDate: string): Promise<string[]> {
    if (!config.liturgyApiUrlTemplate.includes("feed.evangelizo.org/v2/reader.php")) {
      throw new Error("Santo do dia nao suportado para o provedor de liturgia configurado.");
    }

    const date = isoDate.replace(/-/g, "");
    const response = await this.http.get(config.liturgyApiUrlTemplate, {
      params: {
        date,
        type: "saint",
        lang: config.evangelizoLang,
      },
      responseType: "text",
      headers: {
        Accept: "text/plain, text/html, */*",
      },
    });

    const raw = typeof response.data === "string" ? response.data : String(response.data ?? "");
    const matches = [...raw.matchAll(/<a[^>]*>([\s\S]*?)<\/a>/gi)];

    return matches.map((match) => cleanText(match[1])).filter((name) => name.length > 0);
  }
}
