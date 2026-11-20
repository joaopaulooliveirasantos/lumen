# Status da migração do frontend (React Native → Preact + Vite + Capacitor)

Atualizado em 2026-11-19 (Fase 1 concluída; Fase 3 implementada, aguardando deploy na VPS). Plano completo e decisões: [planejamento-migracao-frontend.md](planejamento-migracao-frontend.md). Login obrigatório: [planejamento-login-obrigatorio.md](planejamento-login-obrigatorio.md).

## Resumo

As **Fases 1 (prova de conceito Android)** e **2 (fundação)** estão concluídas: o AAB 16 foi instalado pela trilha interna por cima do app RN e **todos os testes da tela de Diagnóstico deram OK no celular**. A **Fase 3 (Bíblias na VPS)** está implementada e testada localmente; falta publicar os arquivos e a nova config do Nginx na VPS. O novo app vive em `lumen/web`. O React Native (`lumen/mobile`) fica **congelado para novos recursos**; na trilha interna ele já foi substituído pelo novo app (versionCode 16).

## Estado do repositório

| Item | Estado |
|---|---|
| `8d4dea2`, `5570311` | Em `origin/main` (Capacitor, workflow de build, correção do `versionCode`) |
| `127b243`, `e0ad730` | Em `origin/main` (plugins nativos, tela de Diagnóstico, este arquivo) |
| Fase 3 (Bíblias) | **Ainda não commitada**: gerador, config do Nginx, deploy, carregador, testes |
| `lumen/app.json` (raiz) | Não rastreado e **não é meu**; deixado de fora de todos os commits |
| AAB `lumen-web-aab-15` | Gerado pelo run `44650160994` (build sem plugins nativos). Não enviado à Play Store |
| AAB `lumen-web-aab-16` | Gerado pelo run `44655899497` **com os plugins nativos** (3,2 MB, mesmo SHA1 `C3:33:…:22:8F`). Cópia local em `C:\Users\jposr\Downloads\lumen-aab-16\app-release.aab`. Publicado na trilha interna e validado no aparelho |
| Próximo `versionCode` livre | 17 (o RN publicou até 14; 15 e 16 existem como artefatos do GitHub) |

## O que já foi feito

### Fundação (`lumen/web`)
- Projeto **Preact 11 + Vite + TypeScript 5.9 + Vitest** (`npm run dev | build | typecheck | test`).
- **Lógica portada** do RN (copiada e adaptada): tipos, dados (orações, planos com capas via `import.meta.glob`, terço), datas, cores, serviços de terço e planos, ranking de vozes de TTS.
- **Armazenamento**: camada `kv` assíncrona (`localStorage` no navegador, **Preferences** no Android) e cache da liturgia em **IndexedDB**.
- **API**: cliente `fetch`; em dev o Vite faz proxy de `/api` para a VPS (`VITE_DEV_API_TARGET`, padrão `http://147.15.109.185`), porque a API não envia cabeçalhos CORS.
- **Tema**: paletas claro, escuro e sépia e cor litúrgica como variáveis CSS.
- **Shell**: barra inferior (ícones SVG provisórios, botão ativo na cor litúrgica), Home funcional (liturgia de hoje com cache offline) e demais abas como placeholders.
- **Testes**: 39 testes em 6 arquivos (datas, tema, terço com 79 passos, planos, `resolveReference`, ranking de vozes, storage, cache de liturgia, deep link do OAuth, horário, mapeamento de vozes, gerador e carregador das Bíblias, planos contra as Bíblias reais). Typecheck e build passam.
- `node_modules`: cerca de **128 MB** (contra 555 MB no RN). A meta era menos de 100 MB. Dá para ganhar cerca de 10 MB trocando jsdom por happy-dom.

### Android / CI (Fase 1, concluída)
- **Capacitor 8** configurado em `web/capacitor.config.ts` (`com.joaopaulosantos.lumen`, `CapacitorHttp` ligado para evitar CORS e mixed content).
- Projeto Android em `web/android`:
  - `versionCode` e `versionName` lidos das variáveis `VERSION_CODE` e `VERSION_NAME` (padrões 15 e 1.1.0);
  - assinatura release via `KEYSTORE_PATH`, `KEYSTORE_PASSWORD`, `KEY_ALIAS` e `KEY_PASSWORD`;
  - `usesCleartextTraffic` ligado (a VPS ainda não tem HTTPS);
  - *intent-filter* do esquema `lumen://` para o retorno do login.
- Workflow [web-android.yml](../.github/workflows/web-android.yml) (disparo manual): typecheck, testes, build, `cap sync`, restaura a keystore, `bundleRelease` com JDK 21, imprime o certificado e publica o AAB como artefato. **Não envia nada à Play Store.**
- **Keystore** exportada do EAS para `C:\Users\jposr\keys\lumen\` (fora do repositório; `*.jks` e `*.keystore` ficam no `.gitignore`). Os segredos `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` e `ANDROID_KEY_PASSWORD` já existem no GitHub.
- **Assinatura**: o AAB do run `44650160994` saiu com SHA1 `C3:33:81:45:6C:64:EF:45:38:9B:81:7D:7B:5B:01:65:E3:1C:22:8F`. A comparação com a chave de upload da Play Console foi feita por você ("feito.ok"); eu considerei que bateu. Reconfirme se houver dúvida.
- **Camada nativa** (em `127b243`, compilada no run `44655899497` e validada no aparelho): plugins `local-notifications`, `preferences`, `browser`, `app`, `clipboard`, `share`, `text-to-speech` e `secure-storage`; módulos em `web/src/native/` (notificações, TTS, cliente Supabase com sessão em armazenamento seguro, login Google por deep link `lumen://oauth-callback`).
- **Tela de Diagnóstico** (aba Perfil) com um botão e um selo OK/FALHA para cada teste: ambiente, API da VPS, Bíblia da VPS (novo, ainda não testado no aparelho), IndexedDB, preferências, armazenamento seguro, notificação em 20 s, lembrete diário, vozes e fala de TTS, copiar, compartilhar, login Google, sessão e sair.
- **Validação no aparelho (2026-11-19)**: AAB 16 instalado pela trilha interna por cima do RN (pacote, assinatura e `versionCode` aceitos) e todos os testes de Diagnóstico OK, inclusive o login Google pelo deep link.
- **Decisão**: o app novo é instalado pela trilha interna. Uma correção crítica no RN, se necessária, sai pelo EAS com `versionCode` 17 ou maior.

### Bíblias na VPS (Fase 3, implementada; falta o deploy)
- **Gerador** [scripts/bible/build-bible-assets.mjs](../scripts/bible/build-bible-assets.mjs) (Node puro, sem dependências): valida cada tradução (46 + 27 livros, capítulos em sequência, versículos não vazios) e gera em `lumen/dist-biblias/biblias/` (no `.gitignore`):
  - `manifest.json`: traduções e versão atual (cache `no-cache`);
  - `<traducao>/<versao>/index.json`: livros, testamento e versículos por capítulo;
  - `<traducao>/<versao>/<NN-slug>.json`: um livro por arquivo, no formato `BibleBook`;
  - cada arquivo com um `.json.gz` ao lado (gzip nível 9). Total: 10,9 MB, ou **3,4 MB com gzip**, para as duas traduções.
  - A versão é um hash do conteúdo (Ave Maria `7ec1dafdf828`, Pastoral `7a239aa62217`): só muda se algum texto mudar.
- **Nginx**: a config agora vive em [scripts/nginx/lumen-backend.conf](../scripts/nginx/lumen-backend.conf), fonte única para os dois scripts de deploy. `/biblias/` sai de `/var/www/lumen-static` com `gzip_static`, `Cache-Control: immutable` (só o manifesto é `no-cache`) e `Access-Control-Allow-Origin: *`. O [deploy-vps.sh](../scripts/deploy-vps.sh) passou a enviar esse arquivo e restaura a config anterior se o `nginx -t` falhar.
- **Deploy** [scripts/deploy-biblias.sh](../scripts/deploy-biblias.sh): gera, envia, copia as versões novas sem apagar as antigas, troca o manifesto por último, aplica a config do Nginx e testa as URLs.
- **Carregador** [web/src/services/bible.ts](../web/src/services/bible.ts):
  - manifesto uma vez por sessão (sem rede, usa a última cópia salva no `kv`);
  - índice e livros sob demanda, guardados no IndexedDB (store `bible_cache`, banco na versão 2);
  - quando a versão muda, rebaixa sob demanda; sem rede, usa o livro da versão anterior; guarda só duas versões;
  - `downloadBibleTranslation` (4 downloads em paralelo, com progresso), `getBibleDownloadStatus` e `clearBibleTranslation` para as Configurações;
  - `loadBibleBook` serve direto como `BibleBookLoader` para os planos de leitura.
- **Dev**: o Vite encaminha `/biblias` para a VPS. Com `BIBLE_LOCAL=1 npm run dev`, serve de `dist-biblias` (rodar o gerador antes).
- **Validação dos planos**: [web/tests/readingPlans.bible.test.ts](../web/tests/readingPlans.bible.test.ts) substitui o `validate-reading-plans.js` do RN e lê as Bíblias de `lumen/biblias`. Mantém a única exceção conhecida: Ester 14–16 (dia 227 do "Bíblia em um ano") não existe na Pastoral.

## O que ainda falta

### Fechar a Fase 3
1. **Deploy na VPS**: `bash scripts/deploy-biblias.sh` (Git Bash). Conferir `manifest: HTTP 200` e o Gênesis com gzip no final.
2. **Build 17** e rodar no aparelho o teste "Bíblia da VPS" duas vezes: com rede e em modo avião.

### Fase 4: design system
- Ícones definitivos (os atuais são aproximações), cards, tela de carregamento e ícone do app (hoje o padrão do Capacitor).

### Fase 5: login e portão de entrada (no novo frontend)
- Telas de boas-vindas/login, criar conta (nome, e-mail, telefone, senha), Google, completar cadastro e recuperar senha.
- Migração `0002_profile_phone.sql` no Supabase, SMTP próprio, exclusão de conta (Edge Function) e política de privacidade. Só Android, sem "Entrar com Apple".
- Decisões do plano de login ainda em aberto: senha ou código por e-mail, telefone verificado por SMS ou não, telefone único, termos de uso e tolerância para usuários atuais.

### Fase 6: telas, da mais simples para a mais complexa
Orações, Configurações, Perfil, Liturgia, Santo do dia, Home completa, Planos de leitura, Terço e Bíblia (a de maior volume). Os testes de Diagnóstico viram serviços reais (lembrete nas Configurações, player de TTS, etc.).

### Fases 7 a 10
- Paridade e qualidade: checklist de funcionalidades contra o RN, desempenho, acessibilidade e modos de leitura.
- Publicação: envio automático à trilha interna pelo CI, política de privacidade e formulário de Segurança dos dados da Play Console, conta de teste para o revisor, lançamento em etapas.
- Desativar o React Native (`lumen/mobile`) depois de a nova versão estar estável em produção.

## Riscos e pontos de atenção
- **HTTP sem TLS na VPS:** hoje o app usa HTTP cleartext. HTTPS exige um domínio apontando para o IP e Certbot. Vale resolver antes do lançamento amplo.
- **CORS:** a API da VPS não envia cabeçalhos CORS. No dev, o proxy do Vite cobre; no Android, o `CapacitorHttp` cobre. Se um dia o app rodar como PWA, será preciso adicionar CORS no backend.
- **TTS e notificações:** são os recursos com maior chance de se comportar diferente do RN. A tela de Diagnóstico existe para isso.
- **Sessão:** os tokens do Supabase ficam no armazenamento seguro (Keystore), nunca em `localStorage`.
- **Dependência da VPS para a Bíblia:** coberta pelo cache offline e pela opção de baixar a tradução inteira. Falta monitoramento básico (ex.: checar `/biblias/manifest.json` e `/api/liturgia` periodicamente).
- **Deploy do backend sobrescreve o Nginx:** resolvido. Os dois scripts usam o mesmo `scripts/nginx/lumen-backend.conf`; editar a config só ali.

## Como retomar
```powershell
# ambiente do novo frontend
Set-Location C:\Users\jposr\desenv\lumen\web
npm install          # demora alguns minutos
npm run dev          # http://localhost:5173 (proxy /api para a VPS)
npm test             # o Vitest às vezes estoura o timeout do worker; basta repetir
npm run typecheck

# Bíblias (na pasta lumen, pelo Git Bash)
node scripts/bible/build-bible-assets.mjs   # gera dist-biblias/
bash scripts/deploy-biblias.sh              # gera e publica na VPS

# CI Android
gh workflow run web-android.yml -f version_code=17 -f version_name=1.1.0   # próximo build
gh run watch <id>                                     # acompanhar
gh run view <id> --log-failed                         # erro, se falhar
gh run download <id> -n lumen-web-aab-17              # baixar o AAB
```

Dicas de ambiente:
- Neste ambiente, comandos que dependem de pasta funcionam melhor no formato `& { Set-Location -LiteralPath <pasta>; <comando> }`.
- Não há JDK nem Android SDK na máquina: o build Android é feito no GitHub Actions.
- O build do RN continua pelo EAS (`eas build --platform android --profile production --auto-submit`), caso seja necessário publicar uma correção crítica antes da migração terminar.
- O Capacitor precisa que o `dist` esteja gerado antes do `cap sync`; o workflow já faz isso.
