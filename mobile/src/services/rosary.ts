import { prayerCategories } from "../data/prayers";
import { mysteryGroups } from "../data/rosaryMysteries";
import type { MysteryGroupId, RosaryStep } from "../types/rosary";

function findPrayerText(id: string): string {
  for (const category of prayerCategories) {
    const found = category.oracoes.find((o) => o.id === id);
    if (found) return found.texto;
  }
  throw new Error(`Oração não encontrada: ${id}`);
}

export function buildRosarySteps(groupId: MysteryGroupId): RosaryStep[] {
  const group = mysteryGroups.find((g) => g.id === groupId);
  if (!group) throw new Error(`Grupo de mistérios inválido: ${groupId}`);

  const steps: RosaryStep[] = [];
  let ordem = 1;

  function pushSimple(titulo: string, texto: string, misterioIndex?: number) {
    steps.push({ ordem: ordem++, kind: "oracao-simples", titulo, texto, misterioIndex });
  }

  // Cada repetição (ex.: Ave Maria x10) vira um passo individual e navegável,
  // contando uma a uma como o usuário pediu — não um único passo com contador.
  function pushRepeated(titulo: string, texto: string, total: number, misterioIndex?: number) {
    for (let i = 1; i <= total; i++) {
      steps.push({
        ordem: ordem++,
        kind: "oracao-simples",
        titulo,
        texto,
        repeticaoAtual: i,
        repeticaoTotal: total,
        misterioIndex,
      });
    }
  }

  pushSimple("Sinal da Cruz", findPrayerText("sinal-da-cruz"));
  pushSimple("Credo", findPrayerText("credo"));
  pushSimple("Pai Nosso", findPrayerText("pai-nosso"));
  pushRepeated("Ave Maria", findPrayerText("ave-maria"), 3);
  pushSimple("Glória ao Pai", findPrayerText("gloria-ao-pai"));

  group.misterios.forEach((misterioTexto, index) => {
    steps.push({
      ordem: ordem++,
      kind: "anuncio-misterio",
      titulo: `${index + 1}º Mistério`,
      texto: misterioTexto,
      misterioIndex: index,
    });
    pushSimple("Pai Nosso", findPrayerText("pai-nosso"), index);
    pushRepeated("Ave Maria", findPrayerText("ave-maria"), 10, index);
    pushSimple("Glória ao Pai", findPrayerText("gloria-ao-pai"), index);
    pushSimple("Oração de Fátima", findPrayerText("oracao-fatima"), index);
  });

  pushSimple("Salve Rainha", findPrayerText("salve-rainha"));
  pushSimple("Oração Final", findPrayerText("oracao-final-terco"));

  return steps;
}
