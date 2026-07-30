import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LoadingScreen } from "../components/LoadingScreen";
import { ReadingSection } from "../components/ReadingSection";
import { ReflectionSection } from "../components/ReflectionSection";
import { addDays, formatIsoDate, formatReadableDate, getWeekDays } from "../services/date";
import type { DailyLiturgyPayload } from "../types/liturgy";
import type { ThemePalette } from "../types/theme";
import type { UserSettings } from "../types/settings";

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

type ReadingTabKey = "leitura1" | "salmo" | "leitura2" | "evangelho" | "homilia";

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

function ReadingTabBar({
  tabs,
  active,
  onSelect,
  theme,
}: {
  tabs: { key: ReadingTabKey; label: string }[];
  active: ReadingTabKey;
  onSelect: (key: ReadingTabKey) => void;
  theme: ThemePalette;
}) {
  return (
    <View style={[styles.tabBar, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="button"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: isActive }}
            style={[styles.tabButton, isActive && { backgroundColor: theme.accent }]}
            onPress={() => onSelect(tab.key)}
          >
            <Text
              allowFontScaling
              numberOfLines={1}
              style={[
                styles.tabLabel,
                { color: isActive ? "#FFFFFF" : theme.mutedText, fontWeight: isActive ? "700" : "600" },
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function LiturgyScreen({ selectedDate, payload, loading, theme, settings, isRead, onSelectDate, onAmen }: Props) {
  const [activeReadingTab, setActiveReadingTab] = useState<ReadingTabKey>("leitura1");

  useEffect(() => {
    setActiveReadingTab("leitura1");
  }, [selectedDate]);

  if (loading) {
    return <LoadingScreen accent={theme.accent} message="Carregando as leituras do dia..." />;
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

  const tabs: { key: ReadingTabKey; label: string }[] = [
    { key: "leitura1", label: "1ª Leitura" },
    { key: "salmo", label: "Salmo" },
    ...(payload.segundaLeitura ? [{ key: "leitura2" as const, label: "2ª Leitura" }] : []),
    { key: "evangelho", label: "Evangelho" },
    { key: "homilia", label: "Homilía" },
  ];

  const currentTab = tabs.some((tab) => tab.key === activeReadingTab) ? activeReadingTab : "leitura1";

  return (
    <View style={[styles.screen, { backgroundColor: theme.appBackground }]}>
      <View style={styles.headerArea}>
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
        </View>

        <ReadingTabBar tabs={tabs} active={currentTab} onSelect={setActiveReadingTab} theme={theme} />
      </View>

      <ScrollView
        style={styles.tabScroll}
        contentContainerStyle={styles.tabContent}
      >
        {currentTab === "leitura1" ? (
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
        ) : null}

        {currentTab === "salmo" ? (
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
        ) : null}

        {currentTab === "leitura2" && payload.segundaLeitura ? (
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

        {currentTab === "evangelho" ? (
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
        ) : null}

        {currentTab === "homilia" ? (
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

      <View style={[styles.footer, { backgroundColor: theme.appBackground, borderTopColor: theme.border }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isRead ? "Leitura ja concluida" : "Marcar leitura como concluida"}
          style={[styles.amenButton, { backgroundColor: theme.accent, opacity: isRead ? 0.7 : 1 }]}
          onPress={onAmen}
        >
          <Text allowFontScaling style={styles.amenText}>
            {isRead ? "✓ Amém" : "Amém"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  screen: {
    flex: 1,
  },
  headerArea: {
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  tabScroll: {
    flex: 1,
  },
  tabContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 20,
  },
  footer: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 12,
    borderTopWidth: 1,
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
  tabBar: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    marginBottom: 4,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  tabLabel: {
    fontSize: 12,
    textAlign: "center",
  },
});
