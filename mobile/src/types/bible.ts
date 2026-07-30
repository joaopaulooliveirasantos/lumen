export interface BibleVerse {
  versiculo: number;
  texto: string;
}

export interface BibleChapter {
  capitulo: number;
  versiculos: BibleVerse[];
}

export interface BibleBook {
  nome: string;
  capitulos: BibleChapter[];
}

export interface BibleData {
  antigoTestamento: BibleBook[];
  novoTestamento: BibleBook[];
}
