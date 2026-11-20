const DB_NAME = "lumen";
// v1: cache da liturgia. v2: cache das Bíblias (índices e livros baixados da VPS).
const DB_VERSION = 2;
export const LITURGY_STORE = "liturgy_cache";
export const BIBLE_STORE = "bible_cache";

let dbPromise: Promise<IDBDatabase> | null = null;

export function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(LITURGY_STORE)) {
          db.createObjectStore(LITURGY_STORE, { keyPath: "date" });
        }
        if (!db.objectStoreNames.contains(BIBLE_STORE)) {
          db.createObjectStore(BIBLE_STORE, { keyPath: "key" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        dbPromise = null;
        reject(request.error);
      };
    });
  }
  return dbPromise;
}

/** Só para testes: fecha a conexão para que o próximo acesso reabra o banco. */
export async function resetDbConnection(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise.catch(() => null);
    db?.close();
  }
  dbPromise = null;
}

export async function idbGet<T>(store: string, key: string): Promise<T | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(store, "readonly").objectStore(store).get(key);
    request.onsuccess = () => resolve(request.result as T | undefined);
    request.onerror = () => reject(request.error);
  });
}

export async function idbPut<T>(store: string, value: T): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(value);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Chaves que começam com `prefix` (busca por intervalo, sem carregar os valores). */
export async function idbKeysWithPrefix(store: string, prefix: string): Promise<string[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const range = IDBKeyRange.bound(prefix, `${prefix}￿`);
    const request = db.transaction(store, "readonly").objectStore(store).getAllKeys(range);
    request.onsuccess = () => resolve(request.result as string[]);
    request.onerror = () => reject(request.error);
  });
}

export async function idbDeleteWithPrefix(store: string, prefix: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).delete(IDBKeyRange.bound(prefix, `${prefix}￿`));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
