# Backend Fase 1 - Liturgia Diaria e Reflexoes

## O que foi implementado
- Middleware serverless em Node.js + TypeScript
- Integracao com API externa de liturgia via template de URL
- Parser de feed RSS para reflexoes e audio
- Endpoint REST para consumo do app mobile
- Suite de testes automatizados com Vitest

## Estrutura principal
- src/integrations/liturgyClient.ts: cliente HTTP da fonte de liturgia
- src/integrations/reflectionRssClient.ts: parser e selecao de reflexao por data
- src/services/dailyLiturgyService.ts: consolidacao liturgia + reflexao
- src/serverless/getDailyLiturgy.ts: handler serverless principal
- src/devServer.ts: servidor local para desenvolvimento
- api/liturgia.ts: adaptador para deploy em Vercel

## Configuracao de ambiente
Copie as variaveis de .env.example para seu ambiente:
- LITURGY_API_URL_TEMPLATE (fonte principal Evangelizo)
- EVANGELIZO_LANG
- EVANGELIZO_CONTENT (opcional)
- REFLECTION_RSS_URL

Exemplo:
LITURGY_API_URL_TEMPLATE=https://feed.evangelizo.org/v2/reader.php
EVANGELIZO_LANG=PT
EVANGELIZO_CONTENT=GSP
REFLECTION_RSS_URL=https://www.vaticannews.va/pt.rss.xml

Observacao sobre data: o backend recebe YYYY-MM-DD no endpoint e converte automaticamente para YYYYMMDD ao consultar o Evangelizo.

## Comandos
- Instalar dependencias: npm install
- Rodar em dev: npm run dev
- Rodar testes: npm test
- Build TypeScript: npm run build

## Endpoint
GET /api/liturgia?date=YYYY-MM-DD

### Sucesso (200)
Retorna JSON no formato:
- data
- liturgia
- cor
- primeiraLeitura
- salmo
- segundaLeitura (ou null)
- evangelho
- reflexao (autor, texto, audioUrl)

### Erro de validacao (400)
Quando date nao estiver em formato YYYY-MM-DD.

### Erro de integracao (502)
Quando houver falha ao consolidar dados externos.
