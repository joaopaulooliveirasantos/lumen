# Backend Fase 1 - Liturgia Diaria e Reflexoes

## O que foi implementado
- Middleware serverless em Node.js + TypeScript
- Integracao com o site do Padre Paulo Ricardo (liturgia diaria, cor liturgica, santo do dia e a meditacao do site, usada como homilia), com CNBB e Evangelizo como providers alternativos
- Cliente do comentario/homilia do Evangelizo (type=comment_t/comment_a/comment_s/comment), usado como fallback quando a fonte principal nao tem homilia
- Endpoint REST para consumo do app mobile
- Suite de testes automatizados com Vitest

## Estrutura principal
- src/integrations/pprClient.ts: cliente HTTP bruto do site padrepauloricardo.org/liturgia/DD-MM-YYYY
- src/integrations/pprParsing.ts: parsing do HTML (leituras, salmo, titulo/santo, meditacao)
- src/integrations/pprLiturgyClient.ts / pprSaintClient.ts: adaptam o parsing do Padre Paulo Ricardo ao formato interno
- src/integrations/cnbbClient.ts / cnbbParsing.ts / cnbbLiturgyClient.ts / cnbbSaintClient.ts: provider alternativo (API da CNBB)
- src/integrations/liturgyClient.ts / saintClient.ts: provider alternativo (Evangelizo)
- src/integrations/evangelizoCommentClient.ts: busca titulo, autor, fonte e texto da homilia via Evangelizo (fallback)
- src/services/dailyLiturgyService.ts: consolidacao liturgia + homilia
- src/serverless/getDailyLiturgy.ts / getSaintOfDay.ts: handlers serverless, escolhem o provider via config.liturgyProvider
- src/devServer.ts: servidor local para desenvolvimento
- api/liturgia.ts: adaptador para deploy em Vercel

## Provider de liturgia (Padre Paulo Ricardo vs CNBB vs Evangelizo)
A variavel `LITURGY_PROVIDER` controla de onde vem a liturgia diaria, a cor liturgica e o santo do dia:
- `ppr` (padrao): usa o site padrepauloricardo.org/liturgia/DD-MM-YYYY. A cor liturgica vem de uma classe CSS propria da pagina (nao e inferida por heuristica). A secao "Meditação" do site e usada como homilia (titulo, autor fixo "Padre Paulo Ricardo", fonte "padrepauloricardo.org").
- `cnbb`: usa a API nao-documentada por tras de liturgiadiaria.edicoescnbb.com.br. A cor liturgica tambem vem de um campo proprio da API.
- `evangelizo`: comportamento mais antigo, usando o feed do Evangelizo (cor inferida por palavras-chave no titulo).

A homilia/reflexao sempre tem o Evangelizo como fallback: com `ppr`, isso so e usado quando o site nao publicou uma "Meditação" para aquele dia (isso acontece com frequencia — ver limitacoes abaixo). Com `cnbb` e `evangelizo`, o Evangelizo e sempre a fonte da homilia (nenhum dos dois expõe esse conteudo).

### Limitacoes conhecidas do provider `ppr` (Padre Paulo Ricardo)
- Site nao tem API publica/documentada; o parsing e feito em cima do HTML renderizado no servidor (Rails/Heroku), sem exigir headers especiais como a CNBB, mas tambem sem nenhum contrato de estabilidade.
- **Meditação nem sempre existe.** Em varios dias (especialmente festas e solenidades nos testes feitos) o site so publica as leituras, sem uma reflexao escrita — nesses dias a homilia cai automaticamente no fallback do Evangelizo (comportamento esperado, nao e um bug).
- **Janela de datas limitada para o futuro.** O site so tem paginas publicadas ate poucos meses a frente (nos testes, foi ate meados de dezembro de 2026 estando em agosto de 2026); datas mais distantes retornam redirecionamento (302) e o endpoint responde 502. Isso nao deve afetar o uso normal do app (liturgia do dia/dias proximos), mas evite usar o backend para pre-carregar datas muito no futuro.
- O parser (`pprParsing.ts`) foi validado contra mais de uma dezena de datas reais (domingos, dias comuns, memorias, festas, solenidades, Quaresma, Advento, Pascoa, Pentecostes) cobrindo as 5 cores liturgicas.

### Limitacoes conhecidas do provider `cnbb`
- API nao-documentada: exige headers `Origin`/`Referer` simulando o site oficial da CNBB para nao retornar 403. Pode mudar ou ser bloqueada sem aviso.
- O HTML retornado tem formatacao inconsistente entre dias (cores de fonte, presenca de divs/spans diferentes para o refrao do salmo, ordem de tags nos titulos de secao). O parser (`cnbbParsing.ts`) e tolerante a essas variacoes, testado contra dezenas de datas reais.
- A **Vigilia Pascal (Sabado de Aleluia)** tem uma estrutura completamente diferente (7 leituras do Antigo Testamento) e **nao e suportada** — o endpoint retorna 502 nesse dia especifico.
- Em dias com mais de uma missa no mesmo corpo de conteudo (ex.: Natal - Missa da Aurora e Missa do Dia), o parser sempre retorna a **primeira** missa encontrada no HTML.

## Configuracao de ambiente
Copie as variaveis de .env.example para seu ambiente:
- LITURGY_API_URL_TEMPLATE (usado pelo Evangelizo: homilia de fallback sempre, e liturgia/santo quando LITURGY_PROVIDER=evangelizo)
- EVANGELIZO_LANG
- EVANGELIZO_CONTENT (opcional)
- LITURGY_PROVIDER (opcional, padrao "ppr")

Exemplo:
LITURGY_API_URL_TEMPLATE=https://feed.evangelizo.org/v2/reader.php
EVANGELIZO_LANG=PT
EVANGELIZO_CONTENT=GSP
LITURGY_PROVIDER=ppr

Observacao sobre data: o backend recebe YYYY-MM-DD no endpoint; essa data e convertida para YYYYMMDD ao consultar o Evangelizo, usada como YYYY-MM-DD diretamente na CNBB, e convertida para DD-MM-YYYY ao consultar o Padre Paulo Ricardo.

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
- reflexao (titulo, autor, fonte, texto, audioUrl)

### Erro de validacao (400)
Quando date nao estiver em formato YYYY-MM-DD.

### Erro de integracao (502)
Quando houver falha ao consolidar dados externos.
