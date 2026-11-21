import { useEffect } from "preact/hooks";
import { App as CapApp } from "@capacitor/app";
import { AuthProvider, useAuth } from "./auth/AuthProvider";
import { BottomTabBar, type TabName } from "./components/BottomTabBar";
import { BRAND_GREEN, LoadingScreen } from "./components/LoadingScreen";
import { AuthScreen } from "./screens/auth/AuthScreen";
import { CompleteProfileScreen, NewPasswordScreen, ProfileErrorScreen } from "./screens/auth/GateScreens";
import { HomeScreen } from "./screens/HomeScreen";
import { LiturgyScreen } from "./screens/LiturgyScreen";
import { BibleScreen } from "./screens/BibleScreen";
import { PrayersScreen } from "./screens/PrayersScreen";
import { SaintStoryScreen } from "./screens/SaintStoryScreen";
import { ReadingPlansScreen } from "./screens/ReadingPlansScreen";
import { RosaryScreen } from "./screens/RosaryScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { AppStateProvider, useAppState } from "./state/AppState";
import { applyTheme, getThemePalette, liturgicColorHex } from "./theme/palette";
import { setSystemBarsForBackground } from "./native/systemBars";
import { useKeyboardAwareness } from "./native/keyboard";
import type { ReadingMode } from "./types/settings";

const DEFAULT_ACCENT = "#2E7D32";
const TAB_NAMES: TabName[] = ["home", "liturgia", "biblia", "oracoes", "perfil"];

/** Em dev, `?tab=perfil` abre direto numa aba (útil para capturas e testes manuais). */
function initialTab(): TabName {
  if (!import.meta.env.DEV) return "home";
  const tab = new URLSearchParams(window.location.search).get("tab") as TabName | null;
  return tab && TAB_NAMES.includes(tab) ? tab : "home";
}

/** Em dev, `?modo=escuro` (ou sepia/claro) força o modo de leitura sem alterar as configurações salvas. */
function devReadingMode(): ReadingMode | null {
  if (!import.meta.env.DEV) return null;
  const mode = new URLSearchParams(window.location.search).get("modo");
  return mode === "claro" || mode === "escuro" || mode === "sepia" ? mode : null;
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

  const mode = devReadingMode() ?? app.settings.readingMode;
  const palette = getThemePalette(mode, accent);
  useKeyboardAwareness();
  useEffect(() => {
    applyTheme(palette, app.settings.fontScale);
    document.documentElement.dataset.mode = mode;
  }, [mode, app.settings.fontScale, accent]);

  // Só em dev: ?semLogin pula o portão para capturas das telas internas (removido do build de produção).
  const skipGate = import.meta.env.DEV && new URLSearchParams(window.location.search).has("semLogin");
  const loading = !(skipGate && app.ready) && (!app.ready || auth.status === "loading");

  // Ícones das barras do sistema: claros sobre a tela de carregamento (verde) e no modo escuro.
  useEffect(() => {
    if (loading) setSystemBarsForBackground(true, BRAND_GREEN);
    else setSystemBarsForBackground(mode === "escuro", palette.appBackground);
  }, [loading, mode, palette.appBackground]);

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
  const { profile } = useAuth();
  const closeOverlay = () => openOverlay(null);

  // Botão "voltar" do Android: fecha a tela sobreposta, depois volta à Home, depois sai do app.
  useEffect(() => {
    let remove: (() => void) | undefined;
    void CapApp.addListener("backButton", () => {
      if (document.querySelector(".sheet-backdrop, .overlay-screen")) {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      } else if (overlay) openOverlay(null);
      else if (activeTab !== "home") setActiveTab("home");
      else void CapApp.exitApp();
    })
      .then((h) => (remove = () => void h.remove()))
      .catch(() => undefined);
    return () => remove?.();
  }, [overlay, activeTab]);

  return (
    <div class="app">
      <main class="app-content" key={overlay ? overlay.kind : activeTab}>
        {overlay?.kind === "saintStory" ? <SaintStoryScreen onExit={closeOverlay} /> : null}
        {overlay?.kind === "plans" ? <ReadingPlansScreen initialPlanId={overlay.planId} onExit={closeOverlay} /> : null}
        {overlay?.kind === "rosary" ? <RosaryScreen onExit={closeOverlay} /> : null}
        {!overlay && activeTab === "home" ? <HomeScreen /> : null}
        {!overlay && activeTab === "liturgia" ? <LiturgyScreen /> : null}
        {!overlay && activeTab === "biblia" ? <BibleScreen /> : null}
        {!overlay && activeTab === "oracoes" ? <PrayersScreen /> : null}
        {!overlay && activeTab === "perfil" ? <ProfileScreen /> : null}
      </main>
      <BottomTabBar activeTab={activeTab} onTabPress={setActiveTab} avatarUrl={profile?.avatarUrl ?? null} />
      {toast ? (
        <div class="toast" role="status" aria-live="polite">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
