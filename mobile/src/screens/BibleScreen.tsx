import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import type { BibleBook, BibleChapter } from "../types/bible";
import type { ThemePalette } from "../types/theme";
import type { UserSettings } from "../types/settings";
import type { VerseBookmark } from "../types/bookmark";
import { getBookmarks, removeBookmark, updateBookmarkComment, upsertBookmarks } from "../storage/bookmarks";
import { getBibleData } from "../services/bibleData";
import { bibleTranslations } from "../data/bibleTranslations";
import { AppIcon, type AppIconName } from "../components/AppIcon";

type ScreenView = "livros" | "capitulos" | "versiculos" | "leitura" | "marcado";
type Testament = "antigoTestamento" | "novoTestamento";
type TestamentTab = Testament | "marcados";

const GOSPEL_BOOKS = ["São Mateus", "São Marcos", "São Lucas", "São João"];

type Props = {
  theme: ThemePalette;
  settings: UserSettings;
};

function bookmarkId(testament: Testament, livro: string, capitulo: number, versiculo: number): string {
  return `${testament}:${livro}:${capitulo}:${versiculo}`;
}

export function BibleScreen({ theme, settings }: Props) {
  const [view, setView] = useState<ScreenView>("livros");
  const [activeTab, setActiveTab] = useState<TestamentTab>("antigoTestamento");
  const [book, setBook] = useState<BibleBook | null>(null);
  const [chapter, setChapter] = useState<BibleChapter | null>(null);
  const [startVerse, setStartVerse] = useState<number | null>(null);
  const [selectedVerses, setSelectedVerses] = useState<Set<number>>(new Set());
  const [bookmarks, setBookmarks] = useState<VerseBookmark[]>([]);
  const [activeBookmark, setActiveBookmark] = useState<VerseBookmark | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [markModalVisible, setMarkModalVisible] = useState(false);
  const [markComment, setMarkComment] = useState("");

  const fs = settings.fontScale;

  useEffect(() => {
    void getBookmarks().then(setBookmarks);
  }, []);

  const bookmarkedIds = new Set(bookmarks.map((b) => b.id));
  const testament: Testament = activeTab === "novoTestamento" ? "novoTestamento" : "antigoTestamento";
  const bibleData = getBibleData(settings.bibleTranslation);
  const books = bibleData[testament];

  function selectBook(b: BibleBook) {
    setBook(b);
    setView("capitulos");
  }

  function selectChapter(c: BibleChapter) {
    setChapter(c);
    setStartVerse(null);
    setSelectedVerses(new Set());
    setView("versiculos");
  }

  function selectVerse(v: number) {
    setStartVerse(v);
    setSelectedVerses(new Set());
    setView("leitura");
  }

  function toggleVerseSelection(v: number) {
    setSelectedVerses((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });
  }

  function openBookmark(b: VerseBookmark) {
    setActiveBookmark(b);
    setCommentDraft(b.comentario);
    setView("marcado");
  }

  function goBack() {
    if (view === "leitura") {
      setSelectedVerses(new Set());
      setView("versiculos");
    } else if (view === "versiculos") {
      setView("capitulos");
    } else if (view === "capitulos") {
      setView("livros");
    } else if (view === "marcado") {
      setActiveBookmark(null);
      setView("livros");
    }
  }

  function getSelectedVerseObjects() {
    if (!chapter) return [];
    return chapter.versiculos
      .filter((v) => selectedVerses.has(v.versiculo))
      .sort((a, b) => a.versiculo - b.versiculo);
  }

  function buildSelectionText(): string {
    if (!book || !chapter) return "";
    const verses = getSelectedVerseObjects();
    if (verses.length === 0) return "";
    const nums = verses.map((v) => v.versiculo);
    const refRange = nums.length > 1 ? `${nums[0]}-${nums[nums.length - 1]}` : `${nums[0]}`;
    const header = `${book.nome} ${chapter.capitulo},${refRange}`;
    const body = verses.map((v) => `${v.versiculo}. ${v.texto}`).join(" ");
    return `${header}\n${body}`;
  }

  async function handleCopy() {
    const text = buildSelectionText();
    if (!text) return;
    await Clipboard.setStringAsync(text);
    Alert.alert("Copiado", "Texto copiado para a área de transferência.");
  }

  async function handleShare() {
    const text = buildSelectionText();
    if (!text) return;
    try {
      await Share.share({ message: text });
    } catch {
      // usuario cancelou o compartilhamento
    }
  }

  function openMarkModal() {
    const verses = getSelectedVerseObjects();
    if (verses.length === 0 || !book || !chapter) return;
    const existing = verses
      .map((v) => bookmarks.find((b) => b.id === bookmarkId(testament, book.nome, chapter.capitulo, v.versiculo)))
      .find((b) => Boolean(b));
    setMarkComment(existing?.comentario ?? "");
    setMarkModalVisible(true);
  }

  async function handleSaveMark() {
    if (!book || !chapter) return;
    const verses = getSelectedVerseObjects();
    if (verses.length === 0) return;
    const nowIso = new Date().toISOString();
    const entries: VerseBookmark[] = verses.map((v) => ({
      id: bookmarkId(testament, book.nome, chapter.capitulo, v.versiculo),
      testamento: testament,
      livro: book.nome,
      capitulo: chapter.capitulo,
      versiculo: v.versiculo,
      texto: v.texto,
      comentario: markComment.trim(),
      criadoEm: nowIso,
    }));
    const updated = await upsertBookmarks(entries);
    setBookmarks(updated);
    setMarkModalVisible(false);
    setSelectedVerses(new Set());
    Alert.alert("Marcado", verses.length > 1 ? "Versículos marcados." : "Versículo marcado.");
  }

  async function handleSaveComment() {
    if (!activeBookmark) return;
    const updated = await updateBookmarkComment(activeBookmark.id, commentDraft.trim());
    setBookmarks(updated);
    setActiveBookmark((prev) => (prev ? { ...prev, comentario: commentDraft.trim() } : prev));
    Alert.alert("Salvo", "Comentário atualizado.");
  }

  function handleRemoveBookmark() {
    if (!activeBookmark) return;
    Alert.alert("Remover marcação", "Deseja remover este versículo marcado?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: () => {
          void removeBookmark(activeBookmark.id).then((updated) => {
            setBookmarks(updated);
            setActiveBookmark(null);
            setView("livros");
          });
        },
      },
    ]);
  }

  // ── Header ──────────────────────────────────────────────────────────────────
  function Header() {
    const bibleName = bibleTranslations.find((t) => t.id === settings.bibleTranslation)?.nome ?? "";
    const titles: Record<ScreenView, string> = {
      livros: bibleName ? `Bíblia - ${bibleName}` : "Bíblia",
      capitulos: book?.nome ?? "",
      versiculos: `${book?.nome} — Cap. ${chapter?.capitulo}`,
      leitura: `${book?.nome} ${chapter?.capitulo},${startVerse ?? ""}`,
      marcado: activeBookmark ? `${activeBookmark.livro} ${activeBookmark.capitulo},${activeBookmark.versiculo}` : "Marcado",
    };

    return (
      <View style={styles.headerArea}>
        <View style={[styles.header, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          {view !== "livros" ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              onPress={goBack}
              style={styles.backBtn}
            >
              <Text style={[styles.backText, { color: theme.accent }]}>{"‹"}</Text>
            </Pressable>
          ) : (
            <View style={styles.backBtn}>
              <Image source={require("../../assets/icon.png")} style={styles.headerLogo} />
            </View>
          )}
          <Text allowFontScaling style={[styles.headerTitle, { color: theme.titleText }]} numberOfLines={1}>
            {titles[view]}
          </Text>
          <View style={styles.backBtn} />
        </View>
      </View>
    );
  }

  // ── Tela: Livros (raiz, com tabs de testamento e marcados) ────────────────────
  if (view === "livros") {
    const tabs: { key: TestamentTab; label: string; icon?: AppIconName }[] = [
      { key: "antigoTestamento", label: "Antigo" },
      { key: "novoTestamento", label: "Novo" },
      { key: "marcados", label: "Marcados", icon: "bookmark" },
    ];

    return (
      <View style={[styles.container, { backgroundColor: theme.appBackground }]}>
        <Header />

        <View style={[styles.tabBar, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                accessibilityRole="button"
                accessibilityLabel={tab.label}
                accessibilityState={{ selected: isActive }}
                style={[styles.tabButton, isActive && { backgroundColor: theme.accent }]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text
                  allowFontScaling
                  numberOfLines={1}
                  style={[
                    styles.tabLabel,
                    { color: isActive ? "#FFFFFF" : theme.mutedText, fontWeight: isActive ? "700" : "600" },
                  ]}
                >
                  {tab.icon ? (
                    <AppIcon name={tab.icon} size={12} color={isActive ? "#FFFFFF" : theme.mutedText} />
                  ) : null}
                  {tab.icon ? "  " : ""}
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {activeTab === "marcados" ? (
          bookmarks.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text allowFontScaling style={[styles.emptyText, { color: theme.mutedText }]}>
                Você ainda não marcou nenhum versículo. Numa leitura, selecione um ou mais versículos e toque em "Marcar".
              </Text>
            </View>
          ) : (
            <FlatList
              key="list-marcados"
              data={[...bookmarks].sort((a, b) =>
                a.livro !== b.livro
                  ? a.livro.localeCompare(b.livro)
                  : a.capitulo !== b.capitulo
                  ? a.capitulo - b.capitulo
                  : a.versiculo - b.versiculo,
              )}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <Pressable
                  accessibilityRole="button"
                  style={[styles.row, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                  onPress={() => openBookmark(item)}
                >
                  <View style={[styles.rowAccent, { backgroundColor: theme.accent }]} />
                  <View style={styles.rowBody}>
                    <Text allowFontScaling style={[styles.rowTitle, { color: theme.titleText, fontSize: 15 * fs }]}>
                      {item.livro} {item.capitulo},{item.versiculo}
                    </Text>
                    <Text
                      allowFontScaling
                      numberOfLines={2}
                      style={[styles.rowSub, { color: theme.mutedText, fontSize: 12 * fs }]}
                    >
                      {item.texto}
                    </Text>
                    {item.comentario ? (
                      <Text
                        allowFontScaling
                        numberOfLines={1}
                        style={[styles.rowComment, { color: theme.accent, fontSize: 12 * fs }]}
                      >
                        <AppIcon name="comment" size={12} color={theme.accent} />{" "}{item.comentario}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={[styles.chevron, { color: theme.mutedText }]}>{"›"}</Text>
                </Pressable>
              )}
            />
          )
        ) : (
          <FlatList
            key="list-livros"
            data={books}
            keyExtractor={(item) => item.nome}
            contentContainerStyle={styles.listContent}
            renderItem={({ item, index }) => {
              const isGospel = testament === "novoTestamento" && GOSPEL_BOOKS.includes(item.nome);
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={isGospel ? `${item.nome}, Evangelho` : item.nome}
                  style={[
                    styles.row,
                    { backgroundColor: theme.cardBackground, borderColor: theme.border },
                    isGospel && {
                      borderColor: theme.accent,
                      borderWidth: 2,
                      backgroundColor: `${theme.accent}12`,
                    },
                  ]}
                  onPress={() => selectBook(item)}
                >
                  <View style={[styles.rowIndex, { backgroundColor: theme.accent }]}>
                    {isGospel ? (
                      <AppIcon name="cross" size={15} color="#FFFFFF" />
                    ) : (
                      <Text style={styles.rowIndexText}>{index + 1}</Text>
                    )}
                  </View>
                  <View style={styles.rowBody}>
                    <View style={styles.rowTitleLine}>
                      <Text
                        allowFontScaling
                        style={[styles.rowTitle, { color: theme.titleText, fontSize: 15 * fs }]}
                      >
                        {item.nome}
                      </Text>
                      {isGospel ? (
                        <View style={[styles.gospelBadge, { backgroundColor: theme.accent }]}>
                          <Text allowFontScaling style={styles.gospelBadgeText}>
                            Evangelho
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text allowFontScaling style={[styles.rowSub, { color: theme.mutedText, fontSize: 12 * fs }]}>
                      {item.capitulos.length} {item.capitulos.length === 1 ? "capítulo" : "capítulos"}
                    </Text>
                  </View>
                  <Text style={[styles.chevron, { color: theme.mutedText }]}>{"›"}</Text>
                </Pressable>
              );
            }}
          />
        )}
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
          renderItem={({ item }) => {
            const isMarked = book ? bookmarkedIds.has(bookmarkId(testament, book.nome, chapter.capitulo, item.versiculo)) : false;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Versículo ${item.versiculo}${isMarked ? ", marcado" : ""}`}
                style={[styles.chapterCell, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                onPress={() => selectVerse(item.versiculo)}
              >
                <Text allowFontScaling style={[styles.chapterNumber, { color: theme.titleText, fontSize: 16 * fs }]}>
                  {item.versiculo}
                </Text>
                {isMarked ? <View style={[styles.gridMarkedDot, { backgroundColor: theme.accent }]} /> : null}
              </Pressable>
            );
          }}
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
          renderItem={({ item }) => {
            const isSelected = selectedVerses.has(item.versiculo);
            const isMarked = book ? bookmarkedIds.has(bookmarkId(testament, book.nome, chapter.capitulo, item.versiculo)) : false;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Versículo ${item.versiculo}${isSelected ? ", selecionado" : ""}`}
                onPress={() => toggleVerseSelection(item.versiculo)}
                style={[styles.verseRow, isSelected && { backgroundColor: `${theme.accent}22` }]}
              >
                <View style={styles.verseNumberCol}>
                  <Text style={[styles.verseNumber, { color: theme.accent, fontSize: 12 * fs }]}>
                    {item.versiculo}
                  </Text>
                  {isMarked ? <View style={[styles.verseMarkedDot, { backgroundColor: theme.accent }]} /> : null}
                </View>
                <Text
                  allowFontScaling
                  style={[styles.verseText, { color: theme.bodyText, fontSize: 15 * fs, lineHeight: 24 * fs }]}
                >
                  {item.texto}
                </Text>
              </Pressable>
            );
          }}
          ItemSeparatorComponent={() => <View style={[styles.verseSeparator, { backgroundColor: theme.border }]} />}
        />

        {selectedVerses.size > 0 ? (
          <View style={[styles.actionBar, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Copiar versículos selecionados"
              style={styles.actionButton}
              onPress={() => void handleCopy()}
            >
              <AppIcon name="copy" size={20} color={theme.titleText} />
              <Text allowFontScaling style={[styles.actionLabel, { color: theme.titleText }]}>Copiar</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Compartilhar versículos selecionados"
              style={styles.actionButton}
              onPress={() => void handleShare()}
            >
              <AppIcon name="share" size={20} color={theme.titleText} />
              <Text allowFontScaling style={[styles.actionLabel, { color: theme.titleText }]}>Compartilhar</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Marcar versículos selecionados"
              style={styles.actionButton}
              onPress={openMarkModal}
            >
              <AppIcon name="bookmark" size={20} color={theme.titleText} />
              <Text allowFontScaling style={[styles.actionLabel, { color: theme.titleText }]}>Marcar</Text>
            </Pressable>
          </View>
        ) : null}

        <Modal
          visible={markModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setMarkModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { backgroundColor: theme.cardBackground }]}>
              <Text allowFontScaling style={[styles.modalTitle, { color: theme.titleText }]}>
                {selectedVerses.size > 1 ? "Marcar versículos" : "Marcar versículo"}
              </Text>
              <TextInput
                accessibilityLabel="Comentário pessoal"
                placeholder="Escreva um comentário pessoal (opcional)"
                placeholderTextColor={theme.mutedText}
                value={markComment}
                onChangeText={setMarkComment}
                multiline
                style={[styles.modalInput, { color: theme.titleText, borderColor: theme.border }]}
              />
              <View style={styles.modalActions}>
                <Pressable
                  accessibilityRole="button"
                  style={styles.modalCancelBtn}
                  onPress={() => setMarkModalVisible(false)}
                >
                  <Text allowFontScaling style={[styles.modalCancelText, { color: theme.mutedText }]}>
                    Cancelar
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  style={[styles.modalSaveBtn, { backgroundColor: theme.accent }]}
                  onPress={() => void handleSaveMark()}
                >
                  <Text allowFontScaling style={styles.modalSaveText}>Salvar</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // ── Tela: Marcado (detalhe + comentário) ───────────────────────────────────────
  if (view === "marcado" && activeBookmark) {
    return (
      <View style={[styles.container, { backgroundColor: theme.appBackground }]}>
        <Header />
        <ScrollView contentContainerStyle={styles.markedDetailContent}>
          <View style={[styles.markedCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <Text allowFontScaling style={[styles.markedRef, { color: theme.accent, fontSize: 13 * fs }]}>
              {activeBookmark.livro} {activeBookmark.capitulo},{activeBookmark.versiculo}
            </Text>
            <Text
              allowFontScaling
              style={[styles.markedText, { color: theme.bodyText, fontSize: 16 * fs, lineHeight: 26 * fs }]}
            >
              {activeBookmark.texto}
            </Text>
          </View>

          <Text allowFontScaling style={[styles.sectionLabel, { color: theme.mutedText }]}>
            Comentário pessoal
          </Text>
          <TextInput
            accessibilityLabel="Comentário pessoal sobre o versículo"
            placeholder="Escreva um comentário pessoal (opcional)"
            placeholderTextColor={theme.mutedText}
            value={commentDraft}
            onChangeText={setCommentDraft}
            multiline
            style={[
              styles.commentInput,
              { color: theme.titleText, borderColor: theme.border, backgroundColor: theme.cardBackground },
            ]}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Salvar comentário"
            style={[styles.saveCommentBtn, { backgroundColor: theme.accent }]}
            onPress={() => void handleSaveComment()}
          >
            <Text allowFontScaling style={styles.saveCommentText}>Salvar comentário</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Remover marcação"
            style={styles.removeBookmarkBtn}
            onPress={handleRemoveBookmark}
          >
            <Text allowFontScaling style={styles.removeBookmarkText}>Remover marcação</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerArea: {
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backBtn: { width: 40, alignItems: "center" },
  backText: { fontSize: 28, fontWeight: "700", lineHeight: 32 },
  headerLogo: { width: 30, height: 30, borderRadius: 8 },
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
  rowTitleLine: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6 },
  rowTitle: { fontWeight: "600" },
  gospelBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  gospelBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  rowSub: { marginTop: 2 },
  rowComment: { marginTop: 4, fontStyle: "italic" },
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
  gridMarkedDot: { width: 5, height: 5, borderRadius: 2.5, marginTop: 4 },
  versesContent: { paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 90 },
  verseRow: { flexDirection: "row", paddingVertical: 8, paddingHorizontal: 6, gap: 10, borderRadius: 8 },
  verseNumberCol: { width: 28, alignItems: "center", paddingTop: 2 },
  verseNumber: { fontWeight: "700", textAlign: "center" },
  verseMarkedDot: { width: 5, height: 5, borderRadius: 2.5, marginTop: 3 },
  verseText: { flex: 1 },
  verseSeparator: { height: 1, marginHorizontal: 38 },
  emptyBox: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  tabBar: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    margin: 12,
    marginBottom: 4,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  tabLabel: { fontSize: 12, textAlign: "center" },
  actionBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    borderTopWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  actionButton: { flex: 1, alignItems: "center", justifyContent: "center", gap: 2 },
  actionLabel: { fontSize: 12, fontWeight: "600" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    borderRadius: 16,
    padding: 18,
  },
  modalTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  modalInput: {
    minHeight: 90,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    textAlignVertical: "top",
  },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", marginTop: 14, gap: 12 },
  modalCancelBtn: { minHeight: 40, justifyContent: "center", paddingHorizontal: 12 },
  modalCancelText: { fontWeight: "600" },
  modalSaveBtn: { minHeight: 40, borderRadius: 8, justifyContent: "center", paddingHorizontal: 18 },
  modalSaveText: { color: "#FFFFFF", fontWeight: "700" },
  markedDetailContent: { padding: 14, paddingBottom: 28 },
  markedCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 18 },
  markedRef: { fontWeight: "700", marginBottom: 8 },
  markedText: {},
  commentInput: {
    minHeight: 100,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    textAlignVertical: "top",
  },
  saveCommentBtn: {
    marginTop: 12,
    minHeight: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  saveCommentText: { color: "#FFFFFF", fontWeight: "700" },
  removeBookmarkBtn: {
    marginTop: 12,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#C62828",
    alignItems: "center",
    justifyContent: "center",
  },
  removeBookmarkText: { color: "#C62828", fontWeight: "700" },
});
