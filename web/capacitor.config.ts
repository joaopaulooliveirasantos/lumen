import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.joaopaulosantos.lumen",
  appName: "Lumen Liturgia",
  webDir: "dist",
  plugins: {
    // fetch/XHR passam pela camada nativa: evita CORS e mixed content (WebView em https://localhost chamando a API em http).
    CapacitorHttp: { enabled: true },
  },
};

export default config;
