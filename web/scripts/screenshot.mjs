#!/usr/bin/env node
/**
 * Captura de telas do app no Edge/Chrome headless via DevTools Protocol (sem dependências; Node 22+).
 * Diferente de `msedge --screenshot`, espera em tempo real (dados da rede) e permite cliques.
 *
 * Uso: node scripts/screenshot.mjs <url> <saida.png> [--wait 4000] [--width 412] [--height 900]
 *        [--click "texto do botão"]... [--full]
 * Ex.:  node scripts/screenshot.mjs "http://localhost:5173/?semLogin&tab=perfil" perfil.png --click "Configurações"
 */
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const args = process.argv.slice(2);
const [url, out] = args;
if (!url || !out) {
  console.error("Uso: node scripts/screenshot.mjs <url> <saida.png> [--wait ms] [--width px] [--height px] [--click texto]... [--full]");
  process.exit(1);
}
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i > -1 ? args[i + 1] : fallback;
};
const clicks = args.flatMap((a, i) => (a === "--click" ? [args[i + 1]] : []));
const wait = Number(opt("--wait", 12000)); // o 1º carregamento no dev server é lento
const width = Number(opt("--width", 412));
const height = Number(opt("--height", 900));
const full = args.includes("--full");

const BROWSERS = [
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
];
const browser = BROWSERS.find((b) => existsSync(b));
if (!browser) throw new Error("Edge/Chrome não encontrado.");

const profile = mkdtempSync(join(tmpdir(), "lumen-shot-"));
const port = 9300 + Math.floor(Math.random() * 500);
const proc = spawn(browser, [`--headless=new`, `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--disable-gpu", "--hide-scrollbars", "about:blank"], {
  stdio: "ignore",
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function target() {
  for (let i = 0; i < 50; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
      const page = list.find((t) => t.type === "page");
      if (page) return page.webSocketDebuggerUrl;
    } catch {
      /* ainda subindo */
    }
    await sleep(200);
  }
  throw new Error("DevTools não respondeu.");
}

try {
  const ws = new WebSocket(await target());
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  let id = 0;
  const pending = new Map();
  ws.addEventListener("message", (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const n = ++id;
      pending.set(n, (msg) => (msg.error ? reject(new Error(`${method}: ${msg.error.message}`)) : resolve(msg.result)));
      ws.send(JSON.stringify({ id: n, method, params }));
    });

  // Viewport de celular (o headless respeita isto, ao contrário de --window-size abaixo de ~500 px).
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: true });
  await send("Page.enable");
  await send("Page.navigate", { url });
  await sleep(wait);
  if (process.env.SHOT_DEBUG) {
    const { result } = await send("Runtime.evaluate", { expression: "location.href + \" | \" + document.readyState + \" | \" + document.body.innerText.slice(0, 200)", returnByValue: true });
    console.log("debug:", result.value);
  }

  for (const text of clicks) {
    const { result } = await send("Runtime.evaluate", {
      expression: `(() => {
        const t = ${JSON.stringify(text)};
        const el = [...document.querySelectorAll('button, a, [role="tab"], label')].find((e) => e.textContent.trim().includes(t) || e.getAttribute("aria-label") === t);
        if (!el) return false;
        el.click();
        return true;
      })()`,
      returnByValue: true,
    });
    if (!result.value) console.warn(`Aviso: não encontrei "${text}" para clicar.`);
    await sleep(1200);
  }

  // --eval "expressão": roda na página (aceita Promise) e imprime o resultado; útil para depurar.
  const evalExpr = opt("--eval", null);
  if (evalExpr) {
    const { result, exceptionDetails } = await send("Runtime.evaluate", { expression: evalExpr, awaitPromise: true, returnByValue: true });
    console.log("eval:", exceptionDetails ? `ERRO ${exceptionDetails.exception?.description ?? exceptionDetails.text}` : JSON.stringify(result.value));
  }

  let clip;
  if (full) {
    const { result } = await send("Runtime.evaluate", {
      expression: "Math.max(document.documentElement.scrollHeight, ...[...document.querySelectorAll('.app-content')].map(e => e.scrollHeight + 80))",
      returnByValue: true,
    });
    const fullHeight = Math.min(8000, Number(result.value) || height);
    await send("Emulation.setDeviceMetricsOverride", { width, height: fullHeight, deviceScaleFactor: 1, mobile: true });
    await sleep(500);
    clip = { x: 0, y: 0, width, height: fullHeight, scale: 1 };
  }
  const { data } = await send("Page.captureScreenshot", { format: "png", ...(clip ? { clip } : {}) });
  writeFileSync(out, Buffer.from(data, "base64"));
  console.log(`ok: ${out}`);
  ws.close();
} finally {
  proc.kill();
  await sleep(300);
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {
    /* o navegador pode demorar a liberar a pasta */
  }
}
