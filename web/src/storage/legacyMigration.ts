// Migração única dos dados locais do app React Native anterior (mesmo pacote na Play Store).
// Quem atualiza do RN mantém versículos marcados (com comentários), progresso dos planos, históricos de
// liturgia e terço e as configurações. As chaves e os formatos são os mesmos do RN, então basta copiar.
// Regras:
// - roda uma vez por instalação (marca MIGRATED_FLAG ao terminar, com ou sem dados antigos);
// - nunca sobrescreve um valor que o app novo já tenha salvo;
// - valores que não são JSON válido são ignorados;
// - não copia a voz do TTS (os identificadores do expo-speech não valem no plugin novo) nem o cache da liturgia.
import { registerPlugin } from "@capacitor/core";
import { isNative } from "../native/platform";
import { kv } from "./kv";

export const MIGRATED_FLAG = "lumen:legacy_rn_migrated_v1";
export const LEGACY_KEYS = [
  "lumen_user_settings_v1",
  "lumen:bible_bookmarks_v1",
  "lumen:reading_plan_progress_v1",
  "lumen:read_days_v1",
  "lumen:rosary_days_v1",
] as const;
const SETTINGS_KEY = "lumen_user_settings_v1";

export type LegacyReadResult = { found: boolean; entries: Record<string, string> };
export type LegacySource = (keys: readonly string[]) => Promise<LegacyReadResult>;

interface LegacyStoragePlugin {
  read(options: { keys: string[] }): Promise<LegacyReadResult>;
}
const LegacyStorage = registerPlugin<LegacyStoragePlugin>("LegacyStorage");
const nativeSource: LegacySource = (keys) => LegacyStorage.read({ keys: [...keys] });

export type MigrationOutcome = { migrated: string[]; reminderToReschedule: string | null };

function isJson(value: string): boolean {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}

/** Copia os dados do RN para o armazenamento novo. `source` é injetável para os testes. */
export async function migrateLegacyStorage(source: LegacySource | null = isNative() ? nativeSource : null): Promise<MigrationOutcome> {
  const none: MigrationOutcome = { migrated: [], reminderToReschedule: null };
  if (!source || (await kv.getItem(MIGRATED_FLAG))) return none;

  const { found, entries } = await source(LEGACY_KEYS);
  const migrated: string[] = [];
  let reminderToReschedule: string | null = null;

  if (found) {
    for (const key of LEGACY_KEYS) {
      const value = entries[key];
      if (value == null || !isJson(value) || (await kv.getItem(key)) != null) continue;
      await kv.setItem(key, value);
      migrated.push(key);
    }
    if (migrated.includes(SETTINGS_KEY)) {
      // O lembrete do RN era agendado pelo expo-notifications, que não existe mais: precisa reagendar.
      const settings = JSON.parse(entries[SETTINGS_KEY]) as { reminderEnabled?: boolean; reminderTime?: string };
      if (settings.reminderEnabled && typeof settings.reminderTime === "string") reminderToReschedule = settings.reminderTime;
    }
  }

  await kv.setItem(MIGRATED_FLAG, new Date().toISOString());
  return { migrated, reminderToReschedule };
}

/** Para a tela de Diagnóstico: o que existe no banco do app RN e se a migração já rodou. */
export async function describeLegacyStorage(): Promise<string> {
  const flag = await kv.getItem(MIGRATED_FLAG);
  if (!isNative()) return "Só no aparelho.";
  const { found, entries } = await nativeSource(LEGACY_KEYS);
  const lines = LEGACY_KEYS.map((key) => `${key}: ${entries[key] != null ? `${entries[key].length} caracteres` : "—"}`);
  return [`banco do RN: ${found ? "encontrado" : "não existe"}`, `migração: ${flag ?? "ainda não rodou"}`, ...(found ? lines : [])].join("\n");
}
