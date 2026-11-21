import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { marked } from "marked";
import QRCode from "qrcode";
import { site } from "./site.config.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");

// Páginas do site (cada uma vira um index.html na pasta da rota).
const pages = {
  main: "index.html",
  privacidade: "privacidade/index.html",
  termos: "termos/index.html",
  excluirConta: "excluir-conta/index.html",
  notFound: "404.html",
};

// Os textos legais têm fonte única fora do site: as páginas que a API já serve (src/static/*.html,
// usadas na Play Console) e os Termos em doc/. Aqui só tiramos o miolo e ajustamos os links.
const LEGAL_LINKS = { 'href="/privacy-policy"': 'href="/privacidade"' };

function legalFromStatic(file) {
  const html = readFileSync(resolve(repo, "src/static", file), "utf8");
  let body = html.slice(html.indexOf("<body>") + 6, html.indexOf("</body>"));
  body = body.replace(/<!--[\s\S]*?-->/g, "");
  for (const [from, to] of Object.entries(LEGAL_LINKS)) body = body.replaceAll(from, to);
  return body.trim();
}

function legalFromMarkdown(file) {
  const md = readFileSync(resolve(repo, "doc", file), "utf8")
    // "Última atualização: 2026-11-20" -> parágrafo com a mesma classe das páginas estáticas.
    .replace(/^Última atualização: (\d{4})-(\d{2})-(\d{2})$/m, (_, y, m, d) => `<p class="updated">Última atualização: ${d}/${m}/${y}</p>`);
  return marked.parse(md);
}

function playCta(variant) {
  const cls = variant === "light" ? "play play-light" : "play";
  if (!site.playLive) {
    return `<span class="${cls} play-soon" aria-label="Em breve no Google Play"><span class="play-soon-kicker">Em breve no</span><span class="play-soon-name">Google Play</span></span>`;
  }
  return `<a class="${cls}" href="${site.playUrl}" data-play-link rel="noopener"><img src="/src/assets/google-play-badge.png" width="646" height="250" alt="Disponível no Google Play" /></a>`;
}

async function qrCode() {
  if (!site.playLive) return "";
  const svg = await QRCode.toString(site.playUrl, { type: "svg", margin: 1, color: { dark: "#123d24", light: "#ffffff" } });
  return `<figure class="qr">${svg.replace("<svg", '<svg role="img" aria-label="QR code para baixar o Lumen na Google Play"')}<figcaption>Aponte a câmera do celular</figcaption></figure>`;
}

function lumenSite() {
  const vars = { ...site, year: String(new Date().getFullYear()) };
  return {
    name: "lumen-site",
    transformIndexHtml: {
      order: "pre",
      async handler(html) {
        // Inclusões primeiro (os parciais também usam as outras marcações).
        html = html.replace(/<!--@include (\S+)-->/g, (_, p) => readFileSync(resolve(here, p), "utf8"));
        html = html.replace(/<!--@legal static:(\S+)-->/g, (_, f) => legalFromStatic(f));
        html = html.replace(/<!--@legal md:(\S+)-->/g, (_, f) => legalFromMarkdown(f));
        html = html.replace(/<!--@play(?: (\w+))?-->/g, (_, v) => playCta(v));
        if (html.includes("<!--@qr-->")) html = html.replace("<!--@qr-->", await qrCode());
        html = html.replace(/<!--@if-live-->([\s\S]*?)<!--@endif-->/g, (_, inner) => (site.playLive ? inner : ""));
        return html.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
      },
    },
    configureServer(server) {
      // Recarrega a página ao editar parciais ou textos legais (eles não passam pelo grafo do Vite).
      const watched = [resolve(here, "partials"), resolve(repo, "src/static"), resolve(repo, "doc/Termos-de-Uso.md")];
      server.watcher.add(watched);
      server.watcher.on("change", (file) => {
        if (watched.some((w) => resolve(file).startsWith(w))) server.ws.send({ type: "full-reload" });
      });
    },
  };
}

export default defineConfig({
  plugins: [lumenSite()],
  // URLs limpas também em dev e no preview (/privacidade -> privacidade/index.html).
  appType: "mpa",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    assetsInlineLimit: 0,
    rollupOptions: { input: Object.fromEntries(Object.entries(pages).map(([k, v]) => [k, resolve(here, v)])) },
  },
  server: { port: 5180 },
  preview: { port: 5181 },
});
