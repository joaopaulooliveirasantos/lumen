// Configuração do site de divulgação (doc/planejamento-site-divulgacao.md).
// Os valores entram no HTML pelo plugin de vite.config.mjs como {{chave}}.
export const site = {
  url: "https://lumenliturgia.com.br",
  appName: "Lumen Liturgia",
  packageId: "com.joaopaulosantos.lumen",
  playUrl: "https://play.google.com/store/apps/details?id=com.joaopaulosantos.lumen",
  // false enquanto o app não estiver em produção na Play: o botão vira "Em breve no Google Play" e o
  // QR code some. Troque para true no lançamento (ou rode o build com PLAY_LIVE=1).
  playLive: process.env.PLAY_LIVE === "1" || false,
  // Precisa receber e-mail (encaminhamento) antes do deploy: ver seção 6 do planejamento.
  contactEmail: "contato@lumenliturgia.com.br",
};
