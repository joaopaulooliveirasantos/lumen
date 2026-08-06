import { describe, expect, it } from "vitest";
import { parseDetails, parsePsalmChunk, parseReadingChunk } from "../src/integrations/cnbbParsing";

const sundayDetails = `<div><div style="display: flex; flex-direction: flex-start; align-items: center"><div style="padding: 0 10px 10px 0"><img src="https://liturgiadiaria.edicoescnbb.com.br/estolas/verde.png" style="width: 30px;"></div><div style="flex: 1"><div style="font-size: 12px; font-weight: lighter; color: #AFAFAF">Domingo, 2 de Agosto de 2026</div><div style="font-size: 26px;"><b>18º Domingo  do Tempo Comum</b>, Ano A</div></div></div><div style="padding: 30px 35px"><div style="color: #6a6a6a;">Leituras: </div><div>Is 55,1-3</div></div></div>`;

const weekdayWithSaintDetails = `<div><div style="display: flex; flex-direction: flex-start; align-items: center"><div style="padding: 0 10px 10px 0"><img src="https://liturgiadiaria.edicoescnbb.com.br/estolas/branco.png" style="width: 30px;"></div><div style="flex: 1"><div style="font-size: 12px; font-weight: lighter; color: #AFAFAF">Terça-feira, 4 de Agosto de 2026</div><div style="font-size: 26px;"><b>São João Maria Vianney, presbítero</b>, Memória</div><div style="font-size: 20px;">18ª Semana  do Tempo Comum</div></div></div><div style="padding: 30px 35px"><div style="color: #6a6a6a;">Leituras: </div><div>Jr 30,1-2</div></div></div>`;

describe("parseDetails", () => {
  it("domingo sem santo: liturgia vem do titulo em negrito e santo e null", () => {
    const result = parseDetails(sundayDetails);
    expect(result.liturgia).toBe("18º Domingo do Tempo Comum");
    expect(result.santo).toBeNull();
  });

  it("dia de semana com memoria: liturgia vem da semana e santo do titulo em negrito", () => {
    const result = parseDetails(weekdayWithSaintDetails);
    expect(result.liturgia).toBe("18ª Semana do Tempo Comum");
    expect(result.santo).toBe("São João Maria Vianney, presbítero");
  });
});

describe("parseReadingChunk", () => {
  it("extrai titulo, referencia e texto de um bloco de leitura", () => {
    const chunk = `<p align="right"><i>Epigrafe da leitura.<br></i></p>Leitura do Livro do Profeta Isaías <font color="#ff6666">1,1-3</font><br><div><div style="display: flex;flex-direction:row;align-items:flex-start"><div style="text-align: left; min-width: 30px; font-size: 12px; color: #FF0000">1</div><div><div style="flex: 1"><div>Texto da leitura linha 1.<br></div></div></div></div></div><div><div style="display: flex;flex-direction:row;align-items:flex-start"><div style="text-align: left; min-width: 30px; font-size: 12px; color: #FF0000">2</div><div><div style="flex: 1"><div>Texto da leitura linha 2.<br>Palavra do Senhor.<br></div></div></div></div></div>`;

    const result = parseReadingChunk(chunk);

    expect(result.titulo).toBe("Leitura do Livro do Profeta Isaías");
    expect(result.referencia).toBe("1,1-3");
    expect(result.texto).toBe("Texto da leitura linha 1.\nTexto da leitura linha 2.\nPalavra do Senhor.");
  });

  it("extrai o titulo do evangelho mesmo com a marcacao em negrito e imagem da cruz", () => {
    const chunk = `<p align="right"><i>Epigrafe do evangelho.<br></i></p><img src="cruz.png" width="32" height="32"><b>Proclamação do Evangelho de Jesus Cristo segundo Mateus&nbsp;</b><font color="tomato">3,1-2</font><br><div><div style="display: flex;flex-direction:row;align-items:flex-start"><div style="text-align: left; min-width: 30px; font-size: 12px; color: #FF0000">1</div><div><div style="flex: 1"><div>Texto do evangelho.<br>Palavra da Salvação.<br></div></div></div></div></div>`;

    const result = parseReadingChunk(chunk);

    expect(result.titulo).toBe("Proclamação do Evangelho de Jesus Cristo segundo Mateus");
    expect(result.referencia).toBe("3,1-2");
    expect(result.texto).toBe("Texto do evangelho.\nPalavra da Salvação.");
  });
});

describe("parsePsalmChunk", () => {
  it("extrai referencia, refrao e texto (com refrao repetido na primeira linha)", () => {
    const chunk = `<font color="tomato">Sl 1(1),1-2 (R. 1a)</font><br><br><font color="red">R.</font> Refrão do salmo.<br><br><div><div style="display: flex;flex-direction:row;align-items:flex-start"><div style="text-align: left; min-width: 30px; font-size: 12px; color: #FF0000">1</div><div><div style="flex: 1"><div>Verso A do salmo.<font color="red"> R.</font><br></div></div></div></div></div><div><div style="display: flex;flex-direction:row;align-items:flex-start"><div style="text-align: left; min-width: 30px; font-size: 12px; color: #FF0000">2</div><div><div style="flex: 1"><div>Verso B do salmo.<br></div></div></div></div></div>`;

    const result = parsePsalmChunk(chunk);

    expect(result.referencia).toBe("Sl 1(1),1-2 (R. 1a)");
    expect(result.refrao).toBe("Refrão do salmo.");
    expect(result.texto).toBe("Refrão do salmo.\nVerso A do salmo. R.\nVerso B do salmo.");
  });

  it("aceita refrao dentro de div/span.refrao_salmo com cor #ff0000 (variante observada em festas)", () => {
    const chunk = `<font color="tomato"> Sl 2(2),1-2 (R. 5a)</font><br><br><div class="refrao_salmo"><font color="#ff0000">R.</font> Feliz quem confia no Senhor.</div><br><div><div style="display: flex;flex-direction:row;align-items:flex-start"><div style="text-align: left; min-width: 30px; font-size: 12px; color: #FF0000">1</div><div><div style="flex: 1"><div>Verso A.<span class="tabulacao"> </span><span class="tabulacao"><font color="#ff0000">R.</font></span></div></div></div></div></div><div><div style="display: flex;flex-direction:row;align-items:flex-start"><div style="text-align: left; min-width: 30px; font-size: 12px; color: #FF0000">2</div><div><div style="flex: 1"><div>Verso B.</div></div></div></div></div>`;

    const result = parsePsalmChunk(chunk);

    expect(result.referencia).toBe("Sl 2(2),1-2 (R. 5a)");
    expect(result.refrao).toBe("Feliz quem confia no Senhor.");
    expect(result.texto).toBe("Feliz quem confia no Senhor.\nVerso A. R.\nVerso B.");
  });

  it("aceita <br> dentro da propria tag de referencia (variante observada na Epifania)", () => {
    const chunk = `<font color="tomato"><br>Sl 3(3),1-2 (R. cf. 11)</font><br><br><font color="red">R.</font> Refrao com br na referencia.<br><br><div><div style="display: flex;flex-direction:row;align-items:flex-start"><div style="text-align: left; min-width: 30px; font-size: 12px; color: #FF0000">1</div><div><div style="flex: 1"><div>Verso unico.<br></div></div></div></div></div>`;

    const result = parsePsalmChunk(chunk);

    expect(result.referencia).toBe("Sl 3(3),1-2 (R. cf. 11)");
    expect(result.texto).toContain("Verso unico.");
  });
});

describe("extractVerses - variante com divs aninhados sem <br>", () => {
  it("nao trunca versiculos que usam <div> em vez de <br> para separar linhas", () => {
    const chunk = `Leitura do Livro do Apocalipse <font color="#ff6666">1,1-2</font><br><div><div style="display: flex;flex-direction:row;align-items:flex-start"><div style="text-align: left; min-width: 30px; font-size: 12px; color: #FF0000">1</div><div><div style="flex: 1"><div><div>Primeira linha do versiculo.</div><div>Segunda linha do mesmo versiculo.</div></div></div></div></div></div><div><div style="display: flex;flex-direction:row;align-items:flex-start"><div style="text-align: left; min-width: 30px; font-size: 12px; color: #FF0000">2</div><div><div style="flex: 1"><div>Palavra do Senhor.</div></div></div></div></div>`;

    const result = parseReadingChunk(chunk);

    expect(result.texto).toBe(
      "Primeira linha do versiculo.\nSegunda linha do mesmo versiculo.\nPalavra do Senhor.",
    );
  });
});

describe("parseReadingChunk - marcadores com bookmarks ocultos e formula de encerramento", () => {
  it("corta qualquer conteudo apos a formula de encerramento (ex.: vazamento de outra missa)", () => {
    const chunk = `Leitura do Livro do Profeta Isaías <font color="#ff0000">1,1-2</font><br><div><div style="display: flex;flex-direction:row;align-items:flex-start"><div style="text-align: left; min-width: 30px; font-size: 12px; color: #FF0000">1</div><div><div style="flex: 1"><div>Texto da leitura.<br>Palavra do Senhor.<br></div></div></div></div></div><font color="red">Missa do dia<br></font>`;

    const result = parseReadingChunk(chunk);

    expect(result.texto).toBe("Texto da leitura.\nPalavra do Senhor.");
  });
});
