import { describe, expect, it } from "vitest";
import { CnbbLiturgyClient } from "../src/integrations/cnbbLiturgyClient";
import type { CnbbContent } from "../src/integrations/cnbbClient";

const detailsWithSaint = `<div><div style="font-size: 12px; font-weight: lighter; color: #AFAFAF">Terça-feira, 4 de Agosto de 2026</div><div style="font-size: 26px;"><b>São João Maria Vianney, presbítero</b>, Memória</div><div style="font-size: 20px;">18ª Semana  do Tempo Comum</div></div>`;

const bodyWithSecondReading = `<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><font color="red"><center>PRIMEIRA LEITURA</center></font><p align="right"><i>Epigrafe.<br></i></p>Leitura do Livro do Profeta Isaías <font color="#ff6666">1,1-3</font><br><div><div style="display: flex;flex-direction:row;align-items:flex-start"><div style="text-align: left; min-width: 30px; font-size: 12px; color: #FF0000">1</div><div><div style="flex: 1"><div>Texto da primeira leitura.<br>Palavra do Senhor.<br></div></div></div></div></div><br><font color="red">Salmo responsorial&nbsp;&nbsp;</font><font color="tomato">Sl 1(1),1-2 (R. 1a)</font><br><br><font color="red">R.</font> Refrão do salmo.<br><br><div><div style="display: flex;flex-direction:row;align-items:flex-start"><div style="text-align: left; min-width: 30px; font-size: 12px; color: #FF0000">1</div><div><div style="flex: 1"><div>Verso do salmo.<font color="red"> R.</font><br></div></div></div></div></div><br><font color="red"><center>SEGUNDA LEITURA</center></font><p align="right"><i>Epigrafe.<br></i></p>Leitura da Carta de São Paulo aos Romanos <font color="#ff6666">2,1-2</font><br><div><div style="display: flex;flex-direction:row;align-items:flex-start"><div style="text-align: left; min-width: 30px; font-size: 12px; color: #FF0000">1</div><div><div style="flex: 1"><div>Texto da segunda leitura.<br>Palavra do Senhor.<br></div></div></div></div></div><font color="red">Aclamação ao Evangelho&nbsp;&nbsp;</font><font color="tomato">Jo 1,1</font><br><font color="red">R. </font>Aleluia, Aleluia.<br><font color="red"><center>EVANGELHO</center></font><p align="right"><i>Epigrafe.<br></i></p><img src="cruz.png"><b>Proclamação do Evangelho de Jesus Cristo segundo Mateus&nbsp;</b><font color="tomato">3,1-2</font><br><div><div style="display: flex;flex-direction:row;align-items:flex-start"><div style="text-align: left; min-width: 30px; font-size: 12px; color: #FF0000">1</div><div><div style="flex: 1"><div>Texto do evangelho.<br>Palavra da Salvação.<br></div></div></div></div></div>`;

const bodyWithoutSecondReading = bodyWithSecondReading.replace(
  /<font color="red"><center>SEGUNDA LEITURA<\/center><\/font>[\s\S]*?(?=<font color="red">Aclamação ao Evangelho)/,
  "",
);

function makeClient(content: CnbbContent) {
  return new CnbbLiturgyClient(undefined, {
    getContentByDate: async () => content,
  });
}

describe("CnbbLiturgyClient", () => {
  it("monta o payload com cor mapeada e as quatro leituras (com segunda leitura)", async () => {
    const client = makeClient({
      date: "2026-08-04",
      filename: "x.htm",
      title: "Tempo Comum",
      color: "branco",
      details: detailsWithSaint,
      leituras: "",
      body: bodyWithSecondReading,
    });

    const result = (await client.getByDate("2026-08-04")) as {
      data: string;
      liturgia: string;
      cor: string;
      primeiraLeitura: { referencia: string; titulo: string; texto: string };
      salmo: { referencia: string; refrao: string; texto: string };
      segundaLeitura: { referencia: string; titulo: string; texto: string } | null;
      evangelho: { referencia: string; titulo: string; texto: string };
    };

    expect(result.data).toBe("04/08/2026");
    expect(result.liturgia).toBe("18ª Semana do Tempo Comum");
    expect(result.cor).toBe("Branco");
    expect(result.primeiraLeitura.referencia).toBe("1,1-3");
    expect(result.primeiraLeitura.texto).toContain("Palavra do Senhor.");
    expect(result.salmo.refrao).toBe("Refrão do salmo.");
    expect(result.segundaLeitura?.referencia).toBe("2,1-2");
    expect(result.evangelho.referencia).toBe("3,1-2");
    expect(result.evangelho.titulo).toBe("Proclamação do Evangelho de Jesus Cristo segundo Mateus");
  });

  it("retorna segundaLeitura nula quando o dia nao tem segunda leitura", async () => {
    const client = makeClient({
      date: "2026-08-04",
      filename: "x.htm",
      title: "Tempo Comum",
      color: "verde",
      details: detailsWithSaint,
      leituras: "",
      body: bodyWithoutSecondReading,
    });

    const result = (await client.getByDate("2026-08-04")) as { segundaLeitura: unknown; cor: string };

    expect(result.segundaLeitura).toBeNull();
    expect(result.cor).toBe("Verde");
  });

  it("aceita marcadores com a ordem das tags trocada e ignora bookmarks ocultos (variante observada no Natal)", async () => {
    const bodySwappedOrder = `<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><center><font color="red">PRIMEIRA LEITURA</font></center><p align="right"><i>Epigrafe.<br></i></p>Leitura do Livro do Profeta Isaías <font color="#ff6666">1,1-3</font><br><div><div style="display: flex;flex-direction:row;align-items:flex-start"><div style="text-align: left; min-width: 30px; font-size: 12px; color: #FF0000">1</div><div><div style="flex: 1"><div>Texto da primeira leitura.<br>Palavra do Senhor.<br></div></div></div></div></div><div id="1" style="display: none;"><h3 class="title-leitura">Evangelho - Mt 1,1</h3></div><br><font color="red">Salmo responsorial</font><br><font color="tomato"> Sl 1(1),1-2 (R. 1a)</font><br><br><font color="red">R.</font> Refrão do salmo.<br><br><div><div style="display: flex;flex-direction:row;align-items:flex-start"><div style="text-align: left; min-width: 30px; font-size: 12px; color: #FF0000">1</div><div><div style="flex: 1"><div>Verso do salmo.<br></div></div></div></div></div><font color="red">Aclamação ao Evangelho</font><br><font color="red">R. </font>Aleluia.<br><center><font color="red">EVANGELHO</font></center><p align="right"><i>Epigrafe.<br></i></p><img src="cruz.png"><b>Proclamação do Evangelho de Jesus Cristo segundo Mateus&nbsp;</b><font color="tomato">3,1-2</font><br><div><div style="display: flex;flex-direction:row;align-items:flex-start"><div style="text-align: left; min-width: 30px; font-size: 12px; color: #FF0000">1</div><div><div style="flex: 1"><div>Texto do evangelho.<br>Palavra da Salvação.<br></div></div></div></div></div><font color="red">Missa do dia<br></font><center><font color="red">PRIMEIRA LEITURA</font></center>outra missa que nao deve vazar`;

    const client = makeClient({
      date: "2026-12-25",
      filename: "x.htm",
      title: "Natal",
      color: "branco",
      details: detailsWithSaint,
      leituras: "",
      body: bodySwappedOrder,
    });

    const result = (await client.getByDate("2026-12-25")) as {
      primeiraLeitura: { texto: string };
      salmo: { texto: string };
      evangelho: { texto: string; referencia: string };
    };

    expect(result.primeiraLeitura.texto).toBe("Texto da primeira leitura.\nPalavra do Senhor.");
    expect(result.salmo.texto).not.toContain("Evangelho - Mt 1,1");
    expect(result.evangelho.referencia).toBe("3,1-2");
    expect(result.evangelho.texto).toBe("Texto do evangelho.\nPalavra da Salvação.");
    expect(result.evangelho.texto).not.toContain("Missa do dia");
    expect(result.evangelho.texto).not.toContain("outra missa");
  });
});
