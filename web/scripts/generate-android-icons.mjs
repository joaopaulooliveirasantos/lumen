#!/usr/bin/env node
/**
 * Gera os ícones e a splash do Android a partir das artes da marca em web/assets/
 * (as mesmas do app React Native: mobile/assets/icon.png e adaptive-icon.png).
 *
 * Node puro (só zlib): decodifica PNG de 8 bits (RGB/RGBA, sem entrelaçamento), reduz por média de
 * área e grava PNG RGBA. Saída em android/app/src/main/res:
 *   mipmap-<dpi>/ic_launcher.png             ícone legado (48 dp), a arte inteira
 *   mipmap-<dpi>/ic_launcher_round.png       idem, com máscara circular
 *   mipmap-<dpi>/ic_launcher_foreground.png  camada da frente do ícone adaptável (108 dp)
 *   drawable-(port|land)-<dpi>/splash.png    fundo creme com o emblema redondo no centro
 * As cores de fundo (ícone adaptável e splash) ficam em values/ic_launcher_background.xml e styles.xml.
 *
 * Uso (na pasta web): node scripts/generate-android-icons.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync, inflateSync } from "node:zlib";

const WEB_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RES = join(WEB_ROOT, "android", "app", "src", "main", "res");
export const SPLASH_BACKGROUND = [0xf3, 0xec, 0xda]; // #F3ECDA, o creme da borda do adaptive-icon

// ---- PNG -----------------------------------------------------------------------------------------

export function decodePng(buffer) {
  let offset = 8;
  let width = 0;
  let height = 0;
  let colorType = 0;
  const idat = [];
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      if (data[8] !== 8 || data[12] !== 0) throw new Error("Só PNG de 8 bits sem entrelaçamento.");
      colorType = data[9];
    } else if (type === "IDAT") {
      idat.push(data);
    }
    offset += 12 + length;
  }
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : 0;
  if (!channels) throw new Error(`Tipo de cor PNG não suportado: ${colorType}`);

  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const pixels = new Uint8Array(width * height * channels);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const src = y * (stride + 1) + 1;
    const dst = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? pixels[dst + x - channels] : 0;
      const b = y > 0 ? pixels[dst - stride + x] : 0;
      const c = x >= channels && y > 0 ? pixels[dst - stride + x - channels] : 0;
      let value = raw[src + x];
      if (filter === 1) value += a;
      else if (filter === 2) value += b;
      else if (filter === 3) value += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        value += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      pixels[dst + x] = value & 0xff;
    }
  }

  // Normaliza para RGBA em float, com alfa pré-multiplicado (média correta nas bordas transparentes).
  const rgba = new Float64Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const alpha = channels === 4 ? pixels[i * 4 + 3] / 255 : 1;
    for (let k = 0; k < 3; k++) rgba[i * 4 + k] = pixels[i * channels + k] * alpha;
    rgba[i * 4 + 3] = alpha;
  }
  return { width, height, data: rgba };
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
  return Buffer.concat([head, data, crc]);
}

export function encodePng(image) {
  const { width, height, data } = image;
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const alpha = data[i + 3];
      const o = y * (width * 4 + 1) + 1 + x * 4;
      for (let k = 0; k < 3; k++) raw[o + k] = alpha > 0 ? Math.round(Math.min(255, data[i + k] / alpha)) : 0;
      raw[o + 3] = Math.round(alpha * 255);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---- Operações ----------------------------------------------------------------------------------

/** Pesos de média por área para reduzir `from` amostras a `to` (cada saída cobre from/to entradas). */
function areaWeights(from, to) {
  const scale = from / to;
  return Array.from({ length: to }, (_, i) => {
    const start = i * scale;
    const end = start + scale;
    const taps = [];
    for (let s = Math.floor(start); s < Math.min(from, Math.ceil(end)); s++) {
      const w = Math.min(end, s + 1) - Math.max(start, s);
      if (w > 0) taps.push([s, w / scale]);
    }
    return taps;
  });
}

export function resize(image, width, height) {
  const { width: sw, height: sh, data } = image;
  const wx = areaWeights(sw, width);
  const wy = areaWeights(sh, height);
  const tmp = new Float64Array(width * sh * 4);
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < width; x++) {
      for (const [s, w] of wx[x]) {
        for (let k = 0; k < 4; k++) tmp[(y * width + x) * 4 + k] += data[(y * sw + s) * 4 + k] * w;
      }
    }
  }
  const out = new Float64Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (const [s, w] of wy[y]) {
      for (let x = 0; x < width; x++) {
        for (let k = 0; k < 4; k++) out[(y * width + x) * 4 + k] += tmp[(s * width + x) * 4 + k] * w;
      }
    }
  }
  return { width, height, data: out };
}

/** Máscara circular com borda suavizada (cobertura de ~1 px). */
export function circleMask(image) {
  const { width, height, data } = image;
  const out = new Float64Array(data);
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(width, height) / 2;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      const coverage = Math.max(0, Math.min(1, r - d + 0.5));
      for (let k = 0; k < 4; k++) out[(y * width + x) * 4 + k] *= coverage;
    }
  }
  return { width, height, data: out };
}

/** Fundo sólido com `image` centralizada por cima (composição "over", alfa pré-multiplicado). */
export function compose(width, height, [r, g, b], image) {
  const out = new Float64Array(width * height * 4);
  for (let i = 0; i < width * height; i++) out.set([r, g, b, 1], i * 4);
  const ox = Math.round((width - image.width) / 2);
  const oy = Math.round((height - image.height) / 2);
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      const s = (y * image.width + x) * 4;
      const d = ((y + oy) * width + (x + ox)) * 4;
      const alpha = image.data[s + 3];
      for (let k = 0; k < 4; k++) out[d + k] = image.data[s + k] + out[d + k] * (1 - alpha);
    }
  }
  return { width, height, data: out };
}

// ---- Main ---------------------------------------------------------------------------------------

const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
const SPLASH_SIZES = {
  "drawable": [480, 320],
  "drawable-port-mdpi": [320, 480],
  "drawable-port-hdpi": [480, 800],
  "drawable-port-xhdpi": [720, 1280],
  "drawable-port-xxhdpi": [960, 1600],
  "drawable-port-xxxhdpi": [1280, 1920],
  "drawable-land-mdpi": [480, 320],
  "drawable-land-hdpi": [800, 480],
  "drawable-land-xhdpi": [1280, 720],
  "drawable-land-xxhdpi": [1600, 960],
  "drawable-land-xxxhdpi": [1920, 1280],
};

function write(relPath, image) {
  const path = join(RES, relPath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, encodePng(image));
}

function main() {
  const icon = decodePng(readFileSync(join(WEB_ROOT, "assets", "icon-only.png")));
  const foreground = decodePng(readFileSync(join(WEB_ROOT, "assets", "icon-foreground.png")));

  for (const [dpi, factor] of Object.entries(DENSITIES)) {
    const legacy = Math.round(48 * factor);
    const adaptive = Math.round(108 * factor);
    write(`mipmap-${dpi}/ic_launcher.png`, resize(icon, legacy, legacy));
    write(`mipmap-${dpi}/ic_launcher_round.png`, circleMask(resize(icon, legacy, legacy)));
    write(`mipmap-${dpi}/ic_launcher_foreground.png`, resize(foreground, adaptive, adaptive));
    console.log(`mipmap-${dpi}: ${legacy}px / ${adaptive}px`);
  }

  for (const [dir, [w, h]] of Object.entries(SPLASH_SIZES)) {
    const size = Math.round(Math.min(w, h) * 0.42);
    write(`${dir}/splash.png`, compose(w, h, SPLASH_BACKGROUND, circleMask(resize(icon, size, size))));
    console.log(`${dir}: ${w}x${h}`);
  }
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main();
