import * as Notifications from "expo-notifications";

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
} catch {
  // expo-notifications não suportado neste ambiente (ex: Expo Go SDK 54)
}

function parseTime(value: string): { hour: number; minute: number } | null {
  const match = value.match(/^(\d{2}):(\d{2})$/);
  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  return { hour, minute };
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const permissions = await Notifications.getPermissionsAsync();
    const isGranted =
      (permissions as { granted?: boolean }).granted === true ||
      (permissions as { status?: string }).status === "granted";

    if (isGranted) return true;

    const requested = await Notifications.requestPermissionsAsync();
    return (
      (requested as { granted?: boolean }).granted === true ||
      (requested as { status?: string }).status === "granted"
    );
  } catch {
    return false;
  }
}

export async function scheduleDailyReminder(time: string): Promise<boolean> {
  const parsedTime = parseTime(time);
  if (!parsedTime) return false;

  try {
    const granted = await requestNotificationPermission();
    if (!granted) return false;

    await Notifications.setNotificationChannelAsync("lumen-reminders", {
      name: "Lembretes diarios",
      importance: Notifications.AndroidImportance.DEFAULT,
    });

    await Notifications.cancelAllScheduledNotificationsAsync();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Liturgia diaria",
        body: "Reserve um momento para sua leitura e reflexao.",
        sound: false,
        data: { source: "lumen-reminder" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: parsedTime.hour,
        minute: parsedTime.minute,
        channelId: "lumen-reminders",
      },
    });

    return true;
  } catch {
    return false;
  }
}

export async function disableDailyReminder(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // not supported in this environment
  }
}
