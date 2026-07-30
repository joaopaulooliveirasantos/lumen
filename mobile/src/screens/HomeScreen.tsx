import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { formatIsoDate, formatReadableDate, getWeekDays } from "../services/date";
import { shadeColor } from "../services/color";
import type { DailyLiturgyPayload } from "../types/liturgy";
import type { ThemePalette } from "../types/theme";

const DAY_LABELS_SHORT = ["D", "S", "T", "Q", "Q", "S", "S"];

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function Hero({
  accent,
  liturgicColor,
  selectedDate,
  offlineSource,
}: {
  accent: string;
  liturgicColor: string | undefined;
  selectedDate: string;
  offlineSource: boolean;
}) {
  return (
    <LinearGradient
      colors={[shadeColor(accent, 14), accent, shadeColor(accent, -18)]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hero}
    >
      <View style={styles.heroOrnamentRow}>
        <View style={styles.heroOrnamentLine} />
        <Text style={styles.heroCross}>✝</Text>
        <View style={styles.heroOrnamentLine} />
      </View>

      <Text allowFontScaling style={styles.heroTitle}>LUMEN</Text>
      <Text allowFontScaling style={styles.heroSubtitle}>Liturgia Diária ✧ Reflexões</Text>

      <View style={styles.heroDivider} />

      <Text allowFontScaling style={styles.heroDate}>{capitalize(formatReadableDate(selectedDate))}</Text>

      {liturgicColor ? (
        <View style={styles.heroBadge}>
          <View style={styles.heroBadgeDot} />
          <Text allowFontScaling style={styles.heroBadgeText}>Cor litúrgica: {liturgicColor}</Text>
        </View>
      ) : null}

      {offlineSource ? (
        <Text allowFontScaling style={styles.heroOffline}>Exibindo conteúdo salvo offline</Text>
      ) : null}
    </LinearGradient>
  );
}

function ReadingCalendar({
  readDays,
  theme,
}: {
  readDays: string[];
  theme: ThemePalette;
}) {
  const today = formatIsoDate(new Date());
  const weekDays = getWeekDays(today);
  const readSet = new Set(readDays);
  const readThisWeek = weekDays.filter((d) => readSet.has(d)).length;

  return (
    <View style={[calStyles.container, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
      <Text allowFontScaling style={[calStyles.sectionTitle, { color: theme.titleText }]}>
        Progresso da Liturgia
      </Text>

      <View style={calStyles.dayLabelsRow}>
        {DAY_LABELS_SHORT.map((d, i) => (
          <Text key={i} style={[calStyles.dayLabelText, { color: theme.mutedText }]}>{d}</Text>
        ))}
      </View>

      <View style={calStyles.grid}>
        {weekDays.map((cell) => {
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
        {readThisWeek} de 7 leituras concluidas esta semana
      </Text>
    </View>
  );
}

function TodayLiturgySummary({
  payload,
  theme,
  onContinueReading,
}: {
  payload: DailyLiturgyPayload;
  theme: ThemePalette;
  onContinueReading: () => void;
}) {
  const excerpt =
    payload.evangelho.texto.length > 140
      ? `${payload.evangelho.texto.slice(0, 140).trim()}…`
      : payload.evangelho.texto;

  return (
    <View style={[summaryStyles.container, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
      <Text allowFontScaling style={[summaryStyles.label, { color: theme.mutedText }]}>
        Liturgia de Hoje
      </Text>
      <Text
        allowFontScaling
        numberOfLines={2}
        style={[summaryStyles.title, { color: theme.titleText }]}
      >
        {payload.liturgia}
      </Text>
      <Text allowFontScaling style={[summaryStyles.gospelRef, { color: theme.accent }]}>
        Evangelho: {payload.evangelho.referencia}
      </Text>
      <Text
        allowFontScaling
        numberOfLines={3}
        style={[summaryStyles.excerpt, { color: theme.bodyText }]}
      >
        {excerpt}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Continuar lendo a liturgia de hoje"
        style={summaryStyles.linkRow}
        onPress={onContinueReading}
      >
        <Text allowFontScaling style={[summaryStyles.linkText, { color: theme.accent }]}>
          Continuar lendo
        </Text>
        <Text style={[summaryStyles.linkArrow, { color: theme.accent }]}>{"→"}</Text>
      </Pressable>
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
  readDays: string[];
  onRetry: () => void;
  onContinueReading: () => void;
};

export function HomeScreen({
  selectedDate,
  payload,
  loading,
  error,
  offlineSource,
  theme,
  readDays,
  onRetry,
  onContinueReading,
}: Props) {
  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: theme.appBackground }]}
      contentContainerStyle={styles.scrollContent}
    >
      <Hero
        accent={theme.accent}
        liturgicColor={payload?.cor}
        selectedDate={selectedDate}
        offlineSource={offlineSource}
      />

      <View style={styles.body}>
        <ReadingCalendar readDays={readDays} theme={theme} />

        {!loading && payload ? (
          <TodayLiturgySummary payload={payload} theme={theme} onContinueReading={onContinueReading} />
        ) : null}

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text allowFontScaling style={[styles.loadingText, { color: theme.mutedText }]}>
              Atualizando dados do dia...
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
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 28 },
  body: { paddingHorizontal: 14, paddingTop: 14 },
  hero: {
    alignItems: "center",
    paddingTop: 22,
    paddingBottom: 18,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  heroOrnamentRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    marginBottom: 6,
  },
  heroOrnamentLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  heroCross: {
    fontSize: 18,
    color: "#F3D98B",
    marginHorizontal: 10,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 5,
  },
  heroSubtitle: {
    fontSize: 12,
    fontStyle: "italic",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 1,
    marginTop: 3,
  },
  heroDivider: {
    width: 48,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#F3D98B",
    marginTop: 10,
    marginBottom: 8,
  },
  heroDate: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.92)",
    textAlign: "center",
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.32)",
  },
  heroBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
    marginRight: 8,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  heroOffline: {
    marginTop: 8,
    fontSize: 11,
    fontStyle: "italic",
    color: "#FFF3C4",
    textAlign: "center",
  },
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

const summaryStyles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "700",
  },
  gospelRef: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "600",
  },
  excerpt: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 12,
    minHeight: 32,
  },
  linkText: {
    fontSize: 14,
    fontWeight: "700",
  },
  linkArrow: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "700",
  },
});
