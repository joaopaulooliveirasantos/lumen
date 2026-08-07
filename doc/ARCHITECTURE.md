# Arquitetura do Lumen

Documento de referência técnica do projeto: o que existe, como está organizado e como as peças conversam entre si. Cobre o backend (`src/`, `api/`), o app mobile (`mobile/`) e a camada de autenticação (Supabase). Para o histórico de decisões/roadmap original, ver [README.md](../README.md) e [RESUMO-IMPLEMENTACAO-E-PROXIMOS-PASSOS.md](RESUMO-IMPLEMENTACAO-E-PROXIMOS-PASSOS.md).

## 1. Visão geral

Lumen é um app de liturgia diária católica (iOS/Android) com leituras do dia, santo do dia, Bíblia offline, terço guiado e orações, mais uma camada opcional de cadastro/login. A arquitetura tem três partes independentes:

```
┌─────────────────────┐        ┌──────────────────────────┐
│   App mobile (Expo)  │──HTTP─▶│  Backend Node (VPS)       │
│   React Native       │        │  scraping + normalização  │
│                       │        │  de liturgia/santo do dia │
│                       │        └──────────────────────────┘
│                       │
│                       │──────▶ ┌──────────────────────────┐
│                       │        │  Supabase (BaaS)          │
│                       │        │  Auth + Postgres (profiles)│
└──────────────────────┘        └──────────────────────────┘
```

- **Backend Node**: sem banco de dados, sem autenticação — só busca/normaliza conteúdo litúrgico de fontes externas e responde JSON. Roda numa VPS.
- **App mobile**: Expo/React Native, sem biblioteca de navegação nem de estado global (exceto o contexto de auth) — quase tudo é `useState`/`useEffect` local, com cache offline (SQLite) e persistência local (AsyncStorage).
- **Supabase**: cuida de 100% da autenticação (email/senha, Google, Apple) e guarda o perfil público do usuário. O app mobile fala diretamente com o Supabase — o backend Node não participa desse fluxo.

## 2. Stack tecnológica

| Camada | Tecnologias |
|---|---|
| Backend | Node.js + TypeScript (`commonjs`, `NodeNext`), `axios` (HTTP), `zod` v4 (validação), `vitest` (testes), `tsx` (dev runner), TypeScript ^7 |
| Deploy backend | VPS Oracle Cloud (Ubuntu arm64) + Nginx (proxy reverso) + systemd (processo) — sem HTTPS, sem CI/CD |
| Mobile | Expo SDK 54, React 19.1, React Native 0.81.5, TypeScript |
| Persistência mobile | `expo-sqlite` (cache de liturgia), `@react-native-async-storage/async-storage` (preferências/histórico), `expo-secure-store` (sessão de auth) |
| Áudio/mídia mobile | `expo-av` (player de homilia, deprecated na SDK 54 mas ainda em uso com fallback), `expo-speech` (leitura em voz alta / TTS) |
| Notificações | `expo-notifications` (lembrete diário local) |
| Autenticação | Supabase Auth (`@supabase/supabase-js`) — email/senha, Google (OAuth via browser, fluxo PKCE), Apple (nativo via `expo-apple-authentication`) |
| Build/distribuição | EAS Build (perfis `development`/`preview`/`production`), EAS Submit (Play Store) |
| Testes | Vitest (backend) — sem testes automatizados no mobile |

Nenhum dos dois lados usa framework HTTP (Express etc.), ORM, Redux/Zustand, React Query ou React Navigation — tudo é deliberadamente minimalista.

## 3. Funcionalidades

| Área | Funcionalidade |
|---|---|
| Liturgia diária | Leituras do dia (1ª leitura, salmo, 2ª leitura quando houver, evangelho), cor litúrgica, homilia/reflexão em texto + áudio, navegação por calendário (semana/mês), marcar dia como lido ("Amém") |
| Santo do dia | Nome(s) do(s) santo(s) do dia na Home; história completa do santo em tela dedicada (texto + imagem, fonte Canção Nova) |
| Bíblia | Leitura offline (Ave Maria e Pastoral-Paulus), navegação livro→capítulo→versículo, seleção múltipla, copiar/compartilhar, marcadores (bookmarks) com comentário pessoal |
| Orações | Biblioteca estática de orações por categoria (fundamentais, marianas, proteção, santos, etc.) |
| Terço | Fluxo guiado passo a passo por mistério (gozoso/doloroso/glorioso/luminoso), sugestão automática por dia da semana, histórico de dias rezados |
| Personalização | Modo de leitura (claro/escuro/sépia), tamanho de fonte, tradução bíblica preferida |
| Lembrete diário | Notificação local configurável por horário |
| Offline | Liturgia com cache local (SQLite) e prefetch dos próximos 7 dias; Bíblia e orações são 100% locais (bundled) |
| Cadastro/login | Email + senha com confirmação por email; login social Google e Apple; sessão persistente; perfil público com nome/foto; opcional — nenhuma outra funcionalidade depende de conta logada hoje |

## 4. Backend — arquitetura e funcionamento

### 4.1 Pontos de entrada

Dois adaptadores chamam os mesmos handlers "framework-agnostic":

- **[src/devServer.ts](../src/devServer.ts)** — servidor `node:http` puro (sem Express), é o que roda em produção na VPS via systemd. Rotas:
  - `GET /api/liturgia?date=YYYY-MM-DD[&type=saint|saint-story]`
  - `GET /privacy-policy` (serve `src/static/privacy-policy.html`)
  - qualquer outra rota → 404 JSON
- **[api/liturgia.ts](../api/liturgia.ts)** — adaptador para Vercel (`@vercel/node`), remanescente de quando o backend era hospedado lá antes de migrar para a VPS (ver [README-deploy-vps.md](README-deploy-vps.md)). **Diferença importante**: não trata `type=saint-story` — esse endpoint só funciona via `devServer.ts`/VPS, não pela rota Vercel. `@vercel/node` nem está mais nas dependências do projeto, então esse adaptador está efetivamente sem uso ativo.

### 4.2 Handlers serverless ([src/serverless/](../src/serverless/))

Padrão idêntico nos três handlers — entrada `{ query: { date } }`, saída `{ statusCode, headers, body }`:

| Handler | Endpoint | Sucesso | Validação (400) | Falha de integração (502) |
|---|---|---|---|---|
| `getDailyLiturgy.ts` | `type=` (padrão) | `DailyLiturgyPayload` | `date` ausente/inválido | consolidação falhou |
| `getSaintOfDay.ts` | `type=saint` | `{ data, santos[] }` | idem | consulta ao santo falhou |
| `getSaintStory.ts` | `type=saint-story` | `{ data, nome, imagemUrl, fonteUrl, paragrafos[] }` | idem | consulta à história falhou |

### 4.3 Services ([src/services/](../src/services/))

Camada de consolidação entre os handlers e as integrações:

- **`dailyLiturgyService.ts`** — o mais complexo: busca liturgia + homilia **em paralelo**, normaliza campos heterogêneos entre provedores (snake_case/camelCase, nomes de campo diferentes por fonte), decide a homilia final priorizando a do próprio provedor (ex.: Meditação do PPR) e caindo para o comentário do Evangelizo quando ausente, e valida o resultado com `dailyLiturgySchema` (Zod) antes de devolver.
- **`saintOfDayService.ts`** e **`saintStoryService.ts`** — wrappers finos, sem consolidação multi-fonte.

### 4.4 Integrações ([src/integrations/](../src/integrations/)) — 4 famílias de provedores

A variável `LITURGY_PROVIDER` escolhe a fonte de liturgia + santo do dia:

| Provedor | Quando usado | Fonte | Particularidades |
|---|---|---|---|
| **Padre Paulo Ricardo (PPR)** | `LITURGY_PROVIDER=ppr` (padrão) | scraping de `padrepauloricardo.org/liturgia/DD-MM-YYYY` | Cor litúrgica e homilia ("Meditação") próprias do site; **nem todo dia tem meditação** (cai no fallback Evangelizo); páginas futuras limitadas a poucos meses à frente (redireciona → 502 além disso) |
| **CNBB** | `LITURGY_PROVIDER=cnbb` | API não-documentada da CNBB (exige headers `Origin`/`Referer` simulados) | HTML inconsistente entre dias (parser tolerante); **Vigília Pascal (Sábado de Aleluia) não é suportada** (502); dias com 2 missas retornam sempre a primeira |
| **Evangelizo** | `LITURGY_PROVIDER` vazio/outro valor, **e sempre como fallback de homilia** independente do provedor escolhido | feed `feed.evangelizo.org/v2/reader.php` | Único provedor que **infere** a cor litúrgica por palavras-chave no título (os outros dois têm campo próprio); homilia montada a partir de 4 chamadas separadas (`comment_t/a/s`) |
| **Canção Nova** | sempre, exclusivo do endpoint `saint-story` | scraping em 2 etapas de `santo.cancaonova.com` (widget de calendário → página do santo) | Não é selecionável via `LITURGY_PROVIDER`; único responsável pela história completa do santo (texto + imagem) |

### 4.5 Schema e tipos

[src/schema.ts](../src/schema.ts) define os schemas Zod (`dailyLiturgySchema`, `saintOfDaySchema`, `saintStorySchema`, etc.) que validam toda resposta antes de sair pela API — qualquer inconsistência de um provedor vira erro 502 em vez de payload malformado chegando ao app. [src/types.ts](../src/types.ts) espelha os mesmos formatos em TypeScript para tipagem em tempo de compilação.

### 4.6 Configuração

[src/config.ts](../src/config.ts) lê de env vars (ver [.env.example](../.env.example)): `LITURGY_API_URL_TEMPLATE`, `EVANGELIZO_LANG`, `EVANGELIZO_CONTENT`, `LITURGY_PROVIDER`. `PORT` é lido direto no `devServer.ts`, só documentado no `.env` da VPS.

### 4.7 Testes

`npm test` (Vitest) roda `tests/**/*.test.ts` — boa cobertura das famílias PPR e CNBB (client + parser + adapter) e do `dailyLiturgyService`. **Sem testes** para `saintClient.ts`, `cancaoNovaSaintClient.ts`, `saintOfDayService.ts`, `saintStoryService.ts`, `getSaintOfDay.ts`, `getSaintStory.ts` e os dois entry points. Existem também alguns `.test.js` legados na raiz que **não rodam** (o `vitest.config.ts` só inclui `.ts`), incluindo um teste órfão para uma integração (`reflectionRssClient`) que não existe mais no código.

### 4.8 Deploy

VPS Oracle Cloud (`147.15.109.185`), sem domínio/HTTPS ainda. `Internet → Nginx :80 → Node (systemd, :3333)`. Deploy via [scripts/deploy-vps.sh](../scripts/deploy-vps.sh) (idempotente, cobre setup inicial e redeploy). Sem CI/CD — deploy é manual. Detalhes completos em [README-deploy-vps.md](README-deploy-vps.md) e [README-backend-fase1.md](README-backend-fase1.md).

## 5. Mobile — arquitetura e funcionamento

### 5.1 Estrutura e navegação

[mobile/App.tsx](../mobile/App.tsx) é o único componente raiz. **Não usa React Navigation** — a navegação é um `switch` sobre um estado local `activeTab` (`"home" | "liturgia" | "biblia" | "oracoes" | "perfil"`), renderizado pela `BottomTabBar`. Três telas extras (`RosaryScreen`, `SaintStoryScreen`, `AuthScreen`) são overlays de tela cheia controlados por flags booleanas (`rosaryOpen`, `saintStoryOpen`, `authScreenOpen`) em vez de rotas — trocar de aba sempre fecha qualquer overlay aberto.

No bootstrap, o app inicializa o cache SQLite e carrega configurações/histórico do AsyncStorage antes de mostrar qualquer tela (`LoadingScreen` até lá). O tema (cores) é recalculado a cada dia com base na cor litúrgica retornada pelo backend.

### 5.2 Telas ([mobile/src/screens/](../mobile/src/screens/))

| Tela | O que faz |
|---|---|
| `HomeScreen` | Dashboard: data selecionada, faixa de progresso semanal (dias lidos/terço rezado), card do santo do dia, resumo da liturgia com atalho para continuar lendo, atalho para o terço |
| `LiturgyScreen` | Leitura completa do dia — calendário semanal, abas por tipo de leitura, player de áudio/TTS, botão "Amém" para marcar como lido |
| `BibleScreen` | Bíblia offline completa — navegação livro/capítulo/versículo, seleção múltipla, copiar/compartilhar, marcadores com comentário |
| `PrayersScreen` | Biblioteca de orações por categoria, 100% estática |
| `RosaryScreen` | Terço guiado passo a passo, com seleção de mistério e progresso |
| `SaintStoryScreen` | História completa do santo do dia (overlay) |
| `SettingsScreen` | Formulário de preferências (renderizado dentro da `ProfileScreen`) |
| `ProfileScreen` | Estado logado (nome/email/foto real + "Sair") ou visitante (CTA para `AuthScreen`) |
| `AuthScreen` | Entrar / criar conta — email+senha, Google, Apple |

### 5.3 Componentes-chave ([mobile/src/components/](../mobile/src/components/))

`BottomTabBar` (barra inferior, mostra a foto de perfil real no lugar do ícone quando logado), `LoadingScreen`, `DatePickerModal` (calendário mensal), `LiturgyPlayer` (TTS via `expo-speech`, escolhe a melhor voz pt-BR disponível), `ReadingSection`/`ReflectionSection` (cards de leitura/homilia memoizados), `AudioPlayer` (player de homilia via `expo-av`, com fallback caso o módulo não esteja disponível).

### 5.4 Services ([mobile/src/services/](../mobile/src/services/))

- **`api.ts`** — `fetch` puro contra o backend (`fetchDailyLiturgy`, `fetchSaintOfDay`, `fetchSaintStory`), sem headers de auth, sem retry.
- **`notifications.ts`** — agenda o lembrete diário via `expo-notifications` (um único lembrete recorrente por vez, cancela o anterior ao reconfigurar).
- **`date.ts`**, **`color.ts`**, **`rosary.ts`**, **`bibleData.ts`** — utilitários de data, cor, montagem do roteiro do terço e carregamento das traduções bíblicas (JSON estático fora de `mobile/`, em `biblias/`).

### 5.5 Persistência local ([mobile/src/storage/](../mobile/src/storage/))

| Arquivo | Mecanismo | Guarda |
|---|---|---|
| `liturgyCache.ts` | **SQLite** (`expo-sqlite`) | Payload completo da liturgia por data — cache offline e prefetch de 7 dias |
| `readingHistory.ts` | AsyncStorage | Dias marcados como lidos |
| `rosaryHistory.ts` | AsyncStorage | Dias com terço rezado |
| `userSettings.ts` | AsyncStorage | Preferências (fonte, tema, lembrete, tradução) |
| `bookmarks.ts` | AsyncStorage | Marcadores bíblicos com comentário |

Todo esse dado é local-only — não sincroniza entre aparelhos nem depende de login.

### 5.6 Config do app

[mobile/app.json](../mobile/app.json): scheme `lumen` (deep link), bundle id `br.com.lumen.liturgia`, plugins (`expo-sqlite`, `expo-notifications`, `expo-secure-store`, `expo-web-browser`, `expo-apple-authentication`, `expo-font`), `extra.apiBaseUrl` apontando para a VPS (HTTP puro, por isso `usesCleartextTraffic: true` no Android), `extra.supabaseUrl`/`supabaseAnonKey`. [mobile/eas.json](../mobile/eas.json): perfis `development` (dev client), `preview` (gera `.apk` instalável, usado para testes internos) e `production` (gera `.aab`, auto-incrementa versão).

### 5.7 Estratégia offline

Network-first com fallback de cache para a liturgia: tenta a rede, salva no SQLite em caso de sucesso, cai pro cache salvo em caso de falha (com aviso visual "conteúdo offline"). Prefetch silencioso dos próximos 7 dias em background após cada carregamento. Bíblia e orações não dependem de rede — conteúdo embutido no bundle.

## 6. Autenticação (Supabase)

Implementada nesta sessão de trabalho — mobile fala direto com o Supabase, o backend Node não participa.

- **Cadastro por email/senha** com confirmação por email obrigatória antes do primeiro login (comportamento padrão do Supabase Auth).
- **Login social**: Google (fluxo OAuth via navegador, PKCE — o app troca só o parâmetro `code`, não a URL inteira, por uma sessão) e Apple (botão nativo, só iOS, exigência da própria Apple).
- **Sessão persistente**: guardada com um adapter próprio (`LargeSecureStore` em [mobile/src/services/supabaseClient.ts](../mobile/src/services/supabaseClient.ts)) que cifra o valor com AES e guarda a chave no `expo-secure-store` e o blob cifrado no AsyncStorage — contorna o limite de ~2KB do SecureStore puro. Falha de leitura/descriptografia é tratada (descarta o item e segue deslogado, não trava o app).
- **Perfil público**: tabela `profiles` no Postgres do Supabase ([supabase/migrations/0001_profiles.sql](../supabase/migrations/0001_profiles.sql)), criada automaticamente por trigger no cadastro, com RLS (cada usuário só lê/edita a própria linha). Nome e foto priorizam o metadata da sessão atual (mais fresco, especialmente para foto do Google) com fallback pros dados salvos na tabela.
- **Ponto de entrada único**: aba Perfil — mostra "Visitante" + CTA quando deslogado, dados reais + "Sair" quando logado; a foto de perfil também substitui o ícone da aba na barra inferior quando disponível.
- **Login é opcional** — nenhuma outra funcionalidade do app depende de conta ativa hoje.

Detalhes de setup (credenciais Supabase, providers OAuth) em [README-mobile-cadastro-usuario.md](README-mobile-cadastro-usuario.md) — **nota**: esse arquivo descreve a configuração como pendente; na prática, já foi concluída (Supabase configurado, Google e Apple habilitados, `app.json` preenchido).

## 7. Limitações conhecidas / dívida técnica

- **Sem HTTPS** no backend (VPS sem domínio ainda).
- **Sem CI/CD** — deploy do backend e build do mobile são manuais.
- **`api/liturgia.ts` (adaptador Vercel) está desatualizado** — não serve `type=saint-story` e depende de um pacote (`@vercel/node`) que não está mais instalado; candidato a remoção se a VPS for definitiva.
- **Cobertura de testes desigual** — backend tem boa cobertura nas famílias PPR/CNBB, mas nenhuma no Canção Nova, santo do dia isolado, e nos entry points; mobile não tem testes automatizados.
- **Sem exclusão de conta** — exigência das lojas (Play/App Store) para apps com cadastro, ainda não implementada.
- **Dados do usuário não sincronizam entre aparelhos** — histórico de leitura, terço e marcadores bíblicos são só locais, mesmo estando logado.
- **PPR e CNBB são scraping sem contrato de API** — podem quebrar sem aviso; Evangelizo como fallback de homilia mitiga parcialmente.

## 8. Outros documentos no repositório

- [README.md](../README.md) — planejamento original e roadmap por fases.
- [RESUMO-IMPLEMENTACAO-E-PROXIMOS-PASSOS.md](RESUMO-IMPLEMENTACAO-E-PROXIMOS-PASSOS.md) — status de entrega por fase.
- [README-backend-fase1.md](README-backend-fase1.md) — detalhes do backend e dos provedores de liturgia.
- [README-deploy-vps.md](README-deploy-vps.md) — runbook completo de deploy/operação da VPS.
- [README-mobile-cadastro-usuario.md](README-mobile-cadastro-usuario.md) — detalhes da feature de cadastro/login.
