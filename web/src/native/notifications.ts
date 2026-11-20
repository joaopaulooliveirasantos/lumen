import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

const CHANNEL_ID = "lumen-reminders";
const REMINDER_ID = 1;
const TEST_ID = 2;

export function parseTime(value: string): { hour: number; minute: number } | null {
  const match = value.match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
}

export async function requestNotificationPermission(): Promise<boolean> {
  const current = await LocalNotifications.checkPermissions();
  if (current.display === "granted") return true;
  const requested = await LocalNotifications.requestPermissions();
  return requested.display === "granted";
}

async function ensureChannel(): Promise<void> {
  if (Capacitor.getPlatform() !== "android") return;
  await LocalNotifications.createChannel({ id: CHANNEL_ID, name: "Lembretes diários", importance: 3 });
}

/** `askPermission: false` só agenda se a permissão já estiver concedida (sem diálogo; usado na migração do RN). */
export async function scheduleDailyReminder(time: string, { askPermission = true } = {}): Promise<boolean> {
  const parsed = parseTime(time);
  if (!parsed) return false;
  const permitted = askPermission
    ? await requestNotificationPermission()
    : (await LocalNotifications.checkPermissions()).display === "granted";
  if (!permitted) return false;

  await ensureChannel();
  await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] });
  await LocalNotifications.schedule({
    notifications: [
      {
        id: REMINDER_ID,
        title: "Liturgia diária",
        body: "Reserve um momento para sua leitura e reflexão.",
        channelId: CHANNEL_ID,
        schedule: { on: { hour: parsed.hour, minute: parsed.minute }, allowWhileIdle: true },
      },
    ],
  });
  return true;
}

export async function disableDailyReminder(): Promise<void> {
  await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] });
}

export async function scheduleTestNotification(seconds: number): Promise<boolean> {
  if (!(await requestNotificationPermission())) return false;
  await ensureChannel();
  await LocalNotifications.schedule({
    notifications: [
      {
        id: TEST_ID,
        title: "Teste do Lumen",
        body: `Notificação local agendada para ${seconds}s.`,
        channelId: CHANNEL_ID,
        schedule: { at: new Date(Date.now() + seconds * 1000), allowWhileIdle: true },
      },
    ],
  });
  return true;
}
