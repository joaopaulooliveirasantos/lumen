# Status da migração do frontend (React Native → Preact + Vite + Capacitor)

Atualizado em 2026-11-19. Plano completo e decisões: [planejamento-migracao-frontend.md](planejamento-migracao-frontend.md). Login obrigatório: [planejamento-login-obrigatorio.md](planejamento-login-obrigatorio.md).

## Resumo

A **Fase 2 (fundação)** está concluída e a **Fase 1 (prova de conceito Android)** está em andamento. O novo app vive em `lumen/web` e já roda no navegador e compila para um AAB assinado pelo GitHub Actions. Falta validar os recursos nativos num aparelho. O app React Native (`lumen/mobile`) continua sendo o publicado (versionCode 14, trilha interna) e está **congelado para novos recursos**.

## Estado do repositório

| Item | Estado |
|---|---|
| `8d4dea2`, `5570311` | Em `origin/main` (Capacitor, workflow de build, correção do `versionCode`) |
| `127b243` | **Só local, sem push**: plugins nativos e tela de Diagnóstico |
| Este arquivo | Ainda não commitado |
| `lumen/app.json` (raiz) | Não rastreado e **não é meu**; deixado de fora de todos os commits |
| AAB `lumen-web-aab-15` | Gerado pelo run `44650160994` (build sem plugins nativos). **Não foi enviado à Play Store** |
| Próximo `versionCode` livre | 16 (o RN publicou até 14; o 15 só existe como artefato do GitHub) |

## O que já foi feito

### Fundação (`lumen/web`)
- Projeto **Preact 11 + Vite + TypeScript 5.9 + Vitest** (`npm run dev | build | typecheck | test`).
- **Lógica portada** do RN (copiada e adaptada): tipos, dados (orações, planos com capas via `import.meta.glob`, terço), datas, cores, serviços de terço e planos, ranking de vozes de TTS.
- **Armazenamento**: camada `kv` assíncrona (`localStorage` no navegador, **Preferences** no Android) e cache da liturgia em **IndexedDB**.
- **API**: cliente `fetch`; em dev o Vite faz proxy de `/api` para a VPS (`VITE_DEV_API_TARGET`, padrão `http://147.15.109.185`), porque a API não envia cabeçalhos CORS.
- **Tema**: paletas claro, escuro e sépia e cor litúrgica como variáveis CSS.
- **Shell**: barra inferior (ícones SVG provisórios, botão ativo na cor litúrgica), Home funcional (liturgia de hoje com cache offline) e demais abas como placeholders.
- **Testes**: 28 testes em 4 arquivos (datas, tema, terço com 79 passos, planos, `resolveReference`, ranking de vozes, storage, cache de liturgia, deep link do OAuth, horário, mapeamento de vozes). Typecheck e build passam.
- `node_modules`: cerca de **128 MB** (contra 555 MB no RN). A meta era menos de 100 MB. Dá para ganhar cerca de 10 MB trocando jsdom por happy-dom.

### Android / CI (Fase 1, parcial)
- **Capacitor 8** configurado em `web/capacitor.config.ts` (`com.joaopaulosantos.lumen`, `CapacitorHttp` ligado para evitar CORS e mixed content).
- Projeto Android em `web/android`:
  - `versionCode` e `versionName` lidos das variáveis `VERSION_CODE` e `VERSION_NAME` (padrões 15 e 1.1.0);
  - assinatura release via `KEYSTORE_PATH`, `KEYSTORE_PASSWORD`, `KEY_ALIAS` e `KEY_PASSWORD`;
  - `usesCleartextTraffic` ligado (a VPS ainda não tem HTTPS);
  - *intent-filter* do esquema `lumen://` para o retorno do login.
- Workflow [web-android.yml](../.github/workflows/web-android.yml) (disparo manual): typecheck, testes, build, `cap sync`, restaura a keystore, `bundleRelease` com JDK 21, imprime o certificado e publica o AAB como artefato. **Não envia nada à Play Store.**
- **Keystore** exportada do EAS para `C:\Users\jposr\keys\lumen\` (fora do repositório; `*.jks` e `*.keystore` ficam no `.gitignore`). Os segredos `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` e `ANDROID_KEY_PASSWORD` já existem no GitHub.
- **Assinatura**: o AAB do run `44650160994` saiu com SHA1 `C3:33:81:45:6C:64:EF:45:38:9B:81:7D:7B:5B:01:65:E3:1C:22:8F`. A comparação com a chave de upload da Play Console foi feita por você ("feito.ok"); eu considerei que bateu. Reconfirme se houver dúvida.
- **Camada nativa** (em `127b243`, ainda não compilada no CI): plugins `local-notifications`, `preferences`, `browser`, `app`, `clipboard`, `share`, `text-to-speech` e `secure-storage`; módulos em `web/src/native/` (notificações, TTS, cliente Supabase com sessão em armazenamento seguro, login Google por deep link `lumen://oauth-callback`).
- **Tela de Diagnóstico** (aba Perfil) com um botão e um selo OK/FALHA para cada teste: ambiente, API da VPS, IndexedDB, preferências, armazenamento seguro, notificação em 20 s, lembrete diário, vozes e fala de TTS, copiar, compartilhar, login Google, sessão e sair.

## O que ainda falta

### Fechar a Fase 1 (próximos passos imediatos)
1. **Push de `127b243`** e disparar o workflow com `versionCode` 16: `gh workflow run web-android.yml -f version_code=16 -f version_name=1.1.0`. Se o Gradle reclamar de algum plugin, ler o log (`gh run view <id> --log-failed`) e corrigir.
2. **Colocar o build num aparelho** (decisão em aberto, ver abaixo) e executar todos os testes da tela de Diagnóstico.
3. **Conferir no Supabase** (Authentication, URL Configuration) que `lumen://oauth-callback` está nas URLs de redirecionamento permitidas.
4. **Testar a atualização sobre o app existente**, que é o risco principal: instalar o AAB pela trilha interna por cima do RN publicado e verificar que o pacote, a assinatura e o `versionCode` são aceitos.

**Decisão em aberto: como instalar no aparelho.** Um AAB não pode ser instalado direto.
- **(a) Trilha interna da Play Store:** testa o caminho real de atualização, mas substitui o app React Native para os testadores.
- **(b) APK separado:** adicionar ao workflow um `assembleRelease` com `applicationIdSuffix` próprio, para instalar sem tocar no app publicado. Não valida a atualização, e o esquema `lumen://` seria disputado entre os dois apps.

### Fase 3: Bíblias na VPS
- Script para dividir as Bíblias (`lumen/biblias`, 2 traduções, cerca de 14 MB) em um arquivo por livro, mais um índice versionado.
- Servir como arquivos estáticos pelo Nginx da VPS (gzip, URLs versionadas) e criar o carregador com cache em IndexedDB (e opção de baixar a tradução inteira).
- Refazer o `validate-reading-plans.js`, que hoje depende das Bíblias embutidas no RN.

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
- **Dependência da VPS para a Bíblia:** exigirá cache offline e, de preferência, monitoramento básico.

## Como retomar
```powershell
# ambiente do novo frontend
Set-Location C:\Users\jposr\desenv\lumen\web
npm install          # demora alguns minutos
npm run dev          # http://localhost:5173 (proxy /api para a VPS)
npm test             # o Vitest às vezes estoura o timeout do worker; basta repetir
npm run typecheck

# CI Android
git push origin main                                  # envia 127b243
gh workflow run web-android.yml -f version_code=16 -f version_name=1.1.0
gh run watch <id>                                     # acompanhar
gh run view <id> --log-failed                         # erro, se falhar
gh run download <id> -n lumen-web-aab-16              # baixar o AAB
```

Dicas de ambiente:
- Neste ambiente, comandos que dependem de pasta funcionam melhor no formato `& { Set-Location -LiteralPath <pasta>; <comando> }`.
- Não há JDK nem Android SDK na máquina: o build Android é feito no GitHub Actions.
- O build do RN continua pelo EAS (`eas build --platform android --profile production --auto-submit`), caso seja necessário publicar uma correção crítica antes da migração terminar.
- O Capacitor precisa que o `dist` esteja gerado antes do `cap sync`; o workflow já faz isso.
