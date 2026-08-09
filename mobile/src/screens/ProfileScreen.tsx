import { useState } from "react";
import { Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Constants from "expo-constants";
import { SettingsScreen } from "./SettingsScreen";
import { useAuth } from "../state/AuthContext";
import { AppIcon } from "../components/AppIcon";
import type { ThemePalette } from "../types/theme";
import type { BibleTranslationId, ReadingMode, UserSettings } from "../types/settings";

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";
const APP_BUILD_NUMBER =
  Platform.OS === "android"
    ? Constants.expoConfig?.android?.versionCode
    : Constants.expoConfig?.ios?.buildNumber;

type ProfileView = "perfil" | "configuracoes";

type Props = {
  theme: ThemePalette;
  settings: UserSettings;
  onUpdateReadingMode: (mode: ReadingMode) => void;
  onUpdateBibleTranslation: (translation: BibleTranslationId) => void;
  onReminderTimeChange: (value: string) => void;
  onEnableReminder: () => void;
  onDisableReminder: () => void;
  onOpenAuth: () => void;
};

export function ProfileScreen({
  theme,
  settings,
  onUpdateReadingMode,
  onUpdateBibleTranslation,
  onReminderTimeChange,
  onEnableReminder,
  onDisableReminder,
  onOpenAuth,
}: Props) {
  const { session, profile, signOut } = useAuth();
  const [view, setView] = useState<ProfileView>("perfil");

  const displayName = profile?.displayName?.trim() || profile?.email || "Usuario";
  const avatarLetter = displayName.charAt(0).toUpperCase() || "U";

  async function handleSignOut(): Promise<void> {
    try {
      await signOut();
    } catch (error) {
      Alert.alert(
        "Nao foi possivel sair",
        error instanceof Error ? error.message : "Ocorreu um erro inesperado.",
      );
    }
  }

  if (view === "configuracoes") {
    return (
      <View style={[styles.subScreen, { backgroundColor: theme.appBackground }]}>
        <View style={styles.headerArea}>
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
        </View>

        <SettingsScreen
          settings={settings}
          theme={theme}
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
    <View style={[styles.container, { backgroundColor: theme.appBackground }]}>
      <View style={styles.headerArea}>
        <View style={[styles.header, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <View style={styles.backBtn}>
            <Image source={require("../../assets/icon.png")} style={styles.headerLogo} />
          </View>
          <Text allowFontScaling style={[styles.headerTitle, { color: theme.titleText }]} numberOfLines={1}>
            Perfil
          </Text>
          <View style={styles.backBtn} />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
      >
        <View style={[styles.avatarContainer, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          {session ? (
            <>
              {profile?.avatarUrl ? (
                <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: theme.accent }]}>
                  <Text style={styles.avatarLetter}>{avatarLetter}</Text>
                </View>
              )}
              <Text allowFontScaling style={[styles.userName, { color: theme.titleText }]}>
                {displayName}
              </Text>
              {profile?.email ? (
                <Text allowFontScaling style={[styles.userSub, { color: theme.mutedText }]}>
                  {profile.email}
                </Text>
              ) : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Sair da conta"
                style={styles.signOutBtn}
                onPress={() => void handleSignOut()}
              >
                <Text allowFontScaling style={[styles.signOutText, { color: theme.accent }]}>
                  Sair
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <View style={[styles.avatar, { backgroundColor: theme.accent }]}>
                <Text style={styles.avatarLetter}>?</Text>
              </View>
              <Text allowFontScaling style={[styles.userName, { color: theme.titleText }]}>
                Visitante
              </Text>
              <Text allowFontScaling style={[styles.userSub, { color: theme.mutedText }]}>
                Entre ou crie uma conta para salvar seu perfil
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Entrar ou criar conta"
                style={[styles.authCta, { backgroundColor: theme.accent }]}
                onPress={onOpenAuth}
              >
                <Text allowFontScaling style={styles.authCtaText}>
                  Entrar ou criar conta
                </Text>
              </Pressable>
            </>
          )}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir configuracoes"
          style={[styles.menuRow, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
          onPress={() => setView("configuracoes")}
        >
          <View style={[styles.menuIcon, { backgroundColor: theme.accent }]}>
            <AppIcon name="settings" size={18} color="#FFFFFF" />
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
            Versão
          </Text>
          <Text allowFontScaling style={[styles.bodyText, { color: theme.mutedText }]}>
            {APP_BUILD_NUMBER ? `${APP_VERSION} (build ${APP_BUILD_NUMBER})` : APP_VERSION}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerArea: {
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerLogo: {
    width: 30,
    height: 30,
    borderRadius: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 28,
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
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
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
  authCta: {
    marginTop: 16,
    minHeight: 44,
    minWidth: 200,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  authCtaText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  signOutBtn: {
    marginTop: 14,
    minHeight: 32,
    justifyContent: "center",
  },
  signOutText: {
    fontSize: 14,
    fontWeight: "700",
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
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
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
