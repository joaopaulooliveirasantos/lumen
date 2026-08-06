function decodeEntities(input: string): string {
  return input
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCharCode(Number(code)));
}

function stripTags(input: string): string {
  return decodeEntities(input.replace(/<[^>]+>/g, ""))
    .replace(/\s+/g, " ")
    .trim();
}

// A home do site (`/?sDia=&sMes=&sAno=`) ignora esses parametros no
// servidor e sempre reflete o dia real atual (o widget de calendario e
// so decoracao client-side). O unico jeito de obter a url do santo de uma
// data especifica e replicar a chamada AJAX que o proprio widget de
// calendario do site faz (`action=widget-ajax`) para renderizar a grade do
// mes pedido, que traz um link por dia com a url definitiva do santo.
export function extractSaintUrlForDay(calendarAjaxHtml: string, day: number, month: number): string | null {
  const pattern = new RegExp(`href="(https://santo\\.cancaonova\\.com/santo/[^"]*)\\?sDia=${day}&sMes=${month}&`);
  const match = calendarAjaxHtml.match(pattern);
  return match ? match[1] : null;
}

export interface SaintStoryBlock {
  tipo: "titulo" | "texto";
  texto: string;
}

export interface ParsedSaintStory {
  nome: string;
  imagemUrl: string | null;
  paragrafos: SaintStoryBlock[];
}

// A pagina de detalhe encerra a biografia e emenda, sem separador, a lista
// "Outros santos e beatos celebrados em <dia>" (mais fontes e credito de
// edicao). Cortar exatamente nesse paragrafo evita incluir esse apendice
// no texto exibido no app.
const APPENDIX_MARKER = /<p>\s*<strong>\s*Outros santos/i;

export function parseSaintStory(detailHtml: string): ParsedSaintStory {
  const titleMatch = detailHtml.match(/<h1 class="entry-title">\s*<span>([\s\S]*?)<\/span>/);
  if (!titleMatch) {
    throw new Error("Titulo do santo nao encontrado na pagina da Cancao Nova.");
  }
  const nome = stripTags(titleMatch[1]);
  if (!nome) {
    throw new Error("Titulo do santo vazio na pagina da Cancao Nova.");
  }

  const contentMatch = detailHtml.match(/<div class="entry-content content-santo">([\s\S]*?)<\/article>/);
  if (!contentMatch) {
    throw new Error("Conteudo do santo nao encontrado na pagina da Cancao Nova.");
  }

  let content = contentMatch[1]
    .replace(/<ul id='share-buttons'[\s\S]*?<\/ul>/g, "")
    .replace(/<input[^>]*>/g, "");

  // A busca e restrita ao dominio de fotos (img.cancaonova.com) em vez de
  // pegar a primeira <img> do conteudo: os icones de compartilhar (SVG em
  // static.cancaonova.com) variam de marcacao entre requisicoes e ja
  // causaram falsos positivos mesmo apos remover o bloco de compartilhar.
  const imageMatch = content.match(/<img[^>]*src="(https:\/\/img\.cancaonova\.com\/[^"]*\.(?:jpe?g|png|webp))"/i);
  // O nome do arquivo de upload preserva acentos (ex.: "São-João...jpg") sem
  // percent-encoding no HTML; o servidor de imagens devolve 404 para essa
  // url crua, entao precisa ser codificada antes de sair da API.
  const imagemUrl = imageMatch ? encodeURI(decodeEntities(imageMatch[1])) : null;

  const appendixMatch = content.match(APPENDIX_MARKER);
  const listIndex = content.indexOf("<ul");
  const bioHtml =
    appendixMatch?.index !== undefined
      ? content.slice(0, appendixMatch.index)
      : listIndex === -1
        ? content
        : content.slice(0, listIndex);

  const paragrafos: SaintStoryBlock[] = [];

  for (const match of bioHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)) {
    const inner = match[1].trim();
    const headingMatch = inner.match(/^<strong>([\s\S]*)<\/strong>$/i);

    if (headingMatch) {
      const texto = stripTags(headingMatch[1]);
      if (texto) paragrafos.push({ tipo: "titulo", texto });
      continue;
    }

    const texto = stripTags(inner);
    if (texto) paragrafos.push({ tipo: "texto", texto });
  }

  if (paragrafos.length === 0) {
    throw new Error("Nenhum paragrafo de historia encontrado na pagina da Cancao Nova.");
  }

  return { nome, imagemUrl, paragrafos };
}
