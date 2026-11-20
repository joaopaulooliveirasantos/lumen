import { useEffect, useMemo, useState } from "preact/hooks";
import { BottomTabBar, type TabName } from "./components/BottomTabBar";
import { HomeScreen } from "./screens/HomeScreen";
import { PlaceholderScreen } from "./screens/PlaceholderScreen";
import { formatIsoDate } from "./services/date";
import { loadUserSettings } from "./storage/userSettings";
import { applyTheme, getThemePalette, liturgicColorHex } from "./theme/palette";
import { defaultUserSettings, type UserSettings } from "./types/settings";
import type { DailyLiturgyPayload } from "./types/liturgy";

const DEFAULT_ACCENT = "#2E7D32";

export function App() {
  const [activeTab, setActiveTab] = useState<TabName>("home");
  const [settings, setSettings] = useState<UserSettings>(defaultUserSettings);
  const [payload, setPayload] = useState<DailyLiturgyPayload | null>(null);
  const today = useMemo(() => formatIsoDate(new Date()), []);

  useEffect(() => {
    void loadUserSettings().then(setSettings);
  }, []);

  const accent = payload ? liturgicColorHex(payload.cor) : DEFAULT_ACCENT;

  useEffect(() => {
    applyTheme(getThemePalette(settings.readingMode, accent), settings.fontScale);
  }, [settings, accent]);

  return (
    <div class="app">
      <main class="app-content">
        {activeTab === "home" ? <HomeScreen date={today} onLiturgyLoaded={setPayload} /> : null}
        {activeTab === "liturgia" ? <PlaceholderScreen title="Liturgia Diária" /> : null}
        {activeTab === "biblia" ? <PlaceholderScreen title="Bíblia" /> : null}
        {activeTab === "oracoes" ? <PlaceholderScreen title="Orações" /> : null}
        {activeTab === "perfil" ? <PlaceholderScreen title="Perfil" /> : null}
      </main>
      <BottomTabBar activeTab={activeTab} onTabPress={setActiveTab} />
    </div>
  );
}
