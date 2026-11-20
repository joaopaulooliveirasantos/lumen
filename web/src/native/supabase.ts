import { SecureStorage } from "@aparajita/capacitor-secure-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Tokens da sessão ficam no armazenamento seguro (Keystore no Android), nunca em localStorage.
const secureAdapter = {
  getItem: (key: string) => SecureStorage.getItem(key),
  setItem: (key: string, value: string) => SecureStorage.setItem(key, value),
  removeItem: (key: string) => SecureStorage.removeItem(key),
};

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error("Supabase não configurado (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).");
    }
    client = createClient(url, key, {
      auth: {
        storage: secureAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        flowType: "pkce",
      },
    });
  }
  return client;
}

export { SecureStorage };
