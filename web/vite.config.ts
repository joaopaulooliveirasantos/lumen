/// <reference types="vitest/config" />
import { createReadStream, existsSync, statSync } from "node:fs";
import { join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import preact from "@preact/preset-vite";

// Em dev o navegador chama "/api" no mesmo origin; o proxy evita CORS (a API da VPS não envia cabeçalhos CORS).
const apiTarget = process.env.VITE_DEV_API_TARGET ?? "http://147.15.109.185";

// BIBLE_LOCAL=1 serve /biblias a partir de ../dist-biblias (gerado por scripts/bible/build-bible-assets.mjs),
// para testar sem depender do deploy na VPS. Sem a variável, /biblias vai pelo proxy como /api.
const bibleLocalDir = resolve(fileURLToPath(new URL(".", import.meta.url)), "..", "dist-biblias");
const useLocalBibles = process.env.BIBLE_LOCAL === "1";

function localBibles(): Plugin {
  return {
    name: "lumen-local-bibles",
    configureServer(server) {
      server.middlewares.use("/biblias", (req, res, next) => {
        const urlPath = decodeURIComponent((req.url ?? "/").split("?")[0]);
        const file = normalize(join(bibleLocalDir, "biblias", urlPath));
        if (!file.startsWith(bibleLocalDir)) return next();
        if (!existsSync(file) || !statSync(file).isFile()) {
          res.statusCode = 404;
          res.end();
          return;
        }
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        createReadStream(file).pipe(res);
      });
    },
  };
}

export default defineConfig({
  plugins: [preact(), ...(useLocalBibles ? [localBibles()] : [])],
  server: {
    host: true,
    port: 5173,
    proxy: {
      "/api": { target: apiTarget, changeOrigin: true },
      ...(useLocalBibles ? {} : { "/biblias": { target: apiTarget, changeOrigin: true } }),
    },
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
  },
});
