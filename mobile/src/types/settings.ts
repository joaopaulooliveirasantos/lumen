export type ReadingMode = "claro" | "escuro" | "sepia";

export interface UserSettings {
  fontScale: number;
  readingMode: ReadingMode;
  reminderEnabled: boolean;
  reminderTime: string;
}

export const defaultUserSettings: UserSettings = {
  fontScale: 1,
  readingMode: "claro",
  reminderEnabled: false,
  reminderTime: "07:00",
};
