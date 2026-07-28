import { describe, expect, it } from "vitest";
import { isValidIsoDate, toBrazilianDate } from "../src/utils/date";

describe("date utils", () => {
  it("valida data ISO correta", () => {
    expect(isValidIsoDate("2026-07-28")).toBe(true);
  });

  it("rejeita formato invalido", () => {
    expect(isValidIsoDate("28/07/2026")).toBe(false);
  });

  it("converte para formato brasileiro", () => {
    expect(toBrazilianDate("2026-07-28")).toBe("28/07/2026");
  });
});
