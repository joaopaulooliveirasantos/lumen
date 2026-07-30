import axios, { type AxiosInstance } from "axios";
import { config } from "../config";
import type { CommentaryCandidate } from "../types";

function decodeEntities(input: string): string {
  return input
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function cleanText(input: string): string {
  return decodeEntities(input.replace(/\r/g, ""))
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const COMMENT_FIELD_TYPES = {
  titulo: "comment_t",
  autor: "comment_a",
  fonte: "comment_s",
  texto: "comment",
} as const;

export class EvangelizoCommentClient {
  private readonly http: AxiosInstance;

  constructor(httpClient?: AxiosInstance) {
    this.http = httpClient ?? axios.create({ timeout: 8000 });
  }

  async getByDate(isoDate: string): Promise<CommentaryCandidate | null> {
    if (!config.liturgyApiUrlTemplate.includes("feed.evangelizo.org/v2/reader.php")) {
      return null;
    }

    const date = isoDate.replace(/-/g, "");
    const fields = Object.keys(COMMENT_FIELD_TYPES) as (keyof typeof COMMENT_FIELD_TYPES)[];

    const responses = await Promise.all(
      fields.map((field) =>
        this.http.get(config.liturgyApiUrlTemplate, {
          params: {
            date,
            lang: config.evangelizoLang,
            type: COMMENT_FIELD_TYPES[field],
          },
          responseType: "text",
          headers: {
            Accept: "text/plain, text/html, */*",
          },
        }),
      ),
    );

    const values = Object.fromEntries(
      fields.map((field, index) => {
        const raw = responses[index].data;
        const text = typeof raw === "string" ? raw : String(raw ?? "");
        return [field, cleanText(text)];
      }),
    ) as Record<keyof typeof COMMENT_FIELD_TYPES, string>;

    if (!values.texto) {
      return null;
    }

    return {
      titulo: values.titulo,
      autor: values.autor,
      fonte: values.fonte,
      texto: values.texto,
    };
  }
}
