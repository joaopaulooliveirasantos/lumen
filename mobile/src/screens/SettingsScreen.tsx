import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import type { ThemePalette } from "../types/theme";
import type { ReadingMode, UserSettings } from "../types/settings";

type Props = {
  settings: UserSettings;
  theme: ThemePalette;
  onUpdateFontScale: (delta: number) => void;
  onUpdateReadingMode: (mode: ReadingMode) => void;
  onReminderTimeChange: (value: string) => void;
  onEnableReminder: () => void;
  onDisableReminder: () => void;
};

const modeLabel: Record<ReadingMode, string> = {
  claro: "Claro",
  escuro: "Escuro",
  sepia: "Sepia",
};

export function SettingsScreen({
  settings,
  theme,
  onUpdateFontScale,
  onUpdateReadingMode,
  onReminderTimeChange,
  onEnableReminder,
  onDisableReminder,
}: Props) {
  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: theme.appBackground }]}
      contentContainerStyle={styles.content}
    >
      <Text allowFontScaling style={[styles.pageTitle, { color: theme.titleText }]}>
        Configuracoes
      </Text>

      {/* Tema */}
      <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <Text allowFontScaling style={[styles.sectionTitle, { color: theme.titleText }]}>
          Tema de leitura
        </Text>
        <View style={styles.modesRow}>
          {(Object.keys(modeLabel) as ReadingMode[]).map((mode) => {
            const selected = settings.readingMode === mode;
            return (
              <Pressable
                key={mode}
                accessibilityRole="button"
                accessibilityLabel={`Ativar modo ${modeLabel[mode]}`}
                style={[
                  styles.modeButton,
                  {
                    borderColor: theme.accent,
                    backgroundColor: selected ? theme.accent : "transparent",
                  },
                ]}
                onPress={() => onUpdateReadingMode(mode)}
              >
                <Text
                  allowFontScaling
                  style={{ color: selected ? "#FFFFFF" : theme.accent, fontWeight: "700" }}
                >
                  {modeLabel[mode]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Tamanho da fonte */}
      <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <Text allowFontScaling style={[styles.sectionTitle, { color: theme.titleText }]}>
          Tamanho da fonte
        </Text>
        <View style={styles.fontRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Diminuir tamanho da fonte"
            style={[styles.fontButton, { borderColor: theme.accent }]}
            onPress={() => onUpdateFontScale(-0.1)}
          >
            <Text allowFontScaling style={[styles.fontButtonText, { color: theme.accent }]}>
              A-
            </Text>
          </Pressable>
          <Text allowFontScaling style={[styles.fontValue, { color: theme.mutedText }]}>
            {(settings.fontScale * 100).toFixed(0)}%
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Aumentar tamanho da fonte"
            style={[styles.fontButton, { borderColor: theme.accent }]}
            onPress={() => onUpdateFontScale(0.1)}
          >
            <Text allowFontScaling style={[styles.fontButtonText, { color: theme.accent }]}>
              A+
            </Text>
          </Pressable>
        </View>
        <Text allowFontScaling style={[styles.fontPreview, { color: theme.bodyText, fontSize: 15 * settings.fontScale }]}>
          Exemplo de texto com a fonte atual.
        </Text>
      </View>

      {/* Lembrete */}
      <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <Text allowFontScaling style={[styles.sectionTitle, { color: theme.titleText }]}>
          Lembrete diario
        </Text>
        <View style={styles.reminderRow}>
          <Text allowFontScaling style={[styles.reminderLabel, { color: theme.mutedText }]}>
            Horario (HH:MM)
          </Text>
          <TextInput
            accessibilityLabel="Horario do lembrete diario"
            accessibilityHint="Digite no formato HH:MM"
            value={settings.reminderTime}
            onChangeText={onReminderTimeChange}
            placeholder="07:00"
            keyboardType="numbers-and-punctuation"
            style={[
              styles.timeInput,
              {
                borderColor: theme.border,
                color: theme.titleText,
                backgroundColor: theme.appBackground,
              },
            ]}
          />
        </View>
        <View style={styles.reminderToggleRow}>
          <Text allowFontScaling style={[styles.reminderLabel, { color: theme.bodyText }]}>
            {settings.reminderEnabled ? "Lembrete ativo" : "Lembrete desativado"}
          </Text>
          <Switch
            value={settings.reminderEnabled}
            onValueChange={(value) => {
              if (value) {
                onEnableReminder();
              } else {
                onDisableReminder();
              }
            }}
            trackColor={{ false: theme.border, true: theme.accent }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 28,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 18,
  },
  card: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  modesRow: {
    flexDirection: "row",
    gap: 8,
  },
  modeButton: {
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 38,
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  fontRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  fontButton: {
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 38,
    minWidth: 48,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  fontButtonText: {
    fontWeight: "700",
    fontSize: 15,
  },
  fontValue: {
    minWidth: 52,
    textAlign: "center",
    fontWeight: "600",
  },
  fontPreview: {
    marginTop: 14,
    lineHeight: 22,
  },
  reminderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  reminderToggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reminderLabel: {
    fontSize: 14,
  },
  timeInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontWeight: "600",
    width: 80,
    textAlign: "center",
  },
});
