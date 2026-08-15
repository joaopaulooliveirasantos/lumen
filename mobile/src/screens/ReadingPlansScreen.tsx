import { useRef, useState } from "react";
import { Alert, Animated, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { readingPlans } from "../data/readingPlans";
import { AppIcon } from "../components/AppIcon";
import { ReadingPlanCard } from "../components/ReadingPlanCard";
import { getPlanStatus, resolveReference } from "../services/readingPlans";
import type { ReadingPlanProgress } from "../storage/readingPlanProgress";
import type { BibleLocation } from "../types/bible";
import type { BibleReference, ReadingPlan } from "../types/readingPlan";
import type { ThemePalette } from "../types/theme";
import type { UserSettings } from "../types/settings";

function formatReference(ref: BibleReference): string {
  const capituloFim = ref.capituloFim ?? ref.capituloInicio;
  if (capituloFim !== ref.capituloInicio) {
    const inicio =
      ref.versiculoInicio !== undefined ? `${ref.capituloInicio},${ref.versiculoInicio}` : `${ref.capituloInicio}`;
    const fim = ref.versiculoFim !== undefined ? `${capituloFim},${ref.versiculoFim}` : `${capituloFim}`;
    return `${ref.livro} ${inicio}–${fim}`;
  }
  if (ref.versiculoInicio === undefined) return `${ref.livro} ${ref.capituloInicio}`;
  if (ref.versiculoFim === undefined || ref.versiculoFim === ref.versiculoInicio) {
    return `${ref.livro} ${ref.capituloInicio},${ref.versiculoInicio}`;
  }
  return `${ref.livro} ${ref.capituloInicio},${ref.versiculoInicio}-${ref.versiculoFim}`;
}

type ReadingPlansView = "destaques" | "todos" | "detalhe" | "leitura";

const CATEGORY_LABELS: Record<string, string> = {
  liturgico: "Tempo Litúrgico",
  evangelho: "Evangelhos",
  tematico: "Temático",
  sapiencial: "Sabedoria",
  catequetico: "Catequese",
  mariano: "Mariano",
  familia: "Família",
  "biblia-anual": "Bíblia em 1 Ano",
};

type Props = {
  theme: ThemePalette;
  settings: UserSettings;
  progress: Record<string, ReadingPlanProgress>;
  initialPlanId?: string | null;
  onDayCompleted: (planoId: string, dia: number, duracaoDias: number) => void;
  onOpenBibleReference: (location: BibleLocation) => void;
  onExit: () => void;
};

export function ReadingPlansScreen({
  theme,
  settings,
  progress,
  initialPlanId,
  onDayCompleted,
  onOpenBibleReference,
  onExit,
}: Props) {
  const initialPlan = initialPlanId ? readingPlans.find((p) => p.id === initialPlanId) ?? null : null;
  const [view, setView] = useState<ReadingPlansView>(initialPlan ? "detalhe" : "destaques");
  const [activePlan, setActivePlan] = useState<ReadingPlan | null>(initialPlan);
  const [activeDayNum, setActiveDayNum] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [amenBurstVisible, setAmenBurstVisible] = useState(false);
  const amenOpacity = useRef(new Animated.Value(0)).current;

  const fs = settings.fontScale;
  const destaquePlans = readingPlans.filter((p) => p.destaque);
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredPlans = normalizedQuery
    ? readingPlans.filter(
        (p) => p.titulo.toLowerCase().includes(normalizedQuery) || p.subtitulo.toLowerCase().includes(normalizedQuery),
      )
    : readingPlans;

  function Header({ title, onBack }: { title: string; onBack: () => void }) {
    return (
      <View style={[styles.header, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={onBack} style={styles.headerBtn}>
          <Text style={[styles.headerBtnText, { color: theme.accent }]}>{"‹"}</Text>
        </Pressable>
        <Text allowFontScaling numberOfLines={1} style={[styles.headerTitle, { color: theme.titleText }]}>
          {title}
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Fechar" onPress={onExit} style={styles.headerBtn}>
          <Text style={[styles.headerBtnText, { color: theme.accent }]}>{"✕"}</Text>
        </Pressable>
      </View>
    );
  }

  function openPlan(plan: ReadingPlan) {
    setActivePlan(plan);
    setActiveDayNum(null);
    setView("detalhe");
  }

  function openDay(dia: number) {
    setActiveDayNum(dia);
    setView("leitura");
  }

  function handleBack() {
    if (view === "leitura") {
      setView("detalhe");
      setActiveDayNum(null);
    } else if (view === "detalhe") {
      setActivePlan(null);
      setView("destaques");
    } else if (view === "todos") {
      setView("destaques");
    }
  }

  // ── Tela: Destaques (raiz) ─────────────────────────────────────────────────
  if (view === "destaques") {
    return (
      <View style={[styles.container, { backgroundColor: theme.appBackground }]}>
        <View style={[styles.header, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <View style={styles.headerBtn} />
          <Text allowFontScaling style={[styles.headerTitle, { color: theme.titleText }]}>
            Planos de Leitura
          </Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Fechar" onPress={onExit} style={styles.headerBtn}>
            <Text style={[styles.headerBtnText, { color: theme.accent }]}>{"✕"}</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.destaquesContent}>
          <Text allowFontScaling style={[styles.sectionLabel, { color: theme.mutedText }]}>
            Em destaque
          </Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={destaquePlans}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.carrosselList}
            renderItem={({ item }) => (
              <ReadingPlanCard
                plan={item}
                theme={theme}
                size="carrossel"
                statusInfo={getPlanStatus(item, progress[item.id])}
                onPress={() => openPlan(item)}
              />
            )}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver todos os planos"
            style={[styles.verTodosBtn, { borderColor: theme.accent }]}
            onPress={() => setView("todos")}
          >
            <Text allowFontScaling style={[styles.verTodosText, { color: theme.accent }]}>
              Ver todos os planos
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  // ── Tela: Todos os planos ──────────────────────────────────────────────────
  if (view === "todos") {
    return (
      <View style={[styles.container, { backgroundColor: theme.appBackground }]}>
        <Header title="Todos os planos" onBack={handleBack} />
        <View style={[styles.searchBar, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <AppIcon name="book" size={16} color={theme.mutedText} />
          <TextInput
            accessibilityLabel="Pesquisar planos de leitura"
            placeholder="Pesquisar planos..."
            placeholderTextColor={theme.mutedText}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: theme.titleText, fontSize: 14 * fs }]}
          />
          {searchQuery.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Limpar pesquisa"
              hitSlop={8}
              onPress={() => setSearchQuery("")}
            >
              <AppIcon name="close" size={16} color={theme.mutedText} />
            </Pressable>
          ) : null}
        </View>
        {filteredPlans.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text allowFontScaling style={[styles.emptyText, { color: theme.mutedText }]}>
              Nenhum plano encontrado para "{searchQuery}".
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredPlans}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listaContent}
            renderItem={({ item }) => (
              <ReadingPlanCard
                plan={item}
                theme={theme}
                size="lista"
                statusInfo={getPlanStatus(item, progress[item.id])}
                onPress={() => openPlan(item)}
              />
            )}
          />
        )}
      </View>
    );
  }

  // ── Tela: Detalhe do plano ──────────────────────────────────────────────────
  if (view === "detalhe" && activePlan) {
    const plan = activePlan;
    const statusInfo = getPlanStatus(plan, progress[plan.id]);
    const concluidos = new Set(progress[plan.id]?.diasConcluidos ?? []);

    const actionLabel =
      statusInfo.status === "nao-iniciado"
        ? "Iniciar plano"
        : statusInfo.status === "concluido"
        ? "Reiniciar plano"
        : `Continuar — Dia ${statusInfo.proximoDia}`;

    return (
      <View style={[styles.container, { backgroundColor: theme.appBackground }]}>
        <Header title={plan.titulo} onBack={handleBack} />
        <FlatList
          data={plan.dias}
          keyExtractor={(day) => String(day.dia)}
          contentContainerStyle={styles.detalheContent}
          ListHeaderComponent={
            <>
              <Image source={plan.capa.imagem} style={styles.detalheImagem} resizeMode="cover" />
              <Text allowFontScaling style={[styles.detalheTitulo, { color: theme.titleText, fontSize: 20 * fs }]}>
                {plan.titulo}
              </Text>
              <Text allowFontScaling style={[styles.detalheSubtitulo, { color: theme.mutedText, fontSize: 14 * fs }]}>
                {plan.subtitulo}
              </Text>
              <Text allowFontScaling style={[styles.detalheDuracao, { color: theme.accent, fontSize: 12 * fs }]}>
                {plan.duracaoDias} dias · {CATEGORY_LABELS[plan.categoria] ?? plan.categoria}
              </Text>
            </>
          }
          renderItem={({ item: day }) => {
            const isDone = concluidos.has(day.dia);
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Dia ${day.dia}: ${day.titulo}${isDone ? ", concluído" : ""}`}
                style={[styles.diaRow, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                onPress={() => openDay(day.dia)}
              >
                <View style={[styles.diaNumero, { backgroundColor: isDone ? theme.accent : `${theme.accent}22` }]}>
                  <Text style={[styles.diaNumeroText, { color: isDone ? "#FFFFFF" : theme.accent }]}>
                    {isDone ? "✓" : day.dia}
                  </Text>
                </View>
                <Text
                  allowFontScaling
                  numberOfLines={1}
                  style={[styles.diaTitulo, { color: theme.titleText, fontSize: 14 * fs }]}
                >
                  {day.titulo}
                </Text>
                <Text style={[styles.chevron, { color: theme.mutedText }]}>{"›"}</Text>
              </Pressable>
            );
          }}
        />

        <View style={[styles.footer, { backgroundColor: theme.appBackground, borderTopColor: theme.border }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
            style={[styles.primaryButton, { backgroundColor: theme.accent }]}
            onPress={() => openDay(statusInfo.status === "concluido" ? 1 : statusInfo.proximoDia)}
          >
            <Text allowFontScaling style={styles.primaryButtonText}>
              {actionLabel}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Tela: Leitura do dia ─────────────────────────────────────────────────────
  if (view === "leitura" && activePlan && activeDayNum !== null) {
    const plan = activePlan;
    const day = plan.dias.find((d) => d.dia === activeDayNum);
    if (!day) return null;

    const isDone = (progress[plan.id]?.diasConcluidos ?? []).includes(day.dia);
    const isLastDay = day.dia >= plan.duracaoDias;
    const hasNextDay = plan.dias.some((d) => d.dia === day.dia + 1);
    const hasPrevDay = plan.dias.some((d) => d.dia === day.dia - 1);

    function handleAmenPress() {
      onDayCompleted(plan.id, day!.dia, plan.duracaoDias);
      setAmenBurstVisible(true);
      amenOpacity.setValue(1);
      Animated.timing(amenOpacity, {
        toValue: 0,
        duration: 1200,
        delay: 400,
        useNativeDriver: true,
      }).start(({ finished }) => {
        setAmenBurstVisible(false);
        if (finished && isLastDay) {
          Alert.alert("Plano concluído!", `Você concluiu "${plan.titulo}". 🙏`, [
            { text: "OK", onPress: () => setView("detalhe") },
          ]);
        }
      });
    }

    return (
      <View style={[styles.container, { backgroundColor: theme.appBackground }]}>
        <Header title={`Dia ${day.dia} de ${plan.duracaoDias}`} onBack={handleBack} />
        <ScrollView contentContainerStyle={styles.leituraContent}>
          <Text allowFontScaling style={[styles.leituraTitulo, { color: theme.titleText, fontSize: 19 * fs }]}>
            {day.titulo}
          </Text>

          {day.referencias.map((ref, index) => {
            const passages = resolveReference(ref, settings.bibleTranslation);
            return (
              <View key={`${ref.livro}-${ref.capituloInicio}-${index}`} style={styles.refBlock}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Ler ${formatReference(ref)} na Bíblia`}
                  style={[styles.refCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                  onPress={() =>
                    onOpenBibleReference({
                      livro: ref.livro,
                      capitulo: ref.capituloInicio,
                      versiculoInicio: ref.versiculoInicio,
                    })
                  }
                >
                  <View style={[styles.refIcon, { backgroundColor: `${theme.accent}1F` }]}>
                    <Text style={styles.refIconText}>📖</Text>
                  </View>
                  <Text allowFontScaling style={[styles.refText, { color: theme.titleText, fontSize: 15 * fs }]}>
                    {formatReference(ref)}
                  </Text>
                  <Text style={[styles.chevron, { color: theme.mutedText }]}>{"›"}</Text>
                </Pressable>

                {passages.map((passage) => (
                  <View key={`${passage.livro}-${passage.capitulo}`} style={styles.passageBlock}>
                    <Text allowFontScaling style={[styles.passageRef, { color: theme.accent, fontSize: 12 * fs }]}>
                      {passage.livro} {passage.capitulo}
                    </Text>
                    <Text
                      allowFontScaling
                      style={[styles.passageText, { color: theme.bodyText, fontSize: 15 * fs, lineHeight: 24 * fs }]}
                    >
                      {passage.versiculos.map((v) => `${v.versiculo}. ${v.texto}`).join(" ")}
                    </Text>
                  </View>
                ))}
              </View>
            );
          })}

          {day.catecismo ? (
            <View style={[styles.cicCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
              <Text allowFontScaling style={[styles.cicLabel, { color: theme.accent, fontSize: 12 * fs }]}>
                Catecismo da Igreja Católica, nº {day.catecismo.paragrafo}
              </Text>
              <Text allowFontScaling style={[styles.cicTema, { color: theme.titleText, fontSize: 13 * fs }]}>
                {day.catecismo.tema}
              </Text>
              <Text
                allowFontScaling
                style={[styles.cicTrecho, { color: theme.bodyText, fontSize: 14 * fs, lineHeight: 22 * fs }]}
              >
                {"“"}
                {day.catecismo.trecho}
                {"”"}
              </Text>
            </View>
          ) : null}
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
            accessibilityLabel="Dia anterior"
            disabled={!hasPrevDay}
            style={[styles.secondaryButton, { borderColor: theme.accent, opacity: hasPrevDay ? 1 : 0.4 }]}
            onPress={() => hasPrevDay && setActiveDayNum((d) => (d ?? 1) - 1)}
          >
            <Text allowFontScaling style={[styles.secondaryButtonText, { color: theme.accent }]}>
              {"‹ Anterior"}
            </Text>
          </Pressable>

          {isDone ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Próximo dia"
              disabled={!hasNextDay}
              style={[
                styles.primaryButton,
                styles.primaryButtonFlex,
                { backgroundColor: theme.accent, opacity: hasNextDay ? 1 : 0.4 },
              ]}
              onPress={() => hasNextDay && setActiveDayNum((d) => (d ?? 1) + 1)}
            >
              <Text allowFontScaling style={styles.primaryButtonText}>
                Próximo ›
              </Text>
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Amém"
              style={[styles.primaryButton, styles.primaryButtonFlex, { backgroundColor: theme.accent }]}
              onPress={handleAmenPress}
            >
              <Text allowFontScaling style={styles.primaryButtonText}>
                <AppIcon name="prayingHands" size={15} color="#FFFFFF" /> Amém
              </Text>
            </Pressable>
          )}
        </View>

        {amenBurstVisible ? (
          <View style={styles.amenBurst} pointerEvents="none">
            <Animated.View style={{ opacity: amenOpacity }}>
              <AppIcon name="prayingHands" size={120} color={theme.accent} />
            </Animated.View>
          </View>
        ) : null}
      </View>
    );
  }

  return null;
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
  headerBtn: { width: 40, alignItems: "center" },
  headerBtnText: { fontSize: 20, fontWeight: "700" },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: "700", textAlign: "center" },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  destaquesContent: { padding: 14, paddingBottom: 28 },
  carrosselList: { paddingRight: 12, paddingBottom: 4 },
  verTodosBtn: {
    marginTop: 20,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  verTodosText: { fontWeight: "700", fontSize: 14 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 14,
    marginTop: 12,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  searchInput: { flex: 1, paddingVertical: 10 },
  emptyBox: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyText: { fontSize: 14, textAlign: "center" },
  listaContent: { padding: 14, paddingBottom: 28 },
  detalheContent: { padding: 18, paddingBottom: 28, alignItems: "center" },
  detalheImagem: { width: 128, height: 128, borderRadius: 24, marginBottom: 12 },
  detalheTitulo: { fontWeight: "800", textAlign: "center" },
  detalheSubtitulo: { textAlign: "center", marginTop: 4 },
  detalheDuracao: { fontWeight: "700", marginTop: 8, marginBottom: 18 },
  diaRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 8,
    minHeight: 56,
  },
  diaNumero: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", marginRight: 12 },
  diaNumeroText: { fontWeight: "800", fontSize: 13 },
  diaTitulo: { flex: 1, fontWeight: "600" },
  chevron: { paddingHorizontal: 8, fontSize: 20 },
  footer: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 14, borderTopWidth: 1 },
  footerRow: { flexDirection: "row", gap: 12 },
  primaryButton: { minHeight: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  primaryButtonFlex: { flex: 1 },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },
  secondaryButton: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  secondaryButtonText: { fontWeight: "700", fontSize: 15 },
  leituraContent: { padding: 16, paddingBottom: 28 },
  leituraTitulo: { fontWeight: "800", marginBottom: 14 },
  refCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
    minHeight: 56,
  },
  refIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginRight: 12 },
  refIconText: { fontSize: 17 },
  refText: { flex: 1, fontWeight: "700" },
  refBlock: { marginBottom: 4 },
  passageBlock: { paddingHorizontal: 4, marginBottom: 14 },
  passageRef: { fontWeight: "700", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.3 },
  passageText: {},
  cicCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginTop: 6 },
  cicLabel: { fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 6 },
  cicTema: { fontWeight: "700", marginBottom: 8 },
  cicTrecho: { fontStyle: "italic" },
  amenBurst: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});
