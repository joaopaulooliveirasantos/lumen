import * as SQLite from "expo-sqlite";
import type { CachedDailyLiturgy, DailyLiturgyPayload } from "../types/liturgy";

const dbPromise = SQLite.openDatabaseAsync("lumen.db");

export async function initCache(): Promise<void> {
  const db = await dbPromise;
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS liturgy_cache (
      date TEXT PRIMARY KEY NOT NULL,
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

export async function saveDailyCache(date: string, payload: DailyLiturgyPayload): Promise<void> {
  const db = await dbPromise;
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO liturgy_cache (date, payload, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       payload=excluded.payload,
       updated_at=excluded.updated_at`,
    [date, JSON.stringify(payload), now],
  );
}

export async function getDailyCache(date: string): Promise<CachedDailyLiturgy | null> {
  const db = await dbPromise;
  const row = (await db.getFirstAsync(
    `SELECT date, payload, updated_at FROM liturgy_cache WHERE date = ?`,
    [date],
  )) as { date: string; payload: string; updated_at: string } | null;

  if (!row) {
    return null;
  }

  return {
    date: row.date,
    payload: JSON.parse(row.payload) as DailyLiturgyPayload,
    updatedAt: row.updated_at,
  };
}
