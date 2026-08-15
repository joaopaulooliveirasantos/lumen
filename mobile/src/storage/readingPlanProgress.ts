import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "lumen:reading_plan_progress_v1";

export interface ReadingPlanProgress {
  planoId: string;
  diasConcluidos: number[];
  iniciadoEm: string;
  concluidoEm?: string;
}

type ProgressMap = Record<string, ReadingPlanProgress>;

async function readMap(): Promise<ProgressMap> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as ProgressMap;
  } catch {
    return {};
  }
}

async function writeMap(map: ProgressMap): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export async function getAllReadingPlanProgress(): Promise<ProgressMap> {
  return readMap();
}

export async function markReadingPlanDayCompleted(
  planoId: string,
  dia: number,
  duracaoDias: number,
): Promise<ProgressMap> {
  const map = await readMap();
  const existing = map[planoId];
  const nowIso = new Date().toISOString();

  const diasConcluidos = existing ? [...existing.diasConcluidos] : [];
  if (!diasConcluidos.includes(dia)) {
    diasConcluidos.push(dia);
  }

  const updated: ReadingPlanProgress = {
    planoId,
    diasConcluidos,
    iniciadoEm: existing?.iniciadoEm ?? nowIso,
    concluidoEm: diasConcluidos.length >= duracaoDias ? existing?.concluidoEm ?? nowIso : undefined,
  };

  const nextMap: ProgressMap = { ...map, [planoId]: updated };
  await writeMap(nextMap);
  return nextMap;
}

export async function resetReadingPlanProgress(planoId: string): Promise<ProgressMap> {
  const map = await readMap();
  const nextMap = { ...map };
  delete nextMap[planoId];
  await writeMap(nextMap);
  return nextMap;
}
