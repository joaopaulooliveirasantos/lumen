export interface VerseBookmark {
  id: string;
  testamento: "antigoTestamento" | "novoTestamento";
  livro: string;
  capitulo: number;
  versiculo: number;
  texto: string;
  comentario: string;
  criadoEm: string;
}
