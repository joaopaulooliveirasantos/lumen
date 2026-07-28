"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const getDailyLiturgy_1 = require("../src/serverless/getDailyLiturgy");
(0, vitest_1.describe)("getDailyLiturgy handler", () => {
    (0, vitest_1.it)("retorna 400 para data invalida", async () => {
        const response = await (0, getDailyLiturgy_1.getDailyLiturgy)({
            query: { date: "28/07/2026" },
        });
        (0, vitest_1.expect)(response.statusCode).toBe(400);
        (0, vitest_1.expect)(response.body).toContain("YYYY-MM-DD");
    });
});
