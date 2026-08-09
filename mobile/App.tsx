import { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { BottomTabBar, type TabName } from "./src/components/BottomTabBar";
import { LoadingScreen } from "./src/components/LoadingScreen";
import { AuthProvider } from "./src/state/AuthContext";
import { AuthScreen } from "./src/screens/AuthScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { LiturgyScreen } from "./src/screens/LiturgyScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { BibleScreen } from "./src/screens/BibleScreen";
import { PrayersScreen } from "./src/screens/PrayersScreen";
import { RosaryScreen } from "./src/screens/RosaryScreen";
import { SaintStoryScreen } from "./src/screens/SaintStoryScreen";
import { fetchDailyLiturgy, fetchSaintOfDay } from "./src/services/api";
import { addDays, formatIsoDate } from "./src/services/date";
import { disableDailyReminder, scheduleDailyReminder } from "./src/services/notifications";
import { getDailyCache, initCache, saveDailyCache } from "./src/storage/liturgyCache";
import { getReadDays, markDayAsRead } from "./src/storage/readingHistory";
import { getRosaryDays, markRosaryAsPrayed } from "./src/storage/rosaryHistory";
import { loadUserSettings, saveUserSettings } from "./src/storage/userSettings";
import type { DailyLiturgyPayload, SaintOfDayPayload } from "./src/types/liturgy";
import type { ThemePalette } from "./src/types/theme";
import {
  defaultUserSettings,
  type BibleTranslationId,
  type ReadingMode,
  type UserSettings,
} from "./src/types/settings";

function liturgicColorHex(color: string): string {
  const normalized = color.toLowerCase();
  if (normalized.includes("roxo")) return "#6A1B9A";
  if (normalized.includes("vermelho")) return "#C62828";
  if (normalized.includes("branco")) return "#D97706";
  if (normalized.includes("rosa")) return "#AD1457";
  return "#2E7D32";
}

function getThemePalette(mode: ReadingMode, accent: string): ThemePalette {
  if (mode === "escuro") {
    return {
      appBackground: "#0B1117",
      cardBackground: "#111827",
      border: "#1F2937",
      titleText: "#F9FAFB",
      bodyText: "#E5E7EB",
      mutedText: "#9CA3AF",
      buttonText: "#F9FAFB",
      buttonBackground: "#1F2937",
      accent,
    };
  }

  if (mode === "sepia") {
    return {
      appBackground: "#F6EFE3",
      cardBackground: "#FFF9EF",
      border: "#E7D6B8",
      titleText: "#5B4636",
      bodyText: "#6C5745",
      mutedText: "#8C775F",
      buttonText: "#FFFFFF",
      buttonBackground: "#7A614A",
      accent,
    };
  }

  return {
    appBackground: "#F4F8F5",
    cardBackground: "#FFFFFF",
    border: "#DDE7DF",
    titleText: "#1F2937",
    bodyText: "#111827",
    mutedText: "#4B5563",
    buttonText: "#FFFFFF",
    buttonBackground: "#1E5C35",
    accent,
  };
}

function normalizeReminderTime(value: string): string {
  const parsed = value.trim();
  if (/^\d{2}:\d{2}$/.test(parsed)) {
    return parsed;
  }
  return "07:00";
}

function clampFontScale(value: number): number {
  return Math.max(0.9, Math.min(1.5, Number(value.toFixed(2))));
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabName>("home");
  const [selectedDate, setSelectedDate] = useState<string>(formatIsoDate(new Date()));
  const [payload, setPayload] = useState<DailyLiturgyPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [offlineSource, setOfflineSource] = useState<boolean>(false);
  const [saintOfDay, setSaintOfDay] = useState<SaintOfDayPayload | null>(null);
  const [saintLoading, setSaintLoading] = useState<boolean>(true);
  const [settings, setSettings] = useState<UserSettings>(defaultUserSettings);
  const [settingsReady, setSettingsReady] = useState(false);
  const [readDays, setReadDays] = useState<string[]>([]);
  const [rosaryDays, setRosaryDays] = useState<string[]>([]);
  const [rosaryOpen, setRosaryOpen] = useState(false);
  const [saintStoryOpen, setSaintStoryOpen] = useState(false);
  const [authScreenOpen, setAuthScreenOpen] = useState(false);

  const accentColor = useMemo(() => {
    if (!payload) return "#2E7D32";
    return liturgicColorHex(payload.cor);
  }, [payload]);

  const theme = useMemo(
    () => getThemePalette(settings.readingMode, accentColor),
    [accentColor, settings.readingMode],
  );

  useEffect(() => {
    async function bootstrap(): Promise<void> {
      await initCache();
      const [loadedSettings, loadedReadDays, loadedRosaryDays] = await Promise.all([
        loadUserSettings(),
        getReadDays(),
        getRosaryDays(),
      ]);
      setSettings(loadedSettings);
      setReadDays(loadedReadDays);
      setRosaryDays(loadedRosaryDays);
      setSettingsReady(true);
    }
    void bootstrap();
  }, []);

  useEffect(() => {
    void loadDate(selectedDate);
    void loadSaintOfDay(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    if (!settingsReady) return;
    void saveUserSettings(settings);
  }, [settings, settingsReady]);

  async function prefetchNextDays(baseDate: string): Promise<void> {
    const tasks = Array.from({ length: 7 }, (_, index) => addDays(baseDate, index + 1)).map(
      async (date) => {
        try {
          const daily = await fetchDailyLiturgy(date);
          await saveDailyCache(date, daily);
        } catch {
          // non-blocking
        }
      },
    );
    await Promise.all(tasks);
  }

  async function loadDate(date: string): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const online = await fetchDailyLiturgy(date);
      setPayload(online);
      setOfflineSource(false);
      await saveDailyCache(date, online);
      void prefetchNextDays(date);
    } catch (networkError) {
      const cached = await getDailyCache(date);
      if (cached) {
        setPayload(cached.payload);
        setOfflineSource(true);
      } else {
        setPayload(null);
        setError(
          networkError instanceof Error
            ? networkError.message
            : "Falha ao carregar liturgia para esta data.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadSaintOfDay(date: string): Promise<void> {
    setSaintLoading(true);
    try {
      const result = await fetchSaintOfDay(date);
      setSaintOfDay(result);
    } catch {
      setSaintOfDay(null);
    } finally {
      setSaintLoading(false);
    }
  }

  function updateFontScale(delta: number): void {
    setSettings((prev) => ({ ...prev, fontScale: clampFontScale(prev.fontScale + delta) }));
  }

  function updateReadingMode(mode: ReadingMode): void {
    setSettings((prev) => ({ ...prev, readingMode: mode }));
  }

  function updateBibleTranslation(translation: BibleTranslationId): void {
    setSettings((prev) => ({ ...prev, bibleTranslation: translation }));
  }

  async function enableReminder(): Promise<void> {
    const validTime = normalizeReminderTime(settings.reminderTime);
    const ok = await scheduleDailyReminder(validTime);
    if (!ok) {
      Alert.alert("Permissao ou horario invalido", "Use o formato HH:MM e permita notificacoes.");
      return;
    }
    setSettings((prev) => ({ ...prev, reminderEnabled: true, reminderTime: validTime }));
    Alert.alert("Lembrete configurado", `Notificacao diaria ativa as ${validTime}.`);
  }

  async function disableReminder(): Promise<void> {
    await disableDailyReminder();
    setSettings((prev) => ({ ...prev, reminderEnabled: false }));
    Alert.alert("Lembrete desativado", "As notificacoes diarias foram canceladas.");
  }

  async function handleAmen(): Promise<void> {
    const updated = await markDayAsRead(selectedDate);
    setReadDays(updated);
    Alert.alert("Am\u00e9m!", "Leitura da liturgia conclu\u00edda.");
  }

  async function handleRosaryFinished(): Promise<void> {
    const updated = await markRosaryAsPrayed(formatIsoDate(new Date()));
    setRosaryDays(updated);
  }

  function renderScreen() {
    switch (activeTab) {
      case "home":
        return (
          <HomeScreen
            selectedDate={selectedDate}
            payload={payload}
            loading={loading}
            error={error}
            offlineSource={offlineSource}
            theme={theme}
            readDays={readDays}
            rosaryDays={rosaryDays}
            saintOfDay={saintOfDay}
            saintLoading={saintLoading}
            onRetry={() => void loadDate(selectedDate)}
            onContinueReading={() => {
              setSelectedDate(formatIsoDate(new Date()));
              setActiveTab("liturgia");
            }}
            onOpenRosary={() => setRosaryOpen(true)}
            onOpenSaintStory={() => setSaintStoryOpen(true)}
            onSelectDate={(date) => setSelectedDate(date)}
          />
        );
      case "liturgia":
        return (
          <LiturgyScreen
            selectedDate={selectedDate}
            payload={payload}
            loading={loading}
            theme={theme}
            settings={settings}
            isRead={readDays.includes(selectedDate)}
            onSelectDate={(date) => setSelectedDate(date)}
            onAmen={() => void handleAmen()}
            onUpdateFontScale={updateFontScale}
          />
        );
      case "biblia":
        return <BibleScreen theme={theme} settings={settings} />;
      case "oracoes":
        return <PrayersScreen theme={theme} settings={settings} />;
      case "perfil":
        return (
          <ProfileScreen
            theme={theme}
            settings={settings}
            onUpdateReadingMode={updateReadingMode}
            onUpdateBibleTranslation={updateBibleTranslation}
            onReminderTimeChange={(value) =>
              setSettings((prev) => ({ ...prev, reminderTime: value }))
            }
            onEnableReminder={() => void enableReminder()}
            onDisableReminder={() => void disableReminder()}
            onOpenAuth={() => setAuthScreenOpen(true)}
          />
        );
    }
  }

  if (!settingsReady) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <LoadingScreen message="Preparando sua leitura..." />
      </SafeAreaProvider>
    );
  }

  return (
    <AuthProvider>
      <SafeAreaProvider>
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.appBackground }]} edges={["top"]}>
          <StatusBar style={activeTab === "home" || settings.readingMode === "escuro" ? "light" : "dark"} />
          <View style={styles.content}>
            {rosaryOpen ? (
              <RosaryScreen
                theme={theme}
                settings={settings}
                onExit={() => setRosaryOpen(false)}
                onFinish={() => void handleRosaryFinished()}
              />
            ) : saintStoryOpen ? (
              <SaintStoryScreen
                date={selectedDate}
                theme={theme}
                settings={settings}
                onExit={() => setSaintStoryOpen(false)}
              />
            ) : authScreenOpen ? (
              <AuthScreen theme={theme} settings={settings} onExit={() => setAuthScreenOpen(false)} />
            ) : (
              renderScreen()
            )}
          </View>
          <BottomTabBar
            activeTab={activeTab}
            onTabPress={(tab) => {
              setRosaryOpen(false);
              setSaintStoryOpen(false);
              setAuthScreenOpen(false);
              setActiveTab(tab);
            }}
            theme={theme}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
