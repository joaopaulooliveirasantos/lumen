import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getBookmarks, removeBookmark, updateBookmarkComment, upsertBookmarks } from "../src/storage/bookmarks";
import { getAllReadingPlanProgress, markReadingPlanDayCompleted, resetReadingPlanProgress } from "../src/storage/readingPlanProgress";
import { getReadDays, markDayAsRead } from "../src/storage/readingHistory";
import { loadUserSettings, saveUserSettings } from "../src/storage/userSettings";
import { getDailyCache } from "../src/storage/liturgyCache";
import { loadLiturgy } from "../src/services/liturgy";
import { defaultUserSettings } from "../src/types/settings";
import type { DailyLiturgyPayload } from "../src/types/liturgy";
import type { VerseBookmark } from "../src/types/bookmark";

const bookmark = (id: string): VerseBookmark => ({
  id,
  testamento: "novoTestamento",
  livro: "João",
  capitulo: 1,
  versiculo: 1,
  texto: "No princípio era o Verbo",
  comentario: "",
  criadoEm: "2026-11-19T00:00:00.000Z",
});

const payload: DailyLiturgyPayload = {
  data: "19/11/2026",
  liturgia: "5ª feira da 33ª Semana do Tempo Comum",
  cor: "Verde",
  primeiraLeitura: { referencia: "Ap 5,1-10", titulo: "Leitura", texto: "t" },
  salmo: { referencia: "Sl 149", refrao: "r", texto: "t" },
  segundaLeitura: null,
  evangelho: { referencia: "Lc 19,41-44", titulo: "Evangelho", texto: "t" },
  reflexao: { titulo: "", autor: "", fonte: "", texto: "", audioUrl: null },
};

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("storage (localStorage)", () => {
  it("guarda, comenta e remove marcações", async () => {
    expect(await getBookmarks()).toEqual([]);
    await upsertBookmarks([bookmark("a"), bookmark("b")]);
    expect(await updateBookmarkComment("a", "bom")).toHaveLength(2);
    expect((await getBookmarks()).find((b) => b.id === "a")?.comentario).toBe("bom");
    expect(await removeBookmark("a")).toHaveLength(1);
  });

  it("registra progresso de plano e conclui no último dia", async () => {
    await markReadingPlanDayCompleted("p", 1, 2);
    const done = await markReadingPlanDayCompleted("p", 2, 2);
    expect(done.p.diasConcluidos).toEqual([1, 2]);
    expect(done.p.concluidoEm).toBeTruthy();
    expect(await resetReadingPlanProgress("p")).toEqual({});
    expect(await getAllReadingPlanProgress()).toEqual({});
  });

  it("não duplica dias lidos", async () => {
    await markDayAsRead("2026-11-19");
    expect(await markDayAsRead("2026-11-19")).toEqual(["2026-11-19"]);
    expect(await getReadDays()).toEqual(["2026-11-19"]);
  });

  it("mescla configurações salvas com os padrões", async () => {
    expect(await loadUserSettings()).toEqual(defaultUserSettings);
    await saveUserSettings({ ...defaultUserSettings, readingMode: "escuro" });
    expect((await loadUserSettings()).readingMode).toBe("escuro");
    window.localStorage.setItem("lumen_user_settings_v1", "{lixo");
    expect(await loadUserSettings()).toEqual(defaultUserSettings);
  });
});

describe("loadLiturgy (rede + cache em IndexedDB)", () => {
  it("usa a rede e grava no cache", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));
    const result = await loadLiturgy("2026-11-19");
    expect(result).toEqual({ payload, offline: false });
    expect((await getDailyCache("2026-11-19"))?.payload.liturgia).toBe(payload.liturgia);
  });

  it("cai para o cache quando a rede falha", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));
    await loadLiturgy("2026-11-20");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(await loadLiturgy("2026-11-20")).toEqual({ payload, offline: true });
  });

  it("propaga o erro sem rede e sem cache", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 502 }));
    await expect(loadLiturgy("2030-01-01")).rejects.toThrow("Falha de rede (502)");
  });
});
