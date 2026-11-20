import { describe, expect, it } from "vitest";
import { prayerCategories } from "../src/data/prayers";
import { prayerOfTheDay } from "../src/screens/PrayersScreen";

describe("oração do dia", () => {
  it("é a mesma durante o dia e muda no dia seguinte", () => {
    const manha = prayerOfTheDay(new Date(2026, 10, 20, 7, 0));
    const noite = prayerOfTheDay(new Date(2026, 10, 20, 23, 30));
    const amanha = prayerOfTheDay(new Date(2026, 10, 21, 7, 0));
    expect(noite.prayer.id).toBe(manha.prayer.id);
    expect(amanha.prayer.id).not.toBe(manha.prayer.id);
  });

  it("sempre devolve uma oração existente, com a sua categoria", () => {
    for (let d = 0; d < 400; d++) {
      const { prayer, category } = prayerOfTheDay(new Date(2026, 0, 1 + d));
      expect(prayerCategories.find((c) => c.id === category.id)?.oracoes).toContain(prayer);
    }
  });
});
