import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import termsSource from "../../doc/Termos-de-Uso.md?raw";
import {
  deriveAuthStatus,
  isProfileComplete,
  loadProfile,
  parseAuthDeepLink,
  profileFromRow,
  saveProfile,
  signUpWithEmail,
  type AccountProfile,
} from "../src/auth/account";
import { authErrorMessage, validateEmail, validateName, validatePassword } from "../src/services/authErrors";
import { formatPhoneForDisplay, formatPhoneInput, normalizePhone } from "../src/services/phone";
import { parseMarkdown } from "../src/components/Markdown";

const session = (meta: Record<string, unknown> = {}) =>
  ({ user: { id: "u1", email: "ana@exemplo.com", user_metadata: meta } }) as unknown as Session;

const complete: AccountProfile = {
  id: "u1",
  email: "ana@exemplo.com",
  displayName: "Ana",
  phone: "+5521987654321",
  avatarUrl: null,
  termsAcceptedAt: "2026-11-20T00:00:00.000Z",
  profileCompletedAt: "2026-11-20T00:00:00.000Z",
};

/** Cliente Supabase falso só com o que account.ts usa. */
function fakeClient(opts: { row?: unknown; selectError?: unknown; upsertError?: unknown; signUp?: unknown } = {}) {
  const upsert = vi.fn(async () => ({ error: opts.upsertError ?? null }));
  const client = {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => {
            if (opts.selectError) throw opts.selectError;
            return { data: opts.row ?? null, error: null };
          },
        }),
      }),
      upsert,
    }),
    auth: { signUp: vi.fn(async () => opts.signUp) },
  };
  return { client: client as unknown as SupabaseClient, upsert, signUp: client.auth.signUp };
}

beforeEach(() => window.localStorage.clear());

describe("telefone", () => {
  it.each([
    ["(21) 98765-4321", "+5521987654321"],
    ["21987654321", "+5521987654321"],
    ["021 98765 4321", "+5521987654321"],
    ["+55 21 98765-4321", "+5521987654321"],
    ["5521987654321", "+5521987654321"],
    ["(11) 3333-4444", "+551133334444"],
    ["+1 415 555 2671", "+14155552671"],
  ])("normaliza %s", (input, e164) => {
    expect(normalizePhone(input)).toEqual({ ok: true, e164 });
  });

  it.each([
    ["", "Informe seu telefone."],
    ["(20) 98765-4321", "DDD inválido."],
    ["(21) 88765-4321", "Celular com 9 dígitos deve começar com 9."],
    ["(21) 8765-4321", "Número incompleto"],
    ["98765", "Informe o DDD"],
  ])("rejeita %j", (input, message) => {
    const result = normalizePhone(input);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain(message);
  });

  it("aplica a máscara enquanto digita e formata para exibição", () => {
    expect(formatPhoneInput("2")).toBe("(2");
    expect(formatPhoneInput("2198")).toBe("(21) 98");
    expect(formatPhoneInput("2198765432")).toBe("(21) 9876-5432");
    expect(formatPhoneInput("21987654321999")).toBe("(21) 98765-4321");
    expect(formatPhoneInput("+1 415")).toBe("+1415");
    expect(formatPhoneForDisplay("+5521987654321")).toBe("(21) 98765-4321");
    expect(formatPhoneForDisplay("+14155552671")).toBe("+14155552671");
    expect(formatPhoneForDisplay(null)).toBe("");
  });
});

describe("validações e mensagens", () => {
  it("valida e-mail, senha e nome", () => {
    expect(validateEmail("ana@exemplo.com")).toBeNull();
    expect(validateEmail("ana@exemplo")).toBe("E-mail inválido.");
    expect(validatePassword("abc12345")).toBeNull();
    expect(validatePassword("abc123")).toMatch(/8 caracteres/);
    expect(validatePassword("abcdefgh")).toMatch(/letras e números/);
    expect(validateName(" A ")).toMatch(/nome/);
  });

  it("traduz erros do Supabase por código, por texto e de rede", () => {
    expect(authErrorMessage({ code: "invalid_credentials", message: "Invalid login credentials" })).toBe("E-mail ou senha incorretos.");
    expect(authErrorMessage({ message: "Email not confirmed" })).toMatch(/Confirme seu e-mail/);
    expect(authErrorMessage({ name: "AuthRetryableFetchError", message: "Failed to fetch" })).toMatch(/Sem conexão/);
    expect(authErrorMessage({ status: 429, message: "x" })).toMatch(/Muitas tentativas/);
    expect(authErrorMessage(new Error("Login cancelado."))).toBe("Login cancelado.");
  });
});

describe("portão de entrada", () => {
  const base = { loading: false, session: session(), recovery: false, profile: complete, profileLoading: false };

  it("deriva cada estado", () => {
    expect(deriveAuthStatus({ ...base, loading: true })).toBe("loading");
    expect(deriveAuthStatus({ ...base, session: null })).toBe("signedOut");
    expect(deriveAuthStatus({ ...base, recovery: true })).toBe("recovery");
    expect(deriveAuthStatus({ ...base, profile: null, profileLoading: true })).toBe("loading");
    expect(deriveAuthStatus({ ...base, profile: null })).toBe("profileError");
    expect(deriveAuthStatus({ ...base, profile: { ...complete, phone: null } })).toBe("needsProfile");
    expect(deriveAuthStatus(base)).toBe("ready");
  });

  it("perfil completo exige nome, telefone e aceite dos termos", () => {
    expect(isProfileComplete(complete)).toBe(true);
    expect(isProfileComplete({ ...complete, displayName: "  " })).toBe(false);
    expect(isProfileComplete({ ...complete, termsAcceptedAt: null })).toBe(false);
    expect(isProfileComplete(null)).toBe(false);
  });

  it("reconhece os links de retorno do e-mail", () => {
    expect(parseAuthDeepLink("lumen://email-confirmed?code=abc")).toEqual({ kind: "email-confirmed", code: "abc", error: null });
    expect(parseAuthDeepLink("lumen://reset-password?code=xyz")?.kind).toBe("reset-password");
    expect(parseAuthDeepLink("lumen://reset-password#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid")).toEqual({
      kind: "reset-password",
      code: null,
      error: "O link expirou. Peça um novo.",
    });
    expect(parseAuthDeepLink("lumen://oauth-callback?code=1")).toBeNull();
  });
});

describe("perfil", () => {
  it("usa o metadata do Google quando o perfil ainda não tem nome", () => {
    const p = profileFromRow(session({ full_name: "Ana Google", picture: "https://x/a.png" }), null);
    expect(p).toMatchObject({ displayName: "Ana Google", avatarUrl: "https://x/a.png", phone: null });
  });

  it("guarda cópia local e a usa quando o servidor falha", async () => {
    const row = { display_name: "Ana", avatar_url: null, phone: "+5521987654321", terms_accepted_at: "t", profile_completed_at: "t" };
    expect(await loadProfile(fakeClient({ row }).client, session())).toMatchObject({ displayName: "Ana", phone: "+5521987654321" });

    const offline = fakeClient({ selectError: new TypeError("Failed to fetch") }).client;
    expect(await loadProfile(offline, session())).toMatchObject({ displayName: "Ana" });

    window.localStorage.clear();
    expect(await loadProfile(offline, session())).toBeNull();
  });

  it("exige o aceite dos termos para salvar quem ainda não aceitou", async () => {
    const { client, upsert } = fakeClient();
    await expect(saveProfile(client, session(), { ...complete, termsAcceptedAt: null }, { displayName: "Ana", phone: "+5521987654321", acceptTerms: false })).rejects.toThrow(
      /aceitar/,
    );
    expect(upsert).not.toHaveBeenCalled();

    const saved = await saveProfile(client, session(), { ...complete, termsAcceptedAt: null, profileCompletedAt: null }, {
      displayName: " Ana Maria ",
      phone: "+5521987654321",
      acceptTerms: true,
    });
    expect(saved.displayName).toBe("Ana Maria");
    expect(saved.termsAcceptedAt).toBeTruthy();
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ id: "u1", phone: "+5521987654321" }), { onConflict: "id" });
  });

  it("mantém a data original do aceite ao editar", async () => {
    const { client } = fakeClient();
    const saved = await saveProfile(client, session(), complete, { displayName: "Ana", phone: "+5511987654321", acceptTerms: false });
    expect(saved.termsAcceptedAt).toBe(complete.termsAcceptedAt);
    expect(saved.phone).toBe("+5511987654321");
  });
});

describe("cadastro", () => {
  const input = { displayName: "Ana", email: " ana@exemplo.com ", phone: "+5521987654321", password: "abc12345" };

  it("envia nome, telefone e aceite no metadata e indica confirmação de e-mail", async () => {
    const { client, signUp } = fakeClient({ signUp: { data: { user: { identities: [{}] }, session: null }, error: null } });
    expect(await signUpWithEmail(client, input)).toEqual({ needsEmailConfirmation: true });
    const call = signUp.mock.calls[0] as unknown as [{ email: string; options: { data: Record<string, string>; emailRedirectTo: string } }];
    expect(call[0].email).toBe("ana@exemplo.com");
    expect(call[0].options.emailRedirectTo).toBe("lumen://email-confirmed");
    expect(call[0].options.data).toMatchObject({ display_name: "Ana", phone: "+5521987654321" });
    expect(call[0].options.data.terms_accepted_at).toBeTruthy();
  });

  it("detecta e-mail já cadastrado (usuário sem identidades)", async () => {
    const { client } = fakeClient({ signUp: { data: { user: { identities: [] }, session: null }, error: null } });
    await expect(signUpWithEmail(client, input)).rejects.toMatchObject({ code: "user_already_exists" });
  });
});

describe("textos legais", () => {
  it("interpreta títulos, listas e parágrafos dos Termos", () => {
    const blocks = parseMarkdown(termsSource);
    expect(blocks[0]).toEqual({ type: "h1", text: "Termos de Uso - Lumen Liturgia" });
    expect(blocks.some((b) => b.type === "ul" && b.items.length >= 3)).toBe(true);
    expect(termsSource).toMatch(/Excluir conta/);
  });

  it("junta itens de lista quebrados em duas linhas", () => {
    expect(parseMarkdown("- um\n  continua\n- dois\n\nfim")).toEqual([
      { type: "ul", items: ["um continua", "dois"] },
      { type: "p", text: "fim" },
    ]);
  });
});
