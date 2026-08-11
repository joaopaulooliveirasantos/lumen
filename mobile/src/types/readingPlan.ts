export interface BibleReference {
  livro: string;
  capituloInicio: number;
  versiculoInicio?: number;
  capituloFim?: number;
  versiculoFim?: number;
}

export interface CatechismReference {
  paragrafo: number;
  tema: string;
  trecho: string;
}

export interface ReadingPlanDay {
  dia: number;
  titulo: string;
  referencias: BibleReference[];
  catecismo?: CatechismReference;
}

export type ReadingPlanCategory =
  | "liturgico"
  | "evangelho"
  | "tematico"
  | "sapiencial"
  | "catequetico"
  | "mariano"
  | "familia";

export interface ReadingPlanCover {
  icone: string;
  corBase: string;
}

export interface ReadingPlan {
  id: string;
  titulo: string;
  subtitulo: string;
  categoria: ReadingPlanCategory;
  duracaoDias: number;
  destaque: boolean;
  capa: ReadingPlanCover;
  dias: ReadingPlanDay[];
}
