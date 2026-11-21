// Siglas (padrão da CNBB) e seções dos 73 livros da Bíblia católica. A chave é o número do livro no
// slug do índice ("01-genesis" -> 1), que é o mesmo nas duas traduções (Ave Maria e Pastoral).
import type { IconName } from "../components/Icon";

export const BOOK_ABBREVIATIONS: readonly string[] = [
  "Gn", "Ex", "Lv", "Nm", "Dt", // Pentateuco
  "Js", "Jz", "Rt", "1Sm", "2Sm", "1Rs", "2Rs", "1Cr", "2Cr", "Esd", "Ne", "Tb", "Jt", "Est",
  "Jó", "Sl",
  "1Mc", "2Mc",
  "Pr", "Ecl", "Ct", "Sb", "Eclo",
  "Is", "Jr", "Lm", "Br", "Ez", "Dn", "Os", "Jl", "Am", "Ab", "Jn", "Mq", "Na", "Hab", "Sf", "Ag", "Zc", "Ml",
  "Mt", "Mc", "Lc", "Jo", // Evangelhos
  "At",
  "Rm", "1Cor", "2Cor", "Gl", "Ef", "Fl", "Cl", "1Ts", "2Ts", "1Tm", "2Tm", "Tt", "Fm", "Hb",
  "Tg", "1Pd", "2Pd", "1Jo", "2Jo", "3Jo", "Jd",
  "Ap",
];

export type BookSection = { id: string; nome: string; icon: IconName; tone: string; livros: readonly number[] };

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

/** Seções na ordem de exibição; `tone` é RGB, usado em CSS vars (vale nos três modos de leitura). */
export const BOOK_SECTIONS: readonly BookSection[] = [
  { id: "pentateuco", nome: "Pentateuco", icon: "book", tone: "150, 98, 40", livros: range(1, 5) },
  { id: "historicos", nome: "Livros Históricos", icon: "church", tone: "46, 125, 50", livros: [...range(6, 19), 22, 23] },
  { id: "sapienciais", nome: "Livros Sapienciais", icon: "star", tone: "176, 131, 20", livros: [20, 21, ...range(24, 28)] },
  { id: "profeticos", nome: "Livros Proféticos", icon: "comment", tone: "123, 63, 143", livros: range(29, 46) },
  { id: "evangelhos", nome: "Evangelhos", icon: "cross", tone: "196, 52, 52", livros: range(47, 50) },
  { id: "atos", nome: "Atos dos Apóstolos", icon: "person", tone: "201, 110, 40", livros: [51] },
  { id: "paulinas", nome: "Cartas de São Paulo", icon: "mail", tone: "47, 111, 176", livros: range(52, 65) },
  { id: "catolicas", nome: "Cartas Católicas", icon: "mail", tone: "38, 128, 112", livros: range(66, 72) },
  { id: "apocalipse", nome: "Apocalipse", icon: "sun", tone: "108, 84, 160", livros: [73] },
];

/** Número do livro (1 a 73) a partir do slug do índice, ou null se o slug fugir do padrão. */
export function bookNumber(slug: string): number | null {
  const n = Number.parseInt(slug, 10);
  return Number.isInteger(n) && n >= 1 && n <= BOOK_ABBREVIATIONS.length ? n : null;
}

export function bookAbbreviation(slug: string): string | null {
  const n = bookNumber(slug);
  return n ? BOOK_ABBREVIATIONS[n - 1] : null;
}
