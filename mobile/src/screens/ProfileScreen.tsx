import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { ThemePalette } from "../types/theme";

type Props = {
  theme: ThemePalette;
};

export function ProfileScreen({ theme }: Props) {
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
});
