import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../state/AuthContext";
import { AppIcon, type AppIconName } from "./AppIcon";
import { BRAND_GOLD, BRAND_GOLD_SOFT, ICON_INACTIVE_OPACITY } from "../theme/brand";
import type { ThemePalette } from "../types/theme";

export type TabName = "home" | "liturgia" | "biblia" | "oracoes" | "perfil";

type TabItem = {
  name: TabName;
  label: string;
  icon: AppIconName;
};

const TABS: TabItem[] = [
  { name: "home", label: "Home", icon: "church" },
  { name: "liturgia", label: "Liturgia Diaria", icon: "book" },
  { name: "biblia", label: "Bíblia", icon: "bible" },
  { name: "oracoes", label: "Orações", icon: "prayingHands" },
  { name: "perfil", label: "Perfil", icon: "person" },
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
                style={[
                  styles.avatarIcon,
                  { borderColor: isActive ? BRAND_GOLD : "transparent" },
                  !isActive && { opacity: ICON_INACTIVE_OPACITY },
                ]}
              />
            ) : (
              <View style={[styles.iconWrap, isActive && { backgroundColor: BRAND_GOLD_SOFT }]}>
                <AppIcon
                  name={tab.icon}
                  size={20}
                  color={isActive ? BRAND_GOLD : theme.mutedText}
                  style={!isActive && { opacity: ICON_INACTIVE_OPACITY }}
                />
              </View>
            )}
            <Text
              style={[
                styles.label,
                { color: isActive ? BRAND_GOLD : theme.mutedText },
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
  iconWrap: {
    width: 34,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
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
