import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Speech from "expo-speech";
import type { DailyLiturgyPayload, ReadingTabKey } from "../types/liturgy";
import type { ThemePalette } from "../types/theme";

interface PlayerTrack {
  key: ReadingTabKey;
  label: string;
  text: string;
}

const MALE_NAME_HINTS = [
  "male", "homem", "masculin",
  "ricardo", "daniel", "diego", "felipe", "thiago", "tiago", "marco", "marcos",
  "paulo", "rodrigo", "bruno", "carlos", "pedro", "joao", "joão", "antonio", "antônio",
];
const FEMALE_NAME_HINTS = [
  "female", "mulher", "feminin",
  "luciana", "joana", "camila", "fernanda", "vitoria", "vitória", "raquel", "ines", "inês",
];

// Escolhe a melhor voz pt-BR disponível no aparelho: prioriza qualidade "Enhanced"
// (soa bem menos robótica que a voz padrão) e nomes que sugerem timbre masculino.
function pickBestVoice(voices: Speech.Voice[]): Speech.Voice | null {
  let best: Speech.Voice | null = null;
  let bestScore = -Infinity;

  for (const voice of voices) {
    const lang = (voice.language ?? "").toLowerCase();
    if (!lang.startsWith("pt")) continue;

    let score = lang === "pt-br" ? 100 : 60;
    if (voice.quality === Speech.VoiceQuality.Enhanced) score += 40;

    const haystack = `${voice.name ?? ""} ${voice.identifier ?? ""}`.toLowerCase();
    if (MALE_NAME_HINTS.some((hint) => haystack.includes(hint))) score += 25;
    if (FEMALE_NAME_HINTS.some((hint) => haystack.includes(hint))) score -= 25;

    if (score > bestScore) {
      bestScore = score;
      best = voice;
    }
  }

  return best;
}

function buildTracks(payload: DailyLiturgyPayload): PlayerTrack[] {
  const tracks: PlayerTrack[] = [
    {
      key: "leitura1",
      label: "1ª Leitura",
      text: `Primeira leitura. ${payload.primeiraLeitura.titulo}. ${payload.primeiraLeitura.texto}`,
    },
    {
      key: "salmo",
      label: "Salmo",
      text: `Salmo responsorial. ${payload.salmo.refrao}. ${payload.salmo.texto}`,
    },
  ];

  if (payload.segundaLeitura) {
    tracks.push({
      key: "leitura2",
      label: "2ª Leitura",
      text: `Segunda leitura. ${payload.segundaLeitura.titulo}. ${payload.segundaLeitura.texto}`,
    });
  }

  tracks.push({
    key: "evangelho",
    label: "Evangelho",
    text: `Evangelho. ${payload.evangelho.titulo}. ${payload.evangelho.texto}`,
  });

  tracks.push({
    key: "homilia",
    label: "Homilía",
    text: `Homilía. ${payload.reflexao.titulo}. ${payload.reflexao.texto}`,
  });

  return tracks;
}

type Props = {
  payload: DailyLiturgyPayload;
  theme: ThemePalette;
  activeTrack: ReadingTabKey;
  onTrackChange: (key: ReadingTabKey) => void;
};

export function LiturgyPlayer({ payload, theme, activeTrack, onTrackChange }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [voice, setVoice] = useState<Speech.Voice | null>(null);
  const tracks = useMemo(() => buildTracks(payload), [payload]);

  useEffect(() => {
    let cancelled = false;
    void Speech.getAvailableVoicesAsync().then((voices) => {
      if (!cancelled) setVoice(pickBestVoice(voices));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    Speech.stop();
    setIsPlaying(false);
  }, [payload]);

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  function speakTrack(key: ReadingTabKey) {
    const track = tracks.find((t) => t.key === key);
    if (!track) {
      setIsPlaying(false);
      return;
    }
    Speech.stop();
    setIsPlaying(true);
    Speech.speak(track.text, {
      language: "pt-BR",
      voice: voice?.identifier,
      pitch: 0.88,
      rate: 0.94,
      onDone: () => {
        const idx = tracks.findIndex((t) => t.key === key);
        const next = tracks[idx + 1];
        if (next) {
          onTrackChange(next.key);
          speakTrack(next.key);
        } else {
          setIsPlaying(false);
        }
      },
      onStopped: () => setIsPlaying(false),
      onError: () => setIsPlaying(false),
    });
  }

  function handlePlayPause() {
    if (isPlaying) {
      Speech.stop();
      setIsPlaying(false);
    } else {
      speakTrack(activeTrack);
    }
  }

  function handleStep(delta: 1 | -1) {
    const idx = tracks.findIndex((t) => t.key === activeTrack);
    const target = tracks[idx + delta];
    if (!target) return;
    onTrackChange(target.key);
    if (isPlaying) speakTrack(target.key);
  }

  const currentIndex = tracks.findIndex((t) => t.key === activeTrack);
  const currentTrack = tracks[currentIndex];

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
      <View style={styles.info}>
        <Text allowFontScaling style={[styles.label, { color: theme.mutedText }]}>
          {isPlaying ? "Ouvindo agora" : "Player de leitura"}
        </Text>
        <Text allowFontScaling numberOfLines={1} style={[styles.trackName, { color: theme.titleText }]}>
          {currentTrack ? currentTrack.label : "—"}
          {tracks.length ? `  ·  ${currentIndex + 1}/${tracks.length}` : ""}
        </Text>
      </View>

      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Leitura anterior"
          hitSlop={6}
          style={styles.iconButton}
          onPress={() => handleStep(-1)}
          disabled={currentIndex <= 0}
        >
          <Text style={[styles.icon, { color: currentIndex <= 0 ? theme.border : theme.accent }]}>⏮</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? "Pausar leitura" : "Reproduzir leitura"}
          style={[styles.playButton, { backgroundColor: theme.accent }]}
          onPress={handlePlayPause}
        >
          <Text style={styles.playIcon}>{isPlaying ? "⏸" : "▶"}</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Próxima leitura"
          hitSlop={6}
          style={styles.iconButton}
          onPress={() => handleStep(1)}
          disabled={currentIndex >= tracks.length - 1}
        >
          <Text
            style={[
              styles.icon,
              { color: currentIndex >= tracks.length - 1 ? theme.border : theme.accent },
            ]}
          >
            ⏭
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
    gap: 10,
  },
  info: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  trackName: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: "700",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  iconButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    fontSize: 16,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  playIcon: {
    color: "#FFFFFF",
    fontSize: 16,
  },
});
