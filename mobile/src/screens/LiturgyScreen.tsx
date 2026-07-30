import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ReadingSection } from "../components/ReadingSection";
import { addDays, formatIsoDate, formatReadableDate, getWeekDays } from "../services/date";
import type { DailyLiturgyPayload } from "../types/liturgy";
import type { ThemePalette } from "../types/theme";
import type { UserSettings } from "../types/settings";

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

type Props = {
  selectedDate: string;
  payload: DailyLiturgyPayload | null;
  loading: boolean;
  theme: ThemePalette;
  settings: UserSettings;
  isRead: boolean;
  onSelectDate: (date: string) => void;
  onAmen: () => void;
};

function WeekCalendar({
  selectedDate,
  theme,
  onSelectDate,
}: {
  selectedDate: string;
  theme: ThemePalette;
  onSelectDate: (date: string) => void;
}) {
  const today = formatIsoDate(new Date());
  const weekDays = getWeekDays(selectedDate);

  return (
    <View style={[styles.calendarContainer, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
      <View style={styles.calendarNav}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Semana anterior"
          style={[styles.navButton, { borderColor: theme.border }]}
          onPress={() => onSelectDate(addDays(weekDays[0], -7))}
        >
          <Text style={[styles.navButtonText, { color: theme.accent }]}>{"‹"}</Text>
        </Pressable>

        <View style={styles.calendarRow}>
          {weekDays.map((day, index) => {
            const isSelected = day === selectedDate;
            const isToday = day === today;
            const dayNumber = day.slice(8); // DD

            return (
              <Pressable
                key={day}
                accessibilityRole="button"
                accessibilityLabel={`${DAY_LABELS[index]} ${dayNumber}`}
                style={[
                  styles.dayCell,
                  isSelected && { backgroundColor: theme.accent },
                ]}
                onPress={() => onSelectDate(day)}
              >
                <Text
                  style={[
                    styles.dayLabel,
                    { color: isSelected ? "#FFFFFF" : theme.mutedText },
                  ]}
                >
                  {DAY_LABELS[index]}
                </Text>
                <Text
                  style={[
                    styles.dayNumber,
                    {
                      color: isSelected
                        ? "#FFFFFF"
                        : isToday
                        ? theme.accent
                        : theme.titleText,
                      fontWeight: isToday || isSelected ? "800" : "500",
                    },
                  ]}
                >
                  {dayNumber}
                </Text>
                {isToday && !isSelected ? (
                  <View style={[styles.todayDot, { backgroundColor: theme.accent }]} />
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Proxima semana"
          style={[styles.navButton, { borderColor: theme.border }]}
          onPress={() => onSelectDate(addDays(weekDays[6], 1))}
        >
          <Text style={[styles.navButtonText, { color: theme.accent }]}>{"›"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function LiturgyScreen({ selectedDate, payload, loading, theme, settings, isRead, onSelectDate, onAmen }: Props) {
  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text allowFontScaling style={[styles.loadingText, { color: theme.mutedText }]}>
          Carregando leituras...
        </Text>
      </View>
    );
  }

  if (!payload) {
    return (
      <View style={styles.emptyBox}>
        <Text allowFontScaling style={[styles.emptyText, { color: theme.mutedText }]}>
          Nenhuma leitura disponivel.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: theme.appBackground }]}
      contentContainerStyle={styles.scrollContent}
    >
      <WeekCalendar selectedDate={selectedDate} theme={theme} onSelectDate={onSelectDate} />

      <View style={[styles.dateHeader, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <Text allowFontScaling style={[styles.dateText, { color: theme.mutedText }]}>
          {formatReadableDate(selectedDate)}
        </Text>
        <View style={styles.colorRow}>
          <View style={[styles.colorDot, { backgroundColor: theme.accent }]} />
          <Text allowFontScaling style={[styles.colorText, { color: theme.accent }]}>
            {payload.cor}
          </Text>
        </View>
      </View>

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
          style={[
            styles.liturgicTitle,
            { color: theme.titleText, fontSize: 15 * settings.fontScale },
          ]}
        >
          {payload.liturgia}
        </Text>
        <Text
          allowFontScaling
          style={[styles.liturgicCor, { color: theme.accent, fontSize: 13 * settings.fontScale }]}
        >
          Cor liturgica: {payload.cor}
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
        <Text
          allowFontScaling
          style={[styles.cardTitle, { color: theme.titleText, fontSize: 16 * settings.fontScale }]}
        >
          Salmo Responsorial
        </Text>
        <Text
          allowFontScaling
          style={[styles.psalmRefrain, { color: theme.accent, fontSize: 15 * settings.fontScale }]}
        >
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

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isRead ? "Leitura ja concluida" : "Marcar leitura como concluida"}
        style={[styles.amenButton, { backgroundColor: theme.accent, opacity: isRead ? 0.7 : 1 }]}
        onPress={onAmen}
      >
        <Text allowFontScaling style={styles.amenText}>
          {isRead ? "\u2713 Am\u00e9m" : "Am\u00e9m"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 8,
  },
  emptyBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
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
  liturgicCor: {
    marginTop: 4,
    fontWeight: "600",
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
  dateHeader: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateText: {
    fontSize: 13,
    textTransform: "capitalize",
    flex: 1,
    marginRight: 8,
  },
  colorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  colorText: {
    fontSize: 12,
    fontWeight: "700",
  },
  amenButton: {
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 14,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  amenText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 1,
  },
  calendarContainer: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  calendarNav: {
    flexDirection: "row",
    alignItems: "center",
  },
  calendarRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  navButton: {
    width: 32,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 2,
  },
  navButtonText: {
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 26,
  },
  dayCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    borderRadius: 10,
    minHeight: 52,
    gap: 2,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  dayNumber: {
    fontSize: 16,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
