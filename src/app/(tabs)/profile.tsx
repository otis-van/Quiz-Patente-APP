import { router } from 'expo-router';
import { Alert, Platform, Pressable, Switch, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { Icon, IconName } from '@/components/Icon';
import { RetroButton } from '@/components/RetroButton';
import { Screen } from '@/components/Screen';
import { Window } from '@/components/Window';
import { addDays, dayKey, longestStreak } from '@/lib/date';
import { remindersSupported, requestReminderPermission } from '@/lib/reminders';
import { isCloudEnabled } from '@/lib/supabase';
import { syncNow, useSyncStatus } from '@/lib/sync';
import { displayName, useAuth } from '@/store/auth';
import { streakOf, totalXp, useProgress } from '@/store/progress';
import { ThemeMode, useSettings } from '@/store/settings';
import { boxed, F, hardShadow, makeStyles, useColors } from '@/theme';

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

  const syncIcon: IconName = sync.status === 'error' ? 'warning' : sync.status === 'syncing' ? 'cloud' : 'check';

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
        <Window title="account.exe" color={C.mint} style={styles.mt} bodyStyle={{ gap: 6 }}>
          <View style={styles.titleRow}>
            <Icon name="cloud" size={24} />
            <Text style={styles.cardTitle}>Salva i tuoi progressi</Text>
          </View>
          <Text style={styles.cardText}>
            Crea un profilo per sincronizzare i progressi e riprendere da qualsiasi dispositivo, iOS o Android.
          </Text>
          {isCloudEnabled ? (
            <View style={{ gap: 12, marginTop: 8 }}>
              <RetroButton title="Crea un profilo" onPress={() => router.push({ pathname: '/auth', params: { mode: 'signup' } })} />
              <RetroButton title="Accedi" variant="surface" onPress={() => router.push({ pathname: '/auth', params: { mode: 'signin' } })} />
            </View>
          ) : (
            <Text style={[styles.cardText, { color: C.redText }]}>
              Sincronizzazione non configurata: imposta EXPO_PUBLIC_SUPABASE_URL ed EXPO_PUBLIC_SUPABASE_ANON_KEY (vedi README).
            </Text>
          )}
        </Window>
      ) : (
        <Window title="sync.exe" color={sync.status === 'error' ? C.pink : C.mint} style={styles.mt} bodyStyle={{ gap: 6 }}>
          <View style={styles.titleRow}>
            <Icon name={syncIcon} size={24} />
            <Text style={styles.cardTitle}>
              {sync.status === 'syncing' ? 'Sincronizzazione…' : sync.status === 'error' ? 'Errore di sincronizzazione' : 'Progressi sincronizzati'}
            </Text>
          </View>
          <Text style={styles.cardText}>
            {sync.status === 'error'
              ? sync.error
              : sync.lastSync
                ? `Ultima sincronizzazione: ${new Date(sync.lastSync).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`
                : 'I progressi vengono salvati automaticamente sul tuo account.'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
            <RetroButton title="Sincronizza" variant="blue" small style={{ flex: 1 }} onPress={() => void syncNow()} />
            <RetroButton
              title="Esci"
              variant="surface"
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
        </Window>
      )}

      <Text style={styles.section}>Statistiche</Text>
      <View style={styles.grid}>
        <Stat icon="fire" value={p.streak} label="Serie attuale" color={C.orange} />
        <Stat icon="trophy" value={p.best} label="Serie record" color={C.yellow} />
        <Stat icon="gem" value={p.xp} label="XP totali" color={C.blue} />
        <Stat icon="target" value={`${accuracy}%`} label="Precisione" color={C.pink} />
        <Stat icon="question" value={answered} label="Risposte date" color={C.lilac} />
        <Stat icon="cap" value={p.exams.filter((e) => e.passed).length} label="Esami superati" color={C.mint} />
      </View>

      <Text style={styles.section}>Questa settimana</Text>
      <Window title="xp_settimana.chart" color={C.yellow} style={styles.mt} bodyStyle={styles.chart}>
        {week.map((w) => (
          <View key={w.k} style={styles.barCol}>
            <Text style={styles.barValue}>{w.xp || ''}</Text>
            <View style={styles.barTrack}>
              {w.xp > 0 && (
                <View
                  style={[
                    styles.bar,
                    { height: `${(w.xp / maxWeek) * 100}%`, backgroundColor: w.xp >= p.goal ? C.green : C.yellow },
                  ]}
                />
              )}
            </View>
            <Text style={[styles.barLabel, w.k === dayKey() && styles.barToday]}>{w.label}</Text>
          </View>
        ))}
      </Window>

      <Text style={styles.section}>Obiettivo giornaliero</Text>
      <View style={styles.goalList}>
        {GOALS.map((g) => {
          const sel = p.goal === g.xp;
          return (
            <Pressable key={g.xp} onPress={() => useProgress.getState().setDailyGoal(g.xp)}>
              <View style={[styles.goalRow, sel && styles.goalSel]}>
                <View style={[styles.radio, sel && styles.radioSel]} />
                <Text style={[styles.goalLabel, sel && { color: C.onAccent }]}>{g.label}</Text>
                <Text style={[styles.goalXp, sel && { color: C.onAccent }]}>{g.xp} XP/giorno</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.section}>Promemoria giornaliero</Text>
      <ReminderSettings />

      <Text style={styles.section}>Aspetto</Text>
      <ThemeSettings />
      <IntroSetting />

      <RetroButton
        title="Azzera progressi"
        variant="ghost"
        style={{ marginTop: 28 }}
        onPress={() =>
          ask('Azzerare i progressi?', session ? 'Verranno azzerati solo su questo dispositivo; al prossimo sync torneranno quelli del tuo account.' : 'Questa azione non si può annullare.', () =>
            useProgress.getState().reset(),
          )
        }
      />
    </Screen>
  );
}

const THEMES: { mode: ThemeMode; label: string; icon: IconName }[] = [
  { mode: 'system', label: 'Auto', icon: 'phone' },
  { mode: 'light', label: 'Chiaro', icon: 'sun' },
  { mode: 'dark', label: 'Scuro', icon: 'moon' },
];

function ThemeSettings() {
  const C = useColors();
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
          style={{ flex: 1 }}>
          <View style={[styles.segmentItem, mode === t.mode && styles.segmentSel]}>
            <Icon name={t.icon} size={28} />
            <Text style={[styles.segmentLabel, mode === t.mode && { color: C.onAccent }]}>{t.label}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

function IntroSetting() {
  const C = useColors();
  const styles = useStyles();
  const on = useSettings((s) => s.introEnabled);
  return (
    <Window title="intro.exe" color={C.pink} style={styles.mt}>
      <View style={styles.switchRow}>
        <Icon name="car" size={28} />
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>Animazione all’apertura</Text>
          <Text style={styles.cardText}>La finestra «patente.exe» che si apre, in una variante diversa ogni volta.</Text>
        </View>
        <Switch
          value={on}
          onValueChange={(v) => useSettings.getState().setIntroEnabled(v)}
          trackColor={{ true: C.green, false: C.surfaceAlt }}
          thumbColor={C.white}
          ios_backgroundColor={C.surfaceAlt}
        />
      </View>
    </Window>
  );
}

const pad = (n: number) => String(n).padStart(2, '0');

function ReminderSettings() {
  const C = useColors();
  const styles = useStyles();
  const { reminderEnabled, reminderHour, reminderMinute, setReminder } = useSettings();

  if (!remindersSupported) {
    return (
      <Window title="promemoria.exe" color={C.orange} style={styles.mt}>
        <Text style={styles.cardText}>I promemoria sono disponibili nell’app per iOS e Android.</Text>
      </Window>
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
    <Window title="promemoria.exe" color={C.orange} style={styles.mt}>
      <View style={styles.switchRow}>
        <Icon name="bell" size={28} />
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>Ricordami di studiare</Text>
          <Text style={styles.cardText}>Non arriva se hai già raggiunto l’obiettivo di oggi.</Text>
        </View>
        <Switch
          value={reminderEnabled}
          onValueChange={toggle}
          trackColor={{ true: C.green, false: C.surfaceAlt }}
          thumbColor={C.white}
          ios_backgroundColor={C.surfaceAlt}
        />
      </View>
      {reminderEnabled && (
        <View style={styles.timeRow}>
          <RetroButton title="−" variant="surface" small onPress={() => shift(-30)} style={{ width: 56 }} />
          <View style={styles.timeBox}>
            <Text style={styles.time}>
              {pad(reminderHour)}:{pad(reminderMinute)}
            </Text>
          </View>
          <RetroButton title="+" variant="surface" small onPress={() => shift(30)} style={{ width: 56 }} />
        </View>
      )}
    </Window>
  );
}

function Stat({ icon, value, label, color }: { icon: IconName; value: string | number; label: string; color: string }) {
  const styles = useStyles();
  return (
    <View style={styles.stat}>
      <View style={[styles.statIcon, { backgroundColor: color }]}>
        <Icon name={icon} size={24} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles((C) => ({
  mt: { marginTop: 14 },
  header: { alignItems: 'center', paddingTop: 28, paddingBottom: 8, gap: 4 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 14,
    backgroundColor: C.lilac,
    borderWidth: 3,
    borderColor: C.ink,
    alignItems: 'center',
    justifyContent: 'center',
    ...hardShadow(C, 5),
  },
  avatarText: { fontFamily: F.black, fontSize: 48, color: C.onAccent },
  name: { fontFamily: F.black, fontSize: 26, color: C.text, marginTop: 14 },
  email: { fontFamily: F.mono, fontSize: 13, color: C.muted, textAlign: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardTitle: { fontFamily: F.bold, fontSize: 17, color: C.text, flexShrink: 1 },
  cardText: { fontFamily: F.regular, fontSize: 15, color: C.textLight, lineHeight: 21 },
  section: { fontFamily: F.black, fontSize: 22, color: C.text, marginTop: 30, marginBottom: 0 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 14 },
  stat: {
    ...boxed(C, 3),
    backgroundColor: C.surface,
    flexBasis: '46%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: C.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { fontFamily: F.black, fontSize: 19, color: C.text },
  statLabel: { fontFamily: F.pixel, fontSize: 10, color: C.muted },
  chart: { flexDirection: 'row', justifyContent: 'space-between', height: 180, alignItems: 'flex-end' },
  barCol: { alignItems: 'center', flex: 1, gap: 4, height: '100%' },
  barValue: { fontFamily: F.mono, fontSize: 11, color: C.muted, height: 16 },
  barTrack: {
    flex: 1,
    width: 24,
    justifyContent: 'flex-end',
    backgroundColor: C.surfaceAlt,
    borderWidth: 2,
    borderColor: C.ink,
    borderRadius: 3,
    overflow: 'hidden',
  },
  bar: { width: '100%', borderTopWidth: 2, borderTopColor: C.ink },
  barLabel: { fontFamily: F.pixel, fontSize: 12, color: C.muted, paddingHorizontal: 4 },
  barToday: { color: C.onAccent, backgroundColor: C.yellow, borderWidth: 1.5, borderColor: C.ink },
  goalList: { gap: 10, marginTop: 14 },
  goalRow: {
    ...boxed(C, 3),
    backgroundColor: C.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  goalSel: { backgroundColor: C.lime },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: C.ink, backgroundColor: C.white },
  radioSel: { backgroundColor: C.ink },
  goalLabel: { fontFamily: F.bold, fontSize: 16, color: C.text, flex: 1 },
  goalXp: { fontFamily: F.mono, fontSize: 14, color: C.textLight },
  segment: { flexDirection: 'row', gap: 12, marginTop: 14 },
  segmentItem: { ...boxed(C, 3), backgroundColor: C.surface, alignItems: 'center', gap: 6, paddingVertical: 12 },
  segmentSel: { backgroundColor: C.yellow },
  segmentLabel: { fontFamily: F.pixel, color: C.text, fontSize: 12 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 16 },
  timeBox: {
    backgroundColor: C.ink,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  time: { fontFamily: F.pixel, fontSize: 28, color: C.lime, minWidth: 110, textAlign: 'center' },
}));
