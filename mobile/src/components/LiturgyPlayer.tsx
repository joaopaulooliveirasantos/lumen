import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, Share, StyleSheet, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Speech from "expo-speech";
import { AppIcon } from "./AppIcon";
import type { DailyLiturgyPayload, ReadingTabKey } from "../types/liturgy";
import type { ThemePalette } from "../types/theme";

interface PlayerTrack {
  key: ReadingTabKey;
  label: string;
  text: string;
  shareText: string;
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
      shareText: `Primeira Leitura\n${payload.primeiraLeitura.titulo}\n${payload.primeiraLeitura.referencia}\n\n${payload.primeiraLeitura.texto}`,
    },
    {
      key: "salmo",
      label: "Salmo",
      text: `Salmo responsorial. ${payload.salmo.refrao}. ${payload.salmo.texto}`,
      shareText: `Salmo Responsorial\n${payload.salmo.referencia}\n\n${payload.salmo.refrao}\n\n${payload.salmo.texto}`,
    },
  ];

  if (payload.segundaLeitura) {
    tracks.push({
      key: "leitura2",
      label: "2ª Leitura",
      text: `Segunda leitura. ${payload.segundaLeitura.titulo}. ${payload.segundaLeitura.texto}`,
      shareText: `Segunda Leitura\n${payload.segundaLeitura.titulo}\n${payload.segundaLeitura.referencia}\n\n${payload.segundaLeitura.texto}`,
    });
  }

  tracks.push({
    key: "evangelho",
    label: "Evangelho",
    text: `Evangelho. ${payload.evangelho.titulo}. ${payload.evangelho.texto}`,
    shareText: `Evangelho\n${payload.evangelho.titulo}\n${payload.evangelho.referencia}\n\n${payload.evangelho.texto}`,
  });

  tracks.push({
    key: "homilia",
    label: "Homilía",
    text: `Homilía. ${payload.reflexao.titulo}. ${payload.reflexao.texto}`,
    shareText: `Homilía\n${payload.reflexao.titulo}\n${payload.reflexao.autor}\n\n${payload.reflexao.texto}${
      payload.reflexao.fonte ? `\n\n${payload.reflexao.fonte}` : ""
    }`,
  });

  return tracks;
}

type Props = {
  payload: DailyLiturgyPayload;
  theme: ThemePalette;
  activeTrack: ReadingTabKey;
  onTrackChange: (key: ReadingTabKey) => void;
  fontScale: number;
  onUpdateFontScale: (delta: number) => void;
};

export function LiturgyPlayer({
  payload,
  theme,
  activeTrack,
  onTrackChange,
  fontScale,
  onUpdateFontScale,
}: Props) {
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

  async function handleCopy() {
    if (!currentTrack) return;
    await Clipboard.setStringAsync(currentTrack.shareText);
    Alert.alert("Copiado", "Texto copiado para a área de transferência.");
  }

  async function handleShare() {
    if (!currentTrack) return;
    try {
      await Share.share({ message: currentTrack.shareText });
    } catch {
      // usuário cancelou o compartilhamento
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Leitura anterior"
          hitSlop={6}
          style={styles.iconButton}
          onPress={() => handleStep(-1)}
          disabled={currentIndex <= 0}
        >
          <AppIcon name="playSkipBack" size={16} color={currentIndex <= 0 ? theme.border : theme.accent} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? "Pausar leitura" : "Reproduzir leitura"}
          style={[styles.playButton, { backgroundColor: theme.accent }]}
          onPress={handlePlayPause}
        >
          <AppIcon name={isPlaying ? "pause" : "play"} size={16} color="#FFFFFF" />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Próxima leitura"
          hitSlop={6}
          style={styles.iconButton}
          onPress={() => handleStep(1)}
          disabled={currentIndex >= tracks.length - 1}
        >
          <AppIcon
            name="playSkipForward"
            size={16}
            color={currentIndex >= tracks.length - 1 ? theme.border : theme.accent}
          />
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
      </View>
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
  iconButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
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
});
