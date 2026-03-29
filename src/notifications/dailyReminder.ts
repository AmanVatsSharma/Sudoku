import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const ANDROID_CHANNEL_ID = 'daily-reminder';
const IDENTIFIER_PREFIX = 'sudoku-daily-reminder-';
const DAYS_AHEAD = 14;
/** Inclusive local hour range for random reminder time (e.g. 10–21). */
const WINDOW_START_HOUR = 10;
const WINDOW_END_HOUR = 21;
const MIN_LEAD_MS = 30_000;

const REMINDER_COPY: { title: string; body: string }[] = [
  { title: 'Sudoku break', body: 'Fit in a quick puzzle today.' },
  { title: 'Time for a grid', body: 'Open Sudoku Ultimatum and keep your streak going.' },
  { title: 'Daily puzzle', body: 'A new board is waiting whenever you are.' },
  { title: 'Brain training', body: 'Sharpen your mind with one game today.' },
  { title: 'Still thinking?', body: 'Come back and finish a sudoku.' },
];

let handlerConfigured = false;

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickCopy(): { title: string; body: string } {
  return REMINDER_COPY[randomInt(0, REMINDER_COPY.length - 1)]!;
}

function computeNextReminderDates(): Date[] {
  const dates: Date[] = [];
  let dayOffset = 0;
  const now = Date.now();
  while (dates.length < DAYS_AHEAD && dayOffset < 400) {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    t.setDate(t.getDate() + dayOffset);
    const hour = randomInt(WINDOW_START_HOUR, WINDOW_END_HOUR);
    const minute = randomInt(0, 59);
    t.setHours(hour, minute, 0, 0);
    if (t.getTime() > now + MIN_LEAD_MS) {
      dates.push(new Date(t));
    }
    dayOffset += 1;
  }
  return dates;
}

export function ensureDailyReminderNotificationHandler(): void {
  if (Platform.OS === 'web' || handlerConfigured) return;
  handlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function requestDailyReminderPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Daily puzzle reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

async function cancelScheduledDailyReminders(): Promise<void> {
  if (Platform.OS === 'web') return;
  const all = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    all
      .filter((r) => r.identifier.startsWith(IDENTIFIER_PREFIX))
      .map((r) => Notifications.cancelScheduledNotificationAsync(r.identifier)),
  );
}

/**
 * Enable or disable randomized local reminders. When enabling, permission should already be granted.
 */
export async function syncDailyReminders(enabled: boolean): Promise<void> {
  if (Platform.OS === 'web') return;

  await cancelScheduledDailyReminders();

  if (!enabled) return;

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  await ensureAndroidChannel();

  const dates = computeNextReminderDates();
  for (let i = 0; i < dates.length; i += 1) {
    const when = dates[i]!;
    const { title, body } = pickCopy();
    await Notifications.scheduleNotificationAsync({
      identifier: `${IDENTIFIER_PREFIX}${i}`,
      content: {
        title,
        body,
        data: { sudokuDailyReminder: true },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: when,
        channelId: Platform.OS === 'android' ? ANDROID_CHANNEL_ID : undefined,
      },
    });
  }
}
