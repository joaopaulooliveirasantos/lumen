import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../state/AuthContext";
import type { ThemePalette } from "../types/theme";

export type TabName = "home" | "liturgia" | "biblia" | "oracoes" | "perfil";

type TabItem = {
  name: TabName;
  label: string;
  icon: string;
};

const TABS: TabItem[] = [
  { name: "home", label: "Home", icon: "⛪" },
  { name: "liturgia", label: "Liturgia Diaria", icon: "📖" },
  { name: "biblia", label: "Bíblia", icon: "✝️" },
  { name: "oracoes", label: "Orações", icon: "🙏" },
  { name: "perfil", label: "Perfil", icon: "👤" },
];

type Props = {
  activeTab: TabName;
  onTabPress: (tab: TabName) => void;
  theme: ThemePalette;
};

export function BottomTabBar({ activeTab, onTabPress, theme }: Props) {
  const insets = useSafeAreaInsets();
  const { session, profile } = useAuth();
  const avatarUrl = session ? profile?.avatarUrl ?? null : null;
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.cardBackground,
          borderTopColor: theme.border,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.name;
        return (
          <Pressable
            key={tab.name}
            accessibilityRole="button"
            accessibilityLabel={tab.label}
            style={styles.tab}
            onPress={() => onTabPress(tab.name)}
          >
            {tab.name === "perfil" && avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={[styles.avatarIcon, { borderColor: isActive ? theme.accent : "transparent" }]}
              />
            ) : (
              <Text style={[styles.icon, isActive && { color: theme.accent }]}>{tab.icon}</Text>
            )}
            <Text
              style={[
                styles.label,
                { color: isActive ? theme.accent : theme.mutedText },
                isActive && styles.activeLabel,
              ]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingBottom: 4,
    paddingTop: 6,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    gap: 2,
  },
  icon: {
    fontSize: 20,
  },
  avatarIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
  },
  label: {
    fontSize: 10,
    textAlign: "center",
  },
  activeLabel: {
    fontWeight: "700",
  },
});
