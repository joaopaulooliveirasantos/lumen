import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { ReadingSection } from "./src/components/ReadingSection";
import { ReflectionSection } from "./src/components/ReflectionSection";
import { fetchDailyLiturgy } from "./src/services/api";
import { addDays, formatIsoDate, formatReadableDate } from "./src/services/date";
import { disableDailyReminder, scheduleDailyReminder } from "./src/services/notifications";
import { getDailyCache, initCache, saveDailyCache } from "./src/storage/liturgyCache";
import { loadUserSettings, saveUserSettings } from "./src/storage/userSettings";
import type { DailyLiturgyPayload } from "./src/types/liturgy";
import { defaultUserSettings, type ReadingMode, type UserSettings } from "./src/types/settings";

function liturgicColorHex(color: string): string {
  const normalized = color.toLowerCase();
  if (normalized.includes("roxo")) return "#6A1B9A";
  if (normalized.includes("vermelho")) return "#C62828";
  if (normalized.includes("branco")) return "#D97706";
  if (normalized.includes("rosa")) return "#AD1457";
  return "#2E7D32";
}

type ThemePalette = {
  appBackground: string;
  cardBackground: string;
  border: string;
  titleText: string;
  bodyText: string;
  mutedText: string;
  buttonText: string;
  buttonBackground: string;
  accent: string;
};

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
  const [selectedDate, setSelectedDate] = useState<string>(formatIsoDate(new Date()));
  const [payload, setPayload] = useState<DailyLiturgyPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [offlineSource, setOfflineSource] = useState<boolean>(false);
  const [settings, setSettings] = useState<UserSettings>(defaultUserSettings);
  const [settingsReady, setSettingsReady] = useState(false);

  const accentColor = useMemo(() => {
    if (!payload) return "#2E7D32";
    return liturgicColorHex(payload.cor);
  }, [payload]);

  const theme = useMemo(
    () => getThemePalette(settings.readingMode, accentColor),
    [accentColor, settings.readingMode],
  );

  const modeLabel: Record<ReadingMode, string> = {
    claro: "Claro",
    escuro: "Escuro",
    sepia: "Sepia",
  };

  useEffect(() => {
    async function bootstrap(): Promise<void> {
      await initCache();
      const loadedSettings = await loadUserSettings();
      setSettings(loadedSettings);
      setSettingsReady(true);
    }

    void bootstrap();
  }, []);

  useEffect(() => {
    void loadDate(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    if (!settingsReady) {
      return;
    }

    void saveUserSettings(settings);
  }, [settings, settingsReady]);

  async function prefetchNextDays(baseDate: string): Promise<void> {
    const tasks = Array.from({ length: 7 }, (_, index) => addDays(baseDate, index + 1)).map(
      async (date) => {
        try {
          const daily = await fetchDailyLiturgy(date);
          await saveDailyCache(date, daily);
        } catch {
          // Prefetch failures are non-blocking for current daily reading.
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

  function updateFontScale(delta: number): void {
    setSettings((previous) => ({
      ...previous,
      fontScale: clampFontScale(previous.fontScale + delta),
    }));
  }

  function updateReadingMode(mode: ReadingMode): void {
    setSettings((previous) => ({
      ...previous,
      readingMode: mode,
    }));
  }

  async function enableReminder(): Promise<void> {
    const validTime = normalizeReminderTime(settings.reminderTime);
    const ok = await scheduleDailyReminder(validTime);

    if (!ok) {
      Alert.alert("Permissao ou horario invalido", "Use o formato HH:MM e permita notificacoes.");
      return;
    }

    setSettings((previous) => ({
      ...previous,
      reminderEnabled: true,
      reminderTime: validTime,
    }));
    Alert.alert("Lembrete configurado", `Notificacao diaria ativa as ${validTime}.`);
  }

  async function disableReminder(): Promise<void> {
    await disableDailyReminder();
    setSettings((previous) => ({
      ...previous,
      reminderEnabled: false,
    }));
    Alert.alert("Lembrete desativado", "As notificacoes diarias foram canceladas.");
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.appBackground }]}>
      <StatusBar style={settings.readingMode === "escuro" ? "light" : "dark"} />
      <View style={styles.container}>
        <View style={[styles.headerCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <Text allowFontScaling style={[styles.headerTitle, { color: theme.titleText }]}>Lumen Liturgia Diaria</Text>
          <Text allowFontScaling style={[styles.headerDate, { color: theme.mutedText }]}>
            {formatReadableDate(selectedDate)}
          </Text>
          <Text allowFontScaling style={[styles.headerTag, { color: theme.accent }]}>
            Cor liturgica: {payload?.cor ?? "-"}
          </Text>

          <View style={styles.controlsRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ir para o dia anterior"
              style={[styles.button, { backgroundColor: theme.buttonBackground }]}
              onPress={() => setSelectedDate(addDays(selectedDate, -1))}
            >
              <Text allowFontScaling style={[styles.buttonText, { color: theme.buttonText }]}>
                Dia anterior
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ir para o proximo dia"
              style={[styles.button, { backgroundColor: theme.buttonBackground }]}
              onPress={() => setSelectedDate(addDays(selectedDate, 1))}
            >
              <Text allowFontScaling style={[styles.buttonText, { color: theme.buttonText }]}>
                Proximo dia
              </Text>
            </Pressable>
          </View>

          <View style={styles.settingsRow}>
            <Text allowFontScaling style={[styles.settingsLabel, { color: theme.titleText }]}>Fonte</Text>
            <View style={styles.settingsActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Diminuir tamanho da fonte"
                style={[styles.smallButton, { borderColor: theme.accent }]}
                onPress={() => updateFontScale(-0.1)}
              >
                <Text allowFontScaling style={[styles.smallButtonText, { color: theme.accent }]}>A-</Text>
              </Pressable>
              <Text allowFontScaling style={[styles.fontScaleValue, { color: theme.mutedText }]}>
                {(settings.fontScale * 100).toFixed(0)}%
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Aumentar tamanho da fonte"
                style={[styles.smallButton, { borderColor: theme.accent }]}
                onPress={() => updateFontScale(0.1)}
              >
                <Text allowFontScaling style={[styles.smallButtonText, { color: theme.accent }]}>A+</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.settingsModesRow}>
            {(Object.keys(modeLabel) as ReadingMode[]).map((mode) => {
              const selected = settings.readingMode === mode;
              return (
                <Pressable
                  key={mode}
                  accessibilityRole="button"
                  accessibilityLabel={`Ativar modo ${modeLabel[mode]}`}
                  style={[
                    styles.modeButton,
                    {
                      borderColor: theme.accent,
                      backgroundColor: selected ? theme.accent : "transparent",
                    },
                  ]}
                  onPress={() => updateReadingMode(mode)}
                >
                  <Text
                    allowFontScaling
                    style={{
                      color: selected ? "#FFFFFF" : theme.accent,
                      fontWeight: "700",
                    }}
                  >
                    {modeLabel[mode]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.reminderRow}>
            <TextInput
              accessibilityLabel="Horario do lembrete diario"
              accessibilityHint="Digite no formato HH:MM"
              value={settings.reminderTime}
              onChangeText={(value) =>
                setSettings((previous) => ({
                  ...previous,
                  reminderTime: value,
                }))
              }
              placeholder="07:00"
              keyboardType="numbers-and-punctuation"
              style={[
                styles.timeInput,
                {
                  borderColor: theme.border,
                  color: theme.titleText,
                  backgroundColor: theme.cardBackground,
                },
              ]}
            />
            {settings.reminderEnabled ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Desativar lembrete diario"
                style={[styles.reminderButton, { backgroundColor: "#9B1C1C" }]}
                onPress={() => void disableReminder()}
              >
                <Text allowFontScaling style={styles.buttonText}>Desativar lembrete</Text>
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ativar lembrete diario"
                style={[styles.reminderButton, { backgroundColor: theme.buttonBackground }]}
                onPress={() => void enableReminder()}
              >
                <Text allowFontScaling style={[styles.buttonText, { color: theme.buttonText }]}> 
                  Ativar lembrete
                </Text>
              </Pressable>
            )}
          </View>

          {offlineSource ? (
            <Text style={[styles.offlineInfo, { color: theme.accent }]}>Exibindo conteudo salvo offline.</Text>
          ) : null}
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text allowFontScaling style={[styles.loadingText, { color: theme.mutedText }]}>Carregando liturgia...</Text>
          </View>
        ) : null}

        {!loading && error ? (
          <View style={styles.errorBox}>
            <Text allowFontScaling style={styles.errorTitle}>Nao foi possivel carregar.</Text>
            <Text allowFontScaling style={styles.errorText}>{error}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tentar carregar novamente"
              style={styles.retryButton}
              onPress={() => void loadDate(selectedDate)}
            >
              <Text allowFontScaling style={styles.retryText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : null}

        {!loading && payload ? (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <View
              style={[
                styles.liturgicBanner,
                {
                  borderLeftColor: theme.accent,
                  backgroundColor: theme.cardBackground,
                  borderTopColor: theme.border,
                  borderRightColor: theme.border,
                  borderBottomColor: theme.border,
                },
              ]}
            >
              <Text
                allowFontScaling
                style={[styles.liturgicTitle, { color: theme.titleText, fontSize: 15 * settings.fontScale }]}
              >
                {payload.liturgia}
              </Text>
            </View>

            <ReadingSection
              title="Primeira Leitura"
              reading={payload.primeiraLeitura}
              fontScale={settings.fontScale}
              cardColor={theme.cardBackground}
              borderColor={theme.border}
              titleColor={theme.titleText}
              bodyColor={theme.bodyText}
              accentColor={theme.accent}
            />

            <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}> 
              <Text allowFontScaling style={[styles.cardTitle, { color: theme.titleText, fontSize: 16 * settings.fontScale }]}> 
                Salmo Responsorial
              </Text>
              <Text allowFontScaling style={[styles.psalmRefrain, { color: theme.accent, fontSize: 15 * settings.fontScale }]}> 
                {payload.salmo.refrao}
              </Text>
              <Text
                allowFontScaling
                style={[
                  styles.cardText,
                  {
                    color: theme.bodyText,
                    fontSize: 15 * settings.fontScale,
                    lineHeight: 24 * settings.fontScale,
                  },
                ]}
              >
                {payload.salmo.texto}
              </Text>
            </View>

            {payload.segundaLeitura ? (
              <ReadingSection
                title="Segunda Leitura"
                reading={payload.segundaLeitura}
                fontScale={settings.fontScale}
                cardColor={theme.cardBackground}
                borderColor={theme.border}
                titleColor={theme.titleText}
                bodyColor={theme.bodyText}
                accentColor={theme.accent}
              />
            ) : null}

            <ReadingSection
              title="Evangelho"
              reading={payload.evangelho}
              fontScale={settings.fontScale}
              cardColor={theme.cardBackground}
              borderColor={theme.border}
              titleColor={theme.titleText}
              bodyColor={theme.bodyText}
              accentColor={theme.accent}
            />

            <ReflectionSection
              reflection={payload.reflexao}
              fontScale={settings.fontScale}
              cardColor={theme.cardBackground}
              borderColor={theme.border}
              titleColor={theme.titleText}
              bodyColor={theme.bodyText}
              mutedColor={theme.mutedText}
              accentColor={theme.accent}
            />
          </ScrollView>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 14,
  },
  headerCard: {
    marginTop: 10,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
  },
  headerDate: {
    marginTop: 6,
    fontSize: 14,
    textTransform: "capitalize",
  },
  headerTag: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "700",
  },
  controlsRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
  },
  button: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 10,
    justifyContent: "center",
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  settingsRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingsLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  settingsActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  smallButton: {
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 36,
    minWidth: 36,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  smallButtonText: {
    fontWeight: "700",
  },
  fontScaleValue: {
    minWidth: 48,
    textAlign: "center",
    fontWeight: "600",
  },
  settingsModesRow: {
    marginTop: 10,
    flexDirection: "row",
    gap: 8,
  },
  modeButton: {
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 36,
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  reminderRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  timeInput: {
    width: 80,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontWeight: "600",
  },
  reminderButton: {
    flex: 1,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: "center",
    paddingVertical: 10,
    alignItems: "center",
  },
  offlineInfo: {
    marginTop: 10,
    fontSize: 12,
  },
  loadingBox: {
    marginTop: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 8,
  },
  errorBox: {
    marginTop: 16,
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    borderColor: "#FECACA",
    borderWidth: 1,
    padding: 14,
  },
  errorTitle: {
    color: "#7F1D1D",
    fontWeight: "700",
  },
  errorText: {
    marginTop: 6,
    color: "#991B1B",
  },
  retryButton: {
    marginTop: 10,
    backgroundColor: "#991B1B",
    borderRadius: 8,
    minHeight: 44,
    justifyContent: "center",
    paddingVertical: 8,
    alignItems: "center",
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  scroll: {
    marginTop: 14,
  },
  scrollContent: {
    paddingBottom: 28,
  },
  liturgicBanner: {
    borderRadius: 10,
    borderLeftWidth: 5,
    padding: 14,
    marginBottom: 12,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
  },
  liturgicTitle: {
    fontWeight: "700",
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardTitle: {
    fontWeight: "700",
  },
  psalmRefrain: {
    marginTop: 8,
    fontWeight: "700",
  },
  cardText: {
    marginTop: 10,
  },
});
