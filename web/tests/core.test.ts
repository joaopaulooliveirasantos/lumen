import { describe, expect, it } from "vitest";
import { addDays, formatIsoDate, getDateParts, getMonthCalendarDays, getWeekDays } from "../src/services/date";
import { shadeColor } from "../src/services/color";
import { applyTheme, getThemePalette, liturgicColorHex } from "../src/theme/palette";

describe("date", () => {
  it("formata e soma dias em ISO", () => {
    expect(formatIsoDate(new Date(2026, 10, 19))).toBe("2026-11-19");
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("retorna a semana de domingo a sábado", () => {
    const week = getWeekDays("2026-11-19");
    expect(week).toHaveLength(7);
    expect(week[0]).toBe("2026-11-15");
    expect(week[6]).toBe("2026-11-21");
  });

  it("monta o calendário do mês com células vazias iniciais", () => {
    // 1º de outubro de 2026 cai numa quinta-feira (4 células vazias antes do dia 1).
    const cells = getMonthCalendarDays(2026, 10);
    expect(cells.filter((c) => c !== null)).toHaveLength(31);
    expect(cells.slice(0, 4)).toEqual([null, null, null, null]);
    expect(cells[4]).toBe("2026-10-01");
  });

  it("separa dia, mês abreviado e ano", () => {
    expect(getDateParts("2026-03-07")).toEqual({ day: "07", monthAbbr: "Mar", year: "2026" });
  });
});

describe("shadeColor", () => {
  it("clareia, escurece e respeita os limites", () => {
    expect(shadeColor("#000000", 100)).toBe("#ffffff");
    expect(shadeColor("#ffffff", -100)).toBe("#000000");
    expect(shadeColor("#808080", 0)).toBe("#808080");
  });
});

describe("tema", () => {
  it("mapeia a cor litúrgica para o acento", () => {
    expect(liturgicColorHex("Roxo")).toBe("#6A1B9A");
    expect(liturgicColorHex("Vermelho")).toBe("#C62828");
    expect(liturgicColorHex("Branco")).toBe("#D97706");
    expect(liturgicColorHex("Rosa")).toBe("#AD1457");
    expect(liturgicColorHex("Verde")).toBe("#2E7D32");
  });

  it("aplica a paleta como variáveis CSS", () => {
    const root = document.createElement("div");
    applyTheme(getThemePalette("escuro", "#6A1B9A"), 1.2, root);
    expect(root.style.getPropertyValue("--app-bg")).toBe("#0B1117");
    expect(root.style.getPropertyValue("--accent")).toBe("#6A1B9A");
    expect(root.style.getPropertyValue("--accent-soft")).toBe("#6A1B9A33");
    expect(root.style.getPropertyValue("--font-scale")).toBe("1.2");
  });
});
