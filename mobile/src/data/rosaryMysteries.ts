import type { MysteryGroup, MysteryGroupId } from "../types/rosary";

export const mysteryGroups: MysteryGroup[] = [
  {
    id: "gozosos",
    nome: "Gozosos",
    dias: "Segunda e Sábado",
    misterios: [
      "A Anunciação do Anjo e a Encarnação do Verbo no seio Puríssimo de Maria",
      "A visitação de Maria a sua prima Santa Isabel",
      "Nascimento do Menino Jesus, na gruta fria em Belém",
      "A apresentação do Menino Jesus no templo, e a purificação de Maria",
      "A perda e o encontro do Menino Jesus no templo discutindo com os doutores da Lei",
    ],
  },
  {
    id: "dolorosos",
    nome: "Dolorosos",
    dias: "Terça e Sexta",
    misterios: [
      "A oração e agonia no Horto das Oliveiras",
      "Flagelação de Nosso Senhor Jesus Cristo",
      "A coroação de espinhos de Nosso Senhor Jesus Cristo",
      "Nosso Senhor carregando a Cruz nas costas à caminho do Calvário",
      "A Crucifixão e morte de Nosso Senhor Jesus Cristo",
    ],
  },
  {
    id: "gloriosos",
    nome: "Gloriosos",
    dias: "Quarta e Domingo",
    misterios: [
      "A Ressurreição de Nosso Senhor Jesus Cristo",
      "A Ascensão de Nosso Senhor Jesus Cristo",
      "A descida do Espírito Santo a Nossa Senhora e os Apóstolos reunidos no Santo Cenáculo",
      "A Assunção de Nossa Senhora aos Céus de corpo e alma",
      "A Coroação de Nossa Senhora como Rainha do Céu e da Terra, dos Anjos e dos Homens",
    ],
  },
  {
    id: "luminosos",
    nome: "Luminosos",
    dias: "Quinta-feira",
    misterios: [
      "Batismo de Nosso Senhor Jesus Cristo no rio Jordão",
      "Primeiro milagre de Nosso Senhor Jesus Cristo transformando a água em vinho nas bodas de Caná",
      "Anúncio do Reino de Deus e o convite à conversão",
      "A transfiguração de Nosso Senhor no Monte Tabor",
      "A Instituição da Eucaristia na Última Ceia",
    ],
  },
];

export function suggestedMysteryGroupFor(date: Date): MysteryGroupId {
  const day = date.getDay(); // 0=domingo .. 6=sabado
  if (day === 1 || day === 6) return "gozosos";
  if (day === 2 || day === 5) return "dolorosos";
  if (day === 3 || day === 0) return "gloriosos";
  return "luminosos"; // quinta-feira (4)
}
