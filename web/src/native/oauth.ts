import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import type { PluginListenerHandle } from "@capacitor/core";
import { getSupabase } from "./supabase";

export const OAUTH_REDIRECT = "lumen://oauth-callback";
const TIMEOUT_MS = 120_000;
const CLOSED_GRACE_MS = 1_500;

// exchangeCodeForSession espera só o valor de "code", não a URL inteira.
export function extractAuthCode(url: string): string | null {
  try {
    return new URL(url).searchParams.get("code");
  } catch {
    return null;
  }
}

function waitForCallback(): { promise: Promise<string>; dispose: () => void } {
  const handles: PluginListenerHandle[] = [];
  let timers: ReturnType<typeof setTimeout>[] = [];
  const dispose = () => {
    timers.forEach(clearTimeout);
    timers = [];
    handles.splice(0).forEach((h) => void h.remove());
  };

  const promise = new Promise<string>((resolve, reject) => {
    timers.push(setTimeout(() => reject(new Error("Tempo esgotado aguardando o login.")), TIMEOUT_MS));

    void App.addListener("appUrlOpen", ({ url }) => {
      if (url.startsWith(OAUTH_REDIRECT)) resolve(url);
    }).then((h) => handles.push(h));

    // Se o usuário fecha a aba sem concluir, o deep link não chega.
    void Browser.addListener("browserFinished", () => {
      timers.push(setTimeout(() => reject(new Error("Login cancelado.")), CLOSED_GRACE_MS));
    }).then((h) => handles.push(h));
  });

  return { promise, dispose };
}

export async function signInWithGoogle(): Promise<string | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: OAUTH_REDIRECT, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data.url) throw new Error("Não foi possível iniciar o login com Google.");

  const { promise, dispose } = waitForCallback();
  try {
    await Browser.open({ url: data.url });
    const callbackUrl = await promise;
    const code = extractAuthCode(callbackUrl);
    if (!code) throw new Error("Resposta inválida do login com Google (sem code).");

    const { data: session, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
    if (sessionError) throw sessionError;
    return session.user?.email ?? null;
  } finally {
    dispose();
    void Browser.close().catch(() => undefined);
  }
}

export async function signOut(): Promise<void> {
  await getSupabase().auth.signOut();
}

export async function currentUserEmail(): Promise<string | null> {
  const { data } = await getSupabase().auth.getSession();
  return data.session?.user.email ?? null;
}
