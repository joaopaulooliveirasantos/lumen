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
  return decodeEntities(input.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, ""));
}

export function cleanLine(input: string): string {
  return stripTags(input).replace(/[ \t]+/g, " ").trim();
}

// Nas leituras e no evangelho os numeros de versiculo vem colados a palavra
// seguinte, sem espaco (ex.: "12Isto diz o Senhor", "2“Por que"), enquanto
// numeros de verdade no texto sempre tem espaco depois (ex.: "40 dias").
// Removemos apenas o padrao colado (precedido de espaco/inicio/pontuacao e
// seguido imediatamente de letra ou aspas).
const GLUED_VERSE_NUMBER = /(?<=^|[\s"“„«(])\d{1,3}(?=[A-Za-zÀ-ÿ"“„«])/g;

function extractParagraphs(html: string): string[] {
  const matches = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)];
  return matches.map((match) => cleanLine(match[1])).filter((line) => line.length > 0);
}

export interface ReadingSection {
  referencia: string;
  titulo: string;
  texto: string;
}

export function parseReadingSection(chunkHtml: string): ReadingSection {
  const titleMatch = chunkHtml.match(
    /reading-title"[^>]*>([\s\S]*?)<span class="reading-reference"[^>]*>([^<]*)<\/span>/,
  );
  if (!titleMatch) {
    throw new Error("Titulo/referencia da leitura nao encontrados no conteudo do Padre Paulo Ricardo.");
  }

  const bodyMatch = chunkHtml.match(/data-liturgy-target="readingBody">([\s\S]*)$/);
  if (!bodyMatch) {
    throw new Error("Corpo da leitura nao encontrado no conteudo do Padre Paulo Ricardo.");
  }

  const titulo = cleanLine(titleMatch[1]);
  const referencia = cleanLine(titleMatch[2]);
  const paragraphs = extractParagraphs(bodyMatch[1]).map((p) => p.replace(GLUED_VERSE_NUMBER, ""));
  const texto = paragraphs.join("\n\n").replace(/[ \t]+/g, " ").trim();

  if (!titulo || !referencia || !texto) {
    throw new Error("Leitura incompleta no conteudo do Padre Paulo Ricardo.");
  }

  return { titulo, referencia, texto };
}

export interface PsalmSection {
  referencia: string;
  refrao: string;
  texto: string;
}

export function parsePsalmSection(chunkHtml: string): PsalmSection {
  const refrainMatch = chunkHtml.match(
    /reading-refrain"[^>]*>([\s\S]*?)<span class="reading-reference"[^>]*>([^<]*)<\/span>/,
  );
  if (!refrainMatch) {
    throw new Error("Refrao/referencia do salmo nao encontrados no conteudo do Padre Paulo Ricardo.");
  }

  const bodyMatch = chunkHtml.match(/data-liturgy-target="readingBody">([\s\S]*)$/);
  if (!bodyMatch) {
    throw new Error("Corpo do salmo nao encontrado no conteudo do Padre Paulo Ricardo.");
  }

  const refrao = cleanLine(refrainMatch[1]);
  const referencia = cleanLine(refrainMatch[2]);

  // O primeiro <p> do corpo e sempre a repeticao do refrao (sem numero de
  // versiculo); os demais sao as estrofes numeradas.
  const stanzas = [...bodyMatch[1].matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map((m) => m[1]).slice(1);

  const versos = stanzas
    .flatMap((stanza) => stanza.split(/<br\s*\/?>/i))
    .map((line) => cleanLine(line).replace(/^\d{1,3}\s+/, ""))
    .filter((line) => line.length > 0)
    .join("\n");

  if (!referencia || !refrao || !versos) {
    throw new Error("Salmo incompleto no conteudo do Padre Paulo Ricardo.");
  }

  return { referencia, refrao, texto: [refrao, versos].join("\n") };
}

export interface MeditationSection {
  titulo: string;
  texto: string;
}

export function parseMeditationSection(chunkHtml: string): MeditationSection | null {
  const titleMatch = chunkHtml.match(/reading-title"[^>]*>([^<]*)</);
  const bodyMatch = chunkHtml.match(/data-liturgy-target="readingBody">([\s\S]*)$/);
  if (!titleMatch || !bodyMatch) {
    return null;
  }

  const titulo = cleanLine(titleMatch[1]);
  const withoutGospelHeader = bodyMatch[1].replace(/<p class="text-center">[\s\S]*?<\/p>/, "");
  const withoutBlockquote = withoutGospelHeader.replace(/<blockquote>[\s\S]*?<\/blockquote>/, "");
  const texto = extractParagraphs(withoutBlockquote).join("\n\n");

  if (!titulo || !texto) {
    return null;
  }

  return { titulo, texto };
}

const COLOR_MAP: Record<string, string> = {
  white: "Branco",
  green: "Verde",
  red: "Vermelho",
  purple: "Roxo",
  rose: "Rosa",
};

export function mapColor(rawColor: string): string {
  const key = rawColor.trim().toLowerCase();
  return COLOR_MAP[key] ?? cleanLine(rawColor);
}

const RANK_KEYWORDS = ["Solenidade", "Festa", "Memória Facultativa", "Memória"];

export interface TitleInfo {
  liturgia: string;
  santo: string | null;
}

export function parseTitle(rawTitle: string): TitleInfo {
  const liturgia = cleanLine(rawTitle);

  for (const rank of RANK_KEYWORDS) {
    const suffix = `, ${rank}`;
    if (liturgia.endsWith(suffix)) {
      return { liturgia, santo: liturgia.slice(0, -suffix.length).trim() };
    }
  }

  return { liturgia, santo: null };
}
