import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as aesjs from "aes-js";
import Constants from "expo-constants";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { createClient } from "@supabase/supabase-js";

// expo-secure-store tem limite de ~2048 bytes por valor, e a sessao do Supabase
// (access token + refresh token + metadata do usuario) costuma passar disso.
// Por isso guardamos so uma chave AES no SecureStore, e o valor cifrado no
// AsyncStorage (padrao recomendado pelo Supabase para Expo/React Native).
class LargeSecureStore {
  private async getEncryptionKey(keyName: string): Promise<Uint8Array> {
    const stored = await SecureStore.getItemAsync(keyName);
    if (stored) {
      return aesjs.utils.hex.toBytes(stored);
    }

    const newKey = Crypto.getRandomBytes(32);
    await SecureStore.setItemAsync(keyName, aesjs.utils.hex.fromBytes(newKey));
    return newKey;
  }

  async getItem(key: string): Promise<string | null> {
    const encrypted = await AsyncStorage.getItem(key);
    if (!encrypted) return null;

    // A chave (SecureStore) e o valor cifrado (AsyncStorage) vivem em dois
    // sistemas de armazenamento distintos, que podem se dessincronizar entre
    // instalacoes/reinstalacoes do app (ex: um foi limpo e o outro nao). Se a
    // descriptografia falhar, trata como "sem sessao salva" em vez de deixar
    // o erro propagar e travar o app na inicializacao.
    try {
      const encryptionKey = await this.getEncryptionKey(`${key}-encryption-key`);
      const encryptedBytes = aesjs.utils.hex.toBytes(encrypted);
      const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(1));
      const decryptedBytes = cipher.decrypt(encryptedBytes);
      return aesjs.utils.utf8.fromBytes(decryptedBytes);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(`Falha ao ler item seguro "${key}", descartando.`, error);
      await this.removeItem(key);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    const encryptionKey = await this.getEncryptionKey(`${key}-encryption-key`);
    const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(1));
    const encryptedBytes = cipher.encrypt(aesjs.utils.utf8.toBytes(value));
    await AsyncStorage.setItem(key, aesjs.utils.hex.fromBytes(encryptedBytes));
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
    await SecureStore.deleteItemAsync(`${key}-encryption-key`);
  }
}

function getSupabaseConfig(): { url: string; anonKey: string } {
  const extra = Constants.expoConfig?.extra as
    | { supabaseUrl?: string; supabaseAnonKey?: string }
    | undefined;

  return {
    url: extra?.supabaseUrl ?? "",
    anonKey: extra?.supabaseAnonKey ?? "",
  };
}

const { url, anonKey } = getSupabaseConfig();

if (!url || !anonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    "Supabase nao configurado: preencha extra.supabaseUrl e extra.supabaseAnonKey em app.json.",
  );
}

export const supabase = createClient(url, anonKey, {
  auth: {
    storage: new LargeSecureStore(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: "pkce",
  },
});
