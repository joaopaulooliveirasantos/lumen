# CI/CD do Lumen

Implementado a partir do plano de resolução do débito técnico de CI/CD
(2026-08-14). Cobre CI (checagem automática em todo push/PR) para
backend e mobile, e CD (entrega) para os dois, com gatilhos manuais por
enquanto — ver "Decisões em aberto" no fim deste documento.

## CI (automático, roda sozinho)

| Workflow | Dispara em | O que faz |
|---|---|---|
| [`.github/workflows/backend-ci.yml`](../.github/workflows/backend-ci.yml) | push/PR tocando `src/`, `tests/`, `package.json`, `tsconfig.json` | `npm ci` + `npm run build` (typecheck) + `npm test` (Vitest) |
| [`.github/workflows/mobile-ci.yml`](../.github/workflows/mobile-ci.yml) | push/PR tocando `mobile/` | `npm ci` + `npm run typecheck` em `mobile/` |

Nenhum dos dois precisa de segredo configurado — rodam prontos assim
que o repositório tiver Actions habilitado.

## CD do backend (manual)

[`.github/workflows/backend-deploy.yml`](../.github/workflows/backend-deploy.yml)
reaproveita o [`scripts/deploy-vps.sh`](../scripts/deploy-vps.sh) que já existia,
disparado via **Actions → Backend Deploy (VPS) → Run workflow** (gatilho
`workflow_dispatch`, não roda sozinho em push).

O script agora faz backup do `dist/` atual no VPS antes de sobrescrever e
restaura automaticamente se `npm run build` falhar lá — o serviço
`systemd` só é reiniciado se o build novo funcionar.

**Segredos/variáveis necessários no GitHub** (Settings → Secrets and
variables → Actions), antes da primeira execução:
- `VPS_SSH_PRIVATE_KEY` (secret) — conteúdo da chave `~/.ssh/ssh-key-2026-07-31.key`.
- `VPS_HOST` / `VPS_USER` (variables, opcionais — o workflow já tem
  `147.15.109.185`/`ubuntu` como default se não forem definidas).

Recomendado também criar o *environment* `production-backend` (Settings
→ Environments) com *required reviewers*, para exigir uma aprovação
manual antes do job rodar de verdade.

## CD do mobile (manual, GitHub Actions aciona EAS Workflows)

O build/submit em si continuam definidos como
[EAS Workflows](https://docs.expo.dev/eas/workflows/introduction/) —
ferramenta nativa da Expo, já que o projeto usa EAS (`mobile/eas.json`).
Note que `.eas/workflows/` mora dentro de `mobile/` (mesmo diretório do
`eas.json`), não na raiz do repo — é assim que o `eas-cli` os localiza.

| Workflow EAS | O que faz |
|---|---|
| [`mobile/.eas/workflows/build-production-android.yml`](../mobile/.eas/workflows/build-production-android.yml) | Build Android, perfil `production` — é o que o botão do GitHub usa |
| [`mobile/.eas/workflows/build-production.yml`](../mobile/.eas/workflows/build-production.yml) | Build Android + iOS, perfil `production` — só via terminal, não ligado ao botão do GitHub |
| [`mobile/.eas/workflows/submit-android.yml`](../mobile/.eas/workflows/submit-android.yml) | Submete o `.aab` mais recente pro Play Store (track interno) |

Dá pra rodar qualquer um deles direto do terminal (`cd mobile && eas
workflow:run .eas/workflows/build-production-android.yml`, sessão do
EAS CLI local já autenticada) **ou**, pelo botão **Actions → Mobile
Deploy (EAS Build + Submit) → Run workflow** no GitHub — usando
[`.github/workflows/mobile-deploy.yml`](../.github/workflows/mobile-deploy.yml).
Esse workflow só autentica e aciona os EAS Workflows acima (que rodam na
infraestrutura da própria EAS) — não faz build/submit dentro do runner
do GitHub. Tem uma opção (`submeter_para_loja`) pra também rodar o
submit logo depois do build, na mesma execução.

O botão do GitHub builda **só Android** (usa
`build-production-android.yml`) — a única loja configurada no projeto
hoje é a Play Store. Pra buildar iOS também, use
`build-production.yml` direto do terminal; submissão iOS continua fora
do escopo do CD (sem credenciais da App Store Connect ainda).

**Segredo necessário no GitHub** (Settings → Secrets and variables →
Actions), antes da primeira execução:
- `EXPO_TOKEN` (secret) — um Access Token da sua conta Expo (expo.dev →
  Account Settings → Access Tokens → Create), **não** é a mesma coisa
  que a sua senha; ele só autentica o `eas-cli` a agir em seu nome.

**Pré-requisito único para o submit funcionar via GitHub/EAS Workflows**
(diferente do build): o `serviceAccountKeyPath` em `mobile/eas.json`
aponta pra um arquivo local (fora do repo) que só existe na sua máquina
— isso funciona pra `eas submit` rodado localmente, mas não pra quando o
submit roda na infraestrutura da EAS (via EAS Workflows, seja disparado
do terminal ou do GitHub Actions). Para esses casos, a própria EAS
precisa ter a chave já cadastrada nas credenciais do projeto — suba ela
uma vez com `eas credentials` (fluxo interativo: escolha Android →
production → "Google Service Account") ou pelo painel do projeto em
expo.dev → *Credentials*. Depois de cadastrada lá, tanto `eas
workflow:run submit-android.yml` quanto o botão no GitHub passam a
funcionar sem precisar de mais nenhum segredo (a chave não precisa virar
segredo do GitHub). Submissão iOS fica de fora por enquanto (exigiria
credenciais da App Store Connect que o projeto ainda não tem).

Recomendado também criar o *environment* `production-mobile` (Settings
→ Environments) com *required reviewers*, mesmo padrão do
`production-backend` — dá uma trava de aprovação manual antes do build
(e principalmente do submit) rodar de verdade.

### EAS Update (OTA) — não implementado ainda

O mobile não tem a dependência `expo-updates` instalada, então toda
mudança — inclusive um fix só de JavaScript — ainda depende de build +
revisão de loja completos. Adicionar OTA (`npx expo install
expo-updates` + `eas update:configure`) resolveria isso para mudanças
JS/assets (mudança nativa continua exigindo build completo). Fica como
próximo passo recomendado, não incluído nesta rodada por exigir decisão
e execução autenticada do dono do projeto.

## O que ainda falta (Fase 5 do plano, configuração no GitHub, não código)

- **Branch protection** na `main`: exigir `backend-ci`/`mobile-ci`
  verdes antes de merge (Settings → Branches).
- **Environments** `production-backend` e `production-mobile` com
  required reviewers (ver acima).
- Criar o secret `EXPO_TOKEN` e, se for usar o submit via GitHub/EAS
  Workflows, cadastrar o Google Service Account nas credenciais do
  projeto na EAS (`eas credentials`) — ver seção acima.

## Decisões em aberto

- Deploy do backend automático a cada merge (`push:` comentado em
  `backend-deploy.yml`) ou manter manual?
- Vale incluir EAS Update nesta fase ou deixar para depois?
- Vale automatizar `submit-android.yml` também via gatilho automático
  (ex.: tag de release) ou manter sempre manual?
- Vale usar o app nativo do Expo no GitHub (Account Settings >
  Connections, com Build Triggers configurados no painel expo.dev) em
  vez do botão no GitHub Actions? Ficou de fora por exigir vincular a
  conta GitHub à Expo via OAuth (só o dono da conta pode fazer) e por
  deixar a configuração de gatilhos fora do repo (não versionada).
