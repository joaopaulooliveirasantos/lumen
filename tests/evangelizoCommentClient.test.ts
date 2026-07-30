import { describe, expect, it } from "vitest";
import { EvangelizoCommentClient } from "../src/integrations/evangelizoCommentClient";

const FIELD_BY_TYPE: Record<string, string> = {
  comment_t: `<font style="align-text:left" dir="ltr">Imitar a paciência do Senhor</font>`,
  comment_a: `<font style="align-text:left" dir="ltr">Santo Agostinho (354-430), bispo de Hipona</font>`,
  comment_s: `<font style="align-text:left" dir="ltr">«A fé e as obras», caps. 3-5</font>`,
  comment: `<font style="align-text:left" dir="ltr">Linha um do comentario.<br />\n<br />\nLinha dois do comentario.</font>`,
};

describe("EvangelizoCommentClient", () => {
  it("busca titulo, autor, fonte e texto do comentario a partir dos parametros type=comment_*", async () => {
    const requestedTypes: string[] = [];
    const client = new EvangelizoCommentClient({
      get: async (_url: string, options: { params: { type: string } }) => {
        requestedTypes.push(options.params.type);
        return { data: FIELD_BY_TYPE[options.params.type] ?? "" };
      },
    } as never);

    const result = await client.getByDate("2026-07-30");

    expect(requestedTypes.sort()).toEqual(["comment", "comment_a", "comment_s", "comment_t"]);
    expect(result?.titulo).toBe("Imitar a paciência do Senhor");
    expect(result?.autor).toBe("Santo Agostinho (354-430), bispo de Hipona");
    expect(result?.fonte).toBe("«A fé e as obras», caps. 3-5");
    expect(result?.texto).toContain("Linha um do comentario.");
    expect(result?.texto).toContain("Linha dois do comentario.");
  });

  it("retorna null quando o texto do comentario vem vazio", async () => {
    const client = new EvangelizoCommentClient({
      get: async () => ({ data: "" }),
    } as never);

    const result = await client.getByDate("2026-07-30");

    expect(result).toBeNull();
  });
});
