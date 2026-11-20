import type { DailyLiturgyPayload } from "../types/liturgy";
import { fetchDailyLiturgy } from "./api";
import { getDailyCache, saveDailyCache } from "../storage/liturgyCache";

export interface LiturgyResult {
  payload: DailyLiturgyPayload;
  offline: boolean;
}

// Tenta a rede e grava no cache; se falhar, usa o cache local; sem cache, propaga o erro de rede.
export async function loadLiturgy(date: string): Promise<LiturgyResult> {
  try {
    const payload = await fetchDailyLiturgy(date);
    await saveDailyCache(date, payload);
    return { payload, offline: false };
  } catch (networkError) {
    const cached = await getDailyCache(date);
    if (cached) return { payload: cached.payload, offline: true };
    throw networkError;
  }
}
