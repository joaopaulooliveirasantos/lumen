# Cadastro de Usuário (Supabase Auth)

Funcionalidade adicional ao roadmap original (Fases 1-4): login/cadastro de
usuário via [Supabase](https://supabase.com) Auth, com e-mail/senha, Google
e Apple. É opcional — o app continua funcionando normalmente para quem não
faz login ("Visitante").

## O que foi implementado

- **Cadastro e login por e-mail/senha**, com confirmação por e-mail quando
  exigida pelo projeto Supabase.
- **Login social**: Google (via navegador/OAuth) e Apple (botão nativo,
  somente iOS).
- **Sessão persistente** no aparelho, sobrevivendo ao fechar o app.
- **Perfil público** (`profiles`) no banco do Supabase, criado
  automaticamente no cadastro (nome vindo do formulário ou do provider
  social).
- **Ponto de entrada**: aba Perfil mostra "Visitante" com botão
  "Entrar ou criar conta" quando deslogado; mostra nome/e-mail e botão
  "Sair" quando logado.

## Arquivos principais

- `mobile/src/services/supabaseClient.ts` — cliente Supabase configurado
  para Expo/React Native, com sessão criptografada (AES) guardada em
  `AsyncStorage` + chave de criptografia no `expo-secure-store` (o
  `expo-secure-store` sozinho tem limite de ~2KB por valor, insuficiente
  para o token de sessão do Supabase).
- `mobile/src/state/AuthContext.tsx` — contexto React
  (`AuthProvider`/`useAuth`) com `signUp`, `signIn`, `signInWithGoogle`,
  `signInWithApple`, `signOut`, e o perfil (`profiles`) carregado da sessão
  ativa.
- `mobile/src/screens/AuthScreen.tsx` — tela de entrar/cadastrar (toggle),
  com formulário de e-mail/senha, botão Google e botão nativo Apple
  (iOS).
- `mobile/src/screens/ProfileScreen.tsx` — consome `useAuth()` para exibir
  o estado logado/visitante.
- `mobile/src/types/user.ts` — tipo `UserProfile`.
- `mobile/App.tsx` — envolve o app em `<AuthProvider>` e controla a
  navegação para `AuthScreen` (estado `authScreenOpen`, aberto via
  `onOpenAuth` a partir do Perfil).
- `supabase/migrations/0001_profiles.sql` — tabela `public.profiles`
  (RLS: cada usuário só lê/edita o próprio perfil) e trigger que cria a
  linha em `profiles` automaticamente quando um usuário se cadastra
  (email/senha ou social).

## Dependências adicionadas (`mobile/package.json`)

`@supabase/supabase-js`, `expo-apple-authentication`, `expo-auth-session`,
`expo-crypto`, `expo-linking`, `expo-secure-store`, `expo-web-browser`,
`aes-js` (+ `@types/aes-js`), `react-native-url-polyfill`.

## Configuração necessária (pendente)

O projeto **ainda não está configurado com credenciais reais** — em
`mobile/app.json`, `expo.extra.supabaseUrl` e `expo.extra.supabaseAnonKey`
estão vazios. Sem isso, `signUp`/`signIn` falham (o `supabaseClient.ts`
emite um aviso no console e o cliente Supabase é criado com URL/chave
vazias).

Para ativar de verdade:

1. **Criar um projeto no [supabase.com](https://supabase.com)** (plano
   gratuito atende o MVP).
2. **Rodar a migration**: copiar o conteúdo de
   `supabase/migrations/0001_profiles.sql` no SQL Editor do projeto e
   executar.
3. **Preencher `mobile/app.json`**:
   ```json
   "extra": {
     "supabaseUrl": "https://SEU-PROJETO.supabase.co",
     "supabaseAnonKey": "SUA_ANON_KEY_PUBLICA"
   }
   ```
   (a "anon key" é pública por design — é a mesma usada em qualquer app
   cliente Supabase; a segurança vem das políticas de RLS, já configuradas
   na migration.)
4. **Google Sign-In**: em Supabase → Authentication → Providers, habilitar
   Google e configurar OAuth Client ID/Secret (Google Cloud Console).
   Adicionar a URL de redirect do Supabase nas origens autorizadas do
   OAuth Client.
5. **Apple Sign-In**: habilitar "Sign in with Apple" no Apple Developer
   (Certificates, Identifiers & Profiles) e configurar o provider Apple no
   Supabase (Services ID, chave, team ID). Sem isso, o botão nativo Apple
   (que já aparece em builds iOS) falha ao autenticar.
6. **Deep link de retorno do OAuth**: o app usa o scheme `lumen://` (já
   configurado em `app.json` → `"scheme": "lumen"`) e o redirect
   `lumen://auth-callback`. Cadastrar essa URL como redirect permitido no
   Supabase Auth (Authentication → URL Configuration).

## Limitações conhecidas

- **Sem credenciais configuradas**, o cadastro/login não funciona em
  nenhum ambiente até os passos acima serem feitos.
- **Apple Sign-In só aparece no iOS** (`Platform.OS === "ios"` em
  `AuthScreen.tsx`) — é exigência da própria Apple (apps com login social
  na App Store devem oferecer "Sign in with Apple").
- **Login é opcional**: nenhuma tela ou fluxo do app hoje exige sessão
  ativa para funcionar — o cadastro existe, mas ainda não há nenhuma
  funcionalidade que dependa dele (ex.: sincronizar progresso de leitura
  entre aparelhos). Isso é esperado nesta etapa; ver "Próximos passos".
- **Cancelamento no Apple Sign-In** (`ERR_REQUEST_CANCELED`) é tratado
  silenciosamente (sem popup de erro), pois é uma ação normal do usuário.

## Próximos passos sugeridos

- Configurar as credenciais do Supabase e dos providers OAuth (ver acima)
  antes de qualquer teste real ou publicação.
- Definir o que passa a depender de conta logada (hoje é só decorativo):
  candidatos naturais são sincronizar entre aparelhos o histórico de
  leitura (`readingHistory.ts`), progresso do terço (`rosaryHistory.ts`) e
  marcadores da Bíblia (`bookmarks.ts`), hoje todos só locais
  (`AsyncStorage`).
- Adicionar uma opção de **exclusão de conta** (obrigatória pelas políticas
  da Google Play e da App Store para apps com cadastro) — hoje não existe
  UI nem endpoint para isso.
- Atualizar a Política de Privacidade e o formulário "Data safety" do Play
  Console para refletir a coleta de e-mail/senha e dados de login social
  (ver `Politica-de-Privacidade.md` e `mobile/store/`, já atualizados
  junto com esta funcionalidade).
