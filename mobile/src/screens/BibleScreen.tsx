import { useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { BibleBook, BibleChapter, BibleData } from "../types/bible";
import type { ThemePalette } from "../types/theme";
import type { UserSettings } from "../types/settings";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const bibleData = require("../../../biblias/ave maria/bibliaAveMaria.json") as BibleData;

type ScreenView = "testamentos" | "livros" | "capitulos" | "versiculos" | "leitura";

type Props = {
  theme: ThemePalette;
  settings: UserSettings;
};

export function BibleScreen({ theme, settings }: Props) {
  const [view, setView] = useState<ScreenView>("testamentos");
  const [testament, setTestament] = useState<"antigoTestamento" | "novoTestamento">("antigoTestamento");
  const [book, setBook] = useState<BibleBook | null>(null);
  const [chapter, setChapter] = useState<BibleChapter | null>(null);
  const [startVerse, setStartVerse] = useState<number | null>(null);

  const fs = settings.fontScale;

  function selectTestament(t: "antigoTestamento" | "novoTestamento") {
    setTestament(t);
    setView("livros");
  }

  function selectBook(b: BibleBook) {
    setBook(b);
    setView("capitulos");
  }

  function selectChapter(c: BibleChapter) {
    setChapter(c);
    setStartVerse(null);
    setView("versiculos");
  }

  function selectVerse(v: number) {
    setStartVerse(v);
    setView("leitura");
  }

  function goBack() {
    if (view === "leitura") setView("versiculos");
    else if (view === "versiculos") setView("capitulos");
    else if (view === "capitulos") setView("livros");
    else if (view === "livros") setView("testamentos");
  }

  const books = bibleData[testament];

  // ── Header ──────────────────────────────────────────────────────────────────
  function Header() {
    const titles: Record<ScreenView, string> = {
      testamentos: "Bíblia",
      livros: testament === "antigoTestamento" ? "Antigo Testamento" : "Novo Testamento",
      capitulos: book?.nome ?? "",
      versiculos: `${book?.nome} — Cap. ${chapter?.capitulo}`,
      leitura: `${book?.nome} ${chapter?.capitulo},${startVerse ?? ""}`,
    };

    return (
      <View style={[styles.header, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        {view !== "testamentos" ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            onPress={goBack}
            style={styles.backBtn}
          >
            <Text style={[styles.backText, { color: theme.accent }]}>{"‹"}</Text>
          </Pressable>
        ) : (
          <View style={styles.backBtn} />
        )}
        <Text allowFontScaling style={[styles.headerTitle, { color: theme.titleText }]} numberOfLines={1}>
          {titles[view]}
        </Text>
        <View style={styles.backBtn} />
      </View>
    );
  }

  // ── Tela: Testamentos ────────────────────────────────────────────────────────
  if (view === "testamentos") {
    return (
      <View style={[styles.container, { backgroundColor: theme.appBackground }]}>
        <Header />
        <ScrollView contentContainerStyle={styles.listContent}>
          <Text allowFontScaling style={[styles.sectionLabel, { color: theme.mutedText }]}>
            Selecione o Testamento
          </Text>
          {(["antigoTestamento", "novoTestamento"] as const).map((t) => (
            <Pressable
              key={t}
              accessibilityRole="button"
              style={[styles.row, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
              onPress={() => selectTestament(t)}
            >
              <View style={[styles.rowAccent, { backgroundColor: theme.accent }]} />
              <View style={styles.rowBody}>
                <Text allowFontScaling style={[styles.rowTitle, { color: theme.titleText, fontSize: 16 * fs }]}>
                  {t === "antigoTestamento" ? "Antigo Testamento" : "Novo Testamento"}
                </Text>
                <Text allowFontScaling style={[styles.rowSub, { color: theme.mutedText, fontSize: 12 * fs }]}>
                  {bibleData[t].length} livros
                </Text>
              </View>
              <Text style={[styles.chevron, { color: theme.mutedText }]}>{"›"}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  }

  // ── Tela: Livros ─────────────────────────────────────────────────────────────
  if (view === "livros") {
    return (
      <View style={[styles.container, { backgroundColor: theme.appBackground }]}>
        <Header />
        <FlatList
          key="list-livros"
          data={books}
          keyExtractor={(item) => item.nome}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => (
            <Pressable
              accessibilityRole="button"
              style={[styles.row, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
              onPress={() => selectBook(item)}
            >
              <View style={[styles.rowIndex, { backgroundColor: theme.accent }]}>
                <Text style={styles.rowIndexText}>{index + 1}</Text>
              </View>
              <View style={styles.rowBody}>
                <Text allowFontScaling style={[styles.rowTitle, { color: theme.titleText, fontSize: 15 * fs }]}>
                  {item.nome}
                </Text>
                <Text allowFontScaling style={[styles.rowSub, { color: theme.mutedText, fontSize: 12 * fs }]}>
                  {item.capitulos.length} {item.capitulos.length === 1 ? "capítulo" : "capítulos"}
                </Text>
              </View>
              <Text style={[styles.chevron, { color: theme.mutedText }]}>{"›"}</Text>
            </Pressable>
          )}
        />
      </View>
    );
  }

  // ── Tela: Capítulos ──────────────────────────────────────────────────────────
  if (view === "capitulos" && book) {
    const numCols = 5;
    return (
      <View style={[styles.container, { backgroundColor: theme.appBackground }]}>
        <Header />
        <FlatList
          key={`grid-chapters-${numCols}`}
          data={book.capitulos}
          keyExtractor={(item) => String(item.capitulo)}
          numColumns={numCols}
          contentContainerStyle={styles.chapterGrid}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Capítulo ${item.capitulo}`}
              style={[styles.chapterCell, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
              onPress={() => selectChapter(item)}
            >
              <Text allowFontScaling style={[styles.chapterNumber, { color: theme.titleText, fontSize: 16 * fs }]}>
                {item.capitulo}
              </Text>
              <Text allowFontScaling style={[styles.chapterVerseCount, { color: theme.mutedText, fontSize: 10 * fs }]}>
                {item.versiculos.length}v
              </Text>
            </Pressable>
          )}
        />
      </View>
    );
  }

  // ── Tela: Versículos (seleção) ────────────────────────────────────────────────
  if (view === "versiculos" && chapter) {
    const numCols = 5;
    return (
      <View style={[styles.container, { backgroundColor: theme.appBackground }]}>
        <Header />
        <FlatList
          key={`grid-verses-${numCols}`}
          data={chapter.versiculos}
          keyExtractor={(item) => String(item.versiculo)}
          numColumns={numCols}
          contentContainerStyle={styles.chapterGrid}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Versículo ${item.versiculo}`}
              style={[styles.chapterCell, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
              onPress={() => selectVerse(item.versiculo)}
            >
              <Text allowFontScaling style={[styles.chapterNumber, { color: theme.titleText, fontSize: 16 * fs }]}>
                {item.versiculo}
              </Text>
            </Pressable>
          )}
        />
      </View>
    );
  }

  // ── Tela: Leitura ────────────────────────────────────────────────────────────
  if (view === "leitura" && chapter && startVerse !== null) {
    const verses = chapter.versiculos.filter((v) => v.versiculo >= startVerse);
    return (
      <View style={[styles.container, { backgroundColor: theme.appBackground }]}>
        <Header />
        <FlatList
          key="list-leitura"
          data={verses}
          keyExtractor={(item) => String(item.versiculo)}
          contentContainerStyle={styles.versesContent}
          renderItem={({ item }) => (
            <View style={styles.verseRow}>
              <Text style={[styles.verseNumber, { color: theme.accent, fontSize: 12 * fs }]}>
                {item.versiculo}
              </Text>
              <Text allowFontScaling style={[styles.verseText, { color: theme.bodyText, fontSize: 15 * fs, lineHeight: 24 * fs }]}>
                {item.texto}
              </Text>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={[styles.verseSeparator, { backgroundColor: theme.border }]} />}
        />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, alignItems: "center" },
  backText: { fontSize: 28, fontWeight: "700", lineHeight: 32 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: "700", textAlign: "center" },
  listContent: { padding: 12, gap: 8 },
  sectionLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", marginBottom: 4, paddingHorizontal: 4 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    minHeight: 56,
  },
  rowAccent: { width: 4, alignSelf: "stretch" },
  rowIndex: {
    width: 40,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
  },
  rowIndexText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  rowBody: { flex: 1, paddingHorizontal: 12, paddingVertical: 10 },
  rowTitle: { fontWeight: "600" },
  rowSub: { marginTop: 2 },
  chevron: { paddingHorizontal: 12, fontSize: 20 },
  chapterGrid: { padding: 12, gap: 8 },
  chapterCell: {
    flex: 1,
    margin: 4,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    minHeight: 56,
  },
  chapterNumber: { fontWeight: "700" },
  chapterVerseCount: { marginTop: 2 },
  versesContent: { paddingHorizontal: 16, paddingVertical: 12 },
  verseRow: { flexDirection: "row", paddingVertical: 8, gap: 10 },
  verseNumber: { width: 28, fontWeight: "700", textAlign: "right", paddingTop: 2 },
  verseText: { flex: 1 },
  verseSeparator: { height: 1, marginHorizontal: 38 },
});
