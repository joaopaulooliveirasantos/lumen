import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { ReflectionBlock } from "../types/liturgy";
import { AudioPlayer } from "./AudioPlayer";

type Props = {
  reflection: ReflectionBlock;
  fontScale: number;
  cardColor: string;
  borderColor: string;
  titleColor: string;
  bodyColor: string;
  mutedColor: string;
  accentColor: string;
};

function ReflectionSectionComponent({
  reflection,
  fontScale,
  cardColor,
  borderColor,
  titleColor,
  bodyColor,
  mutedColor,
  accentColor,
}: Props) {
  return (
    <View
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`Reflexao do dia. Autor ${reflection.autor}`}
      style={[styles.card, { backgroundColor: cardColor, borderColor }]}
    >
      <Text allowFontScaling style={[styles.title, { color: titleColor, fontSize: 16 * fontScale }]}> 
        Reflexao do Dia
      </Text>
      <Text allowFontScaling style={[styles.author, { color: mutedColor, fontSize: 14 * fontScale }]}>
        {reflection.autor}
      </Text>
      <Text
        allowFontScaling
        style={[styles.text, { color: bodyColor, fontSize: 15 * fontScale, lineHeight: 24 * fontScale }]}
      >
        {reflection.texto}
      </Text>
      {reflection.audioUrl ? (
        <AudioPlayer
          audioUrl={reflection.audioUrl}
          textColor={titleColor}
          cardColor={cardColor}
          accentColor={accentColor}
        />
      ) : (
        <Text allowFontScaling style={[styles.audio, { color: mutedColor, fontSize: 13 * fontScale }]}>
          Audio indisponivel para esta data.
        </Text>
      )}
    </View>
  );
}

export const ReflectionSection = memo(ReflectionSectionComponent);

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  title: {
    fontWeight: "700",
  },
  author: {
    marginTop: 4,
  },
  text: {
    marginTop: 10,
  },
  audio: {
    marginTop: 10,
  },
});
