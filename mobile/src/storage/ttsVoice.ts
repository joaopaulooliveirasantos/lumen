import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "lumen_tts_voice_identifier_v1";

export async function loadSavedVoiceIdentifier(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export async function saveVoiceIdentifier(identifier: string): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, identifier);
  } catch {
    // ignora falha ao persistir a preferência de voz
  }
}
