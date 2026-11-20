import type { BibleBook } from "../types/bible";
import type { BibleTranslationId } from "../types/settings";
import type { BibleReference, ReadingPlan } from "../types/readingPlan";
import type { ReadingPlanProgress } from "../storage/readingPlanProgress";

export type BibleBookLoader = (translation: BibleTranslationId, nome: string) => Promise<BibleBook | undefined>;

export interface ResolvedVerse {
  versiculo: number;
  texto: string;
}

export interface ResolvedPassage {
  livro: string;
  capitulo: number;
  versiculos: ResolvedVerse[];
}

export async function resolveReference(
  reference: BibleReference,
  translation: BibleTranslationId,
  loadBook: BibleBookLoader,
): Promise<ResolvedPassage[]> {
  const book = await loadBook(translation, reference.livro);
  if (!book) return [];

  const capituloFim = reference.capituloFim ?? reference.capituloInicio;
  const passages: ResolvedPassage[] = [];

  for (const chapter of book.capitulos) {
    if (chapter.capitulo < reference.capituloInicio || chapter.capitulo > capituloFim) continue;

    const isFirstChapter = chapter.capitulo === reference.capituloInicio;
    const isLastChapter = chapter.capitulo === capituloFim;
    const minVerse = isFirstChapter && reference.versiculoInicio !== undefined ? reference.versiculoInicio : 1;
    const maxVerse =
      isLastChapter && reference.versiculoFim !== undefined ? reference.versiculoFim : Number.MAX_SAFE_INTEGER;

    const versiculos = chapter.versiculos
      .filter((v) => v.versiculo >= minVerse && v.versiculo <= maxVerse)
      .map((v) => ({ versiculo: v.versiculo, texto: v.texto }));

    if (versiculos.length > 0) {
      passages.push({ livro: book.nome, capitulo: chapter.capitulo, versiculos });
    }
  }

  return passages;
}

export type PlanStatus = "nao-iniciado" | "em-andamento" | "concluido";

export interface PlanStatusInfo {
  status: PlanStatus;
  diasConcluidos: number;
  proximoDia: number;
}

export function getPlanStatus(plan: ReadingPlan, progress: ReadingPlanProgress | undefined): PlanStatusInfo {
  const diasConcluidos = progress?.diasConcluidos.length ?? 0;

  if (diasConcluidos === 0) {
    return { status: "nao-iniciado", diasConcluidos: 0, proximoDia: 1 };
  }

  if (diasConcluidos >= plan.duracaoDias) {
    return { status: "concluido", diasConcluidos, proximoDia: plan.duracaoDias };
  }

  const concluidos = new Set(progress?.diasConcluidos ?? []);
  let proximoDia = 1;
  for (let dia = 1; dia <= plan.duracaoDias; dia++) {
    if (!concluidos.has(dia)) {
      proximoDia = dia;
      break;
    }
  }

  return { status: "em-andamento", diasConcluidos, proximoDia };
}

/** "João 3,16-18", "Gênesis 1–3", "Mateus 5,1–7,29" (mesmo formato do RN). */
export function formatReference(ref: BibleReference): string {
  const capituloFim = ref.capituloFim ?? ref.capituloInicio;
  if (capituloFim !== ref.capituloInicio) {
    const inicio = ref.versiculoInicio !== undefined ? `${ref.capituloInicio},${ref.versiculoInicio}` : `${ref.capituloInicio}`;
    const fim = ref.versiculoFim !== undefined ? `${capituloFim},${ref.versiculoFim}` : `${capituloFim}`;
    return `${ref.livro} ${inicio}–${fim}`;
  }
  if (ref.versiculoInicio === undefined) return `${ref.livro} ${ref.capituloInicio}`;
  if (ref.versiculoFim === undefined || ref.versiculoFim === ref.versiculoInicio) return `${ref.livro} ${ref.capituloInicio},${ref.versiculoInicio}`;
  return `${ref.livro} ${ref.capituloInicio},${ref.versiculoInicio}-${ref.versiculoFim}`;
}

export const CATEGORY_LABELS: Record<string, string> = {
  liturgico: "Tempo Litúrgico",
  evangelho: "Evangelhos",
  tematico: "Temático",
  sapiencial: "Sabedoria",
  catequetico: "Catequese",
  mariano: "Mariano",
  familia: "Família",
  "biblia-anual": "Bíblia em 1 Ano",
};
