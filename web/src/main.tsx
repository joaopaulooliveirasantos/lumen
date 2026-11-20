import { render } from "preact";
import { App } from "./App";
import { scheduleDailyReminder } from "./native/notifications";
import { isNative } from "./native/platform";
import { preferencesStore } from "./native/preferencesStore";
import { setKeyValueStore } from "./storage/kv";
import { migrateLegacyStorage } from "./storage/legacyMigration";
import { loadUserSettings, saveUserSettings } from "./storage/userSettings";
import "./styles.css";

if (isNative()) setKeyValueStore(preferencesStore);

/** Dados do app RN anterior: copiados antes de o app ler o armazenamento (só na 1ª abertura). */
async function migrate(): Promise<void> {
  const { reminderToReschedule } = await migrateLegacyStorage();
  if (!reminderToReschedule) return;
  const ok = await scheduleDailyReminder(reminderToReschedule, { askPermission: false }).catch(() => false);
  if (!ok) await saveUserSettings({ ...(await loadUserSettings()), reminderEnabled: false });
}

// A migração nunca impede o app de abrir: em caso de erro ou demora, segue sem ela.
const timeout = new Promise<void>((resolve) => setTimeout(resolve, 4000));
void Promise.race([migrate().catch((e) => console.warn("Migração do RN falhou", e)), timeout]).then(() =>
  render(<App />, document.getElementById("app")!),
);
