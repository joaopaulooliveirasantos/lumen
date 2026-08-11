import { Image, ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { PlanStatusInfo } from "../services/readingPlans";
import type { ReadingPlan } from "../types/readingPlan";
import type { ThemePalette } from "../types/theme";

type Props = {
  plan: ReadingPlan;
  theme: ThemePalette;
  size: "carrossel" | "lista";
  statusInfo?: PlanStatusInfo;
  onPress: () => void;
};

function ProgressBadge({ statusInfo, duracaoDias }: { statusInfo: PlanStatusInfo; duracaoDias: number }) {
  if (statusInfo.status === "nao-iniciado") return null;
  const label = statusInfo.status === "concluido" ? "Concluído ✓" : `${statusInfo.diasConcluidos}/${duracaoDias} dias`;
  return (
    <View style={styles.badge}>
      <Text allowFontScaling style={styles.badgeText} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function ReadingPlanCard({ plan, theme, size, statusInfo, onPress }: Props) {
  if (size === "carrossel") {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${plan.titulo}, ${plan.duracaoDias} dias`}
        style={styles.carrosselWrap}
        onPress={onPress}
      >
        <ImageBackground
          source={plan.capa.imagem}
          style={styles.carrosselCard}
          imageStyle={styles.carrosselImage}
        >
          <LinearGradient
            colors={["transparent", "rgba(20,16,24,0.05)", "rgba(15,12,18,0.62)"]}
            style={StyleSheet.absoluteFillObject}
          />
          {statusInfo ? <ProgressBadge statusInfo={statusInfo} duracaoDias={plan.duracaoDias} /> : null}
          <View style={styles.carrosselBody}>
            <Text allowFontScaling numberOfLines={2} style={styles.carrosselTitle}>
              {plan.titulo}
            </Text>
            <Text allowFontScaling numberOfLines={1} style={styles.carrosselDuracao}>
              {plan.duracaoDias} dias
            </Text>
          </View>
        </ImageBackground>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${plan.titulo}, ${plan.duracaoDias} dias`}
      style={[styles.listaRow, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
      onPress={onPress}
    >
      <Image source={plan.capa.imagem} style={styles.listaIcon} resizeMode="cover" />
      <View style={styles.listaBody}>
        <Text allowFontScaling numberOfLines={1} style={[styles.listaTitle, { color: theme.titleText }]}>
          {plan.titulo}
        </Text>
        <Text allowFontScaling numberOfLines={1} style={[styles.listaSub, { color: theme.mutedText }]}>
          {plan.subtitulo} · {plan.duracaoDias} dias
        </Text>
        {statusInfo ? (
          <Text allowFontScaling style={[styles.listaStatus, { color: theme.accent }]}>
            {statusInfo.status === "concluido"
              ? "Concluído ✓"
              : statusInfo.status === "em-andamento"
              ? `${statusInfo.diasConcluidos}/${plan.duracaoDias} dias · continuar no Dia ${statusInfo.proximoDia}`
              : null}
          </Text>
        ) : null}
      </View>
      <Text style={[styles.chevron, { color: theme.mutedText }]}>{"›"}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  carrosselWrap: { width: 168, marginRight: 12 },
  carrosselCard: {
    borderRadius: 16,
    minHeight: 140,
    padding: 14,
    justifyContent: "space-between",
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  carrosselImage: { borderRadius: 16 },
  carrosselBody: { marginTop: 8 },
  carrosselTitle: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },
  carrosselDuracao: { color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: "600", marginTop: 2 },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,0,0,0.28)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "700" },
  listaRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    minHeight: 68,
    marginBottom: 8,
  },
  listaIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    marginRight: 12,
  },
  listaBody: { flex: 1 },
  listaTitle: { fontWeight: "700", fontSize: 15 },
  listaSub: { marginTop: 2, fontSize: 12 },
  listaStatus: { marginTop: 4, fontSize: 11, fontWeight: "700" },
  chevron: { paddingHorizontal: 8, fontSize: 20 },
});
