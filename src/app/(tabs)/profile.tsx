import { router } from 'expo-router';
import { Alert, Platform, Pressable, Switch, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { DuoButton } from '@/components/DuoButton';
import { Screen } from '@/components/Screen';
import { addDays, dayKey, longestStreak } from '@/lib/date';
import { remindersSupported, requestReminderPermission } from '@/lib/reminders';
import { isCloudEnabled } from '@/lib/supabase';
import { syncNow, useSyncStatus } from '@/lib/sync';
import { displayName, useAuth } from '@/store/auth';
import { streakOf, totalXp, useProgress } from '@/store/progress';
import { ThemeMode, useSettings } from '@/store/settings';
import { F, makeStyles, useColors } from '@/theme';

const GOALS = [
  { xp: 10, label: 'Tranquillo' },
  { xp: 20, label: 'Normale' },
  { xp: 30, label: 'Serio' },
  { xp: 50, label: 'Intenso' },
];

const WEEKDAYS = ['D', 'L', 'M', 'M', 'G', 'V', 'S'];

function ask(title: string, msg: string, onOk: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${msg}`)) onOk();
  } else {
    Alert.alert(title, msg, [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Conferma', style: 'destructive', onPress: onOk },
    ]);
  }
}

export default function ProfileScreen() {
  const C = useColors();
  const styles = useStyles();
  const session = useAuth((s) => s.session);
  const sync = useSyncStatus();
  const p = useProgress(
    useShallow((s) => ({
      streak: streakOf(s),
      best: longestStreak(Object.keys(s.xpByDay).filter((k) => s.xpByDay[k] > 0)),
      xp: totalXp(s),
      xpByDay: s.xpByDay,
      stats: s.questionStats,
      exams: s.exams,
      goal: s.dailyGoal,
    })),
  );
  const answered = Object.values(p.stats).reduce((a, v) => a + v.c + v.w, 0);
  const correct = Object.values(p.stats).reduce((a, v) => a + v.c, 0);
  const accuracy = answered ? Math.round((correct / answered) * 100) : 0;
  const name = displayName(session);

  const week = Array.from({ length: 7 }, (_, i) => {
    const k = addDays(dayKey(), i - 6);
    const [y, m, d] = k.split('-').map(Number);
    return { k, xp: p.xpByDay[k] ?? 0, label: WEEKDAYS[new Date(y, m - 1, d).getDay()] };
  });
  const maxWeek = Math.max(p.goal, ...week.map((w) => w.xp));

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.email}>{session?.user.email ?? 'Progressi salvati solo su questo dispositivo'}</Text>
      </View>

      {!session ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>☁️ Salva i tuoi progressi</Text>
          <Text style={styles.cardText}>
            Crea un profilo per sincronizzare i progressi e riprendere da qualsiasi dispositivo, iOS o Android.
          </Text>
          {isCloudEnabled ? (
            <View style={{ gap: 10, marginTop: 8 }}>
              <DuoButton title="Crea un profilo" onPress={() => router.push({ pathname: '/auth', params: { mode: 'signup' } })} />
              <DuoButton title="Accedi" variant="white" onPress={() => router.push({ pathname: '/auth', params: { mode: 'signin' } })} />
            </View>
          ) : (
            <Text style={[styles.cardText, { color: C.orange }]}>
              Sincronizzazione non configurata: imposta EXPO_PUBLIC_SUPABASE_URL ed EXPO_PUBLIC_SUPABASE_ANON_KEY (vedi README).
            </Text>
          )}
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {sync.status === 'syncing' ? '🔄 Sincronizzazione…' : sync.status === 'error' ? '⚠️ Errore di sincronizzazione' : '✅ Progressi sincronizzati'}
          </Text>
          <Text style={styles.cardText}>
            {sync.status === 'error'
              ? sync.error
              : sync.lastSync
                ? `Ultima sincronizzazione: ${new Date(sync.lastSync).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`
                : 'I progressi vengono salvati automaticamente sul tuo account.'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
            <DuoButton title="Sincronizza" variant="blue" small style={{ flex: 1 }} onPress={() => void syncNow()} />
            <DuoButton
              title="Esci"
              variant="white"
              small
              style={{ flex: 1 }}
              onPress={() =>
                ask('Uscire dall’account?', 'I progressi restano salvati sul tuo account e verranno rimossi da questo dispositivo.', async () => {
                  await syncNow();
                  await useAuth.getState().signOut();
                  useProgress.getState().reset();
                })
              }
            />
          </View>
        </View>
      )}

      <Text style={styles.section}>Statistiche</Text>
      <View style={styles.grid}>
        <Stat icon="🔥" value={p.streak} label="Serie attuale" />
        <Stat icon="🏅" value={p.best} label="Serie record" />
        <Stat icon="💎" value={p.xp} label="XP totali" />
        <Stat icon="🎯" value={`${accuracy}%`} label="Precisione" />
        <Stat icon="❓" value={answered} label="Risposte date" />
        <Stat icon="🎓" value={p.exams.filter((e) => e.passed).length} label="Esami superati" />
      </View>

      <Text style={styles.section}>Questa settimana</Text>
      <View style={[styles.card, styles.chart]}>
        {week.map((w) => (
          <View key={w.k} style={styles.barCol}>
            <Text style={styles.barValue}>{w.xp || ''}</Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.bar,
                  { height: `${(w.xp / maxWeek) * 100}%`, backgroundColor: w.xp >= p.goal ? C.green : C.yellow },
                ]}
              />
            </View>
            <Text style={[styles.barLabel, w.k === dayKey() && { color: C.blue }]}>{w.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.section}>Obiettivo giornaliero</Text>
      <View style={styles.card}>
        {GOALS.map((g, i) => (
          <Pressable
            key={g.xp}
            onPress={() => useProgress.getState().setDailyGoal(g.xp)}
            style={[styles.goalRow, i > 0 && { borderTopWidth: 2, borderTopColor: C.grayLight }, p.goal === g.xp && styles.goalSel]}>
            <Text style={[styles.goalLabel, p.goal === g.xp && { color: C.blueDark }]}>{g.label}</Text>
            <Text style={[styles.goalXp, p.goal === g.xp && { color: C.blueDark }]}>{g.xp} XP al giorno</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.section}>Promemoria giornaliero</Text>
      <ReminderSettings />

      <Text style={styles.section}>Aspetto</Text>
      <ThemeSettings />

      <DuoButton
        title="Azzera progressi"
        variant="ghost"
        style={{ marginTop: 24 }}
        onPress={() =>
          ask('Azzerare i progressi?', session ? 'Verranno azzerati solo su questo dispositivo; al prossimo sync torneranno quelli del tuo account.' : 'Questa azione non si può annullare.', () =>
            useProgress.getState().reset(),
          )
        }
      />
    </Screen>
  );
}

const THEMES: { mode: ThemeMode; label: string; icon: string }[] = [
  { mode: 'system', label: 'Automatico', icon: '📱' },
  { mode: 'light', label: 'Chiaro', icon: '☀️' },
  { mode: 'dark', label: 'Scuro', icon: '🌙' },
];

function ThemeSettings() {
  const styles = useStyles();
  const mode = useSettings((s) => s.themeMode);
  return (
    <View style={styles.segment}>
      {THEMES.map((t) => (
        <Pressable
          key={t.mode}
          onPress={() => useSettings.getState().setThemeMode(t.mode)}
          accessibilityRole="button"
          accessibilityState={{ selected: mode === t.mode }}
          style={[styles.segmentItem, mode === t.mode && styles.segmentSel]}>
          <Text style={{ fontSize: 22 }}>{t.icon}</Text>
          <Text style={[styles.segmentLabel, mode === t.mode && styles.segmentLabelSel]}>{t.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const pad = (n: number) => String(n).padStart(2, '0');

function ReminderSettings() {
  const C = useColors();
  const styles = useStyles();
  const { reminderEnabled, reminderHour, reminderMinute, setReminder } = useSettings();

  if (!remindersSupported) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardText}>I promemoria sono disponibili nell’app per iOS e Android.</Text>
      </View>
    );
  }

  const shift = (deltaMin: number) => {
    const total = (reminderHour * 60 + reminderMinute + deltaMin + 24 * 60) % (24 * 60);
    setReminder({ reminderHour: Math.floor(total / 60), reminderMinute: total % 60 });
  };

  const toggle = async (on: boolean) => {
    if (on && !(await requestReminderPermission())) {
      Alert.alert('Notifiche disattivate', 'Per ricevere i promemoria consenti le notifiche dalle impostazioni del telefono.');
      return;
    }
    setReminder({ reminderEnabled: on });
  };

  return (
    <View style={styles.card}>
      <View style={styles.switchRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>⏰ Ricordami di studiare</Text>
          <Text style={styles.cardText}>Non arriva se hai già raggiunto l’obiettivo di oggi.</Text>
        </View>
        <Switch
          value={reminderEnabled}
          onValueChange={toggle}
          trackColor={{ true: C.green, false: C.grayLight }}
          thumbColor={C.white}
        />
      </View>
      {reminderEnabled && (
        <View style={styles.timeRow}>
          <DuoButton title="−" variant="white" small onPress={() => shift(-30)} style={{ width: 56 }} />
          <Text style={styles.time}>
            {pad(reminderHour)}:{pad(reminderMinute)}
          </Text>
          <DuoButton title="+" variant="white" small onPress={() => shift(30)} style={{ width: 56 }} />
        </View>
      )}
    </View>
  );
}

function Stat({ icon, value, label }: { icon: string; value: string | number; label: string }) {
  const styles = useStyles();
  return (
    <View style={styles.stat}>
      <Text style={{ fontSize: 22 }}>{icon}</Text>
      <View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles((C) => ({
  header: { alignItems: 'center', paddingTop: 24, paddingBottom: 8, gap: 4 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: C.blue,
    borderBottomWidth: 6,
    borderBottomColor: C.blueDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: F.black, fontSize: 44, color: C.white },
  name: { fontFamily: F.black, fontSize: 26, color: C.text, marginTop: 8 },
  email: { fontFamily: F.regular, fontSize: 14, color: C.gray },
  card: { borderWidth: 2, borderColor: C.grayLight, borderRadius: 16, padding: 16, marginTop: 16, gap: 4 },
  cardTitle: { fontFamily: F.black, fontSize: 18, color: C.text },
  cardText: { fontFamily: F.regular, fontSize: 15, color: C.textLight, lineHeight: 21 },
  section: { fontFamily: F.black, fontSize: 21, color: C.text, marginTop: 24, marginBottom: -4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  stat: {
    flexBasis: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 2,
    borderColor: C.grayLight,
    borderRadius: 16,
    padding: 12,
  },
  statValue: { fontFamily: F.black, fontSize: 20, color: C.text },
  statLabel: { fontFamily: F.bold, fontSize: 12, color: C.gray },
  chart: { flexDirection: 'row', justifyContent: 'space-between', height: 170, alignItems: 'flex-end' },
  barCol: { alignItems: 'center', flex: 1, gap: 4, height: '100%' },
  barValue: { fontFamily: F.bold, fontSize: 11, color: C.gray, height: 14 },
  barTrack: { flex: 1, width: 22, justifyContent: 'flex-end', backgroundColor: C.grayBg, borderRadius: 8, overflow: 'hidden' },
  bar: { width: '100%', borderRadius: 8 },
  barLabel: { fontFamily: F.bold, fontSize: 13, color: C.gray },
  goalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 8, borderRadius: 12 },
  goalSel: { backgroundColor: C.blueLight },
  goalLabel: { fontFamily: F.bold, fontSize: 16, color: C.text },
  goalXp: { fontFamily: F.regular, fontSize: 15, color: C.textLight },
  segment: { flexDirection: 'row', gap: 10, marginTop: 16 },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: C.grayLight,
    borderRadius: 16,
  },
  segmentSel: { backgroundColor: C.blueLight, borderColor: C.blueBorder },
  segmentLabel: { fontFamily: F.bold, color: C.text, fontSize: 14 },
  segmentLabelSel: { color: C.blue },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginTop: 12 },
  time: { fontFamily: F.black, fontSize: 32, color: C.text, minWidth: 100, textAlign: 'center' },
}));
