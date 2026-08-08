import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { mysteryGroups, suggestedMysteryGroupFor } from "../data/rosaryMysteries";
import { buildRosarySteps } from "../services/rosary";
import { shadeColor } from "../services/color";
import { formatIsoDate, formatReadableDate } from "../services/date";
import type { MysteryGroupId, RosaryStep } from "../types/rosary";
import type { ThemePalette } from "../types/theme";
import type { UserSettings } from "../types/settings";

type RosaryView = "selecao" | "oracao";

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function RosaryHero({ theme }: { theme: ThemePalette }) {
  const today = formatIsoDate(new Date());
  return (
    <LinearGradient
      colors={[shadeColor(theme.accent, 14), theme.accent, shadeColor(theme.accent, -18)]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={heroStyles.hero}
    >
      <View style={heroStyles.ornamentRow}>
        <View style={heroStyles.ornamentLine} />
        <Text style={heroStyles.icon}>🌹</Text>
        <View style={heroStyles.ornamentLine} />
      </View>

      <Text allowFontScaling style={heroStyles.title}>TERÇO</Text>
      <Text allowFontScaling style={heroStyles.date}>{capitalize(formatReadableDate(today))}</Text>
    </LinearGradient>
  );
}

type Props = {
  theme: ThemePalette;
  settings: UserSettings;
  onExit: () => void;
  onFinish: () => void;
};

export function RosaryScreen({ theme, settings, onExit, onFinish }: Props) {
  const [view, setView] = useState<RosaryView>("selecao");
  const [selectedGroup, setSelectedGroup] = useState<MysteryGroupId>(() => suggestedMysteryGroupFor(new Date()));
  const [steps, setSteps] = useState<RosaryStep[]>([]);
  const [stepIndex, setStepIndex] = useState(0);

  const fs = settings.fontScale;

  function Header({ title }: { title: string }) {
    return (
      <View style={[styles.header, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sair do terço"
          onPress={onExit}
          style={styles.closeBtn}
        >
          <Text style={[styles.closeText, { color: theme.accent }]}>{"✕"}</Text>
        </Pressable>
        <Text allowFontScaling style={[styles.headerTitle, { color: theme.titleText }]} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.closeBtn} />
      </View>
    );
  }

  function startRosary() {
    setSteps(buildRosarySteps(selectedGroup));
    setStepIndex(0);
    setView("oracao");
  }

  function handleBackStep() {
    if (stepIndex === 0) {
      setView("selecao");
      return;
    }
    setStepIndex((i) => i - 1);
  }

  function handleNextStep(isLastStep: boolean) {
    if (isLastStep) {
      onFinish();
      Alert.alert("Terço concluído!", "Que Nossa Senhora interceda por você. 🙏", [
        { text: "OK", onPress: onExit },
      ]);
      return;
    }
    setStepIndex((i) => i + 1);
  }

  // ── Tela: Seleção de mistério ──────────────────────────────────────────────
  if (view === "selecao") {
    return (
      <View style={[styles.container, { backgroundColor: theme.appBackground }]}>
        <Header title="Terço" />
        <ScrollView contentContainerStyle={styles.listContent}>
          <RosaryHero theme={theme} />

          <Text allowFontScaling style={[styles.sectionLabel, { color: theme.mutedText }]}>
            Escolher Mistério
          </Text>
          {mysteryGroups.map((group) => {
            const isSelected = group.id === selectedGroup;
            return (
              <Pressable
                key={group.id}
                accessibilityRole="button"
                accessibilityLabel={group.nome}
                accessibilityState={{ selected: isSelected }}
                style={[
                  styles.groupRow,
                  {
                    backgroundColor: theme.cardBackground,
                    borderColor: isSelected ? theme.accent : theme.border,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
                onPress={() => setSelectedGroup(group.id)}
              >
                <View style={[styles.rowAccent, { backgroundColor: theme.accent }]} />
                <View style={styles.groupBody}>
                  <Text allowFontScaling style={[styles.groupTitle, { color: theme.titleText, fontSize: 16 * fs }]}>
                    {group.nome}
                  </Text>
                  <Text allowFontScaling style={[styles.groupSub, { color: theme.mutedText, fontSize: 12 * fs }]}>
                    {group.dias}
                  </Text>
                </View>
                {isSelected ? <Text style={[styles.checkMark, { color: theme.accent }]}>{"✓"}</Text> : null}
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: theme.appBackground, borderTopColor: theme.border }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Iniciar oração"
            style={[styles.primaryButton, { backgroundColor: theme.accent }]}
            onPress={startRosary}
          >
            <Text allowFontScaling style={styles.primaryButtonText}>Iniciar Oração</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Tela: Oração passo a passo ──────────────────────────────────────────────
  const currentStep = steps[stepIndex];
  if (!currentStep) return null;

  const isLastStep = stepIndex === steps.length - 1;
  const progressPercent = (currentStep.ordem / steps.length) * 100;

  return (
    <View style={[styles.container, { backgroundColor: theme.appBackground }]}>
      <Header title={currentStep.titulo} />

      <View style={styles.progressWrap}>
        <Text allowFontScaling style={[styles.progressLabel, { color: theme.mutedText }]}>
          Passo {currentStep.ordem} de {steps.length}
        </Text>
        <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
          <View style={[styles.progressFill, { backgroundColor: theme.accent, width: `${progressPercent}%` }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.stepContent}>
        <View style={[styles.stepCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          {currentStep.misterioIndex !== undefined ? (
            <Text allowFontScaling style={[styles.misterioSub, { color: theme.mutedText, fontSize: 12 * fs }]}>
              Mistério {currentStep.misterioIndex + 1} de 5
            </Text>
          ) : null}

          <Text allowFontScaling style={[styles.stepTitle, { color: theme.titleText, fontSize: 18 * fs }]}>
            {currentStep.titulo}
          </Text>

          {currentStep.repeticaoTotal ? (
            <View style={[styles.repeatBadge, { backgroundColor: `${theme.accent}22` }]}>
              <Text allowFontScaling style={[styles.repeatBadgeText, { color: theme.accent }]}>
                {currentStep.repeticaoAtual}ª de {currentStep.repeticaoTotal}
              </Text>
            </View>
          ) : null}

          <Text
            allowFontScaling
            style={[styles.stepText, { color: theme.bodyText, fontSize: 16 * fs, lineHeight: 26 * fs }]}
          >
            {currentStep.texto}
          </Text>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          styles.footerRow,
          { backgroundColor: theme.appBackground, borderTopColor: theme.border },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          style={[styles.secondaryButton, { borderColor: theme.accent }]}
          onPress={handleBackStep}
        >
          <Text allowFontScaling style={[styles.secondaryButtonText, { color: theme.accent }]}>Voltar</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isLastStep ? "Finalizar terço" : "Próxima"}
          style={[styles.primaryButton, styles.primaryButtonFlex, { backgroundColor: theme.accent }]}
          onPress={() => handleNextStep(isLastStep)}
        >
          <Text allowFontScaling style={styles.primaryButtonText}>
            {isLastStep ? "Finalizar Terço" : "Próxima"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeBtn: { width: 40, alignItems: "center" },
  closeText: { fontSize: 20, fontWeight: "700" },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: "700", textAlign: "center" },
  listContent: { padding: 12, paddingBottom: 28 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  groupRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    overflow: "hidden",
    minHeight: 60,
    marginBottom: 8,
  },
  rowAccent: { width: 4, alignSelf: "stretch" },
  groupBody: { flex: 1, paddingHorizontal: 14, paddingVertical: 10 },
  groupTitle: { fontWeight: "700" },
  groupSub: { marginTop: 2 },
  checkMark: { fontSize: 18, fontWeight: "800", paddingHorizontal: 14 },
  footer: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
    borderTopWidth: 1,
  },
  footerRow: { flexDirection: "row", gap: 12 },
  primaryButton: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  primaryButtonFlex: { flex: 1 },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },
  secondaryButton: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  secondaryButtonText: { fontWeight: "700", fontSize: 15 },
  progressWrap: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4 },
  progressLabel: { fontSize: 12, fontWeight: "600", marginBottom: 6, textAlign: "center" },
  progressTrack: { height: 4, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: 4, borderRadius: 2 },
  stepContent: { padding: 14, paddingBottom: 28 },
  stepCard: { borderRadius: 14, borderWidth: 1, padding: 18 },
  misterioSub: { fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  stepTitle: { fontWeight: "800" },
  repeatBadge: {
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 10,
  },
  repeatBadgeText: { fontSize: 12, fontWeight: "700" },
  stepText: { marginTop: 14 },
});

const heroStyles = StyleSheet.create({
  hero: {
    alignItems: "center",
    borderRadius: 16,
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 20,
    marginBottom: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  ornamentRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    marginBottom: 4,
  },
  ornamentLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  icon: {
    fontSize: 16,
    marginHorizontal: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 4,
  },
  date: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.92)",
    marginTop: 2,
    textAlign: "center",
  },
});
