import { beforeEach, describe, expect, it } from "vitest";
import { kv } from "../src/storage/kv";
import { LEGACY_KEYS, MIGRATED_FLAG, migrateLegacyStorage, type LegacySource } from "../src/storage/legacyMigration";

const source = (entries: Record<string, string>, found = true): LegacySource => async () => ({ found, entries });

describe("migração dos dados do app RN", () => {
  beforeEach(() => window.localStorage.clear());

  it("copia as chaves do RN e marca a migração", async () => {
    const bookmarks = JSON.stringify([{ id: "1", comentario: "meu comentário" }]);
    const out = await migrateLegacyStorage(source({ "lumen:bible_bookmarks_v1": bookmarks, "lumen:read_days_v1": '["2026-11-01"]' }));
    expect(out.migrated.sort()).toEqual(["lumen:bible_bookmarks_v1", "lumen:read_days_v1"]);
    expect(await kv.getItem("lumen:bible_bookmarks_v1")).toBe(bookmarks);
    expect(await kv.getItem(MIGRATED_FLAG)).not.toBeNull();
  });

  it("não sobrescreve dados do app novo nem copia JSON inválido", async () => {
    await kv.setItem("lumen:read_days_v1", '["2026-11-20"]');
    const out = await migrateLegacyStorage(source({ "lumen:read_days_v1": '["2026-11-01"]', "lumen:rosary_days_v1": "{quebrado" }));
    expect(out.migrated).toEqual([]);
    expect(await kv.getItem("lumen:read_days_v1")).toBe('["2026-11-20"]');
    expect(await kv.getItem("lumen:rosary_days_v1")).toBeNull();
  });

  it("roda uma vez só, mesmo sem dados antigos", async () => {
    await migrateLegacyStorage(source({}, false));
    const out = await migrateLegacyStorage(source({ "lumen:read_days_v1": "[]" }));
    expect(out.migrated).toEqual([]);
  });

  it("pede para reagendar o lembrete que estava ligado no RN", async () => {
    const settings = JSON.stringify({ readingMode: "sepia", reminderEnabled: true, reminderTime: "06:30" });
    const out = await migrateLegacyStorage(source({ lumen_user_settings_v1: settings }));
    expect(out.reminderToReschedule).toBe("06:30");
  });

  it("sem fonte (navegador) não faz nada", async () => {
    expect(await migrateLegacyStorage(null)).toEqual({ migrated: [], reminderToReschedule: null });
    expect(await kv.getItem(MIGRATED_FLAG)).toBeNull();
  });

  it("não migra a voz do TTS", () => {
    expect(LEGACY_KEYS).not.toContain("lumen_tts_voice_identifier_v1");
  });
});
