/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

// Em dev o navegador chama "/api" no mesmo origin; o proxy evita CORS (a API da VPS não envia cabeçalhos CORS).
const apiTarget = process.env.VITE_DEV_API_TARGET ?? "http://147.15.109.185";

export default defineConfig({
  plugins: [preact()],
  server: {
    host: true,
    port: 5173,
    proxy: { "/api": { target: apiTarget, changeOrigin: true } },
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
  },
});
