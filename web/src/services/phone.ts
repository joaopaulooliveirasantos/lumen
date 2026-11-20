// Telefone do cadastro (decisão 2 do plano de login: obrigatório, sem verificação por SMS).
// Guardado em E.164 (+5511987654321). Sem "+", o número é tratado como brasileiro (DDD + número).

// DDDs em uso no Brasil (Anatel).
const VALID_DDDS = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28, 31, 32, 33, 34, 35, 37, 38, 41, 42, 43, 44, 45, 46, 47, 48, 49,
  51, 53, 54, 55, 61, 62, 63, 64, 65, 66, 67, 68, 69, 71, 73, 74, 75, 77, 79, 81, 82, 83, 84, 85, 86, 87, 88, 89, 91, 92,
  93, 94, 95, 96, 97, 98, 99,
]);

export type PhoneResult = { ok: true; e164: string } | { ok: false; error: string };

const onlyDigits = (value: string) => value.replace(/\D/g, "");

function normalizeBrazilian(national: string): PhoneResult {
  if (national.length !== 10 && national.length !== 11) {
    return { ok: false, error: "Informe o DDD e o número, por exemplo (21) 98765-4321." };
  }
  const ddd = Number(national.slice(0, 2));
  if (!VALID_DDDS.has(ddd)) return { ok: false, error: "DDD inválido." };

  const number = national.slice(2);
  if (number.length === 9 && number[0] !== "9") return { ok: false, error: "Celular com 9 dígitos deve começar com 9." };
  if (number.length === 8 && !/^[2-5]/.test(number)) {
    return { ok: false, error: "Número incompleto: celulares têm 9 dígitos depois do DDD." };
  }
  return { ok: true, e164: `+55${national}` };
}

export function normalizePhone(input: string): PhoneResult {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, error: "Informe seu telefone." };

  if (trimmed.startsWith("+")) {
    const digits = onlyDigits(trimmed);
    if (digits.startsWith("55")) return normalizeBrazilian(digits.slice(2));
    if (digits.length < 8 || digits.length > 15 || digits.startsWith("0")) {
      return { ok: false, error: "Número internacional inválido." };
    }
    return { ok: true, e164: `+${digits}` };
  }

  let digits = onlyDigits(trimmed);
  if (digits.startsWith("0")) digits = digits.replace(/^0+/, ""); // prefixo de longa distância (0xx)
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) digits = digits.slice(2);
  return normalizeBrazilian(digits);
}

/** Máscara progressiva enquanto a pessoa digita: "(21) 98765-4321". Com "+", não mascara. */
export function formatPhoneInput(raw: string): string {
  if (raw.trim().startsWith("+")) return "+" + onlyDigits(raw).slice(0, 15);
  const d = onlyDigits(raw).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  const ddd = d.slice(0, 2);
  const rest = d.slice(2);
  if (rest.length <= 4) return `(${ddd}) ${rest}`;
  const split = rest.length === 9 ? 5 : 4;
  return `(${ddd}) ${rest.slice(0, split)}-${rest.slice(split)}`;
}

/** Exibe um E.164 brasileiro no formato nacional; outros países ficam como estão. */
export function formatPhoneForDisplay(e164: string | null | undefined): string {
  if (!e164) return "";
  if (e164.startsWith("+55")) return formatPhoneInput(e164.slice(3));
  return e164;
}
