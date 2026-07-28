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
  autor: string;
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

export interface ReflectionCandidate {
  title: string;
  description: string;
  pubDate: string | null;
  link: string | null;
  audioUrl: string | null;
}
