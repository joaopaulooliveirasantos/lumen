import { useEffect } from "preact/hooks";
import { AuthProvider, useAuth } from "./auth/AuthProvider";
import { BottomTabBar, type TabName } from "./components/BottomTabBar";
import { BRAND_GREEN, LoadingScreen } from "./components/LoadingScreen";
import { AuthScreen } from "./screens/auth/AuthScreen";
import { CompleteProfileScreen, NewPasswordScreen, ProfileErrorScreen } from "./screens/auth/GateScreens";
import { HomeScreen } from "./screens/HomeScreen";
import { LiturgyScreen } from "./screens/LiturgyScreen";
import { PlaceholderScreen } from "./screens/PlaceholderScreen";
import { PrayersScreen } from "./screens/PrayersScreen";
import { SaintStoryScreen } from "./screens/SaintStoryScreen";
import { ReadingPlansScreen } from "./screens/ReadingPlansScreen";
import { RosaryScreen } from "./screens/RosaryScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { AppStateProvider, useAppState } from "./state/AppState";
import { applyTheme, getThemePalette, liturgicColorHex } from "./theme/palette";

const DEFAULT_ACCENT = "#2E7D32";
const TAB_NAMES: TabName[] = ["home", "liturgia", "biblia", "oracoes", "perfil"];

/** Em dev, `?tab=perfil` abre direto numa aba (útil para capturas e testes manuais). */
function initialTab(): TabName {
  if (!import.meta.env.DEV) return "home";
  const tab = new URLSearchParams(window.location.search).get("tab") as TabName | null;
  return tab && TAB_NAMES.includes(tab) ? tab : "home";
}

export function App() {
  return (
    <AuthProvider>
      <AppStateProvider initialTab={initialTab()}>
        <Root />
      </AppStateProvider>
    </AuthProvider>
  );
}

function Root() {
  const auth = useAuth();
  const app = useAppState();
  const accent = app.liturgy ? liturgicColorHex(app.liturgy.cor) : DEFAULT_ACCENT;

  useEffect(() => {
    applyTheme(getThemePalette(app.settings.readingMode, accent), app.settings.fontScale);
    document.documentElement.dataset.mode = app.settings.readingMode;
  }, [app.settings.readingMode, app.settings.fontScale, accent]);

  // Só em dev: ?semLogin pula o portão para capturas das telas internas (removido do build de produção).
  const skipGate = import.meta.env.DEV && new URLSearchParams(window.location.search).has("semLogin");
  if (skipGate && app.ready) return <MainApp />;

  // Portão de entrada (doc/planejamento-login-obrigatorio.md).
  if (!app.ready || auth.status === "loading") return <LoadingScreen accent={BRAND_GREEN} message="Preparando sua leitura..." />;
  if (auth.status === "signedOut") return <AuthScreen />;
  if (auth.status === "recovery") return <NewPasswordScreen />;
  if (auth.status === "profileError") return <ProfileErrorScreen />;
  if (auth.status === "needsProfile") return <CompleteProfileScreen />;

  return <MainApp />;
}

function MainApp() {
  const { activeTab, setActiveTab, toast, overlay, openOverlay } = useAppState();
  const closeOverlay = () => openOverlay(null);

  return (
    <div class="app">
      <main class="app-content" key={overlay ? overlay.kind : activeTab}>
        {overlay?.kind === "saintStory" ? <SaintStoryScreen onExit={closeOverlay} /> : null}
        {overlay?.kind === "plans" ? <ReadingPlansScreen initialPlanId={overlay.planId} onExit={closeOverlay} /> : null}
        {overlay?.kind === "rosary" ? <RosaryScreen onExit={closeOverlay} /> : null}
        {!overlay && activeTab === "home" ? <HomeScreen /> : null}
        {!overlay && activeTab === "liturgia" ? <LiturgyScreen /> : null}
        {!overlay && activeTab === "biblia" ? <PlaceholderScreen title="Bíblia" /> : null}
        {!overlay && activeTab === "oracoes" ? <PrayersScreen /> : null}
        {!overlay && activeTab === "perfil" ? <ProfileScreen /> : null}
      </main>
      <BottomTabBar activeTab={activeTab} onTabPress={setActiveTab} />
      {toast ? (
        <div class="toast" role="status" aria-live="polite">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
