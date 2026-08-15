import { useEffect, useRef } from "react";
import { ActivityIndicator, Animated, Easing, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { shadeColor } from "../services/color";
import { AppIcon } from "./AppIcon";

const DEFAULT_ACCENT = "#1E5C35";

type Props = {
  message?: string;
  accent?: string;
};

export function LoadingScreen({ message = "Carregando...", accent = DEFAULT_ACCENT }: Props) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const crossScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });
  const crossOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] });

  return (
    <LinearGradient
      colors={[shadeColor(accent, 18), accent, shadeColor(accent, -24)]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <Animated.View style={{ transform: [{ scale: crossScale }], opacity: crossOpacity }}>
        <AppIcon name="cross" size={44} color="#F3D98B" />
      </Animated.View>

      <View style={styles.divider} />

      <Text allowFontScaling style={styles.title}>LUMEN</Text>

      <ActivityIndicator size="small" color="#F3D98B" style={styles.spinner} />

      <Text allowFontScaling style={styles.message}>{message}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  divider: {
    width: 56,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#F3D98B",
    marginTop: 18,
    marginBottom: 14,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 6,
  },
  spinner: {
    marginTop: 24,
  },
  message: {
    marginTop: 12,
    fontSize: 13,
    fontStyle: "italic",
    color: "rgba(255,255,255,0.88)",
    textAlign: "center",
  },
});
