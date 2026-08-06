import axios, { type AxiosInstance } from "axios";
import { config } from "../config";
import { toBrazilianDate } from "../utils/date";
import { SaintClient } from "./saintClient";

interface ParsedReading {
  titulo: string;
  referencia: string;
  texto: string;
}

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

function inferColorFromTitle(liturgicTitle: string, hasSaint: boolean): string {
  const title = liturgicTitle.toLowerCase();

  if (title.includes("quaresma") || title.includes("advento")) {
    return "Roxo";
  }

  if (
    title.includes("pentecostes") ||
    title.includes("domingo de ramos") ||
    title.includes("martir") ||
    title.includes("mártir")
  ) {
    return "Vermelho";
  }

  if (title.includes("gaudete") || title.includes("laetare")) {
    return "Rosa";
  }

  if (
    title.includes("pascoa") ||
    title.includes("páscoa") ||
    title.includes("natal") ||
    title.includes("solenidade") ||
    title.includes("festa")
  ) {
    return "Branco";
  }

  if (hasSaint) {
    return "Branco";
  }

  if (title.includes("tempo comum")) {
    return "Verde";
  }

  return "Verde";
}

function parseReferenceFromHeader(header: string): { titulo: string; referencia: string } {
  const match = header.match(/([0-9][0-9(),.\-\s]+)\.?$/);
  if (!match) {
    return {
      titulo: header,
      referencia: header,
    };
  }

  const referencia = match[1].trim();
  const titulo = header.slice(0, match.index).trim();

  return {
    titulo: titulo || header,
    referencia,
  };
}

function parseSection(sectionHtml: string): ParsedReading | null {
  const lines = sectionHtml
    .replace(/<br\s*\/?>/gi, "\n")
    .split("\n")
    .map((line) => cleanText(line))
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    return null;
  }

  const header = lines[0];
  const text = lines.slice(1).join("\n").trim();
  const { titulo, referencia } = parseReferenceFromHeader(header);

  if (!text) {
    return null;
  }

  return {
    titulo,
    referencia,
    texto: text,
  };
}

function parseEvangelizoPayload(raw: string, isoDate: string, hasSaint: boolean): unknown {
  const normalized = raw.replace(/\r/g, "").trim();
  const firstBreak = normalized.match(/<br\s*\/?>\s*<br\s*\/?>/i);

  const liturgicTitle = cleanText(
    firstBreak ? normalized.slice(0, firstBreak.index).trim() : normalized,
  );

  const body = firstBreak
    ? normalized.slice((firstBreak.index ?? 0) + firstBreak[0].length).trim()
    : "";

  const sectionHtmlList = body
    .split(/(?:<br\s*\/?>\s*){3,}/i)
    .map((section) => section.trim())
    .filter((section) => section.length > 0);

  const readingBlocks = sectionHtmlList
    .map((section) => parseSection(section))
    .filter((block): block is ParsedReading => Boolean(block));

  const salmo = readingBlocks.find((block) => block.titulo.toLowerCase().includes("salmo"));
  const evangelho = readingBlocks.find((block) => block.titulo.toLowerCase().includes("evangelho"));
  const restantes = readingBlocks.filter((block) => block !== salmo && block !== evangelho);

  const primeiraLeitura = restantes[0] ?? null;
  const segundaLeitura = restantes[1] ?? null;

  if (!primeiraLeitura || !salmo || !evangelho) {
    throw new Error("Resposta do Evangelizo incompleta para leituras obrigatorias.");
  }

  const salmoLinhas = salmo.texto.split("\n").map((line) => line.trim()).filter(Boolean);

  return {
    data: toBrazilianDate(isoDate),
    liturgia: liturgicTitle || `Liturgia de ${toBrazilianDate(isoDate)}`,
    cor: inferColorFromTitle(liturgicTitle, hasSaint),
    primeiraLeitura,
    salmo: {
      referencia: salmo.referencia,
      refrao: salmoLinhas[0] ?? "",
      texto: salmo.texto,
    },
    segundaLeitura,
    evangelho,
  };
}

export class LiturgyClient {
  private readonly http: AxiosInstance;
  private readonly saintClient: Pick<SaintClient, "getByDate">;

  constructor(httpClient?: AxiosInstance, saintClient?: Pick<SaintClient, "getByDate">) {
    this.http = httpClient ?? axios.create({ timeout: 8000 });
    this.saintClient = saintClient ?? new SaintClient(this.http);
  }

  async getByDate(isoDate: string): Promise<unknown> {
    if (config.liturgyApiUrlTemplate.includes("feed.evangelizo.org/v2/reader.php")) {
      const date = isoDate.replace(/-/g, "");
      const params: Record<string, string> = {
        date,
        type: "all",
        lang: config.evangelizoLang,
      };

      if (config.evangelizoContent) {
        params.content = config.evangelizoContent;
      }

      const [response, santos] = await Promise.all([
        this.http.get(config.liturgyApiUrlTemplate, {
          params,
          responseType: "text",
          headers: {
            Accept: "text/plain, text/html, */*",
          },
        }),
        this.saintClient.getByDate(isoDate).catch(() => []),
      ]);

      const text = typeof response.data === "string" ? response.data : String(response.data ?? "");
      return parseEvangelizoPayload(text, isoDate, santos.length > 0);
    }

    const endpoint = config.liturgyApiUrlTemplate.replace("{date}", isoDate);
    const response = await this.http.get(endpoint, {
      headers: {
        Accept: "application/json",
      },
    });

    return response.data;
  }
}
