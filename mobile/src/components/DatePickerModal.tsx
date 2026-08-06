import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { formatIsoDate, getMonthCalendarDays, MONTH_NAMES_PT } from "../services/date";
import type { ThemePalette } from "../types/theme";

const DAY_LABELS_SHORT = ["D", "S", "T", "Q", "Q", "S", "S"];

type Props = {
  visible: boolean;
  selectedDate: string;
  theme: ThemePalette;
  onSelect: (date: string) => void;
  onClose: () => void;
};

export function DatePickerModal({ visible, selectedDate, theme, onSelect, onClose }: Props) {
  const [cursor, setCursor] = useState(() => {
    const [year, month] = selectedDate.split("-").map(Number);
    return { year, month };
  });

  const today = formatIsoDate(new Date());
  const days = getMonthCalendarDays(cursor.year, cursor.month);

  function changeMonth(delta: number) {
    setCursor((prev) => {
      let month = prev.month + delta;
      let year = prev.year;
      if (month > 12) {
        month = 1;
        year += 1;
      } else if (month < 1) {
        month = 12;
        year -= 1;
      }
      return { year, month };
    });
  }

  function handleSelect(day: string) {
    onSelect(day);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Mes anterior"
              style={styles.navButton}
              onPress={() => changeMonth(-1)}
            >
              <Text style={[styles.navText, { color: theme.accent }]}>{"‹"}</Text>
            </Pressable>

            <Text allowFontScaling style={[styles.headerTitle, { color: theme.titleText }]}>
              {MONTH_NAMES_PT[cursor.month - 1]} {cursor.year}
            </Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Proximo mes"
              style={styles.navButton}
              onPress={() => changeMonth(1)}
            >
              <Text style={[styles.navText, { color: theme.accent }]}>{"›"}</Text>
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {DAY_LABELS_SHORT.map((label, index) => (
              <Text
                key={index}
                allowFontScaling
                style={[styles.weekLabel, { color: theme.mutedText }]}
              >
                {label}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {days.map((day, index) => {
              if (!day) {
                return <View key={index} style={styles.dayCell} />;
              }

              const isSelected = day === selectedDate;
              const isToday = day === today;
              const dayNumber = day.slice(8);

              return (
                <Pressable
                  key={day}
                  accessibilityRole="button"
                  accessibilityLabel={day}
                  style={styles.dayCell}
                  onPress={() => handleSelect(day)}
                >
                  <View
                    style={[
                      styles.dayCircle,
                      isSelected && { backgroundColor: theme.accent },
                      !isSelected && isToday && { borderWidth: 1.5, borderColor: theme.accent },
                    ]}
                  >
                    <Text
                      allowFontScaling
                      style={[
                        styles.dayText,
                        {
                          color: isSelected ? "#FFFFFF" : isToday ? theme.accent : theme.titleText,
                          fontWeight: isSelected || isToday ? "800" : "500",
                        },
                      ]}
                    >
                      {dayNumber}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ir para hoje"
            style={[styles.todayButton, { borderColor: theme.accent }]}
            onPress={() => handleSelect(today)}
          >
            <Text allowFontScaling style={[styles.todayText, { color: theme.accent }]}>
              Hoje
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  navButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  navText: {
    fontSize: 22,
    fontWeight: "700",
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  weekRow: {
    flexDirection: "row",
  },
  weekLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: {
    fontSize: 13,
  },
  todayButton: {
    alignSelf: "center",
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 18,
    minHeight: 36,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  todayText: {
    fontSize: 13,
    fontWeight: "700",
  },
});
