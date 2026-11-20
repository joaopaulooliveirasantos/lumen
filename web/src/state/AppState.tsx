// Estado global do app (equivalente ao mobile/App.tsx do RN): configurações, data selecionada,
// liturgia e santo do dia, históricos, progresso dos planos, navegação e avisos rápidos.
import { createContext, type ComponentChildren } from "preact";
import { useCallback, useContext, useEffect, useRef, useState } from "preact/hooks";
import type { TabName } from "../components/BottomTabBar";
import { disableDailyReminder, parseTime, scheduleDailyReminder } from "../native/notifications";
import { fetchDailyLiturgy, fetchSaintOfDay } from "../services/api";
import { addDays, formatIsoDate } from "../services/date";
import { loadLiturgy } from "../services/liturgy";
import { saveDailyCache } from "../storage/liturgyCache";
import { getReadDays, markDayAsRead } from "../storage/readingHistory";
import { getAllReadingPlanProgress, markReadingPlanDayCompleted, resetReadingPlanProgress, type ReadingPlanProgress } from "../storage/readingPlanProgress";
import { getRosaryDays, markRosaryAsPrayed } from "../storage/rosaryHistory";
import { loadUserSettings, saveUserSettings } from "../storage/userSettings";
import type { BibleLocation } from "../types/bible";
import type { DailyLiturgyPayload, SaintOfDayPayload } from "../types/liturgy";
import { defaultUserSettings, type UserSettings } from "../types/settings";

export const MIN_FONT_SCALE = 0.9;
export const MAX_FONT_SCALE = 1.5;

export function clampFontScale(value: number): number {
  return Math.max(MIN_FONT_SCALE, Math.min(MAX_FONT_SCALE, Number(value.toFixed(2))));
}

/** Telas que abrem por cima das abas (como no RN). */
export type Overlay = { kind: "rosary" } | { kind: "plans"; planId: string | null } | { kind: "saintStory" } | null;

interface AppStateValue {
  ready: boolean;
  settings: UserSettings;
  updateSettings: (patch: Partial<UserSettings>) => void;
  changeFontScale: (delta: number) => void;
  /** Liga o lembrete no horário dado (pede permissão). Devolve uma mensagem de erro ou null. */
  enableReminder: (time: string) => Promise<string | null>;
  disableReminder: () => Promise<void>;

  today: string;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  liturgy: DailyLiturgyPayload | null;
  liturgyLoading: boolean;
  liturgyError: string | null;
  liturgyOffline: boolean;
  retryLiturgy: () => void;
  saint: SaintOfDayPayload | null;
  saintLoading: boolean;

  readDays: string[];
  markSelectedDayAsRead: () => Promise<void>;
  rosaryDays: string[];
  markRosaryPrayedToday: () => Promise<void>;
  planProgress: Record<string, ReadingPlanProgress>;
  completePlanDay: (planId: string, day: number, durationDays: number) => Promise<void>;
  resetPlan: (planId: string) => Promise<void>;

  activeTab: TabName;
  setActiveTab: (tab: TabName) => void;
  overlay: Overlay;
  openOverlay: (overlay: Overlay) => void;
  /** Abre a aba Bíblia já num livro/capítulo (usado pelos planos de leitura). */
  bibleTarget: BibleLocation | null;
  openBibleAt: (location: BibleLocation) => void;
  clearBibleTarget: () => void;

  toast: string | null;
  notify: (message: string) => void;
}

const AppStateContext = createContext<AppStateValue | null>(null);

export function useAppState(): AppStateValue {
  const value = useContext(AppStateContext);
  if (!value) throw new Error("useAppState precisa estar dentro de <AppStateProvider>.");
  return value;
}

type Props = { children: ComponentChildren; initialTab?: TabName };

export function AppStateProvider({ children, initialTab = "home" }: Props) {
  const today = formatIsoDate(new Date());
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(defaultUserSettings);
  const [selectedDate, setSelectedDate] = useState(today);
  const [liturgy, setLiturgy] = useState<DailyLiturgyPayload | null>(null);
  const [liturgyLoading, setLiturgyLoading] = useState(true);
  const [liturgyError, setLiturgyError] = useState<string | null>(null);
  const [liturgyOffline, setLiturgyOffline] = useState(false);
  const [liturgyAttempt, setLiturgyAttempt] = useState(0);
  const [saint, setSaint] = useState<SaintOfDayPayload | null>(null);
  const [saintLoading, setSaintLoading] = useState(true);
  const [readDays, setReadDays] = useState<string[]>([]);
  const [rosaryDays, setRosaryDays] = useState<string[]>([]);
  const [planProgress, setPlanProgress] = useState<Record<string, ReadingPlanProgress>>({});
  const [activeTab, setActiveTabState] = useState<TabName>(initialTab);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [bibleTarget, setBibleTarget] = useState<BibleLocation | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const prefetched = useRef(new Set<string>());

  useEffect(() => {
    void Promise.all([loadUserSettings(), getReadDays(), getRosaryDays(), getAllReadingPlanProgress()])
      .then(([s, read, rosary, progress]) => {
        setSettings(s);
        setReadDays(read);
        setRosaryDays(rosary);
        setPlanProgress(progress);
      })
      .finally(() => setReady(true));
  }, []);

  // Liturgia da data selecionada (rede, com cache offline) e pré-carga dos 7 dias seguintes.
  useEffect(() => {
    let active = true;
    setLiturgyLoading(true);
    setLiturgyError(null);
    loadLiturgy(selectedDate)
      .then((result) => {
        if (!active) return;
        setLiturgy(result.payload);
        setLiturgyOffline(result.offline);
        if (!result.offline && !prefetched.current.has(selectedDate)) {
          prefetched.current.add(selectedDate);
          for (let i = 1; i <= 7; i++) {
            const date = addDays(selectedDate, i);
            void fetchDailyLiturgy(date)
              .then((payload) => saveDailyCache(date, payload))
              .catch(() => undefined);
          }
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLiturgy(null);
        setLiturgyError(error instanceof Error ? error.message : "Falha ao carregar a liturgia desta data.");
      })
      .finally(() => active && setLiturgyLoading(false));
    return () => {
      active = false;
    };
  }, [selectedDate, liturgyAttempt]);

  useEffect(() => {
    let active = true;
    setSaintLoading(true);
    fetchSaintOfDay(selectedDate)
      .then((s) => active && setSaint(s))
      .catch(() => active && setSaint(null))
      .finally(() => active && setSaintLoading(false));
    return () => {
      active = false;
    };
  }, [selectedDate]);

  const updateSettings = useCallback((patch: Partial<UserSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      void saveUserSettings(next);
      return next;
    });
  }, []);

  const notify = useCallback((message: string) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  const value: AppStateValue = {
    ready,
    settings,
    updateSettings,
    changeFontScale: (delta) => updateSettings({ fontScale: clampFontScale(settings.fontScale + delta) }),
    enableReminder: async (time) => {
      if (!parseTime(time)) return "Horário inválido. Use o formato HH:MM, por exemplo 07:00.";
      const ok = await scheduleDailyReminder(time).catch(() => false);
      if (!ok) return "Permita as notificações do Lumen nas configurações do Android.";
      updateSettings({ reminderEnabled: true, reminderTime: time });
      return null;
    },
    disableReminder: async () => {
      await disableDailyReminder().catch(() => undefined);
      updateSettings({ reminderEnabled: false });
    },

    today,
    selectedDate,
    setSelectedDate,
    liturgy,
    liturgyLoading,
    liturgyError,
    liturgyOffline,
    retryLiturgy: () => setLiturgyAttempt((n) => n + 1),
    saint,
    saintLoading,

    readDays,
    markSelectedDayAsRead: async () => setReadDays(await markDayAsRead(selectedDate)),
    rosaryDays,
    markRosaryPrayedToday: async () => setRosaryDays(await markRosaryAsPrayed(formatIsoDate(new Date()))),
    planProgress,
    completePlanDay: async (planId, day, durationDays) => setPlanProgress(await markReadingPlanDayCompleted(planId, day, durationDays)),
    resetPlan: async (planId) => setPlanProgress(await resetReadingPlanProgress(planId)),

    activeTab,
    setActiveTab: (tab) => {
      setOverlay(null);
      setActiveTabState(tab);
    },
    overlay,
    openOverlay: setOverlay,
    bibleTarget,
    openBibleAt: (location) => {
      setBibleTarget(location);
      setOverlay(null);
      setActiveTabState("biblia");
    },
    clearBibleTarget: () => setBibleTarget(null),

    toast,
    notify,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
