import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { DatePickerModal } from "../components/DatePickerModal";
import { LiturgyPlayer } from "../components/LiturgyPlayer";
import { LoadingScreen } from "../components/LoadingScreen";
import { ReadingSection } from "../components/ReadingSection";
import { ReflectionSection } from "../components/ReflectionSection";
import { AppIcon } from "../components/AppIcon";
import { formatReadableDate } from "../services/date";
import type { DailyLiturgyPayload, ReadingTabKey } from "../types/liturgy";
import type { ThemePalette } from "../types/theme";
import type { UserSettings } from "../types/settings";

type Props = {
  selectedDate: string;
  payload: DailyLiturgyPayload | null;
  loading: boolean;
  theme: ThemePalette;
  settings: UserSettings;
  isRead: boolean;
  onSelectDate: (date: string) => void;
  onAmen: () => void;
  onUpdateFontScale: (delta: number) => void;
};

function TitleCard({
  theme,
  onOpenCalendar,
}: {
  theme: ThemePalette;
  onOpenCalendar: () => void;
}) {
  return (
    <View style={[styles.titleCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
      <Text allowFontScaling style={[styles.titleCardText, { color: theme.titleText }]}>
        Liturgia Diária
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Escolher outra data"
        hitSlop={8}
        style={[
          styles.titleCalendarButton,
          { backgroundColor: `${theme.accent}1F`, borderColor: theme.border },
        ]}
        onPress={onOpenCalendar}
      >
        <AppIcon name="calendar" size={16} color={theme.accent} />
      </Pressable>
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

export function LiturgyScreen({
  selectedDate,
  payload,
  loading,
  theme,
  settings,
  isRead,
  onSelectDate,
  onAmen,
  onUpdateFontScale,
}: Props) {
  const [activeReadingTab, setActiveReadingTab] = useState<ReadingTabKey>("leitura1");
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    setActiveReadingTab("leitura1");
  }, [selectedDate]);

  if (loading) {
    return <LoadingScreen accent={theme.accent} message="Carregando as leituras do dia..." />;
  }

  if (!payload) {
    return (
      <View style={[styles.screen, { backgroundColor: theme.appBackground }]}>
        <View style={styles.headerArea}>
          <TitleCard theme={theme} onOpenCalendar={() => setCalendarOpen(true)} />
        </View>
        <View style={styles.emptyBox}>
          <Text allowFontScaling style={[styles.emptyText, { color: theme.titleText }]}>
            Nenhuma leitura disponível para {formatReadableDate(selectedDate)}.
          </Text>
          <Text allowFontScaling style={[styles.emptyHint, { color: theme.mutedText }]}>
            Escolha outro dia acima para continuar.
          </Text>
        </View>
        <DatePickerModal
          visible={calendarOpen}
          selectedDate={selectedDate}
          theme={theme}
          onSelect={onSelectDate}
          onClose={() => setCalendarOpen(false)}
        />
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
        <TitleCard theme={theme} onOpenCalendar={() => setCalendarOpen(true)} />

        <ReadingTabBar tabs={tabs} active={currentTab} onSelect={setActiveReadingTab} theme={theme} />

        <LiturgyPlayer
          payload={payload}
          theme={theme}
          activeTrack={currentTab}
          onTrackChange={setActiveReadingTab}
          fontScale={settings.fontScale}
          onUpdateFontScale={onUpdateFontScale}
        />
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
            closingPhrase="Graças a Deus"
          />
        ) : null}

        {currentTab === "salmo" ? (
          <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <Text
              allowFontScaling
              style={[styles.cardTitle, { color: theme.titleText, fontSize: 18 * settings.fontScale }]}
            >
              Salmo Responsorial
            </Text>
            <Text
              allowFontScaling
              style={[styles.psalmRefrain, { color: theme.accent, fontSize: 16 * settings.fontScale }]}
            >
              {payload.salmo.refrao}
            </Text>
            <Text
              allowFontScaling
              style={[
                styles.cardText,
                {
                  color: theme.bodyText,
                  fontSize: 16 * settings.fontScale,
                  lineHeight: 26 * settings.fontScale,
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
            closingPhrase="Graças a Deus"
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
            closingPhrase="Glória a vós, Senhor"
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
          style={[
            styles.amenButton,
            isRead
              ? { backgroundColor: "transparent", borderWidth: 1.5, borderColor: theme.accent }
              : { backgroundColor: theme.accent },
          ]}
          onPress={onAmen}
        >
          <Text allowFontScaling style={[styles.amenText, { color: isRead ? theme.accent : "#FFFFFF" }]}>
            <AppIcon
              name={isRead ? "checkmark" : "prayingHands"}
              size={15}
              color={isRead ? theme.accent : "#FFFFFF"}
            />{" "}
            Amém
          </Text>
        </Pressable>
      </View>

      <DatePickerModal
        visible={calendarOpen}
        selectedDate={selectedDate}
        theme={theme}
        onSelect={onSelectDate}
        onClose={() => setCalendarOpen(false)}
      />
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
    fontWeight: "600",
    textAlign: "center",
  },
  emptyHint: {
    marginTop: 6,
    fontSize: 13,
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
    paddingTop: 6,
    paddingBottom: 10,
    borderTopWidth: 1,
    alignItems: "center",
  },
  card: {
    borderRadius: 14,
    padding: 22,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardTitle: {
    fontWeight: "700",
  },
  psalmRefrain: {
    marginTop: 10,
    fontWeight: "700",
  },
  cardText: {
    marginTop: 14,
  },
  amenButton: {
    alignSelf: "center",
    borderRadius: 22,
    minHeight: 44,
    minWidth: 160,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  amenText: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  titleCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  titleCardText: {
    fontSize: 17,
    fontWeight: "800",
  },
  titleCalendarButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
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
