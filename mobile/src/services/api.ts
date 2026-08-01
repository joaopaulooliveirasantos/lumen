import Constants from "expo-constants";
import type { DailyLiturgyPayload, SaintOfDayPayload } from "../types/liturgy";

function getApiBaseUrl(): string {
  const extra = Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined;
  return extra?.apiBaseUrl ?? "http://localhost:3333";
}

export async function fetchDailyLiturgy(isoDate: string): Promise<DailyLiturgyPayload> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/liturgia?date=${isoDate}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Falha de rede (${response.status})`);
  }

  return (await response.json()) as DailyLiturgyPayload;
}

export async function fetchSaintOfDay(isoDate: string): Promise<SaintOfDayPayload> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/liturgia?date=${isoDate}&type=saint`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Falha de rede (${response.status})`);
  }

  return (await response.json()) as SaintOfDayPayload;
}
