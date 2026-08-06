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

const redirectTo = Linking.createURL("auth-callback");

async function fetchProfile(session: Session): Promise<UserProfile> {
  const { data } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", session.user.id)
    .maybeSingle();

  return {
    id: session.user.id,
    email: session.user.email ?? null,
    displayName: data?.display_name ?? null,
    avatarUrl: data?.avatar_url ?? null,
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
      if (!url.includes("auth-callback")) return;
      void supabase.auth.exchangeCodeForSession(url);
      void WebBrowser.dismissBrowser();
    });

    return () => subscription.remove();
  }, []);

  async function signUp(email: string, password: string, displayName: string): Promise<SignUpResult> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: redirectTo,
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
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) throw error;
    if (!data.url) throw new Error("Nao foi possivel iniciar o login com Google.");

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== "success" || !result.url) {
      throw new Error("Login com Google cancelado.");
    }

    const { error: sessionError } = await supabase.auth.exchangeCodeForSession(result.url);
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
