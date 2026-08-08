import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { fetchSaintStory } from "../services/api";
import { AppIcon } from "../components/AppIcon";
import type { SaintStoryPayload } from "../types/liturgy";
import type { ThemePalette } from "../types/theme";
import type { UserSettings } from "../types/settings";

type Props = {
  date: string;
  theme: ThemePalette;
  settings: UserSettings;
  onExit: () => void;
};

export function SaintStoryScreen({ date, theme, settings, onExit }: Props) {
  const [story, setStory] = useState<SaintStoryPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fs = settings.fontScale;

  useEffect(() => {
    void load();
  }, [date]);

  async function load(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchSaintStory(date);
      setStory(result);
    } catch (err) {
      setStory(null);
      setError(err instanceof Error ? err.message : "Falha ao carregar a historia do santo do dia.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.appBackground }]}>
      <View style={[styles.header, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar historia do santo do dia"
          onPress={onExit}
          style={styles.closeBtn}
        >
          <AppIcon name="close" size={18} color={theme.accent} />
        </Pressable>
        <Text
          allowFontScaling
          style={[styles.headerTitle, { color: theme.titleText }]}
          numberOfLines={1}
        >
          Santo do Dia
        </Text>
        <View style={styles.closeBtn} />
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text allowFontScaling style={[styles.loadingText, { color: theme.mutedText }]}>
            Carregando a historia do santo do dia...
          </Text>
        </View>
      ) : error || !story ? (
        <View style={styles.centerBox}>
          <Text allowFontScaling style={[styles.errorTitle, { color: theme.titleText }]}>
            Nao foi possivel carregar a historia.
          </Text>
          {error ? (
            <Text allowFontScaling style={[styles.errorText, { color: theme.mutedText }]}>
              {error}
            </Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tentar carregar novamente"
            style={[styles.retryButton, { backgroundColor: theme.accent }]}
            onPress={() => void load()}
          >
            <Text allowFontScaling style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {story.imagemUrl ? (
            <Image source={{ uri: story.imagemUrl }} style={styles.image} resizeMode="cover" />
          ) : null}

          <Text
            allowFontScaling
            style={[styles.title, { color: theme.titleText, fontSize: 20 * fs }]}
          >
            {story.nome}
          </Text>

          {story.paragrafos.map((bloco, index) =>
            bloco.tipo === "titulo" ? (
              <Text
                key={index}
                allowFontScaling
                style={[styles.blockTitle, { color: theme.titleText, fontSize: 16 * fs }]}
              >
                {bloco.texto}
              </Text>
            ) : (
              <Text
                key={index}
                allowFontScaling
                style={[
                  styles.blockText,
                  { color: theme.bodyText, fontSize: 15 * fs, lineHeight: 24 * fs },
                ]}
              >
                {bloco.texto}
              </Text>
            ),
          )}

          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Abrir fonte original na Cancao Nova"
            style={styles.sourceLink}
            onPress={() => void Linking.openURL(story.fonteUrl)}
          >
            <Text allowFontScaling style={[styles.sourceText, { color: theme.accent }]}>
              Fonte: Canção Nova{" "}
              <AppIcon name="externalLink" size={13} color={theme.accent} />
            </Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    fontSize: 18,
    fontWeight: "700",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
  },
  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    textAlign: "center",
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  errorText: {
    marginTop: 8,
    fontSize: 13,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    borderRadius: 22,
    minHeight: 44,
    minWidth: 160,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 14,
  },
  title: {
    marginTop: 16,
    fontWeight: "800",
  },
  blockTitle: {
    marginTop: 18,
    fontWeight: "700",
  },
  blockText: {
    marginTop: 8,
  },
  sourceLink: {
    marginTop: 28,
    alignSelf: "center",
    minHeight: 32,
    justifyContent: "center",
  },
  sourceText: {
    fontSize: 13,
    fontWeight: "700",
  },
});
