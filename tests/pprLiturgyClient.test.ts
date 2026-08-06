import { describe, expect, it } from "vitest";
import { PprLiturgyClient } from "../src/integrations/pprLiturgyClient";

function accordion(readingType: string, innerTitleOrRefrain: string, bodyHtml: string): string {
  return `<div class="reading-accordion" data-controller="accordion" data-liturgy-navigation-target="reading" data-reading-index="0"><div class="reading-accordion-header"><div class="reading-accordion-title"><div class="reading-type">${readingType}</div>${innerTitleOrRefrain}</div></div><div class="reading-accordion-content" data-accordion-target="content"><div class="reading-section"><div class="reading-body" data-liturgy-target="readingBody">${bodyHtml}</div></div></div></div>`;
}

function makePage(options: {
  color: string;
  title: string;
  comSegundaLeitura?: boolean;
  comMeditacao?: boolean;
}): string {
  const primeira = accordion(
    "Primeira Leitura",
    `<div class="reading-title" data-liturgy-target="gospelTitle">Leitura do Livro do profeta Isaías<span class="reading-reference">Is 1,1-2</span></div>`,
    `<p>1Assim diz o Senhor.</p>`,
  );

  const salmo = accordion(
    "Salmo Responsorial",
    `<div class="reading-refrain">O Senhor e meu pastor.<span class="reading-reference">Sl 1(1),1-2</span></div>`,
    `<p>O Senhor e meu pastor.</p><p>1 Verso A. R.</p>`,
  );

  const segunda = options.comSegundaLeitura
    ? accordion(
        "Segunda Leitura",
        `<div class="reading-title" data-liturgy-target="gospelTitle">Leitura da Carta de São Paulo aos Romanos<span class="reading-reference">Rm 1,1-2</span></div>`,
        `<p>1Irmãos, graça e paz.</p>`,
      )
    : "";

  const evangelho = accordion(
    "Evangelho",
    `<div class="reading-title" data-liturgy-target="gospelTitle">Proclamação do Evangelho de Jesus Cristo segundo Mateus<span class="reading-reference">Mt 1,1-2</span></div>`,
    `<p>1Naquele tempo, Jesus disse.</p>`,
  );

  const meditacao = options.comMeditacao
    ? accordion(
        "Meditação",
        `<div class="reading-title">Titulo da meditacao</div>`,
        `<p><p></p><p class="text-center"><b>Evangelho repetido</b></p>\n<blockquote>Texto repetido do evangelho.</blockquote>\n<p>Paragrafo da reflexao.</p>\n</p>`,
      )
    : "";

  return `<html><body><div class="liturgy-color-and-title"><div class="liturgy-color ${options.color}"></div><div class="liturgy-title" data-liturgy-target="title">${options.title}</div></div><div class="liturgy-body">${primeira}${salmo}${segunda}${evangelho}${meditacao}</div><div class="liturgy-copyright-responsive"><p>rodape</p></div></body></html>`;
}

function makeClient(html: string) {
  return new PprLiturgyClient(undefined, {
    getPageHtmlByDate: async () => html,
  });
}

describe("PprLiturgyClient", () => {
  it("monta o payload com cor, liturgia e leituras obrigatorias (sem segunda leitura, sem meditacao)", async () => {
    const html = makePage({ color: "green", title: "18º Domingo do Tempo Comum" });
    const client = makeClient(html);

    const result = (await client.getByDate("2026-08-02")) as {
      data: string;
      liturgia: string;
      cor: string;
      primeiraLeitura: { referencia: string };
      salmo: { refrao: string };
      segundaLeitura: unknown;
      evangelho: { referencia: string };
      reflexao?: unknown;
    };

    expect(result.data).toBe("02/08/2026");
    expect(result.liturgia).toBe("18º Domingo do Tempo Comum");
    expect(result.cor).toBe("Verde");
    expect(result.primeiraLeitura.referencia).toBe("Is 1,1-2");
    expect(result.salmo.refrao).toBe("O Senhor e meu pastor.");
    expect(result.segundaLeitura).toBeNull();
    expect(result.evangelho.referencia).toBe("Mt 1,1-2");
    expect(result.reflexao).toBeUndefined();
  });

  it("inclui segundaLeitura e reflexao (da meditacao) quando presentes", async () => {
    const html = makePage({
      color: "white",
      title: "São Fulano, presbítero, Memória",
      comSegundaLeitura: true,
      comMeditacao: true,
    });
    const client = makeClient(html);

    const result = (await client.getByDate("2026-08-04")) as {
      cor: string;
      segundaLeitura: { referencia: string } | null;
      reflexao?: { titulo: string; autor: string; fonte: string; texto: string; audioUrl: null };
    };

    expect(result.cor).toBe("Branco");
    expect(result.segundaLeitura?.referencia).toBe("Rm 1,1-2");
    expect(result.reflexao).toBeDefined();
    expect(result.reflexao?.titulo).toBe("Titulo da meditacao");
    expect(result.reflexao?.autor).toBe("Padre Paulo Ricardo");
    expect(result.reflexao?.texto).toBe("Paragrafo da reflexao.");
    expect(result.reflexao?.texto).not.toContain("repetido");
  });
});
