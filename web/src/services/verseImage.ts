// Imagem para compartilhar versículos: fundo com a identidade do Lumen (verde e dourado do logo),
// "Lumen Liturgia Católica" no topo, o texto no meio e a referência (sigla, capítulo e versículos)
// no rodapé. Desenhada num <canvas> 1080x1350 (formato 4:5, bom para WhatsApp e Instagram).
import logoUrl from "../assets/brand/logo.png";

export const VERSE_IMAGE_WIDTH = 1080;
export const VERSE_IMAGE_HEIGHT = 1350;

const GREEN_TOP = "#123d24";
const GREEN_BOTTOM = "#0a2516";
const GOLD = "#c9a24b";
const GOLD_LIGHT = "#e8d39a";
const SERIF = '"Noto Serif", Georgia, "Times New Roman", serif';
const SANS = 'Roboto, "Segoe UI", system-ui, sans-serif';

const SUPERSCRIPT = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const toSuperscript = (n: number) => String(n).replace(/\d/g, (d) => SUPERSCRIPT[Number(d)]);

/**
 * Versículos no padrão da CNBB: faixas com hífen e saltos com ponto. Ex.: [16,17,18,20] -> "16-18.20".
 */
export function formatVerseList(verses: number[]): string {
  const sorted = [...new Set(verses)].sort((a, b) => a - b);
  const parts: string[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const start = sorted[i];
    while (i + 1 < sorted.length && sorted[i + 1] === sorted[i] + 1) i++;
    parts.push(sorted[i] === start ? `${start}` : `${start}-${sorted[i]}`);
  }
  return parts.join(".");
}

/** Referência do rodapé, ex.: "Jo 3,16-17". */
export function formatReference(abbreviation: string, chapter: number, verses: number[]): string {
  return `${abbreviation} ${chapter},${formatVerseList(verses)}`;
}

/** Texto do meio da imagem. Com mais de um versículo, cada um leva o número em sobrescrito. */
export function composeVerseText(verses: { versiculo: number; texto: string }[]): string {
  if (verses.length === 1) return verses[0].texto.trim();
  return verses.map((v) => `${toSuperscript(v.versiculo)} ${v.texto.trim()}`).join(" ");
}

/** Quebra o texto em linhas que caibam em `maxWidth`, usando a medida do canvas. */
export function wrapLines(text: string, maxWidth: number, measure: (s: string) => number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (!line || measure(candidate) <= maxWidth) line = candidate;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Escolhe o maior tamanho de fonte (de `max` a `min`) em que o texto cabe na caixa. Se nem no mínimo
 * couber, corta as linhas que sobram e termina com reticências.
 */
export function fitText(
  text: string,
  box: { width: number; height: number },
  measureAt: (size: number) => (s: string) => number,
  { max = 64, min = 30, lineHeight = 1.42 } = {},
): { size: number; lines: string[] } {
  for (let size = max; size >= min; size -= 2) {
    const lines = wrapLines(text, box.width, measureAt(size));
    if (lines.length * size * lineHeight <= box.height) return { size, lines };
  }
  const measure = measureAt(min);
  const maxLines = Math.max(1, Math.floor(box.height / (min * lineHeight)));
  const lines = wrapLines(text, box.width, measure).slice(0, maxLines);
  let last = lines[lines.length - 1];
  while (last.includes(" ") && measure(`${last}…`) > box.width) last = last.slice(0, last.lastIndexOf(" "));
  lines[lines.length - 1] = `${last.replace(/[\s,.;:]+$/, "")}…`;
  return { size: min, lines };
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const base = ctx.createLinearGradient(0, 0, 0, h);
  base.addColorStop(0, GREEN_TOP);
  base.addColorStop(1, GREEN_BOTTOM);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  // Brilho dourado atrás do texto.
  const glow = ctx.createRadialGradient(w / 2, h * 0.48, 0, w / 2, h * 0.48, w * 0.75);
  glow.addColorStop(0, "rgba(201, 162, 75, 0.26)");
  glow.addColorStop(1, "rgba(201, 162, 75, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  // Raios suaves saindo do centro, como no logo.
  ctx.save();
  ctx.translate(w / 2, h * 0.48);
  ctx.fillStyle = "rgba(232, 211, 154, 0.035)";
  for (let i = 0; i < 36; i++) {
    ctx.rotate((Math.PI * 2) / 36);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-28, -h);
    ctx.lineTo(28, -h);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Moldura fina dourada.
  ctx.strokeStyle = "rgba(232, 211, 154, 0.35)";
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, w - 80, h - 80);
}

/** Linha dourada com um losango no meio (ornamento entre seções). */
function drawOrnament(ctx: CanvasRenderingContext2D, cx: number, y: number, half: number) {
  ctx.strokeStyle = "rgba(201, 162, 75, 0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - half, y);
  ctx.lineTo(cx - 16, y);
  ctx.moveTo(cx + 16, y);
  ctx.lineTo(cx + half, y);
  ctx.stroke();
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.moveTo(cx, y - 8);
  ctx.lineTo(cx + 8, y);
  ctx.lineTo(cx, y + 8);
  ctx.lineTo(cx - 8, y);
  ctx.closePath();
  ctx.fill();
}

function spacedText(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, spacing: number) {
  // letterSpacing ainda não existe em todos os WebViews: desenha letra a letra.
  const widths = [...text].map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (text.length - 1);
  let x = cx - total / 2;
  ctx.textAlign = "left";
  [...text].forEach((c, i) => {
    ctx.fillText(c, x, y);
    x += widths[i] + spacing;
  });
  ctx.textAlign = "center";
}

export type VerseImageInput = {
  verses: { versiculo: number; texto: string }[];
  abbreviation: string;
  bookName: string;
  chapter: number;
  translation?: string;
};

export async function renderVerseImage(input: VerseImageInput): Promise<Blob> {
  const w = VERSE_IMAGE_WIDTH;
  const h = VERSE_IMAGE_HEIGHT;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível.");
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  drawBackground(ctx, w, h);

  // ---- Cabeçalho ----
  const logo = await loadImage(logoUrl);
  if (logo) ctx.drawImage(logo, w / 2 - 56, 92, 112, 112);
  ctx.fillStyle = GOLD_LIGHT;
  ctx.font = `700 40px ${SANS}`;
  spacedText(ctx, "LUMEN", w / 2, 252, 14);
  ctx.fillStyle = "rgba(255, 255, 255, 0.78)";
  ctx.font = `500 30px ${SANS}`;
  spacedText(ctx, "Liturgia Católica", w / 2, 298, 3);
  drawOrnament(ctx, w / 2, 352, 150);

  // ---- Texto ----
  const box = { top: 400, bottom: h - 300, side: 120 };
  const text = `“${composeVerseText(input.verses)}”`;
  const measureAt = (size: number) => {
    ctx.font = `italic 400 ${size}px ${SERIF}`;
    return (s: string) => ctx.measureText(s).width;
  };
  const { size, lines } = fitText(text, { width: w - box.side * 2, height: box.bottom - box.top }, measureAt);
  ctx.font = `italic 400 ${size}px ${SERIF}`;
  ctx.fillStyle = "#ffffff";
  const lineHeight = size * 1.42;
  const blockTop = box.top + (box.bottom - box.top - lines.length * lineHeight) / 2;
  lines.forEach((line, i) => ctx.fillText(line, w / 2, blockTop + lineHeight * (i + 0.5)));

  // ---- Rodapé ----
  drawOrnament(ctx, w / 2, h - 252, 150);
  ctx.fillStyle = GOLD;
  ctx.font = `700 56px ${SERIF}`;
  ctx.fillText(formatReference(input.abbreviation, input.chapter, input.verses.map((v) => v.versiculo)), w / 2, h - 186);
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.font = `400 28px ${SANS}`;
  ctx.fillText(input.translation ? `${input.bookName} · ${input.translation}` : input.bookName, w / 2, h - 128);

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Falha ao gerar a imagem."))), "image/jpeg", 0.92));
}
