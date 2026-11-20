import { kv } from "./kv";

const STORAGE_KEY = "lumen:read_days_v1";

export async function markDayAsRead(isoDate: string): Promise<string[]> {
  const days = await getReadDays();
  if (days.includes(isoDate)) return days;
  const updated = [...days, isoDate];
  await kv.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export async function getReadDays(): Promise<string[]> {
  try {
    const raw = await kv.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}
