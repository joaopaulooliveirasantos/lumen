# Planejamento: site de divulgação do Lumen

Site institucional em `https://lumenliturgia.com.br`. Ele existe para apresentar o app, levar as pessoas à Google Play e reunir as páginas legais em um endereço definitivo.

## 1. Objetivos

| # | Objetivo | Como medir |
|---|----------|------------|
| 1 | Converter visitante em instalação | Cliques no selo "Disponível no Google Play" |
| 2 | Ser encontrado por quem procura "liturgia diária app", "terço guiado", "bíblia católica offline" | Impressões e cliques no Google Search Console |
| 3 | Dar um endereço estável para a Play Console e o app (privacidade, termos, exclusão de conta, contato) | URLs no domínio principal, sem depender da API |
| 4 | Passar confiança: projeto católico, gratuito, sem anúncios, que respeita os dados | Conteúdo da página e da seção de perguntas frequentes |

**Fora do escopo agora:** blog, versão web do app, área logada, iOS.

## 2. Público e mensagem

- **Público:** católicos que rezam ou leem a liturgia todo dia, catequistas, grupos de oração e paróquias que indicam o app aos fiéis.
- **Mensagem central:** "A liturgia do dia, a Bíblia e o Terço em um só lugar, mesmo sem internet."
- **Tom:** acolhedor e sóbrio, com a mesma identidade do app (verde da marca, cruz + LUMEN, cores litúrgicas como acento).

## 3. Mapa do site

| Rota | Conteúdo |
|------|----------|
| `/` | Página principal (seções na próxima tabela) |
| `/privacidade` | Política de Privacidade (de `doc/Politica-de-Privacidade.md`) |
| `/termos` | Termos de Uso (de `doc/Termos-de-Uso.md`) |
| `/excluir-conta` | Instruções de exclusão de conta (hoje em `src/static/excluir-conta.html`) |
| `/contato` | Pode ser só uma âncora `/#contato` na página principal |
| `/404.html` | Página de erro com link para a principal |

### Seções da página principal

| # | Seção | Conteúdo |
|---|-------|----------|
| 1 | Topo (hero) | Logo, frase central, subtítulo curto, selo da Google Play e mockup de celular com a Home do app |
| 2 | Recursos | 6 cartões com ícone e uma frase cada: Liturgia diária com leitura em voz alta; Bíblia offline (Ave Maria e Pastoral); Terço guiado com contas e mistérios do dia; Orações com oração do dia e busca; Planos de leitura; Santo do dia |
| 3 | Telas do app | Carrossel ou faixa com 4 a 6 capturas reais (Home, Liturgia, Bíblia, Terço, Orações, modo escuro) |
| 4 | Feito para o dia a dia | Modos claro, sépia e escuro, ajuste de fonte, conta com e-mail ou Google que guarda marcadores e planos |
| 5 | Perguntas frequentes | É gratuito? Tem anúncios? Funciona sem internet? Quais traduções da Bíblia? Tem para iPhone? Como excluo minha conta? |
| 6 | Chamada final | "Comece hoje", com o selo da Google Play e um QR code (útil no desktop) |
| 7 | Rodapé | Links legais, e-mail de contato, versão atual, "Feito com fé no Brasil" |

## 4. Decisões técnicas (recomendação)

### Tecnologia: HTML estático gerado com Vite
- Usar uma pasta nova `site/` no repositório, com Vite em modo multipágina, HTML e CSS puros e quase nenhum JavaScript (só o carrossel e o menu no celular).
- **Por que:** é o mesmo ferramental do `web/`, carrega muito rápido (o que ajuda no SEO) e não precisa de framework.
- **Reaproveitar do app:** os tokens de cor de `web/src/theme/palette.ts`, a fonte, os ícones SVG de `web/src/components/Icon.tsx` (copiados como SVG inline) e a arte do ícone (`web/android/.../mipmap-xxxhdpi`).
- **Páginas legais:** geradas a partir dos `.md` de `doc/` no build, com um script pequeno usando `marked`. Assim há uma fonte única de texto.

### Hospedagem: a mesma VPS, com server block próprio
- Criar o arquivo novo `scripts/nginx/lumen-site.conf` com `server_name lumenliturgia.com.br www.lumenliturgia.com.br`, `root /var/www/lumen-site` e redirecionamento de `www` para o domínio sem `www`.
- **Não mexer** em `lumen-backend.conf` nem em `sites-available/lider`.
- Certificado com o mesmo método da API: `certbot certonly --webroot -w /var/www/letsencrypt -d lumenliturgia.com.br -d www.lumenliturgia.com.br`. O gancho de renovação atual já recarrega o Nginx.
- Cache: `immutable` para os assets com hash e `no-cache` para os `.html`.
- **Alternativa:** Cloudflare Pages ou GitHub Pages. São grátis e mantêm o site no ar mesmo se a VPS cair, mas criam mais um painel para manter. Recomendo a VPS agora, porque o certificado, o deploy e o DNS já estão dominados.

### DNS (no registro.br, feito por você)
- `A @ → 147.15.109.185`
- `A www → 147.15.109.185` (ou um `CNAME www → lumenliturgia.com.br`)
- `TXT` de verificação do Google Search Console, quando chegar a hora

### Deploy
- **Fase 1:** script `scripts/deploy-site.sh`, que roda `npm run build` em `site/` e envia `site/dist/` para `/var/www/lumen-site` com `rsync` (no mesmo padrão de `deploy-vps.sh`).
- **Depois, se valer a pena:** workflow `.github/workflows/site.yml` disparado por push em `site/**`. Ele exige uma chave SSH de deploy como secret.

### Páginas legais e URLs antigas
- As URLs `https://api.lumenliturgia.com.br/privacy-policy` e `/excluir-conta` **continuam funcionando**: a Play Console e os builds publicados apontam para elas.
- Quando o site estiver no ar, elas passam a responder com um redirecionamento 301 para `https://lumenliturgia.com.br/privacidade` e `/excluir-conta`. Você atualiza as URLs na Play Console quando quiser, sem pressa.

## 5. SEO e compartilhamento

- `<title>` e `meta description` por página, `lang="pt-BR"` e URL canônica.
- Open Graph e Twitter Card com uma imagem 1200×630 (mockup + logo), para a prévia ficar bonita no WhatsApp, que é o principal canal de divulgação desse público.
- JSON-LD `MobileApplication` com nome, sistema operacional, categoria, preço 0 e link da Play.
- `sitemap.xml`, `robots.txt`, favicon e `apple-touch-icon`.
- Cadastro no Google Search Console (verificação via TXT no DNS) e envio do sitemap.
- Meta de qualidade: Lighthouse acima de 95 em desempenho, acessibilidade e SEO, no celular.

### Android App Links (opcional, mas barato)
- Publicar `https://lumenliturgia.com.br/.well-known/assetlinks.json` com o SHA-256 da **chave de assinatura de apps da Play**. Ela fica em Play Console → Integridade do app e **não** é a chave de upload.
- Isso permite, no futuro, que links como `lumenliturgia.com.br/terco` abram direto no app.

## 6. Privacidade, analytics e contato

- **Sem cookies e sem rastreadores de terceiros.** Assim não é preciso banner de cookies, o que é coerente com a política do app (LGPD).
- **Analytics (escolha uma):**
  - nenhum: só o Search Console e as estatísticas da Play Console;
  - **Plausible ou Umami** auto-hospedado na VPS, sem cookies (recomendado se você quiser contar cliques no selo);
  - Cloudflare Web Analytics, que exige o DNS na Cloudflare.
- **E-mail de contato:** o Resend só envia. Para *receber* em `contato@lumenliturgia.com.br`, use encaminhamento: o ImprovMX grátis, ou o Cloudflare Email Routing se o DNS for para a Cloudflare. Ele redireciona para a sua caixa pessoal, que não aparece no site.

## 7. Conteúdo e materiais a produzir

| Item | Como | Quem |
|------|------|------|
| Capturas de tela | Chrome headless sobre o dev server (`?semLogin&tab=...&modo=...`), mesmo processo das prévias | Claude |
| Mockup de celular | Moldura em SVG/CSS em volta das capturas, sem imagem de marca de aparelho | Claude |
| Imagem Open Graph 1200×630 | Gerada da mesma forma | Claude |
| Selo "Disponível no Google Play" | Oficial, baixado em play.google.com/intl/pt-BR/badges, seguindo as regras de uso | Claude |
| Textos | Rascunho a partir dos recursos reais do app | Claude rascunha, você revisa |
| QR code da Play | SVG gerado no build (pacote `qrcode`) | Claude |

**Link da Play:** `https://play.google.com/store/apps/details?id=com.joaopaulosantos.lumen`. Ele só funciona para o público depois do lançamento em produção. Até lá, o botão pode dizer "Em breve no Google Play".

## 8. Fases e estimativa

| Fase | Entrega | Esforço |
|------|---------|---------|
| 0 | DNS `@` e `www` apontando para a VPS; decisões da seção 9 | Você, 10 min |
| 1 | `site/` com a página principal completa, as páginas legais geradas dos `.md` e a 404; prévia local | 1 sessão |
| 2 | Capturas, mockups, imagem OG, SEO técnico (meta, JSON-LD, sitemap) e revisão Lighthouse | 1 sessão |
| 3 | `lumen-site.conf`, certificado, `deploy-site.sh`, publicação e redirecionamento 301 das páginas legais da API | 1 sessão (com sua aprovação para mexer na VPS) |
| 4 | Search Console, `assetlinks.json`, analytics, e-mail de contato | Curto, conforme as escolhas |
| 5 (futuro) | Página "Liturgia de hoje" para SEO, link "Compartilhar o Lumen" dentro do app, CI do site | A decidir |

**Sobre a fase 5:** antes de publicar os textos litúrgicos no site, é preciso confirmar os direitos de uso, porque os textos oficiais da CNBB têm restrições. Uma página com só o resumo do dia (data, tempo litúrgico, cor, referências das leituras e santo do dia) e o botão para ler no app evita esse problema.

## 9. Decisões pendentes (suas)

1. Hospedagem: **VPS (recomendado)** ou Cloudflare/GitHub Pages?
2. Analytics: nenhum, **Plausible/Umami na VPS (recomendado)** ou Cloudflare?
3. E-mail de contato público: criar `contato@lumenliturgia.com.br` com encaminhamento?
4. Lançar o site antes da produção, com o botão "Em breve", ou junto com o lançamento?
5. Mover as páginas legais para o domínio principal, com 301 a partir da API? **(recomendado)**

## 10. Andamento

**21/11/2026: fases 1 e 2 prontas localmente**, em `site/` (veja `site/README.md`). Decisões adotadas: VPS, sem analytics por enquanto, páginas legais no domínio principal e botão "Em breve" até o lançamento na Play.

**Já feito:**
- Página principal com topo, recursos, destaques com capturas reais, dia a dia, compromissos, perguntas frequentes e chamada final.
- `/privacidade`, `/termos`, `/excluir-conta` e `/404.html`, com o texto vindo de `src/static/*.html` e `doc/Termos-de-Uso.md`.
- SEO: título, descrição, URL canônica, Open Graph com `og.jpg` (1200×630), JSON-LD `MobileApplication`, `sitemap.xml` e `robots.txt`.
- Selo oficial da Play e QR code, que só aparecem com `playLive` ativo.
- Publicação preparada: `scripts/nginx/lumen-site.conf` (server block próprio, www e HTTP redirecionam para o domínio sem www) e `scripts/deploy-site.sh` (build, emissão do certificado na primeira vez, troca atômica de release e rollback da config do Nginx).

**Falta (fase 3 em diante):**
1. DNS `A @` e `A www` para `147.15.109.185` (você).
2. Encaminhamento de `contato@lumenliturgia.com.br`, citado no rodapé (ImprovMX ou similar). Até lá, troque `contactEmail` em `site/site.config.mjs`.
3. Rodar `bash scripts/deploy-site.sh`, com aprovação, porque mexe na VPS.
4. Depois do site no ar: redirecionamento 301 de `api.../privacy-policy` e `api.../excluir-conta` para o domínio principal, em `lumen-backend.conf`, e atualização das URLs na Play Console.
5. Search Console, `assetlinks.json` e, no lançamento, `playLive: true`.
