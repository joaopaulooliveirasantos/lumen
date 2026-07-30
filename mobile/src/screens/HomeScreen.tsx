import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ReflectionSection } from "../components/ReflectionSection";
import { formatIsoDate, getMonthCalendarDays, MONTH_NAMES_PT } from "../services/date";
import type { DailyLiturgyPayload } from "../types/liturgy";
import type { ThemePalette } from "../types/theme";
import type { UserSettings } from "../types/settings";

const DAY_LABELS_SHORT = ["D", "S", "T", "Q", "Q", "S", "S"];

function ReadingCalendar({
  readDays,
  theme,
}: {
  readDays: string[];
  theme: ThemePalette;
}) {
  const today = formatIsoDate(new Date());
  const todayDate = new Date(`${today}T00:00:00`);
  const [viewYear, setViewYear] = useState(todayDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(todayDate.getMonth() + 1);

  const cells = getMonthCalendarDays(viewYear, viewMonth);
  const readSet = new Set(readDays);
  const monthPrefix = `${viewYear}-${String(viewMonth).padStart(2, "0")}`;
  const readThisMonth = readDays.filter((d) => d.startsWith(monthPrefix)).length;

  function prevMonth() {
    if (viewMonth === 1) { setViewYear((y) => y - 1); setViewMonth(12); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 12) { setViewYear((y) => y + 1); setViewMonth(1); }
    else setViewMonth((m) => m + 1);
  }

  return (
    <View style={[calStyles.container, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
      <Text allowFontScaling style={[calStyles.sectionTitle, { color: theme.titleText }]}>
        Frequencia de Leitura
      </Text>

      <View style={calStyles.navRow}>
        <Pressable accessibilityRole="button" accessibilityLabel="Mes anterior" onPress={prevMonth} style={calStyles.navBtn}>
          <Text style={[calStyles.navText, { color: theme.accent }]}>{"‹"}</Text>
        </Pressable>
        <Text allowFontScaling style={[calStyles.monthTitle, { color: theme.titleText }]}>
          {MONTH_NAMES_PT[viewMonth - 1]} {viewYear}
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Proximo mes" onPress={nextMonth} style={calStyles.navBtn}>
          <Text style={[calStyles.navText, { color: theme.accent }]}>{"›"}</Text>
        </Pressable>
      </View>

      <View style={calStyles.dayLabelsRow}>
        {DAY_LABELS_SHORT.map((d, i) => (
          <Text key={i} style={[calStyles.dayLabelText, { color: theme.mutedText }]}>{d}</Text>
        ))}
      </View>

      <View style={calStyles.grid}>
        {cells.map((cell, idx) => {
          if (!cell) return <View key={`e-${idx}`} style={calStyles.cell} />;
          const isRead = readSet.has(cell);
          const isToday = cell === today;
          const dayNum = cell.slice(8);
          return (
            <View
              key={cell}
              style={[
                calStyles.cell,
                isRead && { backgroundColor: theme.accent, borderRadius: 20 },
                isToday && !isRead && { borderWidth: 2, borderColor: theme.accent, borderRadius: 20 },
              ]}
            >
              <Text
                style={[
                  calStyles.cellText,
                  {
                    color: isRead ? "#FFFFFF" : isToday ? theme.accent : theme.bodyText,
                    fontWeight: isRead || isToday ? "700" : "400",
                  },
                ]}
              >
                {dayNum}
              </Text>
            </View>
          );
        })}
      </View>

      <Text allowFontScaling style={[calStyles.summary, { color: theme.mutedText }]}>
        {readThisMonth} {readThisMonth === 1 ? "leitura concluida" : "leituras concluidas"} em {MONTH_NAMES_PT[viewMonth - 1]}
      </Text>
    </View>
  );
}

type Props = {
  selectedDate: string;
  payload: DailyLiturgyPayload | null;
  loading: boolean;
  error: string | null;
  offlineSource: boolean;
  theme: ThemePalette;
  settings: UserSettings;
  readDays: string[];
  onRetry: () => void;
};

export function HomeScreen({
  selectedDate,
  payload,
  loading,
  error,
  offlineSource,
  theme,
  settings,
  readDays,
  onRetry,
}: Props) {
  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: theme.appBackground }]}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={[styles.headerCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <Text allowFontScaling style={[styles.headerTitle, { color: theme.titleText }]}>
          Lumen
        </Text>
        <Text allowFontScaling style={[styles.headerSubtitle, { color: theme.mutedText }]}>
          Liturgia Diaria
        </Text>
        {offlineSource ? (
          <Text style={[styles.offlineInfo, { color: theme.accent }]}>
            Exibindo conteudo salvo offline.
          </Text>
        ) : null}
      </View>

      <ReadingCalendar readDays={readDays} theme={theme} />

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text allowFontScaling style={[styles.loadingText, { color: theme.mutedText }]}>
            Carregando reflexao...
          </Text>
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
            onPress={onRetry}
          >
            <Text allowFontScaling style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : null}

      {!loading && payload ? (
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
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 28 },
  headerCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  offlineInfo: { marginTop: 8, fontSize: 12 },
  loadingBox: { marginTop: 16, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 8 },
  errorBox: {
    marginTop: 16,
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    borderColor: "#FECACA",
    borderWidth: 1,
    padding: 14,
  },
  errorTitle: { color: "#7F1D1D", fontWeight: "700" },
  errorText: { marginTop: 6, color: "#991B1B" },
  retryButton: {
    marginTop: 10,
    backgroundColor: "#991B1B",
    borderRadius: 8,
    minHeight: 44,
    justifyContent: "center",
    paddingVertical: 8,
    alignItems: "center",
  },
  retryText: { color: "#FFFFFF", fontWeight: "600" },
});

const calStyles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  navBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  navText: {
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 26,
  },
  monthTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  dayLabelsRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  dayLabelText: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 2,
  },
  cellText: {
    fontSize: 13,
  },
  summary: {
    marginTop: 10,
    fontSize: 12,
    textAlign: "center",
  },
});
