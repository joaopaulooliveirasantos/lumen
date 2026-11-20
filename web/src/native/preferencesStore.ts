import { Preferences } from "@capacitor/preferences";
import type { KeyValueStore } from "../storage/kv";

export const preferencesStore: KeyValueStore = {
  async getItem(key) {
    const { value } = await Preferences.get({ key });
    return value;
  },
  async setItem(key, value) {
    await Preferences.set({ key, value });
  },
  async removeItem(key) {
    await Preferences.remove({ key });
  },
};
