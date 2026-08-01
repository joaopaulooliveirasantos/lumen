# Plano: Funcionalidade "Rezar o Terço"

**Status:** implementado (mobile).
**Escopo:** `mobile/`

## Contexto

O app Lumen já tinha uma tela de Orações (`PrayersScreen.tsx`) com orações avulsas, mas nenhuma forma guiada de rezar o Rosário/Terço, uma das devoções católicas mais praticadas. O usuário forneceu a especificação completa (os 4 grupos de mistérios, os 5 mistérios de cada grupo, e a estrutura passo a passo do terço) e pediu uma tela de seleção de grupo + um fluxo guiado por "Próxima"/"Voltar", encerrado por um botão de finalizar.

Quando perguntado onde a entrada da funcionalidade deveria morar na navegação, o usuário escolheu explicitamente **um botão na tela Home** — não uma nova aba, não dentro da aba Orações.

Confirmei via busca (bate com a tradição católica) que a associação de dias da semana que o usuário escreveu de forma abreviada ("Segunda - Sábado" etc.) corresponde a: Gozosos = Segunda **e** Sábado, Dolorosos = Terça **e** Sexta, Gloriosos = Quarta **e** Domingo, Luminosos = Quinta-feira (não são intervalos).

Também usei os textos verbatim de duas orações que faltavam no app (Oração de Fátima e Oração Final do Terço), conferidos em fontes católicas.

Após a primeira versão, o usuário pediu 4 ajustes que mudaram partes do desenho original (detalhados na seção "Ajustes pós-implementação" abaixo).

## Padrões existentes reaproveitados (não reinventados)

- **Sem lib de navegação.** `App.tsx` guarda só `activeTab: TabName`; cada tela gerencia sua própria navegação interna com `useState<ViewState>` + um componente `Header()` local (botão "‹"/"✕" + título centralizado + espaçador simétrico de 40px) — visto em `BibleScreen.tsx` e `PrayersScreen.tsx`. O Terço segue o mesmo molde.
- `HomeScreen.tsx` já tinha o precedente de **botão que abre algo via callback subindo pro App.tsx**: o card "Liturgia de Hoje" chama `onContinueReading` (prop). Repetido com `onOpenRosary`.
- `data/prayers.ts` já continha, com textos prontos, as orações: `sinal-da-cruz`, `credo`, `pai-nosso`, `ave-maria`, `gloria-ao-pai`, `salve-rainha` — o gerador de passos do terço **reaproveita esses textos por id**, sem duplicar strings.
- `theme: ThemePalette` e `settings: UserSettings` (com `fontScale`) são passados a toda tela; todo tamanho de fonte é `base * settings.fontScale`.

## Arquivos novos

### 1. `mobile/src/types/rosary.ts`
```ts
export type MysteryGroupId = "gozosos" | "dolorosos" | "gloriosos" | "luminosos";

export interface MysteryGroup {
  id: MysteryGroupId;
  nome: string;        // "Gozosos" (sem o prefixo "Mistérios", ver ajuste #3)
  dias: string;         // "Segunda e Sábado"
  misterios: string[];  // exatamente 5 títulos, na ordem
}

export type RosaryStepKind = "oracao-simples" | "anuncio-misterio";

export interface RosaryStep {
  ordem: number;             // sequencial, 1..N (N varia — ver ajuste #4)
  kind: RosaryStepKind;
  titulo: string;
  texto: string;
  repeticaoAtual?: number;   // ex.: 3 (esta é a 3ª Ave Maria da dezena)
  repeticaoTotal?: number;   // ex.: 10 (dezena completa)
  misterioIndex?: number;    // 0..4, presente dentro de uma dezena (label "Mistério N de 5")
}
```

### 2. `mobile/src/data/rosaryMysteries.ts`
Exporta `mysteryGroups: MysteryGroup[]`, com os textos **verbatim** fornecidos pelo usuário:

- **gozosos** — dias: "Segunda e Sábado"
  1. A Anunciação do Anjo e a Encarnação do Verbo no seio Puríssimo de Maria
  2. A visitação de Maria a sua prima Santa Isabel
  3. Nascimento do Menino Jesus, na gruta fria em Belém
  4. A apresentação do Menino Jesus no templo, e a purificação de Maria
  5. A perda e o encontro do Menino Jesus no templo discutindo com os doutores da Lei
- **dolorosos** — dias: "Terça e Sexta"
  1. A oração e agonia no Horto das Oliveiras
  2. Flagelação de Nosso Senhor Jesus Cristo
  3. A coroação de espinhos de Nosso Senhor Jesus Cristo
  4. Nosso Senhor carregando a Cruz nas costas à caminho do Calvário
  5. A Crucifixão e morte de Nosso Senhor Jesus Cristo
- **gloriosos** — dias: "Quarta e Domingo"
  1. A Ressurreição de Nosso Senhor Jesus Cristo
  2. A Ascensão de Nosso Senhor Jesus Cristo
  3. A descida do Espírito Santo a Nossa Senhora e os Apóstolos reunidos no Santo Cenáculo
  4. A Assunção de Nossa Senhora aos Céus de corpo e alma
  5. A Coroação de Nossa Senhora como Rainha do Céu e da Terra, dos Anjos e dos Homens
- **luminosos** — dias: "Quinta-feira"
  1. Batismo de Nosso Senhor Jesus Cristo no rio Jordão
  2. Primeiro milagre de Nosso Senhor Jesus Cristo transformando a água em vinho nas bodas de Caná
  3. Anúncio do Reino de Deus e o convite à conversão
  4. A transfiguração de Nosso Senhor no Monte Tabor
  5. A Instituição da Eucaristia na Última Ceia

Os nomes (`nome`) não têm o prefixo "Mistérios" — ver ajuste #3.

Também exporta um helper puro:
```ts
export function suggestedMysteryGroupFor(date: Date): MysteryGroupId
```
Mapeia `date.getDay()` (0=domingo): `1|6→gozosos`, `2|5→dolorosos`, `3|0→gloriosos`, `4→luminosos`. Usado para **pré-selecionar** o grupo do dia na tela de seleção.

### 3. Edição em `mobile/src/data/prayers.ts`
Categoria adicional em `prayerCategories` (aditiva, não mexeu em nada existente):
```ts
{
  id: "terco",
  nome: "Orações do Terço",
  oracoes: [
    {
      id: "oracao-fatima",
      titulo: "Oração de Fátima",
      texto: "Ó meu Jesus, perdoai-nos, livrai-nos do fogo do inferno; levai as almas todas para o Céu, principalmente as que mais precisarem. Amém.",
    },
    {
      id: "oracao-final-terco",
      titulo: "Oração Final do Terço",
      texto: "Ó Deus, cujo Filho unigênito, por sua vida, morte e ressurreição, nos mereceu as recompensas da salvação eterna, concedei-nos, nós vo-lo pedimos, que, meditando estes mistérios do santíssimo Rosário da Bem-Aventurada Virgem Maria, imitemos o que encerram e alcancemos o que prometem. Por Cristo, Senhor Nosso. Amém.",
    },
  ],
},
```
Essas duas orações também aparecem na aba Orações (a `PrayersScreen.tsx` já itera `prayerCategories` genericamente — zero mudança lá).

### 4. `mobile/src/services/rosary.ts`
Função pura `buildRosarySteps(groupId: MysteryGroupId): RosaryStep[]`, buscando os textos reaproveitados de `prayerCategories` por id (helper interno `findPrayerText(id)`) e interpolando os 5 anúncios de mistério de `mysteryGroups`.

**Estrutura (após o ajuste #4 — cada repetição é um passo próprio):**
```
Sinal da Cruz            (sinal-da-cruz)                     — 1 passo
Credo                    (credo)                              — 1 passo
Pai Nosso                (pai-nosso)                           — 1 passo
Ave Maria                (ave-maria) × 3                       — 3 passos, cada um com repeticaoAtual/repeticaoTotal
Glória ao Pai            (gloria-ao-pai)                       — 1 passo
── por mistério i = 0..4:
   Anúncio do (i+1)º Mistério   (texto = mysteryGroups[grupo].misterios[i])  — 1 passo
   Pai Nosso                    (pai-nosso)                                  — 1 passo
   Ave Maria                    (ave-maria) × 10                             — 10 passos
   Glória ao Pai                (gloria-ao-pai)                              — 1 passo
   Oração de Fátima             (oracao-fatima)                              — 1 passo
Salve Rainha             (salve-rainha)                       — 1 passo
Oração Final             (oracao-final-terco)                 — 1 passo
```
Total: 7 (abertura) + 5 × 14 (cada dezena) + 2 (fechamento) = **79 passos**, sempre, para qualquer grupo — `ordem` sequencial 1..79. Verificado por script (`buildRosarySteps` para os 4 grupos: `total=79`, `sequential=true`, `aveMarias=53` = 3 + 5×10).

**Nota sobre o Pai Nosso:** o pedido de ajuste citou "Ave Maria (3x) e Pai Nosso (10x)" como exemplos de orações repetidas. Mantive o Pai Nosso como uma única recitação por dezena — é a Ave Maria que se repete 10 vezes por dezena (estrutura tradicional do terço, e também o que a especificação original detalhada do usuário já descrevia). O Pai Nosso aparece uma vez na abertura e uma vez em cada dezena (6 ocorrências ao todo, cada uma um passo único).

### 5. `mobile/src/screens/RosaryScreen.tsx`
Tela autocontida, no mesmo molde do `BibleScreen.tsx`/`PrayersScreen.tsx` (um `view` local + `Header()` interno + `StyleSheet` próprio).

```ts
type Props = { theme: ThemePalette; settings: UserSettings; onExit: () => void };

const [view, setView] = useState<"selecao" | "oracao">("selecao");
const [selectedGroup, setSelectedGroup] = useState<MysteryGroupId>(
  () => suggestedMysteryGroupFor(new Date()),
);
const [steps, setSteps] = useState<RosaryStep[]>([]);
const [stepIndex, setStepIndex] = useState(0);
```

**Tela "selecao"** (raiz do fluxo):
- `Header` com botão "✕" à esquerda chamando `onExit` (sem confirmação — não há progresso a perder, pois não há persistência) e título "Terço".
- Rótulo da seção: **"Escolher Mistério"** (ajuste #2).
- 4 cards selecionáveis, mostrando `nome` (só "Gozosos"/"Dolorosos"/"Gloriosos"/"Luminosos", sem a palavra "Mistério" — ajuste #3) + `dias` como subtítulo; toque chama `setSelectedGroup(group.id)`. O grupo sugerido pelo dia já vem marcado.
- Botão "Iniciar Oração" abaixo: monta `buildRosarySteps(selectedGroup)`, `stepIndex=0`, `setView("oracao")`.

**Tela "oracao"** (passo a passo):
- `Header` com "✕" (sempre visível) e título = `steps[stepIndex].titulo`.
- Indicador de progresso: "Passo {ordem} de {steps.length}" (dinâmico, não mais fixo — ajuste #4) + barra fina em `theme.accent`.
- Card de conteúdo dentro de `ScrollView` (textos longos como Credo/Salve Rainha em `fontScale` alto rolam) com:
  - título do passo e texto da oração (`fontScale`-aware).
  - se `repeticaoTotal` presente: selo "{repeticaoAtual}ª de {repeticaoTotal}" (ex.: "3ª de 10") — substituiu o antigo selo "Repetir Nx" de quando a repetição era um único passo.
  - se `misterioIndex` definido: linha secundária "Mistério {misterioIndex+1} de 5".
- Rodapé fixo com "Voltar" (no passo 0 volta pra seleção; senão decrementa) e "Próxima"/"Finalizar Terço" (relabel no último passo, mostra `Alert.alert` de conclusão e sai).

## Arquivos editados

### `mobile/src/screens/HomeScreen.tsx`
- Prop `onOpenRosary: () => void`.
- Componente local `RosaryEntryCard` (mesmo formato visual do card `TodayLiturgySummary`), título "🌹 Rezar o Terço", `Pressable` chamando `onOpenRosary`.
- Inserido no `body`, logo depois do bloco `TodayLiturgySummary`, sempre visível.

### `mobile/App.tsx`
- `const [rosaryOpen, setRosaryOpen] = useState(false);`
- `<HomeScreen ... onOpenRosary={() => setRosaryOpen(true)} />`.
- **Ajuste #1** (barra de abas sempre visível): a primeira versão fazia um early-return de tela cheia que escondia a `BottomTabBar`. Isso foi revertido — agora o Terço é renderizado **dentro** da área de conteúdo normal, ao lado de `renderScreen()`, e a `BottomTabBar` continua sempre montada:
  ```tsx
  <View style={styles.content}>
    {rosaryOpen ? (
      <RosaryScreen theme={theme} settings={settings} onExit={() => setRosaryOpen(false)} />
    ) : (
      renderScreen()
    )}
  </View>
  <BottomTabBar
    activeTab={activeTab}
    onTabPress={(tab) => {
      setRosaryOpen(false);
      setActiveTab(tab);
    }}
    theme={theme}
  />
  ```
  Tocar em outra aba durante o terço fecha o fluxo (`setRosaryOpen(false)`) e navega normalmente — não há confirmação, pois não há progresso persistido a perder.

## Ajustes pós-implementação (pedidos pelo usuário após a v1)

1. **Barra de abas sempre visível** em todas as telas, inclusive durante o Terço → resolvido acima, removendo o takeover de tela cheia.
2. **"Escolha o grupo de mistérios" → "Escolher Mistério"**.
3. **Remover a palavra "Mistério" das opções** → `mysteryGroups[].nome` mudou de "Mistérios Gozosos" etc. para só "Gozosos", "Dolorosos", "Gloriosos", "Luminosos".
4. **Orações repetidas (Ave Maria ×3, ×10) viram passos individuais**, não mais um único passo com "Repetir Nx" → `buildRosarySteps` agora empurra N entradas separadas (uma por repetição, com `repeticaoAtual`/`repeticaoTotal`), e o total de passos passou de 32 (fixo) para 79 (calculado dinamicamente via `steps.length`).

## Fora de escopo (não construído)
- Persistência/histórico de terços rezados.
- Confirmação ao sair no meio do terço.
- Cores diferentes por grupo de mistério — reaproveita `theme.accent` (cor litúrgica do dia).

## Verificação
1. `cd mobile && npx tsc --noEmit` — sem erros.
2. Script de sanidade (`buildRosarySteps` para os 4 grupos): `total=79`, `sequential=true`, `aveMarias=53` (3 + 5×10), primeira Ave Maria = "1 de 3".
3. Bundle Android recompilado via Metro sem erros (Expo Go): Home → "Rezar o Terço" → 4 opções sem a palavra "Mistério", dia sugerido pré-selecionado → "Iniciar Oração" → 79 passos navegáveis um a um, incluindo cada Ave Maria individualmente com selo de posição → "Finalizar Terço" no último passo → barra de abas visível o tempo todo, inclusive durante a oração.
4. Testado com `fontScale` em 0.9 e 1.5 nos passos mais longos (Credo, Salve Rainha, Oração Final).
5. Testado nos 3 modos de leitura (claro/escuro/sépia).
