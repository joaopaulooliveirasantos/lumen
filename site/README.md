# Site de divulgação do Lumen

Site estático de `https://lumenliturgia.com.br`. O planejamento completo está em `doc/planejamento-site-divulgacao.md`.

```bash
cd site
npm install
npm run dev       # http://localhost:5180
npm run build     # gera dist/
bash ../scripts/deploy-site.sh   # publica na VPS (precisa do DNS apontado)
```

## Como funciona

O site usa HTML e CSS puros, sem JavaScript no navegador. O plugin em `vite.config.mjs` monta as páginas no build.

| Marcação | Resultado |
|----------|-----------|
| `<!--@include partials/x.html-->` | Insere um parcial (cabeçalho, rodapé, `<head>`, ícones) |
| `<!--@legal static:arquivo.html-->` | Insere o miolo de `src/static/arquivo.html`, a mesma página que a API serve para a Play Console |
| `<!--@legal md:arquivo.md-->` | Converte `doc/arquivo.md` para HTML |
| `<!--@play-->` | Mostra o selo da Google Play, ou "Em breve no Google Play" enquanto `playLive` for `false` |
| `<!--@qr-->`, `<!--@if-live-->…<!--@endif-->` | Só aparecem depois do lançamento |
| `{{chave}}` | Valores de `site.config.mjs` |

Os textos legais **não** são editados aqui. Altere `src/static/*.html` ou `doc/Termos-de-Uso.md`, e o site acompanha no próximo build.

## Lançamento na Play

Troque `playLive` para `true` em `site.config.mjs`, ou rode `PLAY_LIVE=1 bash scripts/deploy-site.sh`. O selo oficial e o QR code passam a aparecer.

## Imagens

- **Capturas** (`src/assets/telas/*.webp`): telas reais do app, capturadas no Chrome headless a partir do dev server do `web/` (`?semLogin&tab=...&modo=...`) a 390×844 e 3x, e reduzidas para 600 px de largura.
- **`public/og.jpg`** (prévia no WhatsApp e em redes sociais): gerada a partir de `tools/og.html`. Para regerar, rode da pasta `site/`:
  ```bash
  chrome --headless=new --hide-scrollbars --allow-file-access-from-files --window-size=1200,630 \
    --screenshot=og.png "file:///<caminho>/site/tools/og.html"
  ffmpeg -i og.png -q:v 3 public/og.jpg
  ```
- **Selo da Google Play:** arquivo oficial (play.google.com/intl/pt-BR/badges). Não altere as cores nem a proporção.
