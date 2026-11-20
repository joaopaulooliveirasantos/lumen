import type { BibleTranslationId } from "../types/settings";

export interface BibleTranslationMeta {
  id: BibleTranslationId;
  nome: string;
  editora: string;
}

export const bibleTranslations: BibleTranslationMeta[] = [
  { id: "ave-maria", nome: "Ave Maria", editora: "Ave Maria Editora" },
  { id: "paulus", nome: "Bíblia Pastoral", editora: "Paulus Editora" },
];
