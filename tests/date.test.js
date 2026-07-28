"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const date_1 = require("../src/utils/date");
(0, vitest_1.describe)("date utils", () => {
    (0, vitest_1.it)("valida data ISO correta", () => {
        (0, vitest_1.expect)((0, date_1.isValidIsoDate)("2026-07-28")).toBe(true);
    });
    (0, vitest_1.it)("rejeita formato invalido", () => {
        (0, vitest_1.expect)((0, date_1.isValidIsoDate)("28/07/2026")).toBe(false);
    });
    (0, vitest_1.it)("converte para formato brasileiro", () => {
        (0, vitest_1.expect)((0, date_1.toBrazilianDate)("2026-07-28")).toBe("28/07/2026");
    });
});
