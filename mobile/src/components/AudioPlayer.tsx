import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

// expo-av is deprecated in SDK 54 — import lazily to avoid crash
let AudioLib: typeof import("expo-av") | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  AudioLib = require("expo-av") as typeof import("expo-av");
} catch {
  AudioLib = null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SoundRef = any;

type Props = {
  audioUrl: string;
  textColor: string;
  cardColor: string;
  accentColor: string;
};

export function AudioPlayer({ audioUrl, textColor, cardColor, accentColor }: Props) {
  const soundRef = useRef<SoundRef>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!AudioLib) {
    return (
      <View style={[styles.container, { backgroundColor: cardColor }]}>
        <Text allowFontScaling style={[styles.label, { color: textColor }]}>
          Audio indisponivel neste ambiente.
        </Text>
      </View>
    );
  }

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        void (soundRef.current as SoundRef).unloadAsync();
      }
    };
  }, []);

  async function ensureSound(): Promise<SoundRef> {
    if (soundRef.current) return soundRef.current as SoundRef;

    setIsLoading(true);
    const result = await AudioLib!.Audio.Sound.createAsync(
      { uri: audioUrl },
      { shouldPlay: false },
      (status: { isLoaded: boolean; isPlaying?: boolean }) => {
        if (status.isLoaded) setIsPlaying(status.isPlaying ?? false);
      },
    );
    soundRef.current = result.sound;
    setIsLoading(false);
    return result.sound as SoundRef;
  }

  async function togglePlayPause(): Promise<void> {
    try {
      const player = await ensureSound();
      const status = await player.getStatusAsync();
      if (!status.isLoaded) return;
      if (status.isPlaying) {
        await player.pauseAsync();
      } else {
        await player.playAsync();
      }
    } catch {
      setIsPlaying(false);
    }
  }

  async function restartAudio(): Promise<void> {
    if (!soundRef.current) return;
    try {
      const status = await soundRef.current.getStatusAsync();
      if (!status.isLoaded) return;
      await soundRef.current.setPositionAsync(0);
      await soundRef.current.playAsync();
    } catch {
      // ignore
    }
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
