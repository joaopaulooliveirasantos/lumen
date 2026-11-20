// Bíblias servidas pela VPS como arquivos estáticos (gerados por scripts/bible/build-bible-assets.mjs),
// com cache em IndexedDB. Fluxo: manifest.json (versão atual de cada tradução) -> index.json da versão
// -> um arquivo por livro, baixado sob demanda. As URLs de índice e livros carregam a versão, então
// um arquivo em cache nunca fica desatualizado; só o manifesto é consultado de novo (uma vez por sessão).
import type { BibleBook } from "../types/bible";
import type { BibleTranslationId } from "../types/settings";
import { BIBLE_STORE, idbDeleteWithPrefix, idbGet, idbKeysWithPrefix, idbPut } from "../storage/idb";
import { kv } from "../storage/kv";

export type Testament = "antigoTestamento" | "novoTestamento";

export interface BibleManifestEntry {
  id: BibleTranslationId;
  nome: string;
  editora: string;
  versao: string;
  livros: number;
}

export interface BibleManifest {
  schema: number;
  geradoEm: string;
  traducoes: BibleManifestEntry[];
}

export interface BibleIndexBook {
  slug: string;
  nome: string;
  testamento: Testament;
  versiculosPorCapitulo: number[];
  bytes: number;
}

export interface BibleIndex {
  schema: number;
  id: BibleTranslationId;
  versao: string;
  livros: BibleIndexBook[];
}

interface IndexRow {
  key: string;
  versao: string;
  versaoAnterior?: string;
  index: BibleIndex;
}

interface BookRow {
  key: string;
  book: BibleBook;
}

export class BibleUnavailableError extends Error {
  constructor(message = "Sem conexão e conteúdo ainda não baixado neste aparelho.") {
    super(message);
    this.name = "BibleUnavailableError";
  }
}

const MANIFEST_KV_KEY = "bible.manifest";
const FETCH_TIMEOUT_MS = 20_000;
const DOWNLOAD_CONCURRENCY = 4;

const indexKey = (id: BibleTranslationId) => `idx:${id}`;
const bookPrefix = (id: BibleTranslationId) => `book:${id}:`;
const bookVersionPrefix = (id: BibleTranslationId, versao: string) => `${bookPrefix(id)}${versao}:`;
const bookKey = (id: BibleTranslationId, versao: string, slug: string) => `${bookVersionPrefix(id, versao)}${slug}`;

function bibleBaseUrl(): string {
  return `${import.meta.env.VITE_API_BASE_URL ?? ""}/biblias`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Falha de rede (${response.status}) em ${url}`);
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

// ---- Manifesto -----------------------------------------------------------------------------------

let manifestPromise: Promise<BibleManifest | null> | null = null;
const indexMemo = new Map<BibleTranslationId, Promise<BibleIndex>>();

/** Manifesto da sessão: rede uma vez; sem rede, a última cópia salva; sem nenhuma, null. */
export function getBibleManifest(): Promise<BibleManifest | null> {
  if (!manifestPromise) {
    manifestPromise = (async () => {
      try {
        const manifest = await fetchJson<BibleManifest>(`${bibleBaseUrl()}/manifest.json`);
        await kv.setItem(MANIFEST_KV_KEY, JSON.stringify(manifest));
        return manifest;
      } catch {
        const saved = await kv.getItem(MANIFEST_KV_KEY);
        // Sem rede: tenta o manifesto de novo na próxima chamada.
        manifestPromise = null;
        return saved ? (JSON.parse(saved) as BibleManifest) : null;
      }
    })();
  }
  return manifestPromise;
}

// ---- Índice --------------------------------------------------------------------------------------

async function fetchAndStoreIndex(id: BibleTranslationId, versao: string, cached?: IndexRow): Promise<BibleIndex> {
  const index = await fetchJson<BibleIndex>(`${bibleBaseUrl()}/${id}/${versao}/index.json`);
  const versaoAnterior = cached && cached.versao !== versao ? cached.versao : cached?.versaoAnterior;
  await idbPut<IndexRow>(BIBLE_STORE, { key: indexKey(id), versao, versaoAnterior, index });

  // Mantém só a versão nova e a anterior (contingência offline); o resto é lixo.
  const keep = new Set([versao, versaoAnterior].filter(Boolean) as string[]);
  const keys = await idbKeysWithPrefix(BIBLE_STORE, bookPrefix(id));
  const stale = new Set(keys.map((k) => k.slice(bookPrefix(id).length).split(":")[0]).filter((v) => !keep.has(v)));
  for (const v of stale) await idbDeleteWithPrefix(BIBLE_STORE, bookVersionPrefix(id, v));

  return index;
}

async function loadIndex(id: BibleTranslationId): Promise<BibleIndex> {
  const cached = await idbGet<IndexRow>(BIBLE_STORE, indexKey(id));
  const entry = (await getBibleManifest())?.traducoes.find((t) => t.id === id);

  if (cached && (!entry || cached.versao === entry.versao)) return cached.index;
  if (!entry) throw new BibleUnavailableError();

  try {
    return await fetchAndStoreIndex(id, entry.versao, cached);
  } catch (error) {
    if (cached) return cached.index;
    throw error instanceof BibleUnavailableError ? error : new BibleUnavailableError();
  }
}

/** Índice da tradução: livros, testamento e versículos por capítulo (sem os textos). */
export function getBibleIndex(id: BibleTranslationId): Promise<BibleIndex> {
  let promise = indexMemo.get(id);
  if (!promise) {
    promise = loadIndex(id);
    promise.catch(() => indexMemo.delete(id));
    indexMemo.set(id, promise);
  }
  return promise;
}

export async function listBibleBooks(id: BibleTranslationId, testamento?: Testament): Promise<BibleIndexBook[]> {
  const index = await getBibleIndex(id);
  return testamento ? index.livros.filter((b) => b.testamento === testamento) : index.livros;
}

// ---- Livros --------------------------------------------------------------------------------------

async function fetchAndStoreBook(id: BibleTranslationId, versao: string, slug: string): Promise<BibleBook> {
  const book = await fetchJson<BibleBook>(`${bibleBaseUrl()}/${id}/${versao}/${slug}.json`);
  await idbPut<BookRow>(BIBLE_STORE, { key: bookKey(id, versao, slug), book });
  return book;
}

/**
 * Carrega um livro pelo nome (cache primeiro, depois rede). Retorna undefined se o livro não existir
 * na tradução. Compatível com `BibleBookLoader` de services/readingPlans.
 */
export async function loadBibleBook(id: BibleTranslationId, nome: string): Promise<BibleBook | undefined> {
  const index = await getBibleIndex(id);
  const meta = index.livros.find((b) => b.nome === nome);
  if (!meta) return undefined;

  const cached = await idbGet<BookRow>(BIBLE_STORE, bookKey(id, index.versao, meta.slug));
  if (cached) return cached.book;

  try {
    return await fetchAndStoreBook(id, index.versao, meta.slug);
  } catch {
    // Contingência: versão anterior do mesmo livro, se ainda estiver em cache.
    const row = await idbGet<IndexRow>(BIBLE_STORE, indexKey(id));
    if (row?.versaoAnterior) {
      const stale = await idbGet<BookRow>(BIBLE_STORE, bookKey(id, row.versaoAnterior, meta.slug));
      if (stale) return stale.book;
    }
    throw new BibleUnavailableError();
  }
}

// ---- Download completo ---------------------------------------------------------------------------

export interface BibleDownloadStatus {
  baixados: number;
  total: number;
  /** Tamanho dos livros sem compressão, em bytes. */
  bytesTotal: number;
}

export async function getBibleDownloadStatus(id: BibleTranslationId): Promise<BibleDownloadStatus> {
  const index = await getBibleIndex(id);
  const keys = new Set(await idbKeysWithPrefix(BIBLE_STORE, bookVersionPrefix(id, index.versao)));
  const baixados = index.livros.filter((b) => keys.has(bookKey(id, index.versao, b.slug))).length;
  const bytesTotal = index.livros.reduce((sum, b) => sum + b.bytes, 0);
  return { baixados, total: index.livros.length, bytesTotal };
}

/** Baixa todos os livros que faltam na versão atual. Para no primeiro erro de rede. */
export async function downloadBibleTranslation(
  id: BibleTranslationId,
  onProgress?: (status: { baixados: number; total: number }) => void,
  signal?: AbortSignal,
): Promise<void> {
  const index = await getBibleIndex(id);
  const have = new Set(await idbKeysWithPrefix(BIBLE_STORE, bookVersionPrefix(id, index.versao)));
  const pending = index.livros.filter((b) => !have.has(bookKey(id, index.versao, b.slug)));
  const total = index.livros.length;
  let baixados = total - pending.length;
  onProgress?.({ baixados, total });

  let next = 0;
  let failure: unknown = null;
  const worker = async () => {
    while (next < pending.length && !failure && !signal?.aborted) {
      const book = pending[next++];
      try {
        await fetchAndStoreBook(id, index.versao, book.slug);
        baixados++;
        onProgress?.({ baixados, total });
      } catch (error) {
        failure = error;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(DOWNLOAD_CONCURRENCY, pending.length) }, worker));

  if (signal?.aborted) throw new DOMException("Download cancelado", "AbortError");
  if (failure) throw new BibleUnavailableError("Falha ao baixar a tradução. Verifique a conexão e tente de novo.");
}

/** Remove os livros e o índice da tradução do aparelho. */
export async function clearBibleTranslation(id: BibleTranslationId): Promise<void> {
  await idbDeleteWithPrefix(BIBLE_STORE, bookPrefix(id));
  await idbDeleteWithPrefix(BIBLE_STORE, indexKey(id));
  indexMemo.delete(id);
}

/** Só para testes: esquece o estado em memória (manifesto e índices da sessão). */
export function resetBibleSession(): void {
  manifestPromise = null;
  indexMemo.clear();
}
