export type ReadingMode = "claro" | "escuro" | "sepia";

export type BibleTranslationId = "ave-maria" | "paulus";

export interface UserSettings {
  fontScale: number;
  readingMode: ReadingMode;
  reminderEnabled: boolean;
  reminderTime: string;
  bibleTranslation: BibleTranslationId;
}

export const defaultUserSettings: UserSettings = {
  fontScale: 1,
  readingMode: "claro",
  reminderEnabled: false,
  reminderTime: "07:00",
  bibleTranslation: "ave-maria",
};
