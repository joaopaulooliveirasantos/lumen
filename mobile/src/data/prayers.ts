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
    ],
  },
];
