import { describe, expect, it } from "vitest";
import { extractSaintUrlForDay, parseSaintStory } from "../src/integrations/cancaoNovaParsing";

const calendarAjaxHtml = `
<div id="cn-calendar" class="widget-container">
  <table id="wp-calendar">
    <tbody>
      <tr>
        <td id=""><a href="https://santo.cancaonova.com/santo/sao-joao-maria-vianney-padroeiro-dos-sacerdotes-2/?sDia=4&sMes=8&sAno=2026">4</a></td>
        <td id=""><a href="https://santo.cancaonova.com/santo/dedicacao-da-basilica-de-santa-maria-maior/?sDia=5&sMes=8&sAno=2026">5</a></td>
        <td id=""><a href="https://santo.cancaonova.com/santo/santa-teresa-benedita-da-cruz-edith-stein-martir/?sDia=9&sMes=8&sAno=2026">9</a></td>
        <td id=""><a href="https://santo.cancaonova.com/santo/santa-joana-francisca-de-chantal-amiga-de-sao-francisco-de-sales/?sDia=14&sMes=8&sAno=2026">14</a></td>
      </tr>
    </tbody>
  </table>
</div>
`;

describe("extractSaintUrlForDay", () => {
  it("extrai a url do santo do dia pedido dentro do calendario do mes", () => {
    expect(extractSaintUrlForDay(calendarAjaxHtml, 4, 8)).toBe(
      "https://santo.cancaonova.com/santo/sao-joao-maria-vianney-padroeiro-dos-sacerdotes-2/",
    );
    expect(extractSaintUrlForDay(calendarAjaxHtml, 5, 8)).toBe(
      "https://santo.cancaonova.com/santo/dedicacao-da-basilica-de-santa-maria-maior/",
    );
  });

  it("nao confunde dia 4 com dia 14 (prefixo numerico)", () => {
    expect(extractSaintUrlForDay(calendarAjaxHtml, 4, 8)).not.toContain("joana-francisca");
    expect(extractSaintUrlForDay(calendarAjaxHtml, 14, 8)).toBe(
      "https://santo.cancaonova.com/santo/santa-joana-francisca-de-chantal-amiga-de-sao-francisco-de-sales/",
    );
  });

  it("retorna null quando o dia nao esta presente no calendario retornado", () => {
    expect(extractSaintUrlForDay(calendarAjaxHtml, 20, 8)).toBeNull();
  });
});

const detailHtml = `
<h1 class="entry-title">
  <span>São João Maria Vianney, padroeiro dos sacerdotes</span>
</h1>
<div id="content-post">
  <article id="post-11575" class="post-11575 santo type-santo status-publish has-post-thumbnail hentry">
    <input type="hidden" id="dia-santo" value="04">
    <input type="hidden" id="mes-santo" value="Ago">
    <div class="entry-content content-santo">
      <ul id='share-buttons' style="display:none">
        <li id="sh-facebook"><a class="fa fa-facebook-square fa-lg" href="http://www.facebook.com/sharer.php?u=x" target="_blank"></a></li>
        <li id="sh-twitter"><a href="https://twitter.com/intent/tweet"><img src="https://static.cancaonova.com/images/icon-x-extwitter.svg" width="18" height="20" /></a></li>
        <li id="sh-facebook-messenger" style=" display:none "><a class="icon-messenger" href="fb-messenger://share"><div class="msg-container"><div class="blue"></div></div></a></li>
      </ul>
      <ul id='share-buttons' style="display:none">
        <li id="sh-twitter"><a href="https://twitter.com/intent/tweet"><img src="https://static.cancaonova.com/images/icon-x-extwitter-branco.svg" width="18" height="20" /></a></li>
      </ul>
      <p><a href="https://img.cancaonova.com/foto.jpg"><img class="wp-image-14295" src="https://img.cancaonova.com/foto-300x225.jpg" alt="" width="300" height="225" /></a></p>
      <p><strong>Origens</strong></p>
      <p>São João Maria Vianney nasceu no ano de 1786, em Dardilly, França.</p>
      <p><strong>Rude camponês</strong></p>
      <p>Ele enfrentou a resistência do pai para seguir a vida religiosa.</p>
      <p><strong>Minha oração</strong></p>
      <p><em>&#8220;São João Maria Vianney, peço a vossa intercessão.&#8221;</em></p>
      <p><strong>São João Maria Vianney, rogai por nós!</strong></p>
      <p><strong>Outros santos e beatos celebrados em 4 de agosto: </strong></p>
      <ul>
        <li>Comemoração de Santo <strong>Aristarco de Tessalônica</strong>.</li>
        <li><b>Fontes:</b></li>
        <li>vatican.va e vaticannews.va</li>
      </ul>
      <p>– Produção e edição: Bianca Vargas</p>
    </div>
  </article>
</div>
`;

describe("parseSaintStory", () => {
  it("extrai nome, imagem e paragrafos da biografia, sem o apendice de outros santos", () => {
    const result = parseSaintStory(detailHtml);

    expect(result.nome).toBe("São João Maria Vianney, padroeiro dos sacerdotes");
    expect(result.imagemUrl).toBe("https://img.cancaonova.com/foto-300x225.jpg");
    expect(result.paragrafos).toEqual([
      { tipo: "titulo", texto: "Origens" },
      { tipo: "texto", texto: "São João Maria Vianney nasceu no ano de 1786, em Dardilly, França." },
      { tipo: "titulo", texto: "Rude camponês" },
      { tipo: "texto", texto: "Ele enfrentou a resistência do pai para seguir a vida religiosa." },
      { tipo: "titulo", texto: "Minha oração" },
      { tipo: "texto", texto: "“São João Maria Vianney, peço a vossa intercessão.”" },
      { tipo: "titulo", texto: "São João Maria Vianney, rogai por nós!" },
    ]);
  });

  it("lanca erro quando o titulo nao e encontrado", () => {
    expect(() => parseSaintStory("<div class=\"entry-content content-santo\">x</div></article>")).toThrow();
  });

  it("lanca erro quando o conteudo nao e encontrado", () => {
    expect(() => parseSaintStory('<h1 class="entry-title"><span>Santo X</span></h1>')).toThrow();
  });

  it("codifica acentos no nome do arquivo da imagem (o servidor de imagens devolve 404 para a url crua)", () => {
    const html = `<h1 class="entry-title"><span>Santa X</span></h1><div class="entry-content content-santo"><p><img src="https://img.cancaonova.com/cnimages/São-João-1.jpg" /></p><p><strong>Origens</strong></p><p>Texto.</p></div></article>`;

    const result = parseSaintStory(html);

    expect(result.imagemUrl).toBe("https://img.cancaonova.com/cnimages/S%C3%A3o-Jo%C3%A3o-1.jpg");
  });
});
