import type { AxiosInstance } from "axios";
import { toBrazilianDate } from "../utils/date";
import { PprClient } from "./pprClient";
import {
  cleanLine,
  mapColor,
  parseMeditationSection,
  parsePsalmSection,
  parseReadingSection,
  parseTitle,
} from "./pprParsing";

const ACCORDION_MARKER = 'class="reading-accordion" data-controller="accordion"';
const COPYRIGHT_MARKER = '<div class="liturgy-copyright-responsive">';

function splitAccordionChunks(html: string): string[] {
  const positions: number[] = [];
  let index = html.indexOf(ACCORDION_MARKER);
  while (index !== -1) {
    positions.push(index);
    index = html.indexOf(ACCORDION_MARKER, index + ACCORDION_MARKER.length);
  }

  const end = html.indexOf(COPYRIGHT_MARKER);
  const boundaries = [...positions, end !== -1 ? end : html.length];

  return positions.map((_, i) => html.slice(boundaries[i], boundaries[i + 1]));
}

function getReadingType(chunk: string): string | null {
  const match = chunk.match(/reading-type">([^<]*)</);
  return match ? cleanLine(match[1]) : null;
}

export class PprLiturgyClient {
  private readonly client: Pick<PprClient, "getPageHtmlByDate">;

  constructor(httpClient?: AxiosInstance, client?: Pick<PprClient, "getPageHtmlByDate">) {
    this.client = client ?? new PprClient(httpClient);
  }

  async getByDate(isoDate: string): Promise<unknown> {
    const html = await this.client.getPageHtmlByDate(isoDate);

    const colorMatch = html.match(/liturgy-color ([a-z]+)/);
    const titleMatch = html.match(/liturgy-title"[^>]*>([^<]*)</);
    if (!colorMatch || !titleMatch) {
      throw new Error("Cor ou titulo liturgico nao encontrados no conteudo do Padre Paulo Ricardo.");
    }

    const { liturgia } = parseTitle(titleMatch[1]);
    const cor = mapColor(colorMatch[1]);

    let primeiraLeitura: ReturnType<typeof parseReadingSection> | null = null;
    let salmo: ReturnType<typeof parsePsalmSection> | null = null;
    let segundaLeitura: ReturnType<typeof parseReadingSection> | null = null;
    let evangelho: ReturnType<typeof parseReadingSection> | null = null;
    let meditacao: ReturnType<typeof parseMeditationSection> = null;

    for (const chunk of splitAccordionChunks(html)) {
      switch (getReadingType(chunk)) {
        case "Primeira Leitura":
          primeiraLeitura = parseReadingSection(chunk);
          break;
        case "Salmo Responsorial":
          salmo = parsePsalmSection(chunk);
          break;
        case "Segunda Leitura":
          segundaLeitura = parseReadingSection(chunk);
          break;
        case "Evangelho":
          evangelho = parseReadingSection(chunk);
          break;
        case "Meditação":
          meditacao = parseMeditationSection(chunk);
          break;
        default:
          break;
      }
    }

    if (!primeiraLeitura || !salmo || !evangelho) {
      throw new Error("Leituras obrigatorias ausentes no conteudo do Padre Paulo Ricardo.");
    }

    return {
      data: toBrazilianDate(isoDate),
      liturgia,
      cor,
      primeiraLeitura,
      salmo,
      segundaLeitura,
      evangelho,
      // A meditacao do Padre Paulo Ricardo (quando disponivel) e usada como
      // homilia; o dailyLiturgyService prioriza este campo e so recorre ao
      // Evangelizo quando ele estiver ausente (nem todo dia tem meditacao
      // escrita neste site).
      ...(meditacao
        ? {
            reflexao: {
              titulo: meditacao.titulo,
              autor: "Padre Paulo Ricardo",
              fonte: "padrepauloricardo.org",
              texto: meditacao.texto,
              audioUrl: null,
            },
          }
        : {}),
    };
  }
}
