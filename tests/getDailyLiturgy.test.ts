import { describe, expect, it } from "vitest";
import { getDailyLiturgy } from "../src/serverless/getDailyLiturgy";

describe("getDailyLiturgy handler", () => {
  it("retorna 400 para data invalida", async () => {
    const response = await getDailyLiturgy({
      query: { date: "28/07/2026" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.body).toContain("YYYY-MM-DD");
  });
});
