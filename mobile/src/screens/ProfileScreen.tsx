import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SettingsScreen } from "./SettingsScreen";
import type { ThemePalette } from "../types/theme";
import type { BibleTranslationId, ReadingMode, UserSettings } from "../types/settings";

type ProfileView = "perfil" | "configuracoes";

type Props = {
  theme: ThemePalette;
  settings: UserSettings;
  onUpdateFontScale: (delta: number) => void;
  onUpdateReadingMode: (mode: ReadingMode) => void;
  onUpdateBibleTranslation: (translation: BibleTranslationId) => void;
  onReminderTimeChange: (value: string) => void;
  onEnableReminder: () => void;
  onDisableReminder: () => void;
};

export function ProfileScreen({
  theme,
  settings,
  onUpdateFontScale,
  onUpdateReadingMode,
  onUpdateBibleTranslation,
  onReminderTimeChange,
  onEnableReminder,
  onDisableReminder,
}: Props) {
  const [view, setView] = useState<ProfileView>("perfil");

  if (view === "configuracoes") {
    return (
      <View style={[styles.subScreen, { backgroundColor: theme.appBackground }]}>
        <View style={[styles.subHeader, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar para o perfil"
            onPress={() => setView("perfil")}
            style={styles.backBtn}
          >
            <Text style={[styles.backText, { color: theme.accent }]}>{"‹"}</Text>
          </Pressable>
          <Text allowFontScaling style={[styles.subHeaderTitle, { color: theme.titleText }]} numberOfLines={1}>
            Configurações
          </Text>
          <View style={styles.backBtn} />
        </View>

        <SettingsScreen
          settings={settings}
          theme={theme}
          onUpdateFontScale={onUpdateFontScale}
          onUpdateReadingMode={onUpdateReadingMode}
          onUpdateBibleTranslation={onUpdateBibleTranslation}
          onReminderTimeChange={onReminderTimeChange}
          onEnableReminder={onEnableReminder}
          onDisableReminder={onDisableReminder}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: theme.appBackground }]}
      contentContainerStyle={styles.content}
    >
      <Text allowFontScaling style={[styles.pageTitle, { color: theme.titleText }]}>
        Perfil do Usuario
      </Text>

      <View style={[styles.avatarContainer, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <View style={[styles.avatar, { backgroundColor: theme.accent }]}>
          <Text style={styles.avatarLetter}>U</Text>
        </View>
        <Text allowFontScaling style={[styles.userName, { color: theme.titleText }]}>
          Usuario
        </Text>
        <Text allowFontScaling style={[styles.userSub, { color: theme.mutedText }]}>
          Membro da comunidade Lumen
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Abrir configuracoes"
        style={[styles.menuRow, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
        onPress={() => setView("configuracoes")}
      >
        <View style={[styles.menuIcon, { backgroundColor: theme.accent }]}>
          <Text style={styles.menuIconText}>⚙️</Text>
        </View>
        <View style={styles.menuBody}>
          <Text allowFontScaling style={[styles.menuTitle, { color: theme.titleText }]}>
            Configurações
          </Text>
          <Text allowFontScaling style={[styles.menuSub, { color: theme.mutedText }]}>
            Tema, fonte e lembrete diario
          </Text>
        </View>
        <Text style={[styles.chevron, { color: theme.mutedText }]}>{"›"}</Text>
      </Pressable>

      <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <Text allowFontScaling style={[styles.sectionTitle, { color: theme.titleText }]}>
          Sobre o Lumen
        </Text>
        <Text allowFontScaling style={[styles.bodyText, { color: theme.bodyText }]}>
          Lumen e um aplicativo de liturgia diaria que traz as leituras e reflexoes do dia para voce onde estiver.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <Text allowFontScaling style={[styles.sectionTitle, { color: theme.titleText }]}>
          Versao
        </Text>
        <Text allowFontScaling style={[styles.bodyText, { color: theme.mutedText }]}>
          1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 28,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 18,
  },
  avatarContainer: {
    borderRadius: 14,
    padding: 24,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarLetter: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "800",
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
  },
  userSub: {
    marginTop: 4,
    fontSize: 13,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
    minHeight: 64,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuIconText: {
    fontSize: 18,
  },
  menuBody: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  menuSub: {
    marginTop: 2,
    fontSize: 12,
  },
  chevron: {
    fontSize: 20,
    paddingHorizontal: 4,
  },
  card: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 22,
  },
  subScreen: {
    flex: 1,
  },
  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    alignItems: "center",
  },
  backText: {
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 32,
  },
  subHeaderTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
});
