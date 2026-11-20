import { describe, expect, it } from "vitest";
import { beadsFor } from "../src/screens/RosaryScreen";
import { buildRosarySteps } from "../src/services/rosary";

const steps = buildRosarySteps("gozosos");

describe("contas do terço", () => {
  it("as 3 Ave-Marias iniciais contam de 1 a 3", () => {
    const aves = steps.filter((s) => s.misterioIndex === undefined && s.repeticaoTotal);
    expect(aves.map((s) => beadsFor(steps, s))).toEqual([
      { total: 3, done: 0, current: true },
      { total: 3, done: 1, current: true },
      { total: 3, done: 2, current: true },
    ]);
  });

  it("na dezena: nenhuma rezada no Pai-Nosso, a atual na Ave-Maria e todas no Glória", () => {
    const decade = steps.filter((s) => s.misterioIndex === 2);
    const paiNosso = decade.find((s) => s.titulo === "Pai Nosso")!;
    const quinta = decade.find((s) => s.repeticaoAtual === 5)!;
    const gloria = decade.find((s) => s.titulo === "Glória ao Pai")!;
    expect(beadsFor(steps, paiNosso)).toEqual({ total: 10, done: 0, current: false });
    expect(beadsFor(steps, quinta)).toEqual({ total: 10, done: 4, current: true });
    expect(beadsFor(steps, gloria)).toEqual({ total: 10, done: 10, current: false });
  });

  it("sem contas no início e no fim", () => {
    expect(beadsFor(steps, steps[0])).toBeNull();
    expect(beadsFor(steps, steps[steps.length - 1])).toBeNull();
  });
});
