# Changelog — 30/07/2026

**Escopo:** `mobile/` e backend (`src/`, `tests/`)
**Resumo do dia:** correção de bugs da tela da Bíblia, navegação completa de leitura bíblica, identidade visual católica na Home e na tela de carregamento, reorganização da Liturgia Diária em abas (incluindo a Homilía), Configurações movidas para dentro do Perfil, integração real da Homilía com a API do Evangelizo no backend, Home mais compacta com resumo do dia, nova tela de Orações católicas, e Bíblia com abas, seleção/cópia/compartilhamento de versículos e versículos marcados com comentário pessoal.

---

## 1. Correções de bugs — Tela da Bíblia

### `mobile/src/screens/BibleScreen.tsx`
- **Corrigido:** erro de compilação `TS2440` — o tipo local `type View` colidia com o componente `View` do `react-native`. Renomeado para `ScreenView`.
- **Corrigido:** caminho do `require()` do JSON da Bíblia apontava para `mobile/biblias/...` (inexistente). Corrigido para `../../../biblias/...`, alinhado ao `metro.config.js` (que passou a observar o diretório pai do projeto).
- **Corrigido:** crash `Changing numColumns on the fly is not supported` ao navegar de "Livros" (lista) para "Capítulos" (grade 5 colunas) — o React reaproveitava a mesma instância do `FlatList`. Corrigido adicionando `key` únicas por tela (`list-livros`, `grid-chapters-5`, `grid-verses-5`, `list-leitura`).

### `mobile/metro.config.js` *(novo)*
- Configurado `watchFolders` para incluir o diretório pai do projeto, permitindo carregar `biblias/` fora de `mobile/`.

---

## 2. Bíblia — novo nível de navegação (seleção de versículo)

### `mobile/src/screens/BibleScreen.tsx`
- **Adicionado:** nível de navegação **Testamento → Livro → Capítulo → Versículo → Leitura**.
- Tela "Capítulos" agora leva a uma grade de seleção de **versículo** (em vez de mostrar o capítulo inteiro direto).
- **Nova tela "Leitura":** exibe o texto do capítulo a partir do versículo selecionado até o fim do capítulo.
- Cabeçalho mostra `Livro Cap,Vers` (ex.: `Gênesis 1,5`) na tela de leitura.
- Botão "voltar" atualizado para o novo fluxo (leitura → versículos → capítulos → livros → testamentos).

### `mobile/src/types/bible.ts` *(novo)*
- Tipos `BibleVerse`, `BibleChapter`, `BibleBook`, `BibleData`.

---

## 3. Home — identidade visual católica

### `mobile/src/screens/HomeScreen.tsx`
- **Adicionado:** componente `Hero` — banner em gradiente (cor litúrgica do dia), com cruz latina dourada, ornamentos, título "LUMEN", subtítulo, data por extenso e selo "Cor litúrgica: …".
- Substituiu o antigo cabeçalho simples ("Lumen / Liturgia Diária").
- Ícones da status bar ajustados para claro quando a aba Home está ativa (`mobile/App.tsx`).

### `mobile/src/services/color.ts` *(novo)*
- Função `shadeColor(hex, percent)` extraída para uso compartilhado entre `HomeScreen` e `LoadingScreen`.

### Dependência
- Adicionado `expo-linear-gradient` (`mobile/package.json`).

---

## 4. Liturgia Diária — leitura em abas

### `mobile/src/screens/LiturgyScreen.tsx`
- **Adicionado:** barra de abas (`ReadingTabBar`) para alternar entre **1ª Leitura**, **Salmo**, **2ª Leitura** (quando existir) e **Evangelho** sem precisar rolar a tela.
- Cabeçalho (calendário semanal, data, cor litúrgica, título da liturgia, abas) e rodapé (botão **Amém**) fixos; apenas o conteúdo da leitura selecionada rola.
- Aba ativa volta para "1ª Leitura" automaticamente ao trocar de data.
- Removida duplicação da "Cor litúrgica" (mantida só no cabeçalho de data).

---

## 5. Tela de carregamento com identidade católica

### `mobile/src/components/LoadingScreen.tsx` *(novo)*
- Tela de carregamento reutilizável: gradiente na cor litúrgica, cruz latina com animação de pulso (`Animated`), divisor dourado, título "LUMEN" e mensagem customizável.

### `mobile/App.tsx`
- Exibida durante o bootstrap inicial do app (carregamento de configurações e histórico de leitura salvos).

### `mobile/src/screens/LiturgyScreen.tsx`
- Substituiu o spinner simples exibido enquanto as leituras do dia carregam.

---

## 6. Perfil — Configurações como submenu

### `mobile/src/components/BottomTabBar.tsx`
- **Removida:** aba "Configurações" da barra inferior (`TabName` agora é `"home" | "liturgia" | "biblia" | "perfil"`).

### `mobile/src/screens/ProfileScreen.tsx`
- **Adicionado:** navegação interna (mesmo padrão da Bíblia) com item de menu "⚙️ Configurações" que abre o `SettingsScreen` como sub-tela, com cabeçalho próprio e botão "‹ voltar".
- Recebe agora as props de configurações (tema de leitura, tamanho de fonte, lembrete) e repassa ao `SettingsScreen`.

### `mobile/App.tsx`
- Removida a rota direta da aba "configuracoes"; props de configurações passadas para `ProfileScreen`.

---

## 7. Backend — Homilía via API do Evangelizo

### `src/integrations/evangelizoCommentClient.ts` *(novo)*
- Novo cliente `EvangelizoCommentClient`, busca a homilia do dia em `feed.evangelizo.org/v2/reader.php` usando o parâmetro `type` com os valores:
  - `comment_t` — título da homilia
  - `comment_a` — autor
  - `comment_s` — fonte
  - `comment` — texto
- Requisições em paralelo (`Promise.all`), com limpeza de HTML/entidades (`&nbsp;`, `<br>`, `\r\n`).
- Retorna `null` quando o texto vem vazio (dia sem homilia) ou quando `LITURGY_API_URL_TEMPLATE` não aponta para o Evangelizo.

### `src/integrations/reflectionRssClient.ts` *(removido)*
- Cliente antigo baseado em RSS removido — usava uma URL placeholder (`REFLECTION_RSS_URL`) que nunca funcionou de fato.

### `src/types.ts`, `src/schema.ts`
- `ReflectionBlock` ganhou os campos `titulo` e `fonte` (além de `autor`, `texto`, `audioUrl`).
- Novo tipo `CommentaryCandidate` substitui `ReflectionCandidate`.

### `src/services/dailyLiturgyService.ts`, `src/serverless/getDailyLiturgy.ts`
- Passaram a usar `EvangelizoCommentClient` no lugar do cliente RSS.
- Fallbacks atualizados (`"Homilia do dia"`, `"Homilia indisponivel para esta data."`).

### `src/config.ts`, `.env.example`
- Removida a variável `REFLECTION_RSS_URL` (não é mais necessária).

### Testes
- **Novo:** `tests/evangelizoCommentClient.test.ts`.
- **Atualizado:** `tests/dailyLiturgyService.test.ts` para o novo formato de `reflexao`.
- **Removido:** `tests/reflectionRssClient.test.ts`.
- Suíte completa (`npm test`) e `npm run build` validados sem erros.

### Documentação
- `README-backend-fase1.md` e `RESUMO-IMPLEMENTACAO-E-PROXIMOS-PASSOS.md` atualizados para refletir o novo cliente de homilia.

---

## 8. Homilía movida para a Liturgia + calendário semanal na Home

### `mobile/src/types/liturgy.ts`
- `ReflectionBlock` (mobile) espelha o backend: `titulo`, `autor`, `fonte`, `texto`, `audioUrl`.

### `mobile/src/components/ReflectionSection.tsx`
- **Renomeado:** título do cartão de "Reflexão do Dia" para **"Homilía"**.
- Passou a exibir também o **título** do comentário e a **fonte** (quando houver), além de autor e texto.

### `mobile/src/screens/LiturgyScreen.tsx`
- **Adicionado:** nova aba **"Homilía"**, à direita de "Evangelho", renderizando o `ReflectionSection`.

### `mobile/src/screens/HomeScreen.tsx`
- **Removido:** cartão de reflexão/homilia (agora vive na Liturgia).
- Prop `settings` removida da tela (não é mais usada ali).
- Texto de carregamento genérico ("Atualizando dados do dia...").
- **Alterado:** "Frequência de Leitura" não navega mais entre meses — exibe fixamente **a semana atual (domingo a sábado)**, com resumo "X de 7 leituras concluídas esta semana".

### `mobile/App.tsx`
- Removida a prop `settings` passada ao `HomeScreen`.

---

## 9. Home — cabeçalho mais compacto e resumo do dia

### `mobile/src/screens/HomeScreen.tsx`
- **Reduzido:** tamanho do `Hero` (banner do topo) — paddings, título "LUMEN", cruz e demais elementos diminuídos (~30% mais compacto), mantendo a identidade visual.
- **Renomeado:** "Frequência de Leitura" para **"Progresso da Liturgia"**.
- **Adicionado:** novo cartão **"Liturgia de Hoje"**, logo abaixo do progresso semanal, com o nome da liturgia do dia, a referência do Evangelho, um trecho do texto do Evangelho e o link **"Continuar lendo →"**.

### `mobile/App.tsx`
- **Adicionado:** callback `onContinueReading`, que ajusta `selectedDate` para a data de hoje e troca a aba ativa para `"liturgia"`, levando o usuário direto para a `LiturgyScreen` do dia atual.

---

## 10. Nova tela de Orações católicas

### `mobile/src/screens/PrayersScreen.tsx` *(novo)*
- Nova aba **"🙏 Orações"** na barra inferior, entre Bíblia e Perfil.
- Lista organizada por categorias (`SectionList`); tocar numa oração abre a leitura do texto completo, com botão "‹ voltar" (mesmo padrão de navegação da Bíblia/Perfil).

### `mobile/src/data/prayers.ts`, `mobile/src/types/prayers.ts` *(novos)*
- 13 orações católicas tradicionais em português, organizadas em 5 categorias: **Orações Fundamentais** (Sinal da Cruz, Pai Nosso, Ave Maria, Glória ao Pai, Credo), **Orações Marianas** (Salve Rainha, Angelus), **Orações de Proteção** (São Miguel Arcanjo, Anjo da Guarda), **Orações de Devoção** (Vinde Espírito Santo, Alma de Cristo, Ó Jesus Manso e Humilde de Coração) e **Oração de Arrependimento** (Ato de Contrição).
- Textos conferidos com fontes católicas (incluindo a redação oficial da oração a São Miguel Arcanjo, do Papa Leão XIII).

### `mobile/src/components/BottomTabBar.tsx`, `mobile/App.tsx`
- Nova aba `"oracoes"` cadastrada em `TabName` e roteada para `PrayersScreen`.

---

## 11. Bíblia — abas de testamento, seleção de versículos e marcações

### `mobile/src/screens/BibleScreen.tsx`
- **Substituído:** botões de "Antigo Testamento" / "Novo Testamento" por uma **barra de abas** (Antigo | Novo | 🔖 Marcados) na tela raiz da Bíblia, eliminando a tela intermediária de seleção de testamento.
- **Adicionado:** seleção múltipla de versículos na tela de leitura — tocar num versículo o destaca; com um ou mais selecionados, aparece uma barra de ações fixa no rodapé com:
  - **📋 Copiar** — copia referência + texto dos versículos selecionados para a área de transferência.
  - **📤 Compartilhar** — abre o menu nativo de compartilhamento do sistema (`Share.share`), permitindo enviar para redes sociais e outros apps.
  - **🔖 Marcar** — abre um modal para adicionar um comentário pessoal e salvar os versículos selecionados como marcados.
- **Adicionado:** nova aba **"Marcados"**, listando todos os versículos marcados (referência, trecho do texto e comentário); tocar num item abre uma tela de detalhe para editar o comentário ou remover a marcação.
- Indicador visual (ponto colorido) para versículos já marcados, tanto na grade de seleção de versículo quanto na leitura.

### `mobile/src/storage/bookmarks.ts`, `mobile/src/types/bookmark.ts` *(novos)*
- Persistência local (`AsyncStorage`) dos versículos marcados: `upsertBookmarks`, `updateBookmarkComment`, `removeBookmark`, `getBookmarks`.

### Dependências
- Adicionado `expo-clipboard` (`mobile/package.json`). Compartilhamento usa a API nativa `Share` do React Native, sem dependência extra.

---

## Validações realizadas
- `tsc --noEmit` (mobile) sem erros após cada etapa.
- Bundle Android recompilado via Metro (Expo) sem erros após cada etapa.
- Backend: `npm run build` (tsc) e `npm test` (Vitest, 9/9 testes) sem erros.
- Endpoint `GET /api/liturgia?date=YYYY-MM-DD` testado ao vivo, retornando homilia real do Evangelizo.
