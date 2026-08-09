import type { StyleProp, TextStyle } from "react-native";
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export type AppIconName =
  | "church"
  | "book"
  | "bible"
  | "prayingHands"
  | "person"
  | "cross"
  | "close"
  | "playSkipBack"
  | "play"
  | "pause"
  | "playSkipForward"
  | "copy"
  | "share"
  | "bookmark"
  | "comment"
  | "checkmark"
  | "timer"
  | "externalLink"
  | "settings"
  | "calendar"
  | "star"
  | "flower"
  | "voice";

type IconSpec =
  | { family: "ionicons"; glyph: React.ComponentProps<typeof Ionicons>["name"] }
  | { family: "material"; glyph: React.ComponentProps<typeof MaterialCommunityIcons>["name"] }
  | { family: "fa5"; glyph: React.ComponentProps<typeof FontAwesome5>["name"]; solid?: boolean };

const ICONS: Record<AppIconName, IconSpec> = {
  church: { family: "material", glyph: "church" },
  book: { family: "ionicons", glyph: "book-outline" },
  bible: { family: "fa5", glyph: "bible", solid: true },
  prayingHands: { family: "fa5", glyph: "praying-hands", solid: true },
  person: { family: "ionicons", glyph: "person-circle-outline" },
  cross: { family: "fa5", glyph: "cross", solid: true },
  close: { family: "ionicons", glyph: "close" },
  playSkipBack: { family: "ionicons", glyph: "play-skip-back" },
  play: { family: "ionicons", glyph: "play" },
  pause: { family: "ionicons", glyph: "pause" },
  playSkipForward: { family: "ionicons", glyph: "play-skip-forward" },
  copy: { family: "ionicons", glyph: "copy-outline" },
  share: { family: "ionicons", glyph: "share-social-outline" },
  bookmark: { family: "ionicons", glyph: "bookmark" },
  comment: { family: "ionicons", glyph: "chatbubble-ellipses-outline" },
  checkmark: { family: "ionicons", glyph: "checkmark" },
  timer: { family: "ionicons", glyph: "time-outline" },
  externalLink: { family: "ionicons", glyph: "open-outline" },
  settings: { family: "ionicons", glyph: "settings-outline" },
  calendar: { family: "ionicons", glyph: "calendar-outline" },
  star: { family: "ionicons", glyph: "star" },
  flower: { family: "ionicons", glyph: "flower" },
  voice: { family: "ionicons", glyph: "mic-outline" },
};

type Props = {
  name: AppIconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
};

export function AppIcon({ name, size = 18, color, style }: Props) {
  const spec = ICONS[name];
  if (spec.family === "material") {
    return <MaterialCommunityIcons name={spec.glyph} size={size} color={color} style={style} />;
  }
  if (spec.family === "fa5") {
    return <FontAwesome5 name={spec.glyph} size={size} color={color} solid={spec.solid} style={style} />;
  }
  return <Ionicons name={spec.glyph} size={size} color={color} style={style} />;
}
