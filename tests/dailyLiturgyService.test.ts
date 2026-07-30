import { describe, expect, it } from "vitest";
import { DailyLiturgyService } from "../src/services/dailyLiturgyService";

describe("DailyLiturgyService", () => {
  it("consolida liturgia e reflexao", async () => {
    const liturgyClient = {
      getByDate: async () => ({
        data: "28/07/2026",
        liturgia: "Terca-feira da 17a Semana do Tempo Comum",
        cor: "Verde",
        primeiraLeitura: {
          referencia: "Jeremias 14, 17-22",
          titulo: "Nao rejeites o teu povo",
          texto: "Assim fala o Senhor",
        },
        salmo: {
          referencia: "Sl 78(79)",
          refrao: "Socorrei-nos, o Deus",
          texto: "Nao vos lembreis",
        },
        segundaLeitura: null,
        evangelho: {
          referencia: "Mateus 13, 36-43",
          titulo: "Explicacao da parabola do joio",
          texto: "Naquele tempo, Jesus",
        },
      }),
    };

    const reflectionClient = {
      getByDate: async () => ({
        titulo: "Imitar a paciencia do Senhor",
        autor: "Santo Agostinho",
        fonte: "«A fe e as obras», caps. 3-5",
        texto: "Homilia do evangelho do dia",
      }),
    };

    const service = new DailyLiturgyService(liturgyClient as never, reflectionClient as never);
    const result = await service.getDailyPayload("2026-07-28");

    expect(result.cor).toBe("Verde");
    expect(result.reflexao.titulo).toBe("Imitar a paciencia do Senhor");
    expect(result.reflexao.autor).toBe("Santo Agostinho");
    expect(result.reflexao.fonte).toBe("«A fe e as obras», caps. 3-5");
    expect(result.reflexao.texto).toBe("Homilia do evangelho do dia");
    expect(result.reflexao.audioUrl).toBeNull();
  });

  it("lanca erro com liturgia incompleta", async () => {
    const liturgyClient = {
      getByDate: async () => ({ liturgia: "Teste" }),
    };

    const reflectionClient = {
      getByDate: async () => null,
    };

    const service = new DailyLiturgyService(liturgyClient as never, reflectionClient as never);

    await expect(service.getDailyPayload("2026-07-28")).rejects.toThrow(
      "Dados de liturgia incompletos para a data solicitada.",
    );
  });
});
