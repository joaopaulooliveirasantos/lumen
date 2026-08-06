import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { DatePickerModal } from "../components/DatePickerModal";
import { formatIsoDate, formatReadableDate, getWeekDays } from "../services/date";
import { shadeColor } from "../services/color";
import type { DailyLiturgyPayload, SaintOfDayPayload } from "../types/liturgy";
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
  onOpenCalendar,
}: {
  accent: string;
  liturgicColor: string | undefined;
  selectedDate: string;
  offlineSource: boolean;
  onOpenCalendar: () => void;
}) {
  return (
    <LinearGradient
      colors={[shadeColor(accent, 14), accent, shadeColor(accent, -18)]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hero}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Escolher outra data"
        hitSlop={8}
        style={styles.calendarButton}
        onPress={onOpenCalendar}
      >
        <Text style={styles.calendarIcon}>📅</Text>
      </Pressable>

      <View style={styles.heroTopRow}>
        <Text style={styles.heroCross}>✝</Text>
        <Text allowFontScaling style={styles.heroTitle}>LUMEN</Text>
      </View>

      <View style={styles.heroInfoRow}>
        <Text allowFontScaling style={styles.heroDate}>{capitalize(formatReadableDate(selectedDate))}</Text>

        {liturgicColor ? (
          <View style={styles.heroBadge}>
            <View style={styles.heroBadgeDot} />
            <Text allowFontScaling style={styles.heroBadgeText}>{liturgicColor}</Text>
          </View>
        ) : null}
      </View>

      {offlineSource ? (
        <Text allowFontScaling style={styles.heroOffline}>Exibindo conteúdo salvo offline</Text>
      ) : null}
    </LinearGradient>
  );
}

function ReadingCalendar({
  readDays,
  rosaryDays,
  theme,
}: {
  readDays: string[];
  rosaryDays: string[];
  theme: ThemePalette;
}) {
  const today = formatIsoDate(new Date());
  const weekDays = getWeekDays(today);
  const readSet = new Set(readDays);
  const rosarySet = new Set(rosaryDays);
  const readThisWeek = weekDays.filter((d) => readSet.has(d)).length;
  const rosaryThisWeek = weekDays.filter((d) => rosarySet.has(d)).length;

  return (
    <View style={[calStyles.container, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
      <View style={calStyles.headerRow}>
        <Text allowFontScaling style={[calStyles.sectionTitle, { color: theme.titleText }]}>
          Progresso da Liturgia
        </Text>
        <View style={calStyles.statsInline}>
          <Text style={calStyles.statsIcon}>📖</Text>
          <Text allowFontScaling style={[calStyles.statsText, { color: theme.mutedText }]}>
            {readThisWeek}/7
          </Text>
          <Text style={[calStyles.statsIcon, calStyles.statsIconSpaced]}>🌹</Text>
          <Text allowFontScaling style={[calStyles.statsText, { color: theme.mutedText }]}>
            {rosaryThisWeek}/7
          </Text>
        </View>
      </View>

      <View style={calStyles.strip}>
        {weekDays.map((cell, i) => {
          const isRead = readSet.has(cell);
          const isRosaryPrayed = rosarySet.has(cell);
          const isToday = cell === today;
          return (
            <View key={cell} style={calStyles.dayCol}>
              <Text
                allowFontScaling
                style={[calStyles.dayLabel, { color: isToday ? theme.accent : theme.mutedText }]}
              >
                {DAY_LABELS_SHORT[i]}
              </Text>
              <View
                style={[
                  calStyles.dot,
                  { borderColor: isRead || isToday ? theme.accent : theme.border },
                  isRead && { backgroundColor: theme.accent },
                ]}
              >
                {isRosaryPrayed ? (
                  <View
                    style={[calStyles.dotInner, { backgroundColor: isRead ? "#FFFFFF" : theme.accent }]}
                  />
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function SaintOfDayCard({
  saintOfDay,
  loading,
  theme,
  onPress,
}: {
  saintOfDay: SaintOfDayPayload | null;
  loading: boolean;
  theme: ThemePalette;
  onPress: () => void;
}) {
  if (loading || !saintOfDay || !Array.isArray(saintOfDay.santos) || saintOfDay.santos.length === 0) {
    return null;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Ver a historia do santo do dia"
      style={[saintStyles.container, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
      onPress={onPress}
    >
      <View style={[saintStyles.icon, { borderColor: theme.accent }]}>
        <Text style={saintStyles.iconText}>✦</Text>
      </View>
      <View style={saintStyles.body}>
        <Text allowFontScaling style={[saintStyles.label, { color: theme.mutedText }]}>
          Santo do Dia
        </Text>
        {saintOfDay.santos.map((nome, index) => (
          <Text
            key={`${nome}-${index}`}
            allowFontScaling
            style={[saintStyles.title, { color: theme.titleText }]}
          >
            {nome}
          </Text>
        ))}
      </View>
      <Text style={[saintStyles.chevron, { color: theme.mutedText }]}>{"›"}</Text>
    </Pressable>
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

function RosaryEntryCard({ theme, onPress }: { theme: ThemePalette; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Rezar o terço"
      style={[rosaryStyles.container, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
      onPress={onPress}
    >
      <View style={[rosaryStyles.icon, { borderColor: theme.accent }]}>
        <Text style={rosaryStyles.iconText}>🌹</Text>
      </View>
      <View style={rosaryStyles.body}>
        <Text allowFontScaling style={[rosaryStyles.title, { color: theme.titleText }]}>
          Rezar o Terço
        </Text>
        <Text allowFontScaling style={[rosaryStyles.subtitle, { color: theme.mutedText }]}>
          Contemple os mistérios com Nossa Senhora
        </Text>
      </View>
      <Text style={[rosaryStyles.chevron, { color: theme.mutedText }]}>{"›"}</Text>
    </Pressable>
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
  rosaryDays: string[];
  saintOfDay: SaintOfDayPayload | null;
  saintLoading: boolean;
  onRetry: () => void;
  onContinueReading: () => void;
  onOpenRosary: () => void;
  onOpenSaintStory: () => void;
  onSelectDate: (date: string) => void;
};

export function HomeScreen({
  selectedDate,
  payload,
  loading,
  error,
  offlineSource,
  theme,
  readDays,
  rosaryDays,
  saintOfDay,
  saintLoading,
  onRetry,
  onContinueReading,
  onOpenRosary,
  onOpenSaintStory,
  onSelectDate,
}: Props) {
  const [calendarOpen, setCalendarOpen] = useState(false);

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
        onOpenCalendar={() => setCalendarOpen(true)}
      />

      <DatePickerModal
        visible={calendarOpen}
        selectedDate={selectedDate}
        theme={theme}
        onSelect={onSelectDate}
        onClose={() => setCalendarOpen(false)}
      />

      <View style={styles.body}>
        <ReadingCalendar readDays={readDays} rosaryDays={rosaryDays} theme={theme} />

        <SaintOfDayCard
          saintOfDay={saintOfDay}
          loading={saintLoading}
          theme={theme}
          onPress={onOpenSaintStory}
        />

        {!loading && payload ? (
          <TodayLiturgySummary payload={payload} theme={theme} onContinueReading={onContinueReading} />
        ) : null}

        <RosaryEntryCard theme={theme} onPress={onOpenRosary} />

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
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  calendarButton: {
    position: "absolute",
    top: 10,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.32)",
    zIndex: 1,
  },
  calendarIcon: {
    fontSize: 16,
  },
  heroCross: {
    fontSize: 15,
    color: "#F3D98B",
    marginRight: 8,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 4,
  },
  heroInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 8,
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.32)",
  },
  heroBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#FFFFFF",
    marginRight: 6,
  },
  heroBadgeText: {
    fontSize: 11,
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
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  statsInline: {
    flexDirection: "row",
    alignItems: "center",
  },
  statsIcon: {
    fontSize: 11,
  },
  statsIconSpaced: {
    marginLeft: 8,
  },
  statsText: {
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 3,
  },
  strip: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayCol: {
    flex: 1,
    alignItems: "center",
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 4,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  dotInner: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
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

const rosaryStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
    minHeight: 64,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  iconText: { fontSize: 20 },
  body: { flex: 1 },
  title: { fontSize: 15, fontWeight: "700" },
  subtitle: { marginTop: 2, fontSize: 12 },
  chevron: { fontSize: 20, paddingHorizontal: 4 },
});

const saintStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
    minHeight: 64,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  iconText: { fontSize: 18 },
  body: { flex: 1 },
  label: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: { marginTop: 3, fontSize: 14, fontWeight: "700" },
  chevron: { fontSize: 20, paddingHorizontal: 4 },
});
