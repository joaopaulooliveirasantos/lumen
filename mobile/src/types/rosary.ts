export type MysteryGroupId = "gozosos" | "dolorosos" | "gloriosos" | "luminosos";

export interface MysteryGroup {
  id: MysteryGroupId;
  nome: string;
  dias: string;
  misterios: string[];
}

export type RosaryStepKind = "oracao-simples" | "anuncio-misterio";

export interface RosaryStep {
  ordem: number;
  kind: RosaryStepKind;
  titulo: string;
  texto: string;
  repeticaoAtual?: number;
  repeticaoTotal?: number;
  misterioIndex?: number;
}
