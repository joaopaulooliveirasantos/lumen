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
      accessibilityLabel={`Homilia. ${reflection.titulo}. Autor ${reflection.autor}`}
      style={[styles.card, { backgroundColor: cardColor, borderColor }]}
    >
      <Text allowFontScaling style={[styles.title, { color: titleColor, fontSize: 18 * fontScale }]}>
        Homilía
      </Text>
      <Text allowFontScaling style={[styles.commentTitle, { color: titleColor, fontSize: 16 * fontScale }]}>
        {reflection.titulo}
      </Text>
      <Text allowFontScaling style={[styles.author, { color: mutedColor, fontSize: 14 * fontScale }]}>
        {reflection.autor}
      </Text>
      <Text
        allowFontScaling
        style={[styles.text, { color: bodyColor, fontSize: 16 * fontScale, lineHeight: 26 * fontScale }]}
      >
        {reflection.texto}
      </Text>
      {reflection.fonte ? (
        <Text allowFontScaling style={[styles.source, { color: mutedColor, fontSize: 12 * fontScale }]}>
          {reflection.fonte}
        </Text>
      ) : null}
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
    borderRadius: 14,
    padding: 22,
    marginBottom: 24,
    borderWidth: 1,
  },
  title: {
    fontWeight: "700",
  },
  commentTitle: {
    marginTop: 10,
    fontWeight: "700",
  },
  author: {
    marginTop: 4,
    fontStyle: "italic",
  },
  text: {
    marginTop: 10,
  },
  source: {
    marginTop: 8,
    fontStyle: "italic",
  },
  audio: {
    marginTop: 10,
  },
});
