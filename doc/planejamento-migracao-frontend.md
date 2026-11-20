# Planejamento: migração do frontend para Preact + Vite + Capacitor

Status: planejamento aprovado; **Fase 2 (fundação) iniciada em 2026-11-19** em `lumen/web`. Fase 1 (prova de conceito Capacitor/Android) pendente: exige a keystore do EAS e o Android SDK/JDK, que não estão disponíveis neste ambiente. Data: 2026-11-19.

## Objetivo

Substituir o app React Native/Expo (`lumen/mobile`) por um frontend mais leve e fácil de testar localmente, sem a instalação de centenas de pacotes. O app continua publicado na Play Store, com o mesmo pacote.

## Decisões fechadas

| # | Tema | Decisão |
|---|---|---|
| 1 | Framework | **Preact + Vite + TypeScript**, empacotado com **Capacitor** |
| 2 | Plataformas | Somente **Android** por enquanto (sem iOS, sem Sign in with Apple) |
| 3 | Login obrigatório | A tela de login e o portão de entrada serão **construídos já no novo frontend** (ver [planejamento-login-obrigatorio.md](planejamento-login-obrigatorio.md)) |
| 4 | Congelamento | **Pausar novos recursos no RN** durante a migração; só correções críticas |
| 5 | Bíblias | **Servidas pela VPS**, com cache offline no aparelho |
| 6 | Distribuição | **Continuar na Play Store**, via Capacitor |
| 7 | Assinatura | **Exportar a keystore do EAS** para assinar o build do Capacitor |

## Diagnóstico do app atual

| Item | Situação |
|---|---|
| Tamanho do código | 54 arquivos, cerca de 8,7 mil linhas, 10 telas |
| `node_modules` | 555 MB (473 pastas no nível raiz) |
| Rodar localmente | `expo start` com Expo Go ou emulador; builds nativos exigem Android Studio ou EAS |
| Testes no app | Nenhum; só `tsc` e o script `validate:reading-plans` |
| Bíblias | 14 MB de JSON (2 traduções) embutidos no app via `require` |
| Nativo em uso | notificações locais, TTS, SQLite, armazenamento seguro, OAuth pelo navegador, área de transferência |
| Dependências sem uso | `expo-av`, `expo-auth-session` e `babel-preset-expo` não aparecem no código |

A lógica (tipos, dados, serviços, armazenamento, cálculos de planos e terço) é TypeScript puro e quase toda reaproveitável. A camada visual (telas, componentes e `StyleSheet`) precisa ser reescrita.

## Como fica o teste local

- **Dia a dia:** `npm install` e `npm run dev`, abrindo no navegador, com recarga instantânea e emulação de celular no DevTools. Sem Android Studio, sem Expo Go e sem emulador.
- **Automatizado:** Vitest com jsdom para lógica e componentes (o backend já usa Vitest). Playwright opcional para fluxos de ponta a ponta.
- **No aparelho:** só na validação final, com `adb` e o Capacitor.
- **Metas:** `node_modules` abaixo de 100 MB, instalação em cerca de 1 minuto, dev server pronto em poucos segundos, e AAB menor que o atual por não embutir as Bíblias.

## Mapa de substituição

| Hoje (Expo/RN) | No novo frontend |
|---|---|
| `View`, `Text`, `StyleSheet`, `FlatList` | HTML + CSS com variáveis de tema |
| `expo-linear-gradient` | CSS `linear-gradient` |
| `@expo/vector-icons` | Conjunto de ícones SVG (apenas os usados) |
| `react-native-safe-area-context` | `env(safe-area-inset-*)` em CSS |
| `AsyncStorage` | Camada de armazenamento sobre `localStorage`/Preferences |
| `expo-sqlite` (cache da liturgia) | IndexedDB |
| `expo-secure-store` (sessão do Supabase) | Plugin de armazenamento seguro do Capacitor |
| `expo-notifications` | Local Notifications do Capacitor |
| `expo-speech` | Plugin TTS do Capacitor |
| `expo-clipboard`, `Share` | Plugins Clipboard e Share |
| `expo-web-browser` + `expo-linking` (OAuth Google) | Plugins Browser e App (deep link) |
| `expo-apple-authentication` | Removido (somente Android) |
| `expo-constants` (`apiBaseUrl`, chaves) | Variáveis do Vite (`import.meta.env`) |

## Bíblias servidas pela VPS

- **Hoje:** os JSONs de `lumen/biblias` (Ave Maria e Paulus, cerca de 14 MB no total) são embutidos no app.
- **Proposta:** dividir cada tradução em um arquivo por livro, com um índice (livros, capítulos e versículos por capítulo), e servir como arquivos estáticos pelo Nginx da VPS, comprimidos (gzip) e com URLs versionadas.
- **No aparelho:** baixar o índice e cada livro sob demanda, guardando em IndexedDB. Opção de "baixar a tradução inteira para uso offline" nas Configurações.
- **Atualização:** o índice carrega uma versão; o app só rebaixa o que mudou.
- **Contingência:** se a VPS estiver fora do ar e o livro já estiver em cache, a leitura continua funcionando.
- **Script novo:** gerar os arquivos por livro a partir dos JSONs atuais (com validação de contagem de livros e capítulos).

## Fases

1. **Prova de conceito**
   - Projeto Capacitor com uma tela, assinado com a keystore exportada do EAS e usando o pacote `com.joaopaulosantos.lumen`.
   - Valida os riscos antes de investir: instalar por cima da versão atual da Play Store, notificação local, TTS, login Google por deep link, armazenamento seguro da sessão e leitura de um livro da Bíblia servido pela VPS com cache.
2. **Fundação**
   - Criar o projeto Vite + Preact + TS e configurar Vitest.
   - Portar `types`, `data`, `services` e `storage`, trocando as dependências nativas por adaptadores finos.
   - Escrever testes para a lógica portada, que hoje não tem nenhum.
3. **Bíblias na VPS**
   - Script de divisão por livro, configuração do Nginx, camada de cache (IndexedDB) e índice versionado.
4. **Design system**
   - Tema (paletas claro, escuro e sépia, com a cor litúrgica), ícones SVG, barra inferior, cards, tela de carregamento.
5. **Login e portão de entrada** (primeira tela construída, conforme decisão 3)
   - Boas-vindas/login, criar conta (nome, e-mail, telefone, senha), Google, completar cadastro e recuperar senha, conforme o planejamento do login (sem Apple).
6. **Telas**, da mais simples para a mais complexa: Orações, Configurações, Perfil, Liturgia, Santo do dia, Home, Planos de leitura, Terço e Bíblia.
7. **Camada nativa:** notificações, TTS, OAuth, armazenamento seguro, compartilhar e copiar, status bar e teclado.
8. **Paridade e qualidade:** checklist de funcionalidades contra o app atual, orçamento de desempenho, acessibilidade e modos de leitura.
9. **Empacotamento e publicação**
   - Capacitor Android e CI no GitHub Actions no lugar do EAS.
   - Envio à trilha interna, depois lançamento em etapas.
   - Atualização da política de privacidade e do formulário de Segurança dos dados da Play Console.
10. **Desativar o React Native:** remover `lumen/mobile` depois de a nova versão estar estável em produção.

## Assinatura e continuidade na Play Store

- Manter o pacote `com.joaopaulosantos.lumen` e usar `versionCode` acima de 14 (hoje no [app.json](../mobile/app.json)).
- Exportar a keystore do EAS (`eas credentials`) e guardá-la **fora do repositório**, com as senhas apenas em segredos do GitHub Actions.
- Confirmar na Play Console se o app usa Play App Signing. Nesse caso, a chave do EAS é a chave de upload, e a Google mantém a chave de distribuição.
- Fazer o primeiro envio do novo build pela trilha interna para confirmar que ele atualiza o app existente.

## Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Atualização não substituir o app atual (assinatura ou pacote diferentes) | Prova de conceito da Fase 1 antes de qualquer tela |
| TTS e notificações se comportarem diferente | Plugins nativos do Capacitor, testados na Fase 1 |
| Sessão do login menos protegida que hoje | Plugin de armazenamento seguro, nunca `localStorage` para tokens |
| Bíblia indisponível sem rede | Cache em IndexedDB e opção de download completo |
| Menos "sensação nativa" | Aceito para um app de leitura e oração |
| Dependência da VPS para a Bíblia | Cache offline, monitoramento básico e arquivos estáticos simples |
| Retrabalho em duas bases | Congelamento de novos recursos no RN (decisão 4) |

## Passo imediato, sem migrar

Remover as dependências sem uso (`expo-av`, `expo-auth-session` e `babel-preset-expo`) e rodar o typecheck, para ter uma linha de base melhor enquanto a migração não começa.

## Critérios de aceite

- Todas as funcionalidades do app atual presentes e com paridade, mais o login obrigatório.
- Instalação limpa do projeto abaixo de 100 MB em `node_modules` e rodando no navegador com um comando.
- Testes automatizados cobrindo a lógica portada e os fluxos de login.
- Atualização sobre a versão atual da Play Store funcionando, sem perda de sessão local ou dados do usuário.
- Bíblia lida offline depois da primeira abertura de um livro.

## Fora de escopo

- iOS e Sign in with Apple (retomar apenas se o app for para a App Store).
- Mudanças no backend da VPS além do serviço estático das Bíblias.
- Novos recursos de produto durante a migração.
