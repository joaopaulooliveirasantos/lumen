import { kv } from "./kv";

const STORAGE_KEY = "lumen:rosary_days_v1";

export async function markRosaryAsPrayed(isoDate: string): Promise<string[]> {
  const days = await getRosaryDays();
  if (days.includes(isoDate)) return days;
  const updated = [...days, isoDate];
  await kv.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export async function getRosaryDays(): Promise<string[]> {
  try {
    const raw = await kv.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}
