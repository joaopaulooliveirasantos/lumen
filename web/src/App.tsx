import { useEffect, useMemo, useState } from "preact/hooks";
import { BottomTabBar, type TabName } from "./components/BottomTabBar";
import { BRAND_GREEN, LoadingScreen } from "./components/LoadingScreen";
import { Chip } from "./components/ui";
import { HomeScreen } from "./screens/HomeScreen";
import { ComponentGalleryScreen } from "./screens/ComponentGalleryScreen";
import { DiagnosticsScreen } from "./screens/DiagnosticsScreen";
import { PlaceholderScreen } from "./screens/PlaceholderScreen";
import { formatIsoDate } from "./services/date";
import { loadUserSettings } from "./storage/userSettings";
import { applyTheme, getThemePalette, liturgicColorHex } from "./theme/palette";
import { defaultUserSettings, type ReadingMode, type UserSettings } from "./types/settings";
import type { DailyLiturgyPayload } from "./types/liturgy";

const DEFAULT_ACCENT = "#2E7D32";

type ProfileView = "componentes" | "diagnostico";
type ThemePreview = { mode: ReadingMode; accent: string | null } | null;

const TAB_NAMES: TabName[] = ["home", "liturgia", "biblia", "oracoes", "perfil"];

/** Em dev, `?tab=perfil` abre direto numa aba (útil para capturas e testes manuais). */
function initialTab(): TabName {
  if (!import.meta.env.DEV) return "home";
  const tab = new URLSearchParams(window.location.search).get("tab") as TabName | null;
  return tab && TAB_NAMES.includes(tab) ? tab : "home";
}

export function App() {
  const [activeTab, setActiveTab] = useState<TabName>(initialTab);
  const [settings, setSettings] = useState<UserSettings>(defaultUserSettings);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [payload, setPayload] = useState<DailyLiturgyPayload | null>(null);
  const [profileView, setProfileView] = useState<ProfileView>("componentes");
  const [preview, setPreview] = useState<ThemePreview>(null);
  const today = useMemo(() => formatIsoDate(new Date()), []);

  useEffect(() => {
    void loadUserSettings()
      .then(setSettings)
      .finally(() => setSettingsLoaded(true));
  }, []);

  const liturgicAccent = payload ? liturgicColorHex(payload.cor) : DEFAULT_ACCENT;
  const accent = preview?.accent ?? liturgicAccent;
  const readingMode = preview?.mode ?? settings.readingMode;

  useEffect(() => {
    applyTheme(getThemePalette(readingMode, accent), settings.fontScale);
    document.documentElement.dataset.mode = readingMode;
  }, [readingMode, accent, settings.fontScale]);

  if (!settingsLoaded) {
    return <LoadingScreen accent={BRAND_GREEN} />;
  }

  return (
    <div class="app">
      <main class="app-content">
        {activeTab === "home" ? <HomeScreen date={today} onLiturgyLoaded={setPayload} /> : null}
        {activeTab === "liturgia" ? <PlaceholderScreen title="Liturgia Diária" /> : null}
        {activeTab === "biblia" ? <PlaceholderScreen title="Bíblia" /> : null}
        {activeTab === "oracoes" ? <PlaceholderScreen title="Orações" /> : null}
        {activeTab === "perfil" ? (
          <>
            <div class="row" style={{ padding: "14px 14px 0" }}>
              <Chip active={profileView === "componentes"} onClick={() => setProfileView("componentes")}>
                Componentes
              </Chip>
              <Chip active={profileView === "diagnostico"} onClick={() => setProfileView("diagnostico")}>
                Diagnóstico
              </Chip>
            </div>
            {profileView === "componentes" ? (
              <ComponentGalleryScreen
                readingMode={readingMode}
                accent={accent}
                onPreview={(mode, previewAccent) => setPreview({ mode, accent: previewAccent ?? preview?.accent ?? null })}
              />
            ) : (
              <DiagnosticsScreen />
            )}
          </>
        ) : null}
      </main>
      <BottomTabBar activeTab={activeTab} onTabPress={setActiveTab} />
    </div>
  );
}
