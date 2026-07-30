# Changelog — Refatoração de Navegação Mobile

**Última atualização:** 29/07/2026  
**Escopo:** `mobile/`

---

## [v3.1] Correção — Erro de Compilação no HomeScreen

**Data:** 29/07/2026

### Correção

#### `src/screens/HomeScreen.tsx`
- **Corrigido:** erro `SyntaxError: Identifier 'Props' has already been declared`
- A substituição parcial do arquivo em v3 deixou a declaração `type Props` e o componente `HomeScreen` antigos duplicados após os novos estilos `calStyles`
- Removido o bloco duplicado (tipo, componente e estilos obsoletos) do final do arquivo
- O arquivo agora contém apenas a versão v3 com o calendário de frequência de leitura

---

## [v3] Frequência de Leitura, Botão Amém e Reorganização de Dados

**Data:** 29/07/2026

### Alterações

#### `src/screens/HomeScreen.tsx`
- **Removido:** data e cor litúrgica do cabeçalho *(movidos para LiturgyScreen)*
- **Simplificado:** cabeçalho exibe apenas "Lumen / Liturgia Diária"
- **Adicionado:** calendário mensal de **frequência de leitura**
  - Navegação entre meses com setas `‹` / `›`
  - Dias com leitura concluída marcados com círculo na cor litúrgica
  - Hoje destacado com borda colorida
  - Contador "X leituras concluídas em [Mês]" abaixo do grid
- **Adicionada:** prop `readDays: string[]`
- **Removidas:** props `onPrevDay`, `onNextDay` (já removidas em v2), `headerDate`, `headerTag`

#### `src/screens/LiturgyScreen.tsx`
- **Adicionado:** cabeçalho de data e cor litúrgica abaixo do `WeekCalendar`
  - Data formatada em pt-BR com capitalização
  - Ponto colorido + label da cor litúrgica
- **Adicionado:** botão **Amém** ao final das leituras
  - Cor de fundo = cor litúrgica do dia
  - Após concluir exibe "✓ Amém" com opacidade reduzida
- **Adicionadas:** props `isRead: boolean` e `onAmen: () => void`

#### `src/storage/readingHistory.ts` *(novo)*
- `markDayAsRead(isoDate)` — persiste data como lida no `AsyncStorage`, retorna lista atualizada
- `getReadDays()` — retorna todas as datas lidas salvas

#### `src/services/date.ts`
- **Adicionada:** função `getMonthCalendarDays(year, month): (string | null)[]`
  - Retorna células do grid mensal iniciando no domingo da 1ª semana
  - Células vazias (`null`) preenchem os dias anteriores ao dia 1
- **Adicionado:** array `MONTH_NAMES_PT` com nomes dos meses em português

#### `App.tsx`
- **Adicionado:** estado `readDays: string[]`
- **Adicionado:** carregamento de `getReadDays()` no `bootstrap` junto com as settings
- **Adicionada:** função `handleAmen()` — chama `markDayAsRead(selectedDate)`, atualiza o estado e exibe alerta "Amém!"
- **Adicionadas:** props `readDays` ao `HomeScreen` e `isRead` / `onAmen` ao `LiturgyScreen`

### Fluxo de conclusão de leitura

```
Usuário clica "Amém" (LiturgyScreen)
  → handleAmen() em App.tsx
  → markDayAsRead(selectedDate) → AsyncStorage
  → setReadDays(updated)
  → HomeScreen.ReadingCalendar renderiza o dia marcado
```

---

## [v2] Melhorias de UX — Calendário Semanal e Simplificação da Home

**Data:** 29/07/2026

### Alterações

#### `src/screens/HomeScreen.tsx`
- **Removido:** botões "Dia anterior" e "Próximo dia"
- **Removido:** props `onPrevDay` e `onNextDay`
- A tela Home exibia o cabeçalho com data/cor litúrgica *(movidos para LiturgyScreen em v3)*

#### `src/screens/LiturgyScreen.tsx`
- **Adicionado:** componente `WeekCalendar` fixo no topo da tela
  - Exibe a semana completa de **Domingo a Sábado** contendo a data selecionada
  - Dia selecionado destacado com cor litúrgica (accent) e texto branco
  - Hoje marcado com ponto indicador e número em negrito
  - Setas `‹` / `›` nas laterais para navegar semana a semana
  - Ao tocar qualquer dia carrega a liturgia correspondente
- **Adicionadas:** props `selectedDate: string` e `onSelectDate: (date: string) => void`

#### `src/services/date.ts`
- **Adicionada:** função `getWeekDays(isoDate: string): string[]`
  - Retorna array com os 7 dias ISO da semana (Dom–Sáb) que contém a data fornecida

#### `App.tsx`
- Removidas props `onPrevDay` / `onNextDay` da chamada do `HomeScreen`
- Adicionadas props `selectedDate` e `onSelectDate` na chamada do `LiturgyScreen`

---

## [v1] Refatoração de Navegação Mobile

**Data:** 29/07/2026

### Resumo

Refatoração da interface do app mobile para introduzir navegação por abas (bottom tab bar), separar responsabilidades em telas distintas e corrigir incompatibilidades com o Expo SDK 54.

---

### Novas Telas

#### `src/screens/HomeScreen.tsx`
- Exibe o cabeçalho com título, data, cor litúrgica ~~e botões de navegação entre dias~~ *(removido em v2)*
- Exibe apenas a **reflexão do dia** (sem as leituras completas)
- Mostra indicador de conteúdo offline quando aplicável
- Mantém estados de loading e erro com botão de retry

#### `src/screens/LiturgyScreen.tsx`
- Exibe as **leituras litúrgicas completas**: Primeira Leitura, Salmo Responsorial, Segunda Leitura (quando existe) e Evangelho
- Mostra o título e cor litúrgica do dia como banner
- Reutiliza o componente `ReadingSection` existente
- **Adicionado em v2:** calendário semanal no topo *(ver seção v2)*

### `src/screens/SettingsScreen.tsx`: Claro, Escuro, Sépia
- Controles de **tamanho da fonte**: A- / A+ com preview ao vivo
- Configuração de **lembrete diário**: horário (HH:MM) e toggle via `Switch`
- Todos os controles removidos da tela principal e centralizados aqui

### `src/screens/ProfileScreen.tsx`
- Tela de perfil do usuário (placeholder)
- Exibe avatar, nome, descrição, versão do app e texto sobre o Lumen

---

### Novos Componentes

#### `src/components/BottomTabBar.tsx`
- Barra de menu inferior com 4 abas: **Home**, **Liturgia Diária**, **Configurações**, **Perfil**
- Aba ativa destacada com a cor litúrgica (accent)
- `paddingBottom` dinâmico via `useSafeAreaInsets()` para não sobrepor os botões de navegação do Android
- Tipo `TabName` exportado para uso em `App.tsx`

---

### Novos Tipos

#### `src/types/theme.ts`
- Exporta o tipo `ThemePalette` (antes definido inline em `App.tsx`)
- Compartilhado por todas as telas e pelo `BottomTabBar`

---

### Arquivos Modificados

#### `App.tsx`
- **Removido:** toda a UI inline (cabeçalho, configurações, leituras, reflexão)
- **Adicionado:** estado `activeTab` para controle da aba ativa
- **Adicionado:** função `renderScreen()` que roteia para a tela correta
- **Adicionado:** `SafeAreaProvider` (react-native-safe-area-context) envolvendo o app
- **Modificado:** `SafeAreaView` agora importado de `react-native-safe-area-context` com `edges={["top"]}` para respeitar o inset superior sem bloquear a área da barra inferior
- Lógica de estado, settings, fetch e cache permanece centralizada aqui

#### `src/services/notifications.ts`
- `setNotificationHandler` envolvido em `try/catch` — evita crash em Expo Go SDK 54 onde notificações Android remotas foram removidas
- Funções `scheduleDailyReminder`, `requestNotificationPermission` e `disableDailyReminder` também envolvidas em `try/catch`

#### `src/components/AudioPlayer.tsx`
- `expo-av` agora carregado via `require()` lazy com `try/catch`
- Se `expo-av` não estiver disponível (quebrado em SDK 54), exibe mensagem "Áudio indisponível neste ambiente" em vez de crashar
- Substituído `useState<Audio.Sound>` por `useRef` com tipo genérico para evitar dependência de tipo em tempo de compilação

---

### Novas Dependências

| Pacote | Versão | Motivo |
|---|---|---|
| `react-native-safe-area-context` | latest | Insets do sistema para posicionamento correto da barra inferior |

---

### Correções de Compatibilidade (SDK 53 → 54)

| Problema | Solução |
|---|---|
| Expo Go SDK 54 incompatível com projeto SDK 53 | Atualizado `expo` e pacotes para versões `~54.x` |
| `babel-preset-expo` ausente após update | Instalado `babel-preset-expo@~54.0.10` |
| `expo-asset` ausente (requerido por `expo-sqlite`) | Instalado `expo-asset@~12.0.13` |
| Conflito `@types/react` vs `react-native@0.81.5` | Atualizado `@types/react@^19.1.0` com `--legacy-peer-deps` |
| `expo-notifications` crasha em Expo Go SDK 54 | Envolvido em `try/catch` |
| `expo-av` deprecated em SDK 54 | Import lazy com fallback gracioso |
| `SafeAreaView` deprecated | Migrado para `react-native-safe-area-context` |
| URL da API `10.0.2.2` (emulador) | Atualizado para `192.168.1.8` (IP do host na rede local) |

---

### Estrutura de Telas

```
App
├── SafeAreaProvider
│   ├── SafeAreaView (edges: top)
│   │   ├── HomeScreen        ← aba "Home"
│   │   ├── LiturgyScreen     ← aba "Liturgia Diária"
│   │   ├── SettingsScreen    ← aba "Configurações"
│   │   └── ProfileScreen     ← aba "Perfil"
│   └── BottomTabBar (com paddingBottom = inset Android)
```
