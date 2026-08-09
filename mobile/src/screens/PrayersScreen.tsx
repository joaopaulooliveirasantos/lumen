import { useState } from "react";
import { Image, Pressable, SectionList, ScrollView, StyleSheet, Text, View } from "react-native";
import { prayerCategories } from "../data/prayers";
import type { Prayer } from "../types/prayers";
import type { ThemePalette } from "../types/theme";
import type { UserSettings } from "../types/settings";

type Props = {
  theme: ThemePalette;
  settings: UserSettings;
};

export function PrayersScreen({ theme, settings }: Props) {
  const [selectedPrayer, setSelectedPrayer] = useState<Prayer | null>(null);
  const fs = settings.fontScale;

  function Header({ title, showBack, onBack }: { title: string; showBack: boolean; onBack?: () => void }) {
    return (
      <View style={styles.headerArea}>
        <View style={[styles.header, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          {showBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              onPress={onBack}
              style={styles.backBtn}
            >
              <Text style={[styles.backText, { color: theme.accent }]}>{"‹"}</Text>
            </Pressable>
          ) : (
            <View style={styles.backBtn}>
              <Image source={require("../../assets/icon.png")} style={styles.headerLogo} />
            </View>
          )}
          <Text allowFontScaling style={[styles.headerTitle, { color: theme.titleText }]} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.backBtn} />
        </View>
      </View>
    );
  }

  if (selectedPrayer) {
    return (
      <View style={[styles.container, { backgroundColor: theme.appBackground }]}>
        <Header title={selectedPrayer.titulo} showBack onBack={() => setSelectedPrayer(null)} />
        <ScrollView contentContainerStyle={styles.readingContent}>
          <View style={[styles.readingCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <Text
              allowFontScaling
              style={[styles.readingTitle, { color: theme.titleText, fontSize: 18 * fs }]}
            >
              {selectedPrayer.titulo}
            </Text>
            <Text
              allowFontScaling
              style={[
                styles.readingText,
                { color: theme.bodyText, fontSize: 16 * fs, lineHeight: 26 * fs },
              ]}
            >
              {selectedPrayer.texto}
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.appBackground }]}>
      <Header title="Orações" showBack={false} />
      <SectionList
        sections={prayerCategories.map((category) => ({ title: category.nome, data: category.oracoes }))}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <Text allowFontScaling style={[styles.sectionLabel, { color: theme.mutedText }]}>
            {section.title}
          </Text>
        )}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            style={[styles.row, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
            onPress={() => setSelectedPrayer(item)}
          >
            <View style={[styles.rowAccent, { backgroundColor: theme.accent }]} />
            <Text
              allowFontScaling
              style={[styles.rowTitle, { color: theme.titleText, fontSize: 15 * fs }]}
              numberOfLines={1}
            >
              {item.titulo}
            </Text>
            <Text style={[styles.chevron, { color: theme.mutedText }]}>{"›"}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  backBtn: { width: 40, alignItems: "center" },
  backText: { fontSize: 28, fontWeight: "700", lineHeight: 32 },
  headerLogo: { width: 30, height: 30, borderRadius: 8 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: "700", textAlign: "center" },
  listContent: { padding: 12, paddingBottom: 28 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    minHeight: 52,
    marginBottom: 8,
  },
  rowAccent: { width: 4, alignSelf: "stretch" },
  rowTitle: { flex: 1, fontWeight: "600", paddingHorizontal: 14 },
  chevron: { paddingHorizontal: 12, fontSize: 20 },
  readingContent: { padding: 14, paddingBottom: 28 },
  readingCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
  },
  readingTitle: {
    fontWeight: "800",
    marginBottom: 14,
  },
  readingText: {
    fontWeight: "400",
  },
});
