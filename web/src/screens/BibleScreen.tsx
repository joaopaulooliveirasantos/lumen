// Bíblia: livros (Antigo/Novo/Marcados), capítulos, versículos, leitura com seleção (copiar,
// compartilhar, marcar com comentário) e detalhe do versículo marcado. As grades usam só o índice
// da tradução (services/bible.ts); o texto do livro é baixado da VPS na leitura e fica em cache.
import { useEffect, useMemo, useState } from "preact/hooks";
import { Icon } from "../components/Icon";
import { FontScaleControls, PageHeader } from "../components/PageHeader";
import { Sheet } from "../components/Sheet";
import { Alert, Button, Card, EmptyState, Spinner } from "../components/ui";
import { BOOK_SECTIONS, bookAbbreviation, bookNumber } from "../data/bibleBooks";
import { bibleTranslations } from "../data/bibleTranslations";
import { copyText, shareImage } from "../native/share";
import { formatVerseList, renderVerseImage } from "../services/verseImage";
import { BibleUnavailableError, getBibleIndex, loadBibleBook, type BibleIndexBook, type Testament } from "../services/bible";
import { useAppState } from "../state/AppState";
import { getBookmarks, removeBookmark, updateBookmarkComment, upsertBookmarks } from "../storage/bookmarks";
import type { BibleBook } from "../types/bible";
import type { VerseBookmark } from "../types/bookmark";

type View = "livros" | "capitulos" | "versiculos" | "leitura" | "marcado";
type Tab = Testament | "marcados";

const bookmarkId = (t: Testament, livro: string, cap: number, v: number) => `${t}:${livro}:${cap}:${v}`;

export function BibleScreen() {
  const { settings, bibleTarget, clearBibleTarget, notify } = useAppState();
  const translation = settings.bibleTranslation;
  const [view, setView] = useState<View>("livros");
  const [tab, setTab] = useState<Tab>("antigoTestamento");
  const [books, setBooks] = useState<BibleIndexBook[] | null>(null);
  const [indexError, setIndexError] = useState<string | null>(null);
  const [indexAttempt, setIndexAttempt] = useState(0);
  const [book, setBook] = useState<BibleIndexBook | null>(null);
  const [chapter, setChapter] = useState<number | null>(null);
  const [startVerse, setStartVerse] = useState<number | null>(null);
  const [bookmarks, setBookmarks] = useState<VerseBookmark[]>([]);
  const [activeBookmark, setActiveBookmark] = useState<VerseBookmark | null>(null);

  useEffect(() => {
    void getBookmarks().then(setBookmarks);
  }, []);

  useEffect(() => {
    let active = true;
    setBooks(null);
    setIndexError(null);
    getBibleIndex(translation)
      .then((index) => active && setBooks(index.livros))
      .catch((e: unknown) => active && setIndexError(e instanceof BibleUnavailableError ? e.message : "Não foi possível carregar a Bíblia."));
    return () => {
      active = false;
    };
  }, [translation, indexAttempt]);

  // Abrir direto numa referência (vinda dos planos de leitura).
  useEffect(() => {
    if (!bibleTarget || !books) return;
    const found = books.find((b) => b.nome === bibleTarget.livro);
    if (found && bibleTarget.capitulo <= found.versiculosPorCapitulo.length) {
      setTab(found.testamento);
      setBook(found);
      setChapter(bibleTarget.capitulo);
      setStartVerse(bibleTarget.versiculoInicio ?? 1);
      setView("leitura");
    } else {
      notify(`${bibleTarget.livro} ${bibleTarget.capitulo} não existe nesta tradução.`);
    }
    clearBibleTarget();
  }, [bibleTarget, books]);

  const marked = useMemo(() => new Set(bookmarks.map((b) => b.id)), [bookmarks]);
  const translationName = bibleTranslations.find((t) => t.id === translation)?.nome ?? "";

  const back = () => {
    if (view === "leitura") setView("versiculos");
    else if (view === "versiculos") setView("capitulos");
    else if (view === "capitulos") setView("livros");
    else if (view === "marcado") setView("livros");
  };

  // ---- Leitura ----
  if (view === "leitura" && book && chapter !== null && startVerse !== null) {
    return (
      <Reading
        book={book}
        chapter={chapter}
        startVerse={startVerse}
        marked={marked}
        onBack={back}
        onChangeChapter={(c) => {
          setChapter(c);
          setStartVerse(1);
        }}
        onBookmarksChange={setBookmarks}
        bookmarks={bookmarks}
      />
    );
  }

  // ---- Versículo marcado ----
  if (view === "marcado" && activeBookmark) {
    return (
      <BookmarkDetail
        bookmark={activeBookmark}
        onBack={back}
        onChange={(list, updated) => {
          setBookmarks(list);
          if (updated) setActiveBookmark(updated);
          else setView("livros");
        }}
        onOpen={() => {
          const found = books?.find((b) => b.nome === activeBookmark.livro);
          if (!found) return;
          setTab(found.testamento);
          setBook(found);
          setChapter(activeBookmark.capitulo);
          setStartVerse(activeBookmark.versiculo);
          setView("leitura");
        }}
      />
    );
  }

  // ---- Capítulos ----
  if (view === "capitulos" && book) {
    return (
      <section class="screen">
        <PageHeader title={book.nome} onBack={back} />
        <div class="num-grid">
          {book.versiculosPorCapitulo.map((count, i) => (
            <button key={i} type="button" class="num-cell" aria-label={`Capítulo ${i + 1}`} onClick={() => (setChapter(i + 1), setView("versiculos"))}>
              <span class="num-cell-main">{i + 1}</span>
              <span class="num-cell-sub">{count}v</span>
            </button>
          ))}
        </div>
      </section>
    );
  }

  // ---- Versículos ----
  if (view === "versiculos" && book && chapter !== null) {
    const count = book.versiculosPorCapitulo[chapter - 1] ?? 0;
    return (
      <section class="screen">
        <PageHeader title={`${book.nome} — Cap. ${chapter}`} onBack={back} />
        <Button variant="secondary" icon="book" onClick={() => (setStartVerse(1), setView("leitura"))}>
          Ler o capítulo inteiro
        </Button>
        <div class="num-grid">
          {Array.from({ length: count }, (_, i) => i + 1).map((v) => {
            const isMarked = marked.has(bookmarkId(book.testamento, book.nome, chapter, v));
            return (
              <button key={v} type="button" class="num-cell" aria-label={`Versículo ${v}${isMarked ? ", marcado" : ""}`} onClick={() => (setStartVerse(v), setView("leitura"))}>
                <span class="num-cell-main">{v}</span>
                {isMarked ? <span class="marked-dot" /> : null}
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  // ---- Livros (raiz) ----
  const sorted = [...bookmarks].sort((a, b) => (a.livro !== b.livro ? a.livro.localeCompare(b.livro) : a.capitulo !== b.capitulo ? a.capitulo - b.capitulo : a.versiculo - b.versiculo));
  return (
    <section class="screen">
      <PageHeader title={translationName ? `Bíblia - ${translationName}` : "Bíblia"} />
      <div class="segmented" role="tablist">
        {(
          [
            ["antigoTestamento", "Antigo"],
            ["novoTestamento", "Novo"],
            ["marcados", "Marcados"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button key={key} type="button" role="tab" aria-selected={tab === key} class={tab === key ? "segmented-item segmented-active" : "segmented-item"} onClick={() => setTab(key)}>
            {key === "marcados" ? <Icon name="bookmark" size={12} /> : null} {label}
          </button>
        ))}
      </div>

      {tab === "marcados" ? (
        sorted.length === 0 ? (
          <Card>
            <EmptyState icon="bookmark" title="Nenhum versículo marcado">
              Numa leitura, toque em um ou mais versículos e escolha “Marcar”.
            </EmptyState>
          </Card>
        ) : (
          <div class="list">
            {sorted.map((b) => (
              <button key={b.id} type="button" class="list-row" onClick={() => (setActiveBookmark(b), setView("marcado"))}>
                <span class="list-row-body">
                  <span class="list-row-title">
                    {b.livro} {b.capitulo},{b.versiculo}
                  </span>
                  <span class="list-row-subtitle clamp-2">{b.texto}</span>
                  {b.comentario ? (
                    <span class="bookmark-comment">
                      <Icon name="comment" size={12} /> {b.comentario}
                    </span>
                  ) : null}
                </span>
                <Icon name="chevronRight" size={18} class="list-row-chevron" />
              </button>
            ))}
          </div>
        )
      ) : indexError ? (
        <Alert tone="error" title="Bíblia indisponível" action={<Button variant="secondary" onClick={() => setIndexAttempt((n) => n + 1)}>Tentar novamente</Button>}>
          {indexError}
        </Alert>
      ) : !books ? (
        <div class="row" style={{ justifyContent: "center", padding: "32px 0" }}>
          <Spinner label="Carregando livros" />
        </div>
      ) : (
        <BookBrowser books={books} testament={tab} onOpen={(b) => (setBook(b), setView("capitulos"))} />
      )}
    </section>
  );
}

// ---- Navegação pelos livros: seções com cor, sigla em cada botão e busca ---------------------------

function sectionStyle(tone: string): Record<string, string> {
  return { "--tone": `rgb(${tone})`, "--tone-soft": `rgba(${tone}, 0.14)` };
}

const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function BookButton({ book, tone, onOpen }: { book: BibleIndexBook; tone: string; onOpen: (b: BibleIndexBook) => void }) {
  const abbr = bookAbbreviation(book.slug);
  const chapters = book.versiculosPorCapitulo.length;
  return (
    <button type="button" class="book-cell" style={sectionStyle(tone)} aria-label={`${book.nome}${abbr ? ` (${abbr})` : ""}, ${chapters} capítulos`} onClick={() => onOpen(book)}>
      <span class="book-abbr">{abbr ?? book.nome.slice(0, 2)}</span>
      <span class="book-name">{book.nome}</span>
      <span class="book-chapters">
        {chapters} {chapters === 1 ? "capítulo" : "capítulos"}
      </span>
    </button>
  );
}

export function BookBrowser({ books, testament, onOpen }: { books: BibleIndexBook[]; testament: Testament; onOpen: (b: BibleIndexBook) => void }) {
  const [query, setQuery] = useState("");
  const q = normalize(query.trim());
  const bySlugNumber = new Map(books.map((b) => [bookNumber(b.slug), b]));
  const toneOf = (b: BibleIndexBook) => BOOK_SECTIONS.find((s) => s.livros.includes(bookNumber(b.slug) ?? -1))?.tone ?? "46, 125, 50";

  // A busca vale para a Bíblia toda (nome ou sigla), não só para o testamento da aba.
  const results = q ? books.filter((b) => normalize(b.nome).includes(q) || normalize(bookAbbreviation(b.slug) ?? "") === q.replace(/\s+/g, "")) : [];
  const sections = BOOK_SECTIONS.map((s) => ({ ...s, books: s.livros.map((n) => bySlugNumber.get(n)).filter((b): b is BibleIndexBook => !!b && b.testamento === testament) })).filter(
    (s) => s.books.length > 0,
  );
  // Livros fora do padrão de slug (não deveria acontecer) aparecem no fim, sem seção.
  const loose = books.filter((b) => b.testamento === testament && bookNumber(b.slug) === null);

  return (
    <>
      <div class="prayer-search">
        <Icon name="search" size={18} class="prayer-search-icon" />
        <input
          type="search"
          class="prayer-search-input"
          placeholder="Buscar livro ou sigla (ex.: Jo, Salmos)"
          aria-label="Buscar livro"
          value={query}
          onInput={(e) => setQuery((e.currentTarget as HTMLInputElement).value)}
        />
        {query ? (
          <button type="button" class="prayer-search-clear" aria-label="Limpar busca" onClick={() => setQuery("")}>
            <Icon name="close" size={16} />
          </button>
        ) : null}
      </div>

      {q ? (
        results.length ? (
          <div class="book-grid">
            {results.map((b) => (
              <BookButton key={b.slug} book={b} tone={toneOf(b)} onOpen={onOpen} />
            ))}
          </div>
        ) : (
          <p class="muted prayer-empty">Nenhum livro encontrado para “{query.trim()}”.</p>
        )
      ) : (
        <>
          {sections.map((s) => (
            <div key={s.id} class="stack" style={sectionStyle(s.tone)}>
              <div class="prayer-section-head">
                <span class="prayer-section-icon">
                  <Icon name={s.icon} size={16} />
                </span>
                <h2 class="prayer-section-title">{s.nome}</h2>
                <span class="prayer-section-count">{s.books.length}</span>
              </div>
              <div class="book-grid">
                {s.books.map((b) => (
                  <BookButton key={b.slug} book={b} tone={s.tone} onOpen={onOpen} />
                ))}
              </div>
            </div>
          ))}
          {loose.length ? (
            <div class="book-grid">
              {loose.map((b) => (
                <BookButton key={b.slug} book={b} tone="46, 125, 50" onOpen={onOpen} />
              ))}
            </div>
          ) : null}
        </>
      )}
    </>
  );
}

// ---- Leitura do capítulo -------------------------------------------------------------------------

type ReadingProps = {
  book: BibleIndexBook;
  chapter: number;
  startVerse: number;
  marked: Set<string>;
  bookmarks: VerseBookmark[];
  onBack: () => void;
  onChangeChapter: (chapter: number) => void;
  onBookmarksChange: (list: VerseBookmark[]) => void;
};

function Reading({ book, chapter, startVerse, marked, bookmarks, onBack, onChangeChapter, onBookmarksChange }: ReadingProps) {
  const { settings, notify } = useAppState();
  const [text, setText] = useState<BibleBook | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [markSheet, setMarkSheet] = useState(false);
  const [comment, setComment] = useState("");

  useEffect(() => {
    let active = true;
    setError(null);
    loadBibleBook(settings.bibleTranslation, book.nome)
      .then((b) => {
        if (!active) return;
        if (b) setText(b);
        else setError("Livro não encontrado nesta tradução.");
      })
      .catch((e: unknown) => active && setError(e instanceof BibleUnavailableError ? e.message : "Não foi possível carregar o livro."));
    return () => {
      active = false;
    };
  }, [book.nome, settings.bibleTranslation, attempt]);

  useEffect(() => {
    setSelected(new Set());
    document.querySelector(".app-content")?.scrollTo({ top: 0 });
  }, [chapter, startVerse]);

  const verses = text?.capitulos.find((c) => c.capitulo === chapter)?.versiculos.filter((v) => v.versiculo >= startVerse) ?? [];
  const chosen = verses.filter((v) => selected.has(v.versiculo));

  const selectionText = () => {
    if (chosen.length === 0) return "";
    const nums = chosen.map((v) => v.versiculo);
    const range = nums.length > 1 ? `${nums[0]}-${nums[nums.length - 1]}` : `${nums[0]}`;
    return `${book.nome} ${chapter},${range}\n${chosen.map((v) => `${v.versiculo}. ${v.texto}`).join(" ")}`;
  };

  // Compartilha os versículos escolhidos como imagem (services/verseImage.ts).
  const [sharing, setSharing] = useState(false);
  async function shareSelection() {
    if (chosen.length === 0 || sharing) return;
    setSharing(true);
    try {
      const abbreviation = bookAbbreviation(book.slug) ?? book.nome;
      const translation = bibleTranslations.find((t) => t.id === settings.bibleTranslation)?.nome;
      const blob = await renderVerseImage({ verses: chosen, abbreviation, bookName: book.nome, chapter, translation });
      const slug = `${abbreviation}-${chapter}-${formatVerseList(chosen.map((v) => v.versiculo))}`
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^\w-]+/g, "-")
        .toLowerCase();
      const result = await shareImage(blob, `lumen-${slug}.jpg`, `${book.nome} ${chapter}`);
      if (result === "downloaded") notify("Imagem salva.");
    } catch {
      notify("Não foi possível gerar a imagem.");
    } finally {
      setSharing(false);
    }
  }

  const toggle = (v: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });

  async function saveMark() {
    const now = new Date().toISOString();
    const updated = await upsertBookmarks(
      chosen.map((v) => ({
        id: bookmarkId(book.testamento, book.nome, chapter, v.versiculo),
        testamento: book.testamento,
        livro: book.nome,
        capitulo: chapter,
        versiculo: v.versiculo,
        texto: v.texto,
        comentario: comment.trim(),
        criadoEm: now,
      })),
    );
    onBookmarksChange(updated);
    setMarkSheet(false);
    setSelected(new Set());
    notify(chosen.length > 1 ? "Versículos marcados." : "Versículo marcado.");
  }

  const chapters = book.versiculosPorCapitulo.length;

  return (
    <section class="screen bible-reading">
      <PageHeader title={`${book.nome} ${chapter}${startVerse > 1 ? `,${startVerse}` : ""}`} onBack={onBack} action={<FontScaleControls />} />

      {error ? (
        <Alert tone="error" title="Texto indisponível" action={<Button variant="secondary" onClick={() => setAttempt((n) => n + 1)}>Tentar novamente</Button>}>
          {error} Em Configurações, você pode baixar a Bíblia para ler sem internet.
        </Alert>
      ) : !text ? (
        <div class="row" style={{ justifyContent: "center", padding: "32px 0" }}>
          <Spinner label="Carregando o livro" />
        </div>
      ) : (
        <Card class="verses">
          {verses.map((v) => {
            const isSelected = selected.has(v.versiculo);
            const isMarked = marked.has(bookmarkId(book.testamento, book.nome, chapter, v.versiculo));
            return (
              <button key={v.versiculo} type="button" class={isSelected ? "verse verse-selected" : "verse"} aria-pressed={isSelected} onClick={() => toggle(v.versiculo)}>
                <span class="verse-number">
                  {v.versiculo}
                  {isMarked ? <span class="marked-dot" /> : null}
                </span>
                <span class="verse-text">{v.texto}</span>
              </button>
            );
          })}
        </Card>
      )}

      {text ? (
        <div class="row chapter-nav">
          <Button variant="secondary" icon="chevronLeft" disabled={chapter <= 1} onClick={() => onChangeChapter(chapter - 1)}>
            Cap. {chapter - 1 || ""}
          </Button>
          <Button variant="secondary" disabled={chapter >= chapters} onClick={() => onChangeChapter(chapter + 1)}>
            Próximo capítulo
          </Button>
        </div>
      ) : null}

      {chosen.length > 0 ? (
        <div class="action-bar" role="toolbar" aria-label="Ações dos versículos selecionados">
          <span class="action-count">{chosen.length}</span>
          <button type="button" onClick={() => void copyText(selectionText()).then(() => notify("Texto copiado."), () => notify("Não foi possível copiar."))}>
            <Icon name="copy" size={20} />
            Copiar
          </button>
          <button type="button" disabled={sharing} aria-busy={sharing} onClick={() => void shareSelection()}>
            <Icon name="share" size={20} />
            Compartilhar
          </button>
          <button
            type="button"
            onClick={() => {
              const existing = chosen.map((v) => bookmarks.find((b) => b.id === bookmarkId(book.testamento, book.nome, chapter, v.versiculo))).find(Boolean);
              setComment(existing?.comentario ?? "");
              setMarkSheet(true);
            }}
          >
            <Icon name="bookmark" size={20} />
            Marcar
          </button>
        </div>
      ) : null}

      {markSheet ? (
        <Sheet title={chosen.length > 1 ? `Marcar ${chosen.length} versículos` : "Marcar versículo"} onClose={() => setMarkSheet(false)}>
          <textarea class="textarea" rows={4} placeholder="Escreva um comentário pessoal (opcional)" value={comment} onInput={(e) => setComment((e.currentTarget as HTMLTextAreaElement).value)} aria-label="Comentário pessoal" />
          <Button block icon="bookmark" onClick={() => void saveMark()}>
            Salvar
          </Button>
        </Sheet>
      ) : null}
    </section>
  );
}

// ---- Detalhe do versículo marcado ----------------------------------------------------------------

function BookmarkDetail(props: { bookmark: VerseBookmark; onBack: () => void; onOpen: () => void; onChange: (list: VerseBookmark[], updated: VerseBookmark | null) => void }) {
  const { notify } = useAppState();
  const b = props.bookmark;
  const [draft, setDraft] = useState(b.comentario);
  const [confirm, setConfirm] = useState(false);

  return (
    <section class="screen">
      <PageHeader title={`${b.livro} ${b.capitulo},${b.versiculo}`} onBack={props.onBack} />
      <Card>
        <p class="reading-kicker">
          {b.livro} {b.capitulo},{b.versiculo}
        </p>
        <p class="reading-text" style={{ marginTop: "6px" }}>
          {b.texto}
        </p>
        <Button variant="ghost" icon="book" onClick={props.onOpen}>
          Abrir no capítulo
        </Button>
      </Card>
      <label class="field-label" for="bookmark-comment">
        Comentário pessoal
      </label>
      <textarea id="bookmark-comment" class="textarea" rows={5} placeholder="Escreva um comentário pessoal (opcional)" value={draft} onInput={(e) => setDraft((e.currentTarget as HTMLTextAreaElement).value)} />
      <Button
        block
        disabled={draft.trim() === b.comentario}
        onClick={async () => {
          const list = await updateBookmarkComment(b.id, draft.trim());
          props.onChange(list, { ...b, comentario: draft.trim() });
          notify("Comentário salvo.");
        }}
      >
        Salvar comentário
      </Button>
      {confirm ? (
        <Alert
          tone="error"
          title="Remover este versículo dos marcados?"
          action={
            <div class="row">
              <Button variant="danger" icon="trash" onClick={async () => props.onChange(await removeBookmark(b.id), null)}>
                Remover
              </Button>
              <Button variant="ghost" onClick={() => setConfirm(false)}>
                Cancelar
              </Button>
            </div>
          }
        />
      ) : (
        <Button block variant="ghost" icon="trash" class="btn-danger-text" onClick={() => setConfirm(true)}>
          Remover marcação
        </Button>
      )}
    </section>
  );
}
