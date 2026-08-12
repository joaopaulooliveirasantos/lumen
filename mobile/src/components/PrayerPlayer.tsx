import { useEffect, useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Speech from "expo-speech";
import { AppIcon } from "./AppIcon";
import { loadSavedVoiceIdentifier, saveVoiceIdentifier } from "../storage/ttsVoice";
import { getDeviceLanguage, pickBestVoice, rankVoices, type VoiceScore } from "../services/ttsVoiceRanking";
import type { ThemePalette } from "../types/theme";

type Props = {
  text: string;
  shareText: string;
  resetKey: string | number;
  theme: ThemePalette;
  fontScale: number;
  onUpdateFontScale: (delta: number) => void;
};

export function PrayerPlayer({ text, shareText, resetKey, theme, fontScale, onUpdateFontScale }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [voice, setVoice] = useState<Speech.Voice | null>(null);
  const [voiceRanking, setVoiceRanking] = useState<VoiceScore[]>([]);
  const [voiceDebugOpen, setVoiceDebugOpen] = useState(false);
  const deviceLanguage = useMemo(() => getDeviceLanguage(), []);
  const visibleVoiceRanking = useMemo(
    () => voiceRanking.filter((entry) => (entry.voice.language ?? "").toLowerCase().startsWith(deviceLanguage)),
    [voiceRanking, deviceLanguage],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [voices, savedIdentifier] = await Promise.all([
        Speech.getAvailableVoicesAsync(),
        loadSavedVoiceIdentifier(),
      ]);
      if (cancelled) return;
      const ranked = rankVoices(voices);
      setVoiceRanking(ranked);
      const savedVoice = savedIdentifier
        ? ranked.find((entry) => entry.voice.identifier === savedIdentifier)?.voice ?? null
        : null;
      setVoice(savedVoice ?? pickBestVoice(ranked));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    Speech.stop();
    setIsPlaying(false);
  }, [resetKey]);

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  function selectVoice(selected: Speech.Voice) {
    setVoice(selected);
    setVoiceDebugOpen(false);
    void saveVoiceIdentifier(selected.identifier);
  }

  function handlePlayPause() {
    if (isPlaying) {
      Speech.stop();
      setIsPlaying(false);
      return;
    }
    Speech.stop();
    setIsPlaying(true);
    Speech.speak(text, {
      language: "pt-BR",
      voice: voice?.identifier,
      pitch: 0.88,
      rate: 0.94,
      onDone: () => setIsPlaying(false),
      onStopped: () => setIsPlaying(false),
      onError: () => setIsPlaying(false),
    });
  }

  async function handleCopy() {
    await Clipboard.setStringAsync(shareText);
    Alert.alert("Copiado", "Texto copiado para a área de transferência.");
  }

  async function handleShare() {
    try {
      await Share.share({ message: shareText });
    } catch {
      // usuário cancelou o compartilhamento
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? "Pausar leitura" : "Reproduzir leitura"}
          style={[styles.playButton, { backgroundColor: theme.accent }]}
          onPress={handlePlayPause}
        >
          <AppIcon name={isPlaying ? "pause" : "play"} size={16} color="#FFFFFF" />
        </Pressable>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Diminuir tamanho da fonte"
          hitSlop={6}
          style={styles.fontButton}
          onPress={() => onUpdateFontScale(-0.1)}
          disabled={fontScale <= 0.9}
        >
          <Text style={[styles.fontButtonText, { color: fontScale <= 0.9 ? theme.border : theme.accent }]}>
            A-
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Aumentar tamanho da fonte"
          hitSlop={6}
          style={styles.fontButton}
          onPress={() => onUpdateFontScale(0.1)}
          disabled={fontScale >= 1.5}
        >
          <Text style={[styles.fontButtonText, { color: fontScale >= 1.5 ? theme.border : theme.accent }]}>
            A+
          </Text>
        </Pressable>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Copiar texto"
          hitSlop={6}
          style={styles.actionButton}
          onPress={() => void handleCopy()}
        >
          <AppIcon name="copy" size={16} color={theme.accent} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Compartilhar"
          hitSlop={6}
          style={styles.actionButton}
          onPress={() => void handleShare()}
        >
          <AppIcon name="share" size={16} color={theme.accent} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Escolher voz de leitura"
          hitSlop={6}
          style={styles.actionButton}
          onPress={() => setVoiceDebugOpen(true)}
        >
          <AppIcon name="voice" size={16} color={theme.accent} />
        </Pressable>
      </View>

      <Modal
        visible={voiceDebugOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setVoiceDebugOpen(false)}
      >
        <View style={styles.debugBackdrop}>
          <View style={[styles.debugCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <Text allowFontScaling style={[styles.debugTitle, { color: theme.titleText }]}>
              Vozes de leitura ({visibleVoiceRanking.length})
            </Text>
            <Text allowFontScaling style={[styles.debugSubtitle, { color: theme.mutedText }]}>
              Idioma do aparelho: {deviceLanguage} · Selecionada:{" "}
              {voice ? `${voice.name ?? voice.identifier}` : "nenhuma"} · toque numa voz para usá-la
            </Text>

            <ScrollView style={styles.debugList}>
              {visibleVoiceRanking.map((entry) => {
                const isSelected = voice?.identifier === entry.voice.identifier;
                return (
                  <Pressable
                    key={entry.voice.identifier}
                    accessibilityRole="button"
                    accessibilityLabel={`Usar a voz ${entry.voice.name ?? entry.voice.identifier}`}
                    accessibilityState={{ selected: isSelected }}
                    style={[
                      styles.debugRow,
                      { borderColor: theme.border },
                      isSelected && { backgroundColor: `${theme.accent}18`, borderColor: theme.accent },
                    ]}
                    onPress={() => selectVoice(entry.voice)}
                  >
                    <View style={styles.debugRowHeader}>
                      <Text
                        allowFontScaling
                        numberOfLines={1}
                        style={[styles.debugVoiceName, { color: theme.titleText }]}
                      >
                        {isSelected ? "✓ " : ""}
                        {entry.voice.name ?? entry.voice.identifier}
                      </Text>
                      <Text
                        allowFontScaling
                        style={[
                          styles.debugScore,
                          { color: entry.eligible ? theme.accent : theme.mutedText },
                        ]}
                      >
                        {entry.eligible ? entry.score : "N/A"}
                      </Text>
                    </View>
                    <Text
                      allowFontScaling
                      numberOfLines={1}
                      style={[styles.debugVoiceMeta, { color: theme.mutedText }]}
                    >
                      {entry.voice.identifier}
                    </Text>
                    <Text allowFontScaling style={[styles.debugVoiceMeta, { color: theme.mutedText }]}>
                      idioma: {entry.voice.language ?? "?"} · qualidade: {entry.voice.quality ?? "?"}
                      {!entry.eligible ? " · não elegível (não é pt)" : ""}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fechar"
              style={[styles.debugCloseButton, { backgroundColor: theme.accent }]}
              onPress={() => setVoiceDebugOpen(false)}
            >
              <Text allowFontScaling style={styles.debugCloseText}>Fechar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    width: 1,
    height: 22,
    marginHorizontal: 2,
  },
  fontButton: {
    width: 28,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  fontButtonText: {
    fontSize: 13,
    fontWeight: "800",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  debugBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  debugCard: {
    maxHeight: "80%",
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  debugSubtitle: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
  },
  debugList: {
    marginTop: 12,
  },
  debugRow: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginBottom: 8,
  },
  debugRowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  debugVoiceName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
  },
  debugScore: {
    fontSize: 13,
    fontWeight: "800",
  },
  debugVoiceMeta: {
    marginTop: 2,
    fontSize: 11,
  },
  debugCloseButton: {
    marginTop: 12,
    minHeight: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  debugCloseText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
