import AsyncStorage from "@react-native-async-storage/async-storage";
import { defaultUserSettings, type UserSettings } from "../types/settings";

const STORAGE_KEY = "lumen_user_settings_v1";

export async function loadUserSettings(): Promise<UserSettings> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    if (!value) {
      return defaultUserSettings;
    }

    const parsed = JSON.parse(value) as Partial<UserSettings>;
    return {
      ...defaultUserSettings,
      ...parsed,
    };
  } catch {
    return defaultUserSettings;
  }
}

export async function saveUserSettings(settings: UserSettings): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
