import { describe, expect, it } from "vitest";
import {
  mapColor,
  parseMeditationSection,
  parsePsalmSection,
  parseReadingSection,
  parseTitle,
} from "../src/integrations/pprParsing";

describe("mapColor", () => {
  it("mapeia as cores em ingles do site para portugues", () => {
    expect(mapColor("white")).toBe("Branco");
    expect(mapColor("green")).toBe("Verde");
    expect(mapColor("red")).toBe("Vermelho");
    expect(mapColor("purple")).toBe("Roxo");
    expect(mapColor("rose")).toBe("Rosa");
  });
});

describe("parseTitle", () => {
  it("domingo sem santo: liturgia e o titulo inteiro, santo e null", () => {
    const result = parseTitle("18º Domingo do Tempo Comum");
    expect(result.liturgia).toBe("18º Domingo do Tempo Comum");
    expect(result.santo).toBeNull();
  });

  it("memoria: extrai o nome do santo removendo o sufixo de grau", () => {
    const result = parseTitle("São João Maria Vianney, presbítero, Memória");
    expect(result.santo).toBe("São João Maria Vianney, presbítero");
  });

  it("festa: extrai o nome do santo removendo o sufixo de grau", () => {
    const result = parseTitle("São Lourenço, diácono e mártir, Festa");
    expect(result.santo).toBe("São Lourenço, diácono e mártir");
  });

  it("solenidade: extrai o nome removendo o sufixo de grau", () => {
    const result = parseTitle("Todos os Santos, Solenidade");
    expect(result.santo).toBe("Todos os Santos");
  });
});

describe("parseReadingSection", () => {
  it("extrai titulo, referencia e remove numeros de versiculo colados ao texto", () => {
    const chunk = `<div class="reading-title" data-liturgy-target="gospelTitle">Leitura do Livro do profeta Isaías<span class="reading-reference" style="margin-left: 8px;">Is 1,1-3</span></div><div class="reading-accordion-content" data-accordion-target="content"><div class="reading-section"><div class="reading-body primeira leitura" data-liturgy-target="readingBody"><p>1Assim diz o Senhor: 2“Vinde a mim”. 3Ele falou.</p></div></div></div>`;

    const result = parseReadingSection(chunk);

    expect(result.titulo).toBe("Leitura do Livro do profeta Isaías");
    expect(result.referencia).toBe("Is 1,1-3");
    expect(result.texto).toBe("Assim diz o Senhor: “Vinde a mim”. Ele falou.");
  });

  it("junta multiplos paragrafos com quebra dupla de linha", () => {
    const chunk = `<div class="reading-title" data-liturgy-target="gospelTitle">Proclamação do Evangelho de Jesus Cristo segundo Mateus<span class="reading-reference" style="margin-left: 8px;">Mt 1,1-2</span></div><div class="reading-body evangelho" data-liturgy-target="readingBody"><p>1Naquele tempo, Jesus disse.</p><p>2E os discípulos ouviram.</p></div>`;

    const result = parseReadingSection(chunk);

    expect(result.texto).toBe("Naquele tempo, Jesus disse.\n\nE os discípulos ouviram.");
  });
});

describe("parsePsalmSection", () => {
  it("pula o primeiro paragrafo (repeticao do refrao) e remove numeros com espaco", () => {
    const chunk = `<div class="reading-refrain">O Senhor e meu pastor.<span class="reading-reference" style="margin-left: 8px;">Sl 22(23),1-2</span></div><div class="reading-body salmo responsorial" data-liturgy-target="readingBody"><p>O Senhor e meu pastor.</p><p>1 Verso A *<br> continuacao do verso A.<br>2 Verso B. R.</p></div>`;

    const result = parsePsalmSection(chunk);

    expect(result.referencia).toBe("Sl 22(23),1-2");
    expect(result.refrao).toBe("O Senhor e meu pastor.");
    expect(result.texto).toBe("O Senhor e meu pastor.\nVerso A *\ncontinuacao do verso A.\nVerso B. R.");
  });
});

describe("parseMeditationSection", () => {
  it("remove a citacao do evangelho e o blockquote, mantendo so os paragrafos da reflexao", () => {
    const chunk = `<div class="reading-type">Meditação</div><div class="reading-title">Titulo da meditacao</div></div><div class="reading-accordion-content" data-accordion-target="content"><div class="reading-section"><div class="reading-body meditation" data-liturgy-target="readingBody"><p><p></p><p class="text-center"><b>Evangelho de Nosso Senhor Jesus Cristo segundo Mateus<br></b></p>
<blockquote>Texto do evangelho repetido aqui.</blockquote>
<p>Primeiro paragrafo da reflexao.</p>
<p>Segundo paragrafo da reflexao.</p>
</p></div></div></div>`;

    const result = parseMeditationSection(chunk);

    expect(result).not.toBeNull();
    expect(result?.titulo).toBe("Titulo da meditacao");
    expect(result?.texto).toBe("Primeiro paragrafo da reflexao.\n\nSegundo paragrafo da reflexao.");
    expect(result?.texto).not.toContain("evangelho repetido");
  });

  it("retorna null quando a secao de meditacao nao tem os campos esperados", () => {
    const result = parseMeditationSection(`<div class="reading-type">Meditação</div>`);
    expect(result).toBeNull();
  });
});
