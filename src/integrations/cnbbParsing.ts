function decodeEntities(input: string): string {
  return input
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripTags(input: string): string {
  return decodeEntities(input.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, ""));
}

export function cleanLine(input: string): string {
  return stripTags(input)
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/^[ \t]+/gm, "")
    .trim();
}

const VERSE_NUMBER_GUTTER =
  /<div style="text-align: left; min-width: 30px; font-size: 12px; color: #FF0000">[\s\S]*?<\/div>/g;

/**
 * O CNBB usa marcacoes HTML inconsistentes entre dias (divs aninhados vs <br>
 * simples para quebras de linha dentro de um versiculo, dependendo de quem
 * editou o conteudo). Em vez de tentar casar a estrutura exata de divs
 * aninhados (fragil e ja se mostrou incompleto em alguns dias), tratamos
 * qualquer fechamento de <div> ou <br> como quebra de linha e no final
 * removemos linhas vazias resultantes.
 */
export function extractVerses(html: string): string {
  const withoutGutter = html.replace(VERSE_NUMBER_GUTTER, "");
  const withNewlines = withoutGutter.replace(/<br\s*\/?>/gi, "\n").replace(/<\/div>/gi, "\n");

  return decodeEntities(withNewlines.replace(/<[^>]+>/g, ""))
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter((line) => line.length > 0)
    .join("\n");
}

export interface ReadingChunk {
  referencia: string;
  titulo: string;
  texto: string;
}

const READING_REF_FONT_COLORS = "#ff6666|#ff0000|tomato";

// Toda leitura/evangelho termina com uma dessas formulas ritualisticas fixas.
// Cortar exatamente ali protege contra qualquer marcacao ou conteudo da
// proxima secao (ex.: o inicio de outra missa em dias com varias missas no
// mesmo corpo, como o Natal) que tenha vazado para dentro do trecho.
const CLOSING_FORMULA = /Palavra (?:do Senhor|da Salvação)\./;

function truncateAtClosingFormula(texto: string): string {
  const match = texto.match(CLOSING_FORMULA);
  if (!match || match.index === undefined) {
    return texto;
  }
  return texto.slice(0, match.index + match[0].length);
}

export function parseReadingChunk(chunkHtml: string): ReadingChunk {
  const withoutEpigraph = chunkHtml.replace(/<p align="right">[\s\S]*?<\/p>/, "");
  const refMatch = withoutEpigraph.match(
    new RegExp(`<font color="(?:${READING_REF_FONT_COLORS})">(?:<br\\s*/?>)*([^<]*)<\\/font>`),
  );

  if (!refMatch || refMatch.index === undefined) {
    throw new Error("Referencia da leitura nao encontrada no conteudo da CNBB.");
  }

  const titulo = cleanLine(withoutEpigraph.slice(0, refMatch.index));
  const referencia = cleanLine(refMatch[1]);
  const rest = withoutEpigraph.slice(refMatch.index + refMatch[0].length);
  const texto = truncateAtClosingFormula(extractVerses(rest));

  if (!titulo || !referencia || !texto) {
    throw new Error("Leitura da CNBB incompleta (titulo, referencia ou texto ausente).");
  }

  return { titulo, referencia, texto };
}

export interface PsalmChunk {
  referencia: string;
  refrao: string;
  texto: string;
}

export function parsePsalmChunk(chunkHtml: string): PsalmChunk {
  const refMatch = chunkHtml.match(/<font color="tomato">(?:<br\s*\/?>)*([^<]*)<\/font>/);
  if (!refMatch || refMatch.index === undefined) {
    throw new Error("Referencia do salmo nao encontrada no conteudo da CNBB.");
  }

  const referencia = cleanLine(refMatch[1]);
  const afterRef = chunkHtml.slice(refMatch.index + refMatch[0].length);

  // A cor e a tag ao redor do "R." variam entre dias (font color="red" vs
  // "#ff0000", envolvido ou nao por div/span.refrao_salmo), mas a declaracao
  // do refrao e sempre a primeira ocorrencia de um "R." sem espaco a
  // esquerda, seguida do texto do refrao ate a proxima tag.
  const refraoMatch = afterRef.match(/<font color="(?:red|#ff0000)">R\.<\/font>\s*([^<]*)/);
  if (!refraoMatch || refraoMatch.index === undefined) {
    throw new Error("Refrao do salmo nao encontrado no conteudo da CNBB.");
  }

  const refrao = cleanLine(refraoMatch[1]);
  const afterRefrao = afterRef.slice(refraoMatch.index + refraoMatch[0].length);
  const versos = extractVerses(afterRefrao);

  if (!referencia || !refrao || !versos) {
    throw new Error("Salmo da CNBB incompleto (referencia, refrao ou texto ausente).");
  }

  return { referencia, refrao, texto: [refrao, versos].join("\n") };
}

export interface DetailsInfo {
  liturgia: string;
  santo: string | null;
}

export function parseDetails(detailsHtml: string): DetailsInfo {
  const tituloMatch = detailsHtml.match(/<div style="font-size: 26px;">([\s\S]*?)<\/div>/);
  if (!tituloMatch) {
    throw new Error("Titulo liturgico nao encontrado nos detalhes da CNBB.");
  }

  const boldMatch = tituloMatch[1].match(/<b>([^<]*)<\/b>/);
  const boldTitle = boldMatch ? cleanLine(boldMatch[1]) : cleanLine(tituloMatch[1]);

  const semanaMatch = detailsHtml.match(/<div style="font-size: 20px;">([\s\S]*?)<\/div>/);

  if (semanaMatch) {
    return {
      liturgia: cleanLine(semanaMatch[1]),
      santo: boldTitle || null,
    };
  }

  return {
    liturgia: boldTitle,
    santo: null,
  };
}
