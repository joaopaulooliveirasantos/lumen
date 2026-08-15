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

## CD do mobile (manual, via EAS Workflows)

Em vez de reimplementar `eas build`/`eas submit` como job do GitHub
Actions, o build e a submissão do mobile usam
[EAS Workflows](https://docs.expo.dev/eas/workflows/introduction/) —
ferramenta nativa da Expo, já que o projeto usa EAS (`mobile/eas.json`).

| Workflow | Como rodar | O que faz |
|---|---|---|
| [`.eas/workflows/build-production.yml`](../.eas/workflows/build-production.yml) | `eas workflow:run .eas/workflows/build-production.yml` (do terminal, dentro de `mobile/`) | Build Android + iOS, perfil `production` |
| [`.eas/workflows/submit-android.yml`](../.eas/workflows/submit-android.yml) | `eas workflow:run .eas/workflows/submit-android.yml` | Submete o `.aab` mais recente pro Play Store (track interno) |

Os dois usam a sessão já autenticada do EAS CLI local — não precisam de
token adicional pra esse uso manual. O submit usa o mesmo
`serviceAccountKeyPath` já configurado em `mobile/eas.json`. Submissão
iOS fica de fora por enquanto (exigiria credenciais da App Store Connect
que o projeto ainda não tem).

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
- **Environments** `production-backend` e `store-submit` com required
  reviewers (ver acima).

## Decisões em aberto

- Deploy do backend automático a cada merge (`push:` comentado em
  `backend-deploy.yml`) ou manter manual?
- Vale incluir EAS Update nesta fase ou deixar para depois?
- Vale automatizar `submit-android.yml` também via gatilho automático
  (ex.: tag de release) ou manter sempre manual?
