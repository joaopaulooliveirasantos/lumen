import type { AxiosInstance } from "axios";
import { toBrazilianDate } from "../utils/date";
import { CnbbClient } from "./cnbbClient";
import { cleanLine, parseDetails, parsePsalmChunk, parseReadingChunk } from "./cnbbParsing";

const COLOR_MAP: Record<string, string> = {
  verde: "Verde",
  roxo: "Roxo",
  branco: "Branco",
  vermelho: "Vermelho",
  rosa: "Rosa",
};

// Marcadores como texto puro (sem depender da ordem das tags ao redor: a
// CNBB usa tanto <font color="red"><center>X</center></font> quanto
// <center><font color="red">X</font></center> dependendo do dia).
const ACLAMACAO_MARKER = "Aclamação ao Evangelho";
const PRIMEIRA_LEITURA_MARKER = "PRIMEIRA LEITURA";
const SEGUNDA_LEITURA_MARKER = "SEGUNDA LEITURA";
const SALMO_MARKER = "Salmo responsorial";
const EVANGELHO_MARKER = "EVANGELHO";

function mapColor(rawColor: string): string {
  const key = rawColor.trim().toLowerCase();
  return COLOR_MAP[key] ?? cleanLine(rawColor);
}

// Marcacoes de bookmark internas do editor da CNBB, escondidas visualmente
// (style="display: none;") mas que ainda contaminam a extracao de texto se
// nao forem removidas antes de dividir o corpo em secoes.
const HIDDEN_BOOKMARK = /<div[^>]*style="display: none;"[^>]*>[\s\S]*?<\/div>/g;

function parseBody(bodyHtml: string): {
  primeiraLeitura: ReturnType<typeof parseReadingChunk>;
  salmo: ReturnType<typeof parsePsalmChunk>;
  segundaLeitura: ReturnType<typeof parseReadingChunk> | null;
  evangelho: ReturnType<typeof parseReadingChunk>;
} {
  const bodyHtmlSemBookmarks = bodyHtml.replace(HIDDEN_BOOKMARK, "");
  const aclamacaoIndex = bodyHtmlSemBookmarks.indexOf(ACLAMACAO_MARKER);
  if (aclamacaoIndex === -1) {
    throw new Error("Marcador de aclamacao ao evangelho nao encontrado no conteudo da CNBB.");
  }

  const leituraSection = bodyHtmlSemBookmarks.slice(0, aclamacaoIndex);
  const evangelhoSection = bodyHtmlSemBookmarks.slice(aclamacaoIndex);

  const primeiraIndex = leituraSection.indexOf(PRIMEIRA_LEITURA_MARKER);
  const salmoIndex = leituraSection.indexOf(SALMO_MARKER);

  if (primeiraIndex === -1) {
    throw new Error("Marcador da primeira leitura nao encontrado no conteudo da CNBB.");
  }
  if (salmoIndex === -1) {
    throw new Error("Marcador do salmo responsorial nao encontrado no conteudo da CNBB.");
  }

  const primeiraLeituraHtml = leituraSection.slice(
    primeiraIndex + PRIMEIRA_LEITURA_MARKER.length,
    salmoIndex,
  );

  const segundaIndex = leituraSection.indexOf(SEGUNDA_LEITURA_MARKER, salmoIndex);
  const salmoHtml = leituraSection.slice(
    salmoIndex + SALMO_MARKER.length,
    segundaIndex !== -1 ? segundaIndex : leituraSection.length,
  );

  const segundaLeituraHtml =
    segundaIndex !== -1
      ? leituraSection.slice(segundaIndex + SEGUNDA_LEITURA_MARKER.length)
      : null;

  const evangelhoIndex = evangelhoSection.indexOf(EVANGELHO_MARKER);
  if (evangelhoIndex === -1) {
    throw new Error("Marcador do evangelho nao encontrado no conteudo da CNBB.");
  }

  // Em dias com varias missas no mesmo corpo (ex.: Natal - Vigilia, Noite,
  // Aurora, Dia), o conteudo da primeira missa encontrada e usado; limitamos
  // o final do evangelho ao inicio da proxima missa (nova "PRIMEIRA
  // LEITURA"), senao o texto vazaria para a leitura seguinte.
  const evangelhoStart = evangelhoIndex + EVANGELHO_MARKER.length;
  const proximaMissaIndex = evangelhoSection.indexOf(PRIMEIRA_LEITURA_MARKER, evangelhoStart);
  const evangelhoHtml = evangelhoSection.slice(
    evangelhoStart,
    proximaMissaIndex !== -1 ? proximaMissaIndex : undefined,
  );

  return {
    primeiraLeitura: parseReadingChunk(primeiraLeituraHtml),
    salmo: parsePsalmChunk(salmoHtml),
    segundaLeitura: segundaLeituraHtml ? parseReadingChunk(segundaLeituraHtml) : null,
    evangelho: parseReadingChunk(evangelhoHtml),
  };
}

export class CnbbLiturgyClient {
  private readonly client: Pick<CnbbClient, "getContentByDate">;

  constructor(httpClient?: AxiosInstance, client?: Pick<CnbbClient, "getContentByDate">) {
    this.client = client ?? new CnbbClient(httpClient);
  }

  async getByDate(isoDate: string): Promise<unknown> {
    const content = await this.client.getContentByDate(isoDate);
    const { liturgia } = parseDetails(content.details);
    const { primeiraLeitura, salmo, segundaLeitura, evangelho } = parseBody(content.body);

    return {
      data: toBrazilianDate(isoDate),
      liturgia,
      cor: mapColor(content.color),
      primeiraLeitura,
      salmo,
      segundaLeitura,
      evangelho,
    };
  }
}
