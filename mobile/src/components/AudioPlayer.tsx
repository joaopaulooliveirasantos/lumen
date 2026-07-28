import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Audio } from "expo-av";

type Props = {
  audioUrl: string;
  textColor: string;
  cardColor: string;
  accentColor: string;
};

export function AudioPlayer({ audioUrl, textColor, cardColor, accentColor }: Props) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (sound) {
        void sound.unloadAsync();
      }
    };
  }, [sound]);

  async function ensureSound(): Promise<Audio.Sound> {
    if (sound) {
      return sound;
    }

    setIsLoading(true);
    const result = await Audio.Sound.createAsync(
      { uri: audioUrl },
      { shouldPlay: false },
      (status) => {
        if (status.isLoaded) {
          setIsPlaying(status.isPlaying);
        }
      },
    );
    setSound(result.sound);
    setIsLoading(false);
    return result.sound;
  }

  async function togglePlayPause(): Promise<void> {
    try {
      const player = await ensureSound();
      const status = await player.getStatusAsync();
      if (!status.isLoaded) {
        return;
      }

      if (status.isPlaying) {
        await player.pauseAsync();
        return;
      }

      await player.playAsync();
    } catch {
      setIsPlaying(false);
    }
  }

  async function restartAudio(): Promise<void> {
    if (!sound) {
      return;
    }

    const status = await sound.getStatusAsync();
    if (!status.isLoaded) {
      return;
    }

    await sound.setPositionAsync(0);
    await sound.playAsync();
  }

  return (
    <View
      accessible
      accessibilityRole="summary"
      accessibilityLabel="Controles de audio da reflexao"
      style={[styles.container, { backgroundColor: cardColor }]}
    >
      <Text allowFontScaling style={[styles.label, { color: textColor }]}>Homilia em audio</Text>
      <View style={styles.buttonsRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? "Pausar audio" : "Reproduzir audio"}
          accessibilityHint="Controla a reproducao da homilia"
          style={[styles.button, { backgroundColor: accentColor }]}
          onPress={() => void togglePlayPause()}
        >
          <Text allowFontScaling style={styles.buttonText}>
            {isLoading ? "Carregando..." : isPlaying ? "Pausar" : "Reproduzir"}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reiniciar audio"
          accessibilityHint="Volta o audio para o inicio"
          style={[styles.secondaryButton, { borderColor: accentColor }]}
          onPress={() => void restartAudio()}
        >
          <Text allowFontScaling style={[styles.secondaryButtonText, { color: accentColor }]}>Reiniciar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    borderRadius: 10,
    padding: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  buttonsRow: {
    marginTop: 10,
    flexDirection: "row",
    gap: 8,
  },
  button: {
    borderRadius: 8,
    minHeight: 44,
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  secondaryButton: {
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  secondaryButtonText: {
    fontWeight: "700",
  },
});
