import { useEffect, useMemo, useState } from "preact/hooks";
import { AuthProvider, useAuth } from "./auth/AuthProvider";
import { BottomTabBar, type TabName } from "./components/BottomTabBar";
import { BRAND_GREEN, LoadingScreen } from "./components/LoadingScreen";
import { Chip } from "./components/ui";
import { AccountSection } from "./screens/AccountSection";
import { AuthScreen } from "./screens/auth/AuthScreen";
import { CompleteProfileScreen, NewPasswordScreen, ProfileErrorScreen } from "./screens/auth/GateScreens";
import { ComponentGalleryScreen } from "./screens/ComponentGalleryScreen";
import { DiagnosticsScreen } from "./screens/DiagnosticsScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { PlaceholderScreen } from "./screens/PlaceholderScreen";
import { formatIsoDate } from "./services/date";
import { loadUserSettings } from "./storage/userSettings";
import { applyTheme, getThemePalette, liturgicColorHex } from "./theme/palette";
import { defaultUserSettings, type ReadingMode, type UserSettings } from "./types/settings";
import type { DailyLiturgyPayload } from "./types/liturgy";

const DEFAULT_ACCENT = "#2E7D32";
const TAB_NAMES: TabName[] = ["home", "liturgia", "biblia", "oracoes", "perfil"];

type ProfileView = "componentes" | "diagnostico";
type ThemePreview = { mode: ReadingMode; accent: string | null } | null;

/** Em dev, `?tab=perfil` abre direto numa aba (útil para capturas e testes manuais). */
function initialTab(): TabName {
  if (!import.meta.env.DEV) return "home";
  const tab = new URLSearchParams(window.location.search).get("tab") as TabName | null;
  return tab && TAB_NAMES.includes(tab) ? tab : "home";
}

export function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}

function Root() {
  const auth = useAuth();
  const [settings, setSettings] = useState<UserSettings>(defaultUserSettings);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [payload, setPayload] = useState<DailyLiturgyPayload | null>(null);
  const [preview, setPreview] = useState<ThemePreview>(null);

  useEffect(() => {
    void loadUserSettings()
      .then(setSettings)
      .finally(() => setSettingsLoaded(true));
  }, []);

  const accent = preview?.accent ?? (payload ? liturgicColorHex(payload.cor) : DEFAULT_ACCENT);
  const readingMode = preview?.mode ?? settings.readingMode;

  useEffect(() => {
    applyTheme(getThemePalette(readingMode, accent), settings.fontScale);
    document.documentElement.dataset.mode = readingMode;
  }, [readingMode, accent, settings.fontScale]);

  // Portão de entrada (doc/planejamento-login-obrigatorio.md).
  if (!settingsLoaded || auth.status === "loading") return <LoadingScreen accent={BRAND_GREEN} />;
  if (auth.status === "signedOut") return <AuthScreen />;
  if (auth.status === "recovery") return <NewPasswordScreen />;
  if (auth.status === "profileError") return <ProfileErrorScreen />;
  if (auth.status === "needsProfile") return <CompleteProfileScreen />;

  return (
    <MainApp
      readingMode={readingMode}
      accent={accent}
      onLiturgyLoaded={setPayload}
      onPreview={(mode, previewAccent) => setPreview({ mode, accent: previewAccent ?? preview?.accent ?? null })}
    />
  );
}

type MainProps = {
  readingMode: ReadingMode;
  accent: string;
  onLiturgyLoaded: (payload: DailyLiturgyPayload | null) => void;
  onPreview: (mode: ReadingMode, accent: string | null) => void;
};

function MainApp({ readingMode, accent, onLiturgyLoaded, onPreview }: MainProps) {
  const [activeTab, setActiveTab] = useState<TabName>(initialTab);
  const [profileView, setProfileView] = useState<ProfileView>("componentes");
  const today = useMemo(() => formatIsoDate(new Date()), []);

  return (
    <div class="app">
      <main class="app-content">
        {activeTab === "home" ? <HomeScreen date={today} onLiturgyLoaded={onLiturgyLoaded} /> : null}
        {activeTab === "liturgia" ? <PlaceholderScreen title="Liturgia Diária" /> : null}
        {activeTab === "biblia" ? <PlaceholderScreen title="Bíblia" /> : null}
        {activeTab === "oracoes" ? <PlaceholderScreen title="Orações" /> : null}
        {activeTab === "perfil" ? (
          <>
            <AccountSection />
            <div class="row" style={{ padding: "14px 14px 0" }}>
              <Chip active={profileView === "componentes"} onClick={() => setProfileView("componentes")}>
                Componentes
              </Chip>
              <Chip active={profileView === "diagnostico"} onClick={() => setProfileView("diagnostico")}>
                Diagnóstico
              </Chip>
            </div>
            {profileView === "componentes" ? (
              <ComponentGalleryScreen readingMode={readingMode} accent={accent} onPreview={onPreview} />
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
