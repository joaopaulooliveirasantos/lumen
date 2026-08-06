import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../services/supabaseClient";
import type { UserProfile } from "../types/user";

export type SignUpResult = { needsEmailConfirmation: boolean };

type AuthContextValue = {
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<SignUpResult>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Caminhos diferentes para cada fluxo: o login social (Google) troca o codigo
// PKCE explicitamente a partir do retorno do WebBrowser, dentro de signInWithGoogle.
// Se o listener global do Linking tambem tentasse processar essa mesma URL, os
// dois disparariam a troca do mesmo codigo (uso unico) e o segundo falharia com
// "invalid flow state, no valid flow state found". Por isso o listener global so
// cuida do link de confirmacao de email, que usa um caminho proprio.
const emailConfirmRedirectTo = Linking.createURL("email-confirmed");
const oauthRedirectTo = Linking.createURL("oauth-callback");

// exchangeCodeForSession espera so o valor do parametro "code", nao a URL
// inteira — passar a URL completa faz o servidor responder 404 "invalid flow
// state" porque ele nao reconhece a URL como um auth_code valido.
function extractAuthCode(url: string): string | null {
  const { queryParams } = Linking.parse(url);
  const code = queryParams?.code;
  return typeof code === "string" ? code : null;
}

async function fetchProfile(session: Session): Promise<UserProfile> {
  const { data } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", session.user.id)
    .maybeSingle();

  // A tabela profiles so e preenchida na criacao da conta (trigger). O
  // metadata da sessao atual e sempre a fonte mais fresca (ex: foto do
  // Google pode ter mudado desde o cadastro), entao ele tem prioridade.
  const metadata = session.user.user_metadata as Record<string, unknown> | undefined;
  const metadataAvatar = typeof metadata?.avatar_url === "string" ? metadata.avatar_url : null;
  const metadataName =
    typeof metadata?.display_name === "string"
      ? metadata.display_name
      : typeof metadata?.full_name === "string"
        ? metadata.full_name
        : typeof metadata?.name === "string"
          ? metadata.name
          : null;

  return {
    id: session.user.id,
    email: session.user.email ?? null,
    displayName: metadataName ?? data?.display_name ?? null,
    avatarUrl: metadataAvatar ?? data?.avatar_url ?? null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setProfile(null);
      return;
    }
    void fetchProfile(session).then(setProfile);
  }, [session]);

  useEffect(() => {
    const subscription = Linking.addEventListener("url", ({ url }) => {
      if (!url.includes("email-confirmed")) return;
      const code = extractAuthCode(url);
      if (code) void supabase.auth.exchangeCodeForSession(code);
    });

    return () => subscription.remove();
  }, []);

  async function signUp(email: string, password: string, displayName: string): Promise<SignUpResult> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: emailConfirmRedirectTo,
      },
    });
    if (error) throw error;

    return { needsEmailConfirmation: !data.session };
  }

  async function signIn(email: string, password: string): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signInWithGoogle(): Promise<void> {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: oauthRedirectTo, skipBrowserRedirect: true },
    });
    if (error) throw error;
    if (!data.url) throw new Error("Nao foi possivel iniciar o login com Google.");

    const result = await WebBrowser.openAuthSessionAsync(data.url, oauthRedirectTo);
    if (result.type !== "success" || !result.url) {
      throw new Error("Login com Google cancelado.");
    }

    const code = extractAuthCode(result.url);
    if (!code) throw new Error("Resposta invalida do login com Google (sem code).");

    const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
    if (sessionError) throw sessionError;
  }

  async function signInWithApple(): Promise<void> {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) {
      throw new Error("Resposta invalida do login com Apple.");
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: "apple",
      token: credential.identityToken,
    });
    if (error) throw error;
  }

  async function signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  const value = useMemo<AuthContextValue>(
    () => ({ session, profile, loading, signUp, signIn, signInWithGoogle, signInWithApple, signOut }),
    [session, profile, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider.");
  }
  return context;
}
