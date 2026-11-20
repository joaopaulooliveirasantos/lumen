import { createContext, type ComponentChildren } from "preact";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "preact/hooks";
import { App as CapApp } from "@capacitor/app";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "../native/supabase";
import { signInWithGoogle as googleSignIn } from "../native/oauth";
import {
  clearProfileCache,
  deleteAccount as deleteAccountRemote,
  deriveAuthStatus,
  loadProfile,
  parseAuthDeepLink,
  resendConfirmation,
  saveProfile,
  sendPasswordReset,
  signInWithEmail,
  signUpWithEmail,
  updatePassword,
  type AccountProfile,
  type AuthStatus,
} from "./account";

interface AuthContextValue {
  status: AuthStatus;
  session: Session | null;
  profile: AccountProfile | null;
  /** Mensagem vinda de um deep link (ex.: link expirado), para a tela de login mostrar. */
  linkMessage: string | null;
  clearLinkMessage: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: { displayName: string; email: string; phone: string; password: string }) => Promise<{ needsEmailConfirmation: boolean }>;
  signInWithGoogle: () => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  finishPasswordRecovery: (newPassword: string) => Promise<void>;
  saveProfile: (input: { displayName: string; phone: string; acceptTerms: boolean }) => Promise<void>;
  retryProfile: () => void;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth precisa estar dentro de <AuthProvider>.");
  return value;
}

export function AuthProvider({ children }: { children: ComponentChildren }) {
  const client = useMemo(() => getSupabase(), []);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [linkMessage, setLinkMessage] = useState<string | null>(null);
  const [profileAttempt, setProfileAttempt] = useState(0);
  const handledLinks = useRef(new Set<string>());

  // Sessão salva + mudanças (login, logout, renovação de token).
  useEffect(() => {
    let active = true;
    client.auth
      .getSession()
      .then(({ data }) => active && setSession(data.session))
      .catch(() => active && setSession(null))
      .finally(() => active && setLoading(false));
    const { data } = client.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      if (event === "SIGNED_OUT") setRecovery(false);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [client]);

  // Perfil do usuário atual. Só recarrega quando muda o usuário (não a cada renovação de token).
  const userId = session?.user.id ?? null;
  useEffect(() => {
    if (!session) {
      setProfile(null);
      return;
    }
    let active = true;
    setProfileLoading(true);
    loadProfile(client, session)
      .then((p) => active && setProfile(p))
      .finally(() => active && setProfileLoading(false));
    return () => {
      active = false;
    };
  }, [client, userId, profileAttempt]);

  // Links de retorno do e-mail (confirmação de cadastro e "esqueci minha senha").
  const handleUrl = useCallback(
    async (url: string) => {
      const link = parseAuthDeepLink(url);
      if (!link || handledLinks.current.has(url)) return;
      handledLinks.current.add(url);
      if (link.error || !link.code) {
        setLinkMessage(link.error ?? "Link inválido. Peça um novo.");
        return;
      }
      const { error } = await client.auth.exchangeCodeForSession(link.code);
      if (error) {
        // O link de confirmação já confirma o e-mail no servidor antes de redirecionar; se a troca
        // falhar (ex.: link aberto em outro aparelho), basta entrar com e-mail e senha.
        setLinkMessage(
          link.kind === "email-confirmed"
            ? "E-mail confirmado. Entre com seu e-mail e senha."
            : "O link expirou ou foi aberto em outro aparelho. Peça um novo.",
        );
        return;
      }
      if (link.kind === "reset-password") setRecovery(true);
    },
    [client],
  );

  useEffect(() => {
    let remove: (() => void) | undefined;
    void CapApp.addListener("appUrlOpen", ({ url }) => void handleUrl(url))
      .then((h) => (remove = () => void h.remove()))
      .catch(() => undefined);
    // App aberto pelo link com o processo fechado.
    void CapApp.getLaunchUrl()
      .then((launch) => {
        if (launch?.url) void handleUrl(launch.url);
      })
      .catch(() => undefined);
    return () => remove?.();
  }, [handleUrl]);

  const status = deriveAuthStatus({ loading, session, recovery, profile, profileLoading });

  const value: AuthContextValue = {
    status,
    session,
    profile,
    linkMessage,
    clearLinkMessage: () => setLinkMessage(null),
    signIn: (email, password) => signInWithEmail(client, email, password),
    signUp: (input) => signUpWithEmail(client, input),
    signInWithGoogle: async () => {
      await googleSignIn();
    },
    resendConfirmation: (email) => resendConfirmation(client, email),
    sendPasswordReset: (email) => sendPasswordReset(client, email),
    finishPasswordRecovery: async (newPassword) => {
      await updatePassword(client, newPassword);
      setRecovery(false);
    },
    saveProfile: async (input) => {
      if (!session) throw new Error("Sessão expirada. Entre novamente.");
      setProfile(await saveProfile(client, session, profile, input));
    },
    retryProfile: () => setProfileAttempt((n) => n + 1),
    signOut: async () => {
      const id = session?.user.id;
      // scope "local": sai deste aparelho mesmo sem rede.
      await client.auth.signOut({ scope: "local" });
      if (id) await clearProfileCache(id);
    },
    deleteAccount: async () => {
      const id = session?.user.id;
      await deleteAccountRemote(client);
      await client.auth.signOut({ scope: "local" });
      if (id) await clearProfileCache(id);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
