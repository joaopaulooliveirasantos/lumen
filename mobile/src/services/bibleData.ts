import type { BibleData } from "../types/bible";
import type { BibleTranslationId } from "../types/settings";

// Metro exige caminhos estáticos em require(); por isso os dois arquivos são
// carregados aqui uma única vez e escolhidos em runtime por getBibleData().
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bibliaAveMaria = require("../../../biblias/ave maria/bibliaAveMaria.json") as BibleData;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bibliaPaulus = require("../../../biblias/paulus/bibliaPastoralPaulus.json") as BibleData;

const BIBLE_DATA_BY_TRANSLATION: Record<BibleTranslationId, BibleData> = {
  "ave-maria": bibliaAveMaria,
  paulus: bibliaPaulus,
};

export function getBibleData(translation: BibleTranslationId): BibleData {
  return BIBLE_DATA_BY_TRANSLATION[translation];
}
