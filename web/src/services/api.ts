import type { DailyLiturgyPayload, SaintOfDayPayload, SaintStoryPayload } from "../types/liturgy";

// Em dev, "/api" é encaminhado pelo proxy do Vite; em produção (Capacitor) vem de VITE_API_BASE_URL.
function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL ?? "";
}

async function getJson<T>(query: string): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}/api/liturgia?${query}`);
  if (!response.ok) {
    throw new Error(`Falha de rede (${response.status})`);
  }
  return (await response.json()) as T;
}

export function fetchDailyLiturgy(isoDate: string): Promise<DailyLiturgyPayload> {
  return getJson<DailyLiturgyPayload>(`date=${isoDate}`);
}

export function fetchSaintOfDay(isoDate: string): Promise<SaintOfDayPayload> {
  return getJson<SaintOfDayPayload>(`date=${isoDate}&type=saint`);
}

export async function fetchSaintStory(isoDate: string): Promise<SaintStoryPayload> {
  const payload = await getJson<Partial<SaintStoryPayload>>(`date=${isoDate}&type=saint-story`);
  if (!payload.nome || !Array.isArray(payload.paragrafos) || payload.paragrafos.length === 0) {
    throw new Error("Resposta invalida do servidor para a historia do santo do dia.");
  }
  return payload as SaintStoryPayload;
}
