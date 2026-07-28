import axios, { type AxiosInstance } from "axios";
import { config } from "../config";
import { toBrazilianDate } from "../utils/date";
import type { ReflectionCandidate } from "../types";

function decodeEntities(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function cleanText(input: string): string {
  return decodeEntities(
    input
      .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function getTag(itemXml: string, tagName: string): string | null {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const match = itemXml.match(regex);
  return match?.[1]?.trim() ?? null;
}

function getEnclosureUrl(itemXml: string): string | null {
  const match = itemXml.match(/<enclosure[^>]*url=["']([^"']+)["'][^>]*>/i);
  return match?.[1] ?? null;
}

function parseRssItems(xml: string): ReflectionCandidate[] {
  const matches = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];
  return matches.map((itemXml) => ({
    title: cleanText(getTag(itemXml, "title") ?? ""),
    description: cleanText(getTag(itemXml, "description") ?? ""),
    pubDate: cleanText(getTag(itemXml, "pubDate") ?? "") || null,
    link: cleanText(getTag(itemXml, "link") ?? "") || null,
    audioUrl: getEnclosureUrl(itemXml),
  }));
}

function isMatchingDate(item: ReflectionCandidate, isoDate: string): boolean {
  const brDate = toBrazilianDate(isoDate);
  const haystack = `${item.title} ${item.description} ${item.pubDate ?? ""}`.toLowerCase();
  return haystack.includes(isoDate.toLowerCase()) || haystack.includes(brDate.toLowerCase());
}

export class ReflectionRssClient {
  private readonly http: AxiosInstance;

  constructor(httpClient?: AxiosInstance) {
    this.http = httpClient ?? axios.create({ timeout: 8000 });
  }

  async getByDate(isoDate: string): Promise<ReflectionCandidate | null> {
    const response = await this.http.get(config.reflectionRssUrl, {
      headers: {
        Accept: "application/rss+xml, application/xml, text/xml",
      },
      responseType: "text",
    });

    const xml = typeof response.data === "string" ? response.data : String(response.data ?? "");
    const items = parseRssItems(xml);

    if (items.length === 0) {
      return null;
    }

    return items.find((item) => isMatchingDate(item, isoDate)) ?? items[0] ?? null;
  }
}
