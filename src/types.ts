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

export interface CommentaryCandidate {
  titulo: string;
  autor: string;
  fonte: string;
  texto: string;
}

export interface SaintOfDayPayload {
  data: string;
  santos: string[];
}
