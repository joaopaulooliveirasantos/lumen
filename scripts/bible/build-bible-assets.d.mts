// Tipos do gerador, para que os testes de lumen/web possam importá-lo.
export interface TranslationSource {
  id: string;
  nome: string;
  editora: string;
  arquivo: string;
}

export interface RawBibleData {
  antigoTestamento: { nome: string; capitulos: { capitulo: number; versiculos: { versiculo: number; texto: string }[] }[] }[];
  novoTestamento: { nome: string; capitulos: { capitulo: number; versiculos: { versiculo: number; texto: string }[] }[] }[];
}

export interface BuiltIndex {
  schema: number;
  id: string;
  versao: string;
  livros: {
    slug: string;
    nome: string;
    testamento: "antigoTestamento" | "novoTestamento";
    versiculosPorCapitulo: number[];
    bytes: number;
  }[];
}

export const SCHEMA_VERSION: number;
export const TRANSLATION_SOURCES: TranslationSource[];
export function slugify(nome: string, position: number): string;
export function validateBible(
  data: RawBibleData,
  label: string,
  expected?: Partial<Record<"antigoTestamento" | "novoTestamento", number>>,
): void;
export function buildTranslationAssets(
  source: Pick<TranslationSource, "id">,
  data: RawBibleData,
  expected?: Partial<Record<"antigoTestamento" | "novoTestamento", number>>,
): { versao: string; index: BuiltIndex; books: { slug: string; json: string }[] };
export function buildAll(options: { biblesDir: string; outDir: string }): unknown;
