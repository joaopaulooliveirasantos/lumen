import type { PrayerCategory } from "../types/prayers";

export const prayerCategories: PrayerCategory[] = [
  {
    id: "fundamentais",
    nome: "Orações Fundamentais",
    oracoes: [
      {
        id: "sinal-da-cruz",
        titulo: "Sinal da Cruz",
        texto: "Em nome do Pai, e do Filho, e do Espírito Santo. Amém.",
      },
      {
        id: "pai-nosso",
        titulo: "Pai Nosso",
        texto:
          "Pai Nosso, que estais nos céus, santificado seja o vosso Nome; venha a nós o vosso Reino; seja feita a vossa vontade, assim na terra como no céu. O pão nosso de cada dia nos dai hoje; perdoai-nos as nossas ofensas, assim como nós perdoamos a quem nos tem ofendido; e não nos deixeis cair em tentação; mas livrai-nos do mal. Amém.",
      },
      {
        id: "ave-maria",
        titulo: "Ave Maria",
        texto:
          "Ave, Maria, cheia de graça, o Senhor é convosco, bendita sois Vós entre as mulheres, e bendito é o fruto do vosso ventre, Jesus. Santa Maria, Mãe de Deus, rogai por nós, pecadores, agora e na hora da nossa morte. Amém.",
      },
      {
        id: "gloria-ao-pai",
        titulo: "Glória ao Pai",
        texto:
          "Glória ao Pai, e ao Filho, e ao Espírito Santo. Como era no princípio, agora e sempre, e por todos os séculos dos séculos. Amém.",
      },
      {
        id: "credo",
        titulo: "Credo (Símbolo dos Apóstolos)",
        texto:
          "Creio em Deus Pai todo-poderoso, criador do céu e da terra. E em Jesus Cristo, seu único Filho, nosso Senhor, que foi concebido pelo poder do Espírito Santo, nasceu da Virgem Maria, padeceu sob Pôncio Pilatos, foi crucificado, morto e sepultado, desceu à mansão dos mortos, ressuscitou ao terceiro dia, subiu aos céus, está sentado à direita de Deus Pai todo-poderoso, donde há de vir a julgar os vivos e os mortos. Creio no Espírito Santo, na santa Igreja católica, na comunhão dos santos, na remissão dos pecados, na ressurreição da carne, na vida eterna. Amém.",
      },
      {
        id: "ato-de-fe",
        titulo: "Ato de Fé",
        texto:
          "Meu Deus, eu creio firmemente em tudo quanto a Santa Igreja Católica crê e ensina, porque Vós, que sois a verdade infalível, o revelastes. Amém.",
      },
      {
        id: "ato-de-esperanca",
        titulo: "Ato de Esperança",
        texto:
          "Meu Deus, espero com firme confiança que me haveis de dar, pelos merecimentos de Jesus Cristo, a vida eterna e as graças necessárias para merecê-la, se eu, de minha parte, fizer o que me é possível com o auxílio da vossa graça. Amém.",
      },
      {
        id: "ato-de-caridade",
        titulo: "Ato de Caridade",
        texto:
          "Meu Deus, eu Vos amo sobre todas as coisas, com todo o meu coração e sobre todas elas, porque sois infinitamente bom e digno de ser amado, e amo o meu próximo como a mim mesmo por amor de Vós. Amém.",
      },
    ],
  },
  {
    id: "marianas",
    nome: "Orações Marianas",
    oracoes: [
      {
        id: "salve-rainha",
        titulo: "Salve Rainha",
        texto:
          "Salve, Rainha, Mãe de misericórdia, vida, doçura, esperança nossa, salve! A vós bradamos, os degredados filhos de Eva. A vós suspiramos, gemendo e chorando neste vale de lágrimas. Eia, pois, advogada nossa, esses vossos olhos misericordiosos a nós volvei. E depois deste desterro, mostrai-nos Jesus, bendito fruto do vosso ventre. Ó clemente, ó piedosa, ó doce sempre Virgem Maria! Rogai por nós, santa Mãe de Deus, para que sejamos dignos das promessas de Cristo. Amém.",
      },
      {
        id: "angelus",
        titulo: "Angelus (Anjo do Senhor)",
        texto:
          "O Anjo do Senhor anunciou a Maria, e ela concebeu do Espírito Santo. Ave Maria...\n\nEis aqui a serva do Senhor. Faça-se em mim segundo a vossa palavra. Ave Maria...\n\nE o Verbo se fez carne. E habitou entre nós. Ave Maria...\n\nRogai por nós, santa Mãe de Deus. Para que sejamos dignos das promessas de Cristo.\n\nOremos: Infundi, Senhor, propiciamente a vossa graça em nossas almas, para que nós, que pela anunciação do Anjo conhecemos a encarnação de Jesus Cristo, vosso Filho, por sua paixão e morte de cruz, sejamos conduzidos à glória da ressurreição. Pelo mesmo Cristo, Senhor Nosso. Amém.",
      },
      {
        id: "memorare",
        titulo: "Memorare (Lembrai-vos)",
        texto:
          "Lembrai-vos, ó piedosíssima Virgem Maria, que nunca se ouviu dizer que algum daqueles que têm recorrido à vossa proteção, implorando a vossa assistência e reclamando o vosso socorro, fosse por vós desamparado. Animado com esta confiança, a vós recorro, ó Mãe, Virgem das Virgens, e, gemendo sob o peso dos meus pecados, oso comparecer ante a vossa presença soberana. Não rejeiteis as minhas súplicas, ó Mãe do Verbo Divino, mas dignai-vos ouvi-las e atendê-las. Amém.",
      },
      {
        id: "sob-vosso-amparo",
        titulo: "Sob Vosso Amparo (Sub Tuum Praesidium)",
        texto:
          "Sob a vossa proteção nos refugiamos, Santa Mãe de Deus. Não desprezeis as nossas súplicas em nossas necessidades, mas livrai-nos sempre de todos os perigos, ó Virgem gloriosa e bendita. Amém.",
      },
      {
        id: "regina-coeli",
        titulo: "Regina Coeli (Rainha do Céu)",
        texto:
          "Rainha do Céu, alegrai-vos, aleluia. Porque o Senhor, que merecestes trazer em vosso seio, aleluia. Ressuscitou como disse, aleluia. Rogai a Deus por nós, aleluia.\n\nExultai e alegrai-vos, ó Virgem Maria, aleluia. Porque o Senhor ressuscitou verdadeiramente, aleluia.\n\nOremos: Ó Deus, que Vos dignastes alegrar o mundo com a ressurreição de vosso Filho, nosso Senhor Jesus Cristo, concedei-nos, Vos pedimos, que, por sua Mãe, a Virgem Maria, alcancemos as alegrias da vida eterna. Por Cristo, Senhor Nosso. Amém.",
      },
    ],
  },
  {
    id: "protecao",
    nome: "Orações de Proteção",
    oracoes: [
      {
        id: "sao-miguel-arcanjo",
        titulo: "Oração a São Miguel Arcanjo",
        texto:
          "São Miguel Arcanjo, defendei-nos no combate, sede o nosso refúgio contra as maldades e as ciladas do demônio. Ordene-lhe Deus, instantemente o pedimos, e vós, príncipe da milícia celeste, pelo divino poder, precipitai no inferno a satanás e a todos os espíritos malignos, que andam pelo mundo para perder as almas. Amém.",
      },
      {
        id: "anjo-da-guarda",
        titulo: "Santo Anjo (Anjo da Guarda)",
        texto:
          "Santo Anjo do Senhor, meu zeloso guardador, se a ti me confiou a piedade divina, sempre me rege, me guarda, me governa e ilumina. Amém.",
      },
      {
        id: "sao-bento",
        titulo: "Oração de São Bento",
        texto:"A Cruz Sagrada seja a minha luz. \nNão seja o dragão o meu guia. \nRetira-te, Satanás! \nNunca me aconselhes coisas vãs. \nÉ mau o que tu me ofereces. \nBebe tu mesmo os teus venenos. \nAmém.",
      },
    ],
  },
  {
    id: "santos",
    nome: "Orações aos Santos",
    oracoes: [
      {
        id: "sao-jose",
        titulo: "Oração a São José",
        texto:
          "A vós, ó bem-aventurado José, recorremos em nossa tribulação, e, depois de implorarmos o auxílio de vossa santíssima Esposa, com confiança pedimos também o vosso patrocínio. Pelo amor que vos uniu à Imaculada Virgem Maria, Mãe de Deus, e pelo afeto paternal com que abraçastes o Menino Jesus, nós vos suplicamos olheis benignamente para a herança que Jesus Cristo adquiriu com o seu sangue, e nos socorrais em nossas necessidades com o vosso poder e auxílio. Amém.",
      },
      {
        id: "santo-expedito",
        titulo: "Oração a Santo Expedito",
        texto:
          "Santo Expedito, valoroso soldado de Cristo, socorrei-nos na hora do perigo, sede rápido em nosso auxílio nas causas urgentes e difíceis, para que, glorificando a Deus em todas as coisas, caminhemos sempre na luz e na graça do Senhor. Assim seja.",
      },
      {
        id: "sao-judas-tadeu",
        titulo: "Oração a São Judas Tadeu",
        texto:
          "São Judas Tadeu, glorioso Apóstolo, fiel servo e amigo de Jesus, o nome do traidor tem sido causa de serdes esquecido por muitos, mas a Igreja vos honra e invoca como padroeiro das causas difíceis e desesperadas. Rogai por mim, que sou tão miserável, e fazei uso, peço-vos, desse privilégio especial a vós concedido, de trazer socorro visível e imediato onde quase se perdeu toda a esperança. Vinde em meu auxílio nesta grande necessidade, para que eu receba os consolos e o socorro do Céu em todas as minhas necessidades, tribulações e sofrimentos. Amém.",
      },
      {
        id: "santa-rita",
        titulo: "Oração a Santa Rita de Cássia",
        texto:
          "Ó Santa Rita, advogada dos casos impossíveis, que participastes de modo admirável da Paixão de Nosso Senhor Jesus Cristo, alcançai-me a graça que tanto desejo, se for para o bem de minha alma e para a glória de Deus. Ensinai-me a sofrer com paciência as provações desta vida, confiando sempre na misericórdia divina. Amém.",
      },
    ],
  },
  {
    id: "devocao",
    nome: "Orações de Devoção",
    oracoes: [
      {
        id: "vinde-espirito-santo",
        titulo: "Vinde, Espírito Santo",
        texto:
          "Vinde, Espírito Santo, enchei os corações dos vossos fiéis e acendei neles o fogo do vosso amor. Enviai o vosso Espírito e tudo será criado. E renovareis a face da terra.\n\nOremos: Ó Deus, que instruístes os corações dos vossos fiéis com a luz do Espírito Santo, dai-nos que apreciemos retamente todas as coisas segundo o mesmo Espírito e gozemos sempre da sua consolação. Por Cristo, Senhor Nosso. Amém.",
      },
      {
        id: "alma-de-cristo",
        titulo: "Alma de Cristo",
        texto:
          "Alma de Cristo, santificai-me. Corpo de Cristo, salvai-me. Sangue de Cristo, inebriai-me. Água do lado de Cristo, lavai-me. Paixão de Cristo, confortai-me. Ó bom Jesus, ouvi-me. Dentro de vossas chagas, escondei-me. Não permitais que eu me separe de Vós. Do espírito maligno, defendei-me. Na hora da minha morte, chamai-me. E mandai-me ir para Vós, para que com os vossos santos vos louve, por todos os séculos dos séculos. Amém.",
      },
      {
        id: "jesus-manso-humilde",
        titulo: "Ó Jesus Manso e Humilde de Coração",
        texto: "Ó Jesus, manso e humilde de coração, fazei o meu coração semelhante ao Vosso.",
      },
      {
        id: "louvores-santissimo",
        titulo: "Louvores ao Santíssimo Sacramento",
        texto:
          "Bendito seja Deus. Bendito seja o seu Santo Nome. Bendito seja Jesus Cristo, verdadeiro Deus e verdadeiro Homem. Bendito seja o Nome de Jesus. Bendito seja o seu Sacratíssimo Coração. Bendito seja o seu Preciosíssimo Sangue. Bendito seja Jesus no Santíssimo Sacramento do Altar. Bendito seja o Espírito Santo Consolador. Bendita seja a excelsa Mãe de Deus, a Santíssima Virgem Maria. Bendita seja a sua Santa e Imaculada Conceição. Bendita seja a sua gloriosa Assunção. Bendito seja o nome de Maria, Virgem e Mãe. Bendito seja São José, seu castíssimo esposo. Bendito seja Deus em seus Anjos e em seus Santos.",
      },
    ],
  },
  {
    id: "misericordia",
    nome: "Coroa da Divina Misericórdia",
    oracoes: [
      {
        id: "coroa-misericordia",
        titulo: "Coroa da Divina Misericórdia",
        texto:
          "Reza-se com o terço comum.\n\nNo início: Pai Nosso, Ave Maria e Creio em Deus Pai (Credo).\n\nNas contas grandes (uma vez em cada mistério): Eterno Pai, eu Vos ofereço o Corpo e Sangue, a Alma e Divindade de Vosso diletíssimo Filho e Nosso Senhor Jesus Cristo, em expiação dos nossos pecados e do mundo inteiro.\n\nNas contas pequenas (dez vezes em cada mistério): Pela Sua dolorosa Paixão, tende misericórdia de nós e do mundo inteiro.\n\nNo final, três vezes: Deus Santo, Deus Forte e Imortal, tende piedade de nós e do mundo inteiro.",
      },
    ],
  },
  {
    id: "penitencia",
    nome: "Oração de Arrependimento",
    oracoes: [
      {
        id: "ato-de-contricao",
        titulo: "Ato de Contrição",
        texto:
          "Meu Deus, eu me arrependo de todo o coração de todos os meus pecados e os detesto, porque, pecando, não somente mereci as penas que justamente estabelecestes, mas principalmente porque vos ofendi, a vós, sumo bem e digno de ser amado sobre todas as coisas. Por isso, proponho firmemente, com a ajuda da vossa graça, não mais pecar e evitar as ocasiões próximas de pecado. Amém.",
      },
      {
        id: "confiteor",
        titulo: "Confiteor (Eu Confesso)",
        texto:
          "Eu confesso a Deus Todo-Poderoso e a vós, irmãos e irmãs, que pequei muitas vezes por pensamentos e palavras, atos e omissões, por minha culpa, minha tão grande culpa. E peço à Virgem Maria sempre Virgem, aos Anjos e Santos, e a vós, irmãos e irmãs, que rogueis por mim a Deus, Nosso Senhor. Amém.",
      },
    ],
  },
  {
    id: "terco",
    nome: "Orações do Terço",
    oracoes: [
      {
        id: "oracao-fatima",
        titulo: "Oração de Fátima",
        texto:
          "Ó meu Jesus, perdoai-nos, livrai-nos do fogo do inferno; levai as almas todas para o Céu, principalmente as que mais precisarem. Amém.",
      },
      {
        id: "oracao-final-terco",
        titulo: "Oração Final do Terço",
        texto:
          "Ó Deus, cujo Filho unigênito, por sua vida, morte e ressurreição, nos mereceu as recompensas da salvação eterna, concedei-nos, nós vo-lo pedimos, que, meditando estes mistérios do santíssimo Rosário da Bem-Aventurada Virgem Maria, imitemos o que encerram e alcancemos o que prometem. Por Cristo, Senhor Nosso. Amém.",
      },
      {
        id: "ladainha-nossa-senhora",
        titulo: "Ladainha de Nossa Senhora",
        texto:
          "Senhor, tende piedade de nós.\nCristo, tende piedade de nós.\nSenhor, tende piedade de nós.\nCristo, ouvi-nos. Cristo, atendei-nos.\n\nPai Celeste que sois Deus, tende piedade de nós.\nFilho Redentor do mundo que sois Deus, tende piedade de nós.\nEspírito Santo que sois Deus, tende piedade de nós.\nSantíssima Trindade que sois um só Deus, tende piedade de nós.\n\nSanta Maria, rogai por nós.\nSanta Mãe de Deus, rogai por nós.\nSanta Virgem das Virgens, rogai por nós.\nMãe de Cristo, rogai por nós.\nMãe da Igreja, rogai por nós.\nMãe da divina graça, rogai por nós.\nMãe puríssima, rogai por nós.\nMãe castíssima, rogai por nós.\nMãe sempre Virgem, rogai por nós.\nMãe imaculada, rogai por nós.\nMãe amável, rogai por nós.\nMãe admirável, rogai por nós.\nMãe do bom conselho, rogai por nós.\nMãe do Criador, rogai por nós.\nMãe do Salvador, rogai por nós.\nVirgem prudentíssima, rogai por nós.\nVirgem veneranda, rogai por nós.\nVirgem louvável, rogai por nós.\nVirgem poderosa, rogai por nós.\nVirgem clemente, rogai por nós.\nVirgem fiel, rogai por nós.\nEspelho de justiça, rogai por nós.\nSede da sabedoria, rogai por nós.\nCausa da nossa alegria, rogai por nós.\nVaso espiritual, rogai por nós.\nVaso honorável, rogai por nós.\nVaso insigne de devoção, rogai por nós.\nRosa mística, rogai por nós.\nTorre de Davi, rogai por nós.\nTorre de marfim, rogai por nós.\nCasa de ouro, rogai por nós.\nArca da aliança, rogai por nós.\nPorta do céu, rogai por nós.\nEstrela da manhã, rogai por nós.\nSaúde dos enfermos, rogai por nós.\nRefúgio dos pecadores, rogai por nós.\nConsoladora dos aflitos, rogai por nós.\nAuxílio dos cristãos, rogai por nós.\nRainha dos Anjos, rogai por nós.\nRainha dos Patriarcas, rogai por nós.\nRainha dos Profetas, rogai por nós.\nRainha dos Apóstolos, rogai por nós.\nRainha dos Mártires, rogai por nós.\nRainha dos Confessores, rogai por nós.\nRainha das Virgens, rogai por nós.\nRainha de todos os Santos, rogai por nós.\nRainha concebida sem pecado original, rogai por nós.\nRainha assunta ao céu, rogai por nós.\nRainha do Santíssimo Rosário, rogai por nós.\nRainha da família, rogai por nós.\nRainha da paz, rogai por nós.\n\nCordeiro de Deus, que tirais o pecado do mundo, perdoai-nos, Senhor.\nCordeiro de Deus, que tirais o pecado do mundo, ouvi-nos, Senhor.\nCordeiro de Deus, que tirais o pecado do mundo, tende piedade de nós.\n\nRogai por nós, Santa Mãe de Deus. Para que sejamos dignos das promessas de Cristo.\n\nOremos: Concedei-nos, ó Deus de bondade, a vós Vos suplicamos, que nós, vossos servos, gozemos perpétua saúde de alma e corpo, e, pela gloriosa intercessão da Bem-Aventurada Sempre Virgem Maria, sejamos livres das tristezas da vida presente e gozemos das eternas alegrias. Por Cristo, Senhor Nosso. Amém.",
      },
    ],
  },
];
