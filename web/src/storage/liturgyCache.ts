import type { CachedDailyLiturgy, DailyLiturgyPayload } from "../types/liturgy";
import { idbGet, idbPut, LITURGY_STORE } from "./idb";

interface LiturgyRow {
  date: string;
  payload: DailyLiturgyPayload;
  updatedAt: string;
}

export async function saveDailyCache(date: string, payload: DailyLiturgyPayload): Promise<void> {
  const row: LiturgyRow = { date, payload, updatedAt: new Date().toISOString() };
  await idbPut(LITURGY_STORE, row);
}

export async function getDailyCache(date: string): Promise<CachedDailyLiturgy | null> {
  const row = await idbGet<LiturgyRow>(LITURGY_STORE, date);
  return row ?? null;
}
