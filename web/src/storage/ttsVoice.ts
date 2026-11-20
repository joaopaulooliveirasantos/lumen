import { kv } from "./kv";

const STORAGE_KEY = "lumen_tts_voice_identifier_v1";

export async function loadSavedVoiceIdentifier(): Promise<string | null> {
  try {
    return await kv.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export async function saveVoiceIdentifier(identifier: string): Promise<void> {
  try {
    await kv.setItem(STORAGE_KEY, identifier);
  } catch {
    // ignora falha ao persistir a preferência de voz
  }
}
