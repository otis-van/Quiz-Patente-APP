import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { AppState, Platform } from 'react-native';

import { addDays, dayKey } from '@/lib/date';
import { streakOf, todayXp, useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';

/** Le notifiche locali programmate non sono disponibili sul web. */
export const remindersSupported = Platform.OS !== 'web';

const CHANNEL = 'promemoria';
const DAYS_AHEAD = 14;

const MESSAGES = [
  ['📅 I tuoi esercizi del giorno ti aspettano', 'Bastano 5 minuti per avvicinarti alla patente!'],
  ['🚗 È ora del quiz!', 'Un paio di lezioni oggi e l’esame sarà una passeggiata.'],
  ['🚦 Semaforo verde per lo studio', 'Riprendi il percorso da dove l’avevi lasciato.'],
  ['📝 Pronto per una simulazione?', '30 domande, 20 minuti: mettiti alla prova.'],
  ['🧠 Ripassa i tuoi errori', 'Le domande sbagliate sono quelle che insegnano di più.'],
] as const;

export async function requestReminderPermission(): Promise<boolean> {
  if (!remindersSupported) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

/**
 * Programma i promemoria dei prossimi giorni all'orario scelto.
 * Quello di oggi viene saltato se l'obiettivo giornaliero è già stato raggiunto.
 */
export async function rescheduleReminders(): Promise<void> {
  if (!remindersSupported) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  const { reminderEnabled, reminderHour, reminderMinute } = useSettings.getState();
  if (!reminderEnabled) return;
  const perm = await Notifications.getPermissionsAsync();
  if (!perm.granted) return;

  const progress = useProgress.getState();
  const goalDone = todayXp(progress) >= progress.dailyGoal;
  const streak = streakOf(progress);
  const today = dayKey();
  const now = Date.now();

  for (let i = 0; i < DAYS_AHEAD; i++) {
    if (i === 0 && goalDone) continue;
    const [y, m, d] = addDays(today, i).split('-').map(Number);
    const date = new Date(y, m - 1, d, reminderHour, reminderMinute);
    if (date.getTime() <= now + 60_000) continue;

    // Il primo promemoria utile ricorda la serie da non perdere, gli altri variano.
    const [title, body] =
      streak > 0 && i <= 1
        ? [`🔥 Non perdere la tua serie di ${streak} ${streak === 1 ? 'giorno' : 'giorni'}!`, 'Completa una lezione per mantenerla viva.']
        : MESSAGES[(d + i) % MESSAGES.length];

    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: 'default' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: CHANNEL },
    });
  }
}

let timer: ReturnType<typeof setTimeout> | undefined;
const schedule = () => {
  clearTimeout(timer);
  timer = setTimeout(() => void rescheduleReminders().catch(() => {}), 1500);
};

/** Mantiene aggiornati i promemoria quando cambiano impostazioni o progressi. */
export function startReminderScheduler(): () => void {
  if (!remindersSupported) return () => {};
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    void Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'Promemoria di studio',
      importance: AndroidImportance.DEFAULT,
    }).catch(() => {});
  }
  const unsubSettings = useSettings.subscribe(schedule);
  const unsubProgress = useProgress.subscribe((s, prev) => {
    if (s.xpByDay !== prev.xpByDay || s.dailyGoal !== prev.dailyGoal) schedule();
  });
  const appState = AppState.addEventListener('change', (st) => st === 'active' && schedule());
  schedule();
  return () => {
    unsubSettings();
    unsubProgress();
    appState.remove();
    clearTimeout(timer);
  };
}
