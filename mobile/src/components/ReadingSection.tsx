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
  closingCall?: string;
  closingResponse?: string;
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
  closingCall,
  closingResponse,
}: Props) {
  return (
    <View
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`${title}. ${reading.referencia}. ${reading.titulo}`}
      style={[styles.card, { backgroundColor: cardColor, borderColor }]}
    >
      <Text allowFontScaling style={[styles.title, { color: titleColor, fontSize: 18 * fontScale }]}>
        {title}
      </Text>
      <Text allowFontScaling style={[styles.reference, { color: accentColor, fontSize: 14 * fontScale }]}>
        {reading.referencia}
      </Text>
      <Text allowFontScaling style={[styles.subtitle, { color: titleColor, fontSize: 15 * fontScale }]}>
        {reading.titulo}
      </Text>
      <Text
        allowFontScaling
        style={[styles.text, { color: bodyColor, fontSize: 16 * fontScale, lineHeight: 26 * fontScale }]}
      >
        {reading.texto}
      </Text>
      {closingCall && closingResponse ? (
        <View style={styles.closingBlock}>
          <Text
            allowFontScaling
            style={[styles.closingCall, { color: titleColor, fontSize: 16 * fontScale }]}
          >
            {closingCall}
          </Text>
          <Text
            allowFontScaling
            style={[styles.closingResponse, { color: titleColor, fontSize: 16 * fontScale }]}
          >
            {closingResponse}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export const ReadingSection = memo(ReadingSectionComponent);

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 22,
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
  closingBlock: {
    marginTop: 16,
  },
  closingCall: {
    fontWeight: "500",
  },
  closingResponse: {
    marginTop: 10,
    fontWeight: "800",
  },
});
