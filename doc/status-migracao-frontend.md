# Status da migração do frontend (React Native → Preact + Vite + Capacitor)

Atualizado em 2026-11-20 (Fases 1 a 8 concluídas; Fase 9 em andamento, com o roteiro em [publicacao-play-store.md](publicacao-play-store.md)). Plano completo e decisões: [planejamento-migracao-frontend.md](planejamento-migracao-frontend.md). Login obrigatório: [planejamento-login-obrigatorio.md](planejamento-login-obrigatorio.md).

## Resumo

As **Fases 1 (prova de conceito Android)** e **2 (fundação)** estão concluídas: o AAB 16 foi instalado pela trilha interna por cima do app RN e **todos os testes da tela de Diagnóstico deram OK no celular**. A **Fase 3 (Bíblias na VPS)** está concluída: publicada na VPS e validada no aparelho com o AAB 17. A **Fase 4 (design system)** está concluída: ícone e splash da marca, ícones SVG, componentes e galeria no Perfil. A **Fase 5 (login obrigatório)** está concluída: Supabase configurado e build 19 validado no aparelho (2026-11-20). A **Fase 6 (telas)** está concluída: todas as telas do RN foram migradas e o build 20 foi validado no aparelho (2026-11-20). As **Fases 7 (camada nativa)** e **8 (paridade e qualidade)** estão implementadas: barras do sistema, teclado, revisão de paridade, modos de leitura, acessibilidade e ferramentas de teste escondidas; build 21 validado no aparelho. A **Fase 9 (publicação)** está em andamento: migração dos dados do RN, página de exclusão de conta, envio pelo CI e roteiro da Play Console prontos; falta testar o build 22 e fazer os passos manuais da Play Console. O novo app vive em `lumen/web`. O React Native (`lumen/mobile`) fica **congelado para novos recursos**; na trilha interna ele já foi substituído pelo novo app (versionCode 16).

## Estado do repositório

| Item | Estado |
|---|---|
| `8d4dea2`, `5570311` | Em `origin/main` (Capacitor, workflow de build, correção do `versionCode`) |
| `127b243`, `e0ad730` | Em `origin/main` (plugins nativos, tela de Diagnóstico, este arquivo) |
| `d83ea41`, seguinte | Em `origin/main`: Fase 3 (gerador, config do Nginx, deploy, carregador, testes) e correção do teste para o CI |
| VPS | Bíblias publicadas em `/var/www/lumen-static/biblias` e Nginx com `/biblias/` (2026-11-19). Conferido: gzip (Gênesis 220 KB → 63 KB), cache imutável, 404 para arquivo inexistente e `/api` inalterada |
| `lumen/app.json` (raiz) | Não rastreado e **não é meu**; deixado de fora de todos os commits |
| AAB `lumen-web-aab-15` | Gerado pelo run `44650160994` (build sem plugins nativos). Não enviado à Play Store |
| AAB `lumen-web-aab-16` | Gerado pelo run `44655899497` **com os plugins nativos** (3,2 MB, mesmo SHA1 `C3:33:…:22:8F`). Cópia local em `C:\Users\jposr\Downloads\lumen-aab-16\app-release.aab`. Publicado na trilha interna e validado no aparelho |
| AAB `lumen-web-aab-17` | Gerado pelo run `44661959913` com o carregador das Bíblias e o novo teste de Diagnóstico (mesmo SHA1). Publicado na trilha interna e validado no aparelho (era cache da Play Store a demora em aparecer) |
| AAB `lumen-web-aab-18` | Gerado pelo run `44667880258` com a Fase 4: ícone e splash da marca, componentes, galeria (mesmo SHA1). 5,1 MB, dos quais cerca de 2 MB são as splash em PNG. Publicado na trilha interna (2026-11-20) |
| AAB `lumen-web-aab-19` | Gerado pelo run `44670477537` com a Fase 5: login obrigatório (mesmo SHA1). Cópia local em `C:\Users\jposr\Downloads\lumen-aab-19\app-release.aab`. Publicado na trilha interna e validado no aparelho (login, cadastro, Google, exclusão) |
| AAB `lumen-web-aab-20` | Gerado pelo run `44676595284` com a Fase 6: todas as telas migradas (mesmo SHA1). 5,8 MB. Cópia local em `C:\Users\jposr\Downloads\lumen-aab-20\app-release.aab`. Validado no aparelho em 2026-11-20 |
| AAB `lumen-web-aab-21` | Gerado pelo run `44763530195` com as Fases 7 e 8 (barras do sistema, teclado, ferramentas de teste escondidas). Mesmo SHA1, 5,8 MB. Cópia local em `C:\Users\jposr\Downloads\lumen-aab-21\app-release.aab`. Validado no aparelho em 2026-11-20 |
| AAB `lumen-web-aab-22` | Fase 9: migração dos dados do app RN e teste "Dados do app antigo" no Diagnóstico. Ver run na seção da Fase 9. **Aguardando envio à trilha interna e teste no aparelho** |
| Próximo `versionCode` livre | 23 |

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

### Bíblias na VPS (Fase 3, publicada; falta o teste no aparelho)
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

### Fase 4: design system (implementada; falta conferir o build 18 no aparelho)
- **Ícone do app e splash**: os builds 15 a 17 saíam com o ícone padrão do Capacitor. Agora usam o Chi-Rho dourado do app RN.
  - [web/scripts/generate-android-icons.mjs](../web/scripts/generate-android-icons.mjs) (Node puro, sem dependências) gera, a partir de `web/assets/icon-only.png` e `icon-foreground.png`, os mipmaps (legado, redondo e camada do ícone adaptável) e as splash em todas as densidades.
  - Fundo creme `#F3ECDA` no ícone adaptável e na splash (`windowSplashScreenBackground`).
  - Para trocar a arte: substituir os PNGs em `web/assets/` e rodar `node scripts/generate-android-icons.mjs` na pasta `web`.
- **Ícones SVG** em [Icon.tsx](../web/src/components/Icon.tsx): os 23 nomes do `AppIcon` do RN, mais 12 novos para login e navegação, e o logotipo do Google para o botão de login. A barra inferior usa os mesmos ícones do RN (igreja, livro, Bíblia, mãos em oração, pessoa).
- **Componentes** em [ui.tsx](../web/src/components/ui.tsx):
  - `Button` (primary, secondary, ghost e danger, com estado de carregamento), `IconButton`;
  - `TextField` (ícone, dica, erro, mostrar/ocultar senha), `Checkbox`;
  - `Card`, `HeroCard` (gradiente na cor litúrgica), `ListRow`, `SectionTitle`, `Chip`, `ScreenHeader`;
  - `Alert`, `EmptyState`, `Spinner`.
  - Mais o [LoadingScreen](../web/src/components/LoadingScreen.tsx), igual ao do RN (gradiente, cruz dourada pulsante, "LUMEN"), mostrado na abertura do app.
- **Tokens** em `styles.css` (espaçamento, raios, sombras, cores da marca e de estado). O modo escuro ganha cores de estado próprias via `data-mode` no `<html>`, e `--accent-light` e `--accent-dark` vêm do `shadeColor` (sem `color-mix`, por compatibilidade com WebViews antigas).
- **Galeria** no Perfil (chip "Componentes"): mostra todos os componentes e ícones e troca o modo de leitura e a cor litúrgica só como prévia, sem salvar. A Home já usa `HeroCard`, `Alert` e `Spinner`.
- **Dev**: `?tab=perfil` na URL abre direto numa aba. Para capturar telas sem abrir o navegador: `msedge --headless=new --window-size=600,2600 --screenshot=...`. O Edge headless impõe cerca de 500 px de largura mínima, então capturas mais estreitas saem cortadas.

### Fase 5: login e portão de entrada (concluída)
- **Decisões (2026-11-20)**: e-mail + senha; telefone obrigatório sem SMS (também para quem entra pelo Google); telefone não precisa ser único; login exigido já na primeira abertura; sem Apple.
- **Núcleo** [web/src/auth/account.ts](../web/src/auth/account.ts):
  - perfil (nome, telefone, aceite dos termos) com cópia local, para quem já entrou continuar usando o app offline;
  - regra do portão: `deriveAuthStatus` decide entre `loading`, `signedOut`, `recovery`, `profileError`, `needsProfile` e `ready`;
  - cadastro com o metadata lido pelo trigger, detecção de e-mail já cadastrado, recuperação de senha, exclusão de conta e leitura dos links de retorno do e-mail.
- **Estado** [AuthProvider.tsx](../web/src/auth/AuthProvider.tsx): sessão, perfil e deep links `lumen://email-confirmed` e `lumen://reset-password` (também com o app fechado, via `getLaunchUrl`). Sair usa `scope: "local"` para funcionar sem rede.
- **Telas** em `web/src/screens/auth/`:
  - entrar / criar conta (Google em destaque, máscara de telefone, aceite dos termos);
  - esqueci a senha, verifique seu e-mail (com reenvio), nova senha, completar cadastro e falha ao carregar o perfil;
  - textos legais abertos dentro do app (renderizados de `doc/*.md`, funcionam offline).
- **Perfil**: seção Conta ([AccountSection.tsx](../web/src/screens/AccountSection.tsx)) com nome, e-mail e telefone, editar, termos, política, sair e **excluir conta** (com confirmação).
- **Utilitários**: [phone.ts](../web/src/services/phone.ts) (DDDs válidos, celular e fixo, internacional com `+`, E.164) e [authErrors.ts](../web/src/services/authErrors.ts) (erros do Supabase em português e validações).
- **Supabase (no repositório, ainda não aplicado)**:
  - [0002_profile_phone.sql](../supabase/migrations/0002_profile_phone.sql): colunas `phone` (E.164, sem unicidade), `terms_accepted_at`, `profile_completed_at` e `updated_at`; policy de insert; `WITH CHECK` no update; trigger novo.
  - Edge Function [delete-account](../supabase/functions/delete-account/index.ts).
- **Textos legais** reescritos para o login obrigatório (telefone, exclusão pelo app, LGPD, sem Apple): [Termos-de-Uso.md](Termos-de-Uso.md), [Politica-de-Privacidade.md](Politica-de-Privacidade.md) e a página pública `src/static/privacy-policy.html`, ainda não publicada na VPS (publicar junto com o lançamento do login, via `scripts/deploy-vps.sh`). **Revisar o texto antes de publicar.**
- **Testes**: 26 novos (65 no total), cobrindo telefone, mensagens, portão, links de retorno, perfil com cache offline, cadastro e textos legais.
- **Dev**: `?auth=criar|esqueci|verifique-email` abre direto naquela etapa.

### Configuração do Supabase da Fase 5 (feita em 2026-11-20; referência para outros ambientes)
1. **SQL Editor**: colar e executar `supabase/migrations/0002_profile_phone.sql`. Sem isso, salvar o telefone falha e ninguém passa da tela "Completar cadastro".
2. **Authentication > URL Configuration > Redirect URLs**: adicionar `lumen://email-confirmed` e `lumen://reset-password` (o `lumen://oauth-callback` já existe).
3. **Edge Functions > Deploy a new function > Via Editor**: nome `delete-account`, colar `supabase/functions/delete-account/index.ts` e manter "Verify JWT" ligado.
4. **Authentication > Sign In / Providers > Email**: conferir se "Confirm email" está ligado (recomendado). O app trata os dois casos.
5. **SMTP próprio** (Authentication > Emails > SMTP Settings, ex.: Resend): o SMTP padrão do Supabase envia só poucos e-mails por hora. Pode ficar para antes do lançamento amplo.
6. Instalar o build 19 e testar: criar conta por e-mail (confirmar pelo link), entrar, esqueci a senha, Google (vai pedir o telefone), editar telefone, sair, excluir uma conta de teste.

### Fase 6: telas (concluída; build 20 validado no aparelho em 2026-11-20)
- **Estado global** [state/AppState.tsx](../web/src/state/AppState.tsx), equivalente ao `App.tsx` do RN: configurações salvas a cada mudança, data selecionada, liturgia com cache e pré-carga dos 7 dias seguintes, santo do dia, históricos (liturgia lida e terço rezado), progresso dos planos, aba ativa, telas sobrepostas (Terço, Planos, Santo do dia), atalho para abrir a Bíblia numa referência e avisos rápidos (toast).
- **Telas** em `web/src/screens/`:
  - **Home**: data e liturgia no topo, carrossel de planos, progresso da semana, santo do dia, resumo do Evangelho e entrada do Terço.
  - **Liturgia**: abas das leituras, aclamações, calendário, Amém e player de leitura em voz alta (TTS). O player avança sozinho de faixa e divide textos acima do limite de 4.000 caracteres do Android (homilias passam disso). Também tem escolha de voz, copiar, compartilhar e A−/A+.
  - **Bíblia**: grades de livros, capítulos e versículos montadas só com o índice (aparecem na hora, offline). O texto é baixado na leitura. Tem seleção de versículos (copiar, compartilhar, marcar com comentário), marcados, detalhe do marcado e navegação entre capítulos (novo).
  - **Orações**: categorias, leitura, copiar e compartilhar.
  - **Perfil**: conta, Sobre e versão. Diagnóstico e Componentes ficam escondidos (ver Fase 8).
  - **Configurações**: tema, tamanho do texto com prévia, tradução da Bíblia com **download offline e progresso** (novo), lembrete diário com horário.
  - **Santo do dia**, **Planos de leitura** (destaques, busca, detalhe, leitura do dia com versículos da VPS e Catecismo) e **Terço** (mistério sugerido pelo dia, 79 passos com TTS).
- **Comportamento novo em relação ao RN**:
  - o tamanho do texto vale só para os textos de leitura;
  - o botão "voltar" do Android fecha folhas e telas sobrepostas, depois volta à Home, depois sai do app;
  - os trechos dos planos sem rede e sem cache mostram aviso com sugestão de baixar a Bíblia.
- **Componentes novos**: `PageHeader`, `FontScaleControls`, `Sheet` e `DatePickerSheet`, `LiturgyPlayer` e `VoiceSheet`, `PrayerPlayer`, `ReadingPlanCard` e `Switch`. Módulos nativos novos: [speech.ts](../web/src/native/speech.ts) (fila de fala com cancelamento) e [share.ts](../web/src/native/share.ts).
- **Testes**: 72 no total (faixas da liturgia, divisão do texto para TTS, referências dos planos, tamanho do texto).
- **Dev**:
  - `?semLogin` pula o portão de login (só no modo dev; some do build de produção);
  - [scripts/screenshot.mjs](../web/scripts/screenshot.mjs) captura telas pelo DevTools Protocol, com cliques (`--click "texto"`), página inteira (`--full`) e `--eval`. Exemplo: `node scripts/screenshot.mjs "http://localhost:5173/?semLogin&tab=biblia" biblia.png --click "Novo"`. O 1º carregamento no dev server é lento, por isso a espera padrão é de 20 s.
- **Visto no backend (não é do app)**: em 2026-11-20 a API devolveu `santos: []` para o santo do dia, mas a história do santo existia ("Cristo Rei"). O cartão do santo some da Home nesses dias, como no RN.

### Fase 7: camada nativa (concluída; build 21 validado no aparelho)
- Notificações, TTS, OAuth, armazenamento seguro, compartilhar, copiar e botão voltar foram feitos nas Fases 1 e 6.
- **Barras do sistema** [native/systemBars.ts](../web/src/native/systemBars.ts): o Capacitor 8 desenha o app atrás das barras e escolhia a cor dos ícones pelo tema do *sistema*. Agora segue o fundo do app: ícones claros na tela de carregamento (verde) e no modo escuro, escuros no claro e no sépia. Usa o `SystemBars` do próprio `@capacitor/core` (sem plugin novo).
- **Teclado** [native/keyboard.ts](../web/src/native/keyboard.ts): `windowSoftInputMode="adjustResize"` explícito no manifesto. Com o teclado aberto, a barra inferior some (`html.keyboard-open`) e o campo focado é rolado para o centro. Detecção sem plugin: campo editável focado e janela mais de 20% menor.
- **Limitação conhecida**: em WebViews anteriores à versão 140, o Capacitor preenche a área das barras com a cor do tema nativo, não com a do app. O WebView se atualiza pela Play Store, então afeta poucos aparelhos.

### Fase 8: paridade e qualidade (concluída; build 21 validado no aparelho)
- **Paridade com o RN**: comparei, por script, todos os textos visíveis das telas e componentes do RN com o app novo. O que sobrou é só diferença de acentuação ou redação, ou recurso reorganizado (ex.: o "Reiniciar plano" virou "Ler de novo", com o mesmo efeito). Nenhuma funcionalidade ficou de fora; o áudio da homilia, o link para a Canção Nova, as tentativas de recarregar e a remoção de marcados existem.
- **Modos escuro e sépia**: capturas de Home, Liturgia, Bíblia, Orações, Perfil e Configurações nos dois modos, sem problemas de contraste. Em dev, `?modo=escuro|sepia|claro` força o modo sem mexer nas configurações.
- **Acessibilidade**: auditoria por script nas abas, no login e em Configurações, sem nenhum botão sem nome acessível, campo sem rótulo ou imagem sem `alt`. Com "remover animações" ligado no sistema, o Amém só esmaece e folhas e avisos não deslizam.
- **Desempenho**: JS de 78 kB e CSS de 6 kB (gzip); o restante são as capas dos planos e o logo, empacotados no APK.
- **Ferramentas de teste**: Diagnóstico e Componentes saíram do Perfil. Aparecem em dev ou depois de **tocar 7 vezes na versão** (em "Sobre o Lumen"), até fechar o app.
- **Testes**: 74 no total.

### Fase 9: publicação (em andamento)
Roteiro completo, com as respostas do formulário de Segurança dos dados: [publicacao-play-store.md](publicacao-play-store.md).
- **Migração dos dados do RN** (lacuna achada nesta fase): o app novo não lia o que o RN salvou, e quem atualizasse da produção perderia versículos marcados, progresso e configurações.
  - O plugin nativo [LegacyStoragePlugin.java](../web/android/app/src/main/java/com/joaopaulosantos/lumen/LegacyStoragePlugin.java) lê, só para leitura, o SQLite `RKStorage` do AsyncStorage.
  - [legacyMigration.ts](../web/src/storage/legacyMigration.ts) copia as mesmas chaves uma única vez, antes de o app abrir, sem sobrescrever o que o app novo já tem.
  - O lembrete é reagendado sem pedir permissão de novo; se ela não existir, o lembrete fica desligado.
  - Diagnóstico › "Dados do app antigo (RN)" mostra o que existe e quando foi migrado.
- **Página de exclusão de conta** exigida pela Play: `src/static/excluir-conta.html`, servida pelo backend em `/excluir-conta` e ligada na política de privacidade. Publicar na VPS junto com a política (`bash scripts/deploy-vps.sh`).
- **Envio pelo CI**: o workflow ganhou `track` (`nenhuma`, `internal` ou `production` em etapas, com `rollout`) e notas da versão em `web/android/whatsnew/`. Depende do segredo `PLAY_SERVICE_ACCOUNT_JSON`; sem ele, use `track=nenhuma`, que é o padrão.
- **Pendências do usuário**:
  - Play Console: conta de teste do revisor, formulário de Segurança dos dados e URL de exclusão;
  - revisar os textos legais e publicar na VPS;
  - SMTP próprio no Supabase;
  - domínio e HTTPS (recomendado);
  - conta de serviço da Play (opcional).
- **Testes**: 80 no total.

### Fase 10
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
gh workflow run web-android.yml -f version_code=23 -f version_name=1.1.0   # próximo build
gh run watch <id>                                     # acompanhar
gh run view <id> --log-failed                         # erro, se falhar
gh run download <id> -n lumen-web-aab-23              # baixar o AAB
```

Dicas de ambiente:
- Neste ambiente, comandos que dependem de pasta funcionam melhor no formato `& { Set-Location -LiteralPath <pasta>; <comando> }`.
- Não há JDK nem Android SDK na máquina: o build Android é feito no GitHub Actions.
- O build do RN continua pelo EAS (`eas build --platform android --profile production --auto-submit`), caso seja necessário publicar uma correção crítica antes da migração terminar.
- O Capacitor precisa que o `dist` esteja gerado antes do `cap sync`; o workflow já faz isso.
