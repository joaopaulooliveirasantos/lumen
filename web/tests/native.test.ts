import { describe, expect, it } from "vitest";
import { extractAuthCode, OAUTH_REDIRECT } from "../src/native/oauth";
import { parseTime } from "../src/native/notifications";
import { mapVoices } from "../src/native/tts";
import { isEditable, keyboardLikelyOpen } from "../src/native/keyboard";

describe("oauth", () => {
  it("extrai o code do deep link", () => {
    expect(extractAuthCode(`${OAUTH_REDIRECT}?code=abc123&state=x`)).toBe("abc123");
  });

  it("retorna null sem code ou com URL inválida", () => {
    expect(extractAuthCode(`${OAUTH_REDIRECT}?error=access_denied`)).toBeNull();
    expect(extractAuthCode("não é url")).toBeNull();
  });
});

describe("parseTime", () => {
  it("aceita HH:MM válido e rejeita o resto", () => {
    expect(parseTime("07:30")).toEqual({ hour: 7, minute: 30 });
    expect(parseTime("23:59")).toEqual({ hour: 23, minute: 59 });
    expect(parseTime("24:00")).toBeNull();
    expect(parseTime("7:30")).toBeNull();
    expect(parseTime("07:60")).toBeNull();
  });
});

describe("mapVoices", () => {
  it("preserva o índice original das vozes do plugin", () => {
    const mapped = mapVoices([
      { voiceURI: "a", name: "A", lang: "en-US" },
      { voiceURI: "b", name: "B", lang: "pt-BR" },
    ]);
    expect(mapped[1]).toEqual({ index: 1, voice: { identifier: "b", name: "B", language: "pt-BR" } });
  });
});

describe("teclado", () => {
  it("considera editáveis só campos de texto que aceitam digitação", () => {
    const text = document.createElement("input");
    const checkbox = Object.assign(document.createElement("input"), { type: "checkbox" });
    const readOnly = Object.assign(document.createElement("input"), { readOnly: true });
    expect(isEditable(text)).toBe(true);
    expect(isEditable(document.createElement("textarea"))).toBe(true);
    expect(isEditable(checkbox)).toBe(false);
    expect(isEditable(readOnly)).toBe(false);
    expect(isEditable(document.createElement("button"))).toBe(false);
    expect(isEditable(null)).toBe(false);
  });

  it("detecta o teclado pela queda de mais de 20% na altura", () => {
    expect(keyboardLikelyOpen(500, 800)).toBe(true);
    expect(keyboardLikelyOpen(760, 800)).toBe(false);
  });
});
