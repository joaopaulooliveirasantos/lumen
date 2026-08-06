import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { ReadingBlock } from "../types/liturgy";

type Props = {
  title: string;
  reading: ReadingBlock;
  fontScale: number;
  cardColor: string;
  borderColor: string;
  titleColor: string;
  bodyColor: string;
  accentColor: string;
  closingPhrase?: string;
};

function ReadingSectionComponent({
  title,
  reading,
  fontScale,
  cardColor,
  borderColor,
  titleColor,
  bodyColor,
  accentColor,
  closingPhrase,
}: Props) {
  return (
    <View
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`${title}. ${reading.referencia}. ${reading.titulo}`}
      style={[styles.card, { backgroundColor: cardColor, borderColor }]}
    >
      <Text allowFontScaling style={[styles.title, { color: titleColor, fontSize: 16 * fontScale }]}>
        {title}
      </Text>
      <Text allowFontScaling style={[styles.reference, { color: accentColor, fontSize: 13 * fontScale }]}>
        {reading.referencia}
      </Text>
      <Text allowFontScaling style={[styles.subtitle, { color: titleColor, fontSize: 14 * fontScale }]}>
        {reading.titulo}
      </Text>
      <Text
        allowFontScaling
        style={[styles.text, { color: bodyColor, fontSize: 15 * fontScale, lineHeight: 24 * fontScale }]}
      >
        {reading.texto}
      </Text>
      {closingPhrase ? (
        <Text
          allowFontScaling
          style={[styles.closingPhrase, { color: titleColor, fontSize: 15 * fontScale }]}
        >
          {closingPhrase}
        </Text>
      ) : null}
    </View>
  );
}

export const ReadingSection = memo(ReadingSectionComponent);

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  title: {
    fontWeight: "700",
  },
  reference: {
    marginTop: 4,
    fontWeight: "600",
  },
  subtitle: {
    marginTop: 4,
    fontWeight: "600",
  },
  text: {
    marginTop: 10,
  },
  closingPhrase: {
    marginTop: 16,
    fontWeight: "700",
  },
});
