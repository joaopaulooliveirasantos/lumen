// Núcleo do login obrigatório (Fase 5): perfil, regras do portão de entrada e chamadas ao Supabase.
// Sem UI e sem estado global: as funções recebem o cliente, o que permite testar com um cliente falso.
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { kv } from "../storage/kv";

export const EMAIL_CONFIRM_REDIRECT = "lumen://email-confirmed";
export const PASSWORD_RESET_REDIRECT = "lumen://reset-password";

export interface AccountProfile {
  id: string;
  email: string | null;
  displayName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  termsAcceptedAt: string | null;
  profileCompletedAt: string | null;
}

/** Estados do portão de entrada (ver o fluxograma em doc/planejamento-login-obrigatorio.md). */
export type AuthStatus =
  | "loading" //       restaurando a sessão salva
  | "signedOut" //     sem sessão: tela de login
  | "recovery" //      voltou pelo link de "esqueci minha senha": definir nova senha
  | "profileError" //  com sessão, mas o perfil não carregou e não há cópia local
  | "needsProfile" //  com sessão e perfil incompleto (falta nome, telefone ou aceite dos termos)
  | "ready"; //        app liberado

export function isProfileComplete(profile: AccountProfile | null): boolean {
  return Boolean(profile?.displayName?.trim() && profile.phone && profile.termsAcceptedAt);
}

export function deriveAuthStatus(input: {
  loading: boolean;
  session: Session | null;
  recovery: boolean;
  profile: AccountProfile | null;
  profileLoading: boolean;
}): AuthStatus {
  if (input.loading) return "loading";
  if (!input.session) return "signedOut";
  if (input.recovery) return "recovery";
  if (!input.profile) return input.profileLoading ? "loading" : "profileError";
  return isProfileComplete(input.profile) ? "ready" : "needsProfile";
}

// ---- Perfil --------------------------------------------------------------------------------------

interface ProfileRow {
  display_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  terms_accepted_at: string | null;
  profile_completed_at: string | null;
}

const profileCacheKey = (userId: string) => `auth.profile.${userId}`;

function metadataString(session: Session, ...keys: string[]): string | null {
  const meta = (session.user.user_metadata ?? {}) as Record<string, unknown>;
  for (const key of keys) {
    const value = meta[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
}

export function profileFromRow(session: Session, row: ProfileRow | null): AccountProfile {
  return {
    id: session.user.id,
    email: session.user.email ?? null,
    // O perfil salvo tem prioridade sobre o metadata (que só reflete o cadastro ou o Google).
    displayName: row?.display_name ?? metadataString(session, "display_name", "full_name", "name"),
    phone: row?.phone ?? null,
    avatarUrl: row?.avatar_url ?? metadataString(session, "avatar_url", "picture"),
    termsAcceptedAt: row?.terms_accepted_at ?? null,
    profileCompletedAt: row?.profile_completed_at ?? null,
  };
}

/**
 * Busca o perfil no Supabase e guarda uma cópia local. Sem rede, devolve a cópia (quem já entrou
 * continua usando o app offline). Sem rede e sem cópia, devolve null.
 */
export async function loadProfile(client: SupabaseClient, session: Session): Promise<AccountProfile | null> {
  try {
    const { data, error } = await client
      .from("profiles")
      .select("display_name, avatar_url, phone, terms_accepted_at, profile_completed_at")
      .eq("id", session.user.id)
      .maybeSingle();
    if (error) throw error;
    const profile = profileFromRow(session, data as ProfileRow | null);
    await kv.setItem(profileCacheKey(session.user.id), JSON.stringify(profile));
    return profile;
  } catch {
    const cached = await kv.getItem(profileCacheKey(session.user.id));
    return cached ? (JSON.parse(cached) as AccountProfile) : null;
  }
}

export async function clearProfileCache(userId: string): Promise<void> {
  await kv.removeItem(profileCacheKey(userId));
}

/** Salva nome, telefone e (se ainda não havia) o aceite dos termos; marca o cadastro como completo. */
export async function saveProfile(
  client: SupabaseClient,
  session: Session,
  current: AccountProfile | null,
  input: { displayName: string; phone: string; acceptTerms: boolean },
): Promise<AccountProfile> {
  const now = new Date().toISOString();
  const termsAcceptedAt = current?.termsAcceptedAt ?? (input.acceptTerms ? now : null);
  if (!termsAcceptedAt) throw new Error("É preciso aceitar os Termos de Uso e a Política de Privacidade.");

  const row = {
    id: session.user.id,
    display_name: input.displayName.trim(),
    phone: input.phone,
    terms_accepted_at: termsAcceptedAt,
    profile_completed_at: current?.profileCompletedAt ?? now,
  };
  const { error } = await client.from("profiles").upsert(row, { onConflict: "id" });
  if (error) throw error;

  const profile = profileFromRow(session, { ...row, avatar_url: current?.avatarUrl ?? null });
  await kv.setItem(profileCacheKey(session.user.id), JSON.stringify(profile));
  return profile;
}

// ---- Conta ---------------------------------------------------------------------------------------

export async function signUpWithEmail(
  client: SupabaseClient,
  input: { displayName: string; email: string; phone: string; password: string },
): Promise<{ needsEmailConfirmation: boolean }> {
  const { data, error } = await client.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      emailRedirectTo: EMAIL_CONFIRM_REDIRECT,
      // Lidos pelo trigger handle_new_user (supabase/migrations/0002_profile_phone.sql).
      data: { display_name: input.displayName.trim(), phone: input.phone, terms_accepted_at: new Date().toISOString() },
    },
  });
  if (error) throw error;
  // Com confirmação de e-mail ligada no Supabase, o cadastro não devolve sessão.
  // Se o e-mail já existe, o Supabase devolve um usuário sem identidades (para não revelar a conta).
  if (data.user && data.user.identities?.length === 0) {
    throw Object.assign(new Error("Já existe uma conta com este e-mail."), { code: "user_already_exists" });
  }
  return { needsEmailConfirmation: !data.session };
}

export async function signInWithEmail(client: SupabaseClient, email: string, password: string): Promise<void> {
  const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
}

export async function resendConfirmation(client: SupabaseClient, email: string): Promise<void> {
  const { error } = await client.auth.resend({
    type: "signup",
    email: email.trim(),
    options: { emailRedirectTo: EMAIL_CONFIRM_REDIRECT },
  });
  if (error) throw error;
}

export async function sendPasswordReset(client: SupabaseClient, email: string): Promise<void> {
  const { error } = await client.auth.resetPasswordForEmail(email.trim(), { redirectTo: PASSWORD_RESET_REDIRECT });
  if (error) throw error;
}

export async function updatePassword(client: SupabaseClient, password: string): Promise<void> {
  const { error } = await client.auth.updateUser({ password });
  if (error) throw error;
}

export async function deleteAccount(client: SupabaseClient): Promise<void> {
  const { data, error } = await client.functions.invoke<{ ok?: boolean; error?: string }>("delete-account", { method: "POST" });
  if (error) throw new Error("Não foi possível excluir a conta agora. Tente novamente mais tarde.");
  if (!data?.ok) throw new Error(data?.error ?? "Não foi possível excluir a conta.");
}

/** Deep links de retorno do e-mail: qual fluxo e o `code` PKCE para trocar por sessão. */
export function parseAuthDeepLink(url: string): { kind: "email-confirmed" | "reset-password"; code: string | null; error: string | null } | null {
  let kind: "email-confirmed" | "reset-password";
  if (url.startsWith(EMAIL_CONFIRM_REDIRECT)) kind = "email-confirmed";
  else if (url.startsWith(PASSWORD_RESET_REDIRECT)) kind = "reset-password";
  else return null;

  // O Supabase pode mandar o erro na query (?error=) ou no fragmento (#error=).
  const query = url.includes("?") ? url.slice(url.indexOf("?") + 1).split("#")[0] : "";
  const fragment = url.includes("#") ? url.slice(url.indexOf("#") + 1) : "";
  const params = new URLSearchParams(query);
  const hashParams = new URLSearchParams(fragment);
  const errorDescription = params.get("error_description") ?? hashParams.get("error_description");
  const errorCode = params.get("error_code") ?? hashParams.get("error_code");
  return {
    kind,
    code: params.get("code"),
    error: errorDescription || errorCode ? (errorCode === "otp_expired" ? "O link expirou. Peça um novo." : errorDescription ?? "Link inválido.") : null,
  };
}
