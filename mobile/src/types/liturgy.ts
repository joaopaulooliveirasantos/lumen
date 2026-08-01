export interface ReadingBlock {
  referencia: string;
  titulo: string;
  texto: string;
}

export interface PsalmBlock {
  referencia: string;
  refrao: string;
  texto: string;
}

export interface ReflectionBlock {
  titulo: string;
  autor: string;
  fonte: string;
  texto: string;
  audioUrl: string | null;
}

export interface DailyLiturgyPayload {
  data: string;
  liturgia: string;
  cor: string;
  primeiraLeitura: ReadingBlock;
  salmo: PsalmBlock;
  segundaLeitura: ReadingBlock | null;
  evangelho: ReadingBlock;
  reflexao: ReflectionBlock;
}

export interface CachedDailyLiturgy {
  date: string;
  payload: DailyLiturgyPayload;
  updatedAt: string;
}

export interface SaintOfDayPayload {
  data: string;
  santos: string[];
}

export type ReadingTabKey = "leitura1" | "salmo" | "leitura2" | "evangelho" | "homilia";
