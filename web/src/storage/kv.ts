// Camada de chave-valor assíncrona; trocar a implementação aqui (ex.: Capacitor Preferences) não afeta os módulos de storage.
export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

const localStorageStore: KeyValueStore = {
  async getItem(key) {
    return window.localStorage.getItem(key);
  },
  async setItem(key, value) {
    window.localStorage.setItem(key, value);
  },
  async removeItem(key) {
    window.localStorage.removeItem(key);
  },
};

export let kv: KeyValueStore = localStorageStore;

export function setKeyValueStore(store: KeyValueStore): void {
  kv = store;
}
