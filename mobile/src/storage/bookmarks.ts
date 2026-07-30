import AsyncStorage from "@react-native-async-storage/async-storage";
import type { VerseBookmark } from "../types/bookmark";

const STORAGE_KEY = "lumen:bible_bookmarks_v1";

export async function getBookmarks(): Promise<VerseBookmark[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as VerseBookmark[];
  } catch {
    return [];
  }
}

async function persist(bookmarks: VerseBookmark[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
}

export async function upsertBookmarks(entries: VerseBookmark[]): Promise<VerseBookmark[]> {
  const current = await getBookmarks();
  const byId = new Map(current.map((b) => [b.id, b]));
  for (const entry of entries) {
    byId.set(entry.id, entry);
  }
  const updated = Array.from(byId.values());
  await persist(updated);
  return updated;
}

export async function updateBookmarkComment(id: string, comentario: string): Promise<VerseBookmark[]> {
  const current = await getBookmarks();
  const updated = current.map((b) => (b.id === id ? { ...b, comentario } : b));
  await persist(updated);
  return updated;
}

export async function removeBookmark(id: string): Promise<VerseBookmark[]> {
  const current = await getBookmarks();
  const updated = current.filter((b) => b.id !== id);
  await persist(updated);
  return updated;
}
