import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { Icon, IconName } from '@/components/Icon';
import { ProgressBar } from '@/components/ProgressBar';
import { RetroButton } from '@/components/RetroButton';
import { RoadSign } from '@/components/RoadSign';
import { Screen } from '@/components/Screen';
import { StatsBar } from '@/components/StatsBar';
import { Window } from '@/components/Window';
import { CHAPTERS } from '@/data/chapters';
import { dayKey } from '@/lib/date';
import { DAILY_SIZE } from '@/lib/quiz';
import { mistakeIds, todayXp, useProgress } from '@/store/progress';
import { boxed, F, makeStyles, useColors } from '@/theme';

const EMPTY: number[] = [];

export default function DailyScreen() {
  const C = useColors();
  const styles = useStyles();
  const today = dayKey();
  const { doneToday, xp, goal, examsToday, mistakes } = useProgress(
    useShallow((s) => ({
      doneToday: s.dailyDone[today] ?? EMPTY,
      xp: todayXp(s),
      goal: s.dailyGoal,
      examsToday: s.exams.filter((e) => dayKey(new Date(e.at)) === today).length,
      mistakes: mistakeIds(s).length,
    })),
  );

  const quests: { icon: IconName; title: string; value: number; target: number }[] = [
    { icon: 'bolt', title: `Guadagna ${goal} XP`, value: xp, target: goal },
    { icon: 'calendar', title: 'Completa 3 esercizi del giorno', value: doneToday.length, target: 3 },
    { icon: 'doc', title: 'Fai una simulazione d’esame', value: examsToday, target: 1 },
  ];

  const dateLabel = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <Screen header={<StatsBar left={<Text style={styles.headerTitle}>OGGI</Text>} />}>
      <Text style={styles.date}>{dateLabel}</Text>

      <Window title="missioni_del_giorno.exe" color={C.lilac} style={{ marginTop: 14 }} bodyStyle={{ padding: 0 }}>
        {quests.map((q, i) => (
          <View key={q.title} style={[styles.quest, i > 0 && styles.questBorder]}>
            <Icon name={q.icon} size={30} />
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={styles.questTitle}>{q.title}</Text>
              <View style={styles.questBarRow}>
                <ProgressBar value={q.value / q.target} color={C.yellow} height={16} />
                <Text style={styles.questCount}>
                  {Math.min(q.value, q.target)}/{q.target}
                </Text>
              </View>
            </View>
            <Icon name={q.value >= q.target ? 'gift' : 'box'} size={30} />
          </View>
        ))}
      </Window>

      <View style={styles.quickRow}>
        <QuickCard
          icon="target"
          title="Allenamento rapido"
          subtitle="10 domande sui tuoi punti deboli"
          color={C.blue}
          onPress={() => router.push({ pathname: '/quiz', params: { mode: 'practice' } })}
        />
        <QuickCard
          icon="heart"
          title="Ripassa errori"
          subtitle={mistakes ? `${mistakes} domande da ripassare` : 'Nessun errore, grande!'}
          color={C.pink}
          onPress={() => router.push({ pathname: '/quiz', params: { mode: 'review' } })}
        />
      </View>

      <Pressable onPress={() => router.push('/signs')} style={{ marginTop: 14 }}>
        {({ pressed }) => (
          <View style={[styles.signsCard, pressed && styles.pressed]}>
            <View style={styles.signBox}>
              <RoadSign id="stop" size={40} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.quickTitle}>Dizionario dei segnali</Text>
              <Text style={styles.quickSub}>Tutti i segnali illustrati, divisi per categoria</Text>
            </View>
            <Icon name="chevron" size={20} />
          </View>
        )}
      </Pressable>

      <Text style={styles.section}>Esercizi per argomento</Text>
      <Text style={styles.hint}>
        Ogni giorno {DAILY_SIZE} domande nuove per ciascuno dei 25 argomenti. Completati oggi: {doneToday.length}/25
      </Text>
      <View style={{ gap: 12 }}>
        {CHAPTERS.map((ch) => {
          const done = doneToday.includes(ch.id);
          return (
            <Pressable
              key={ch.id}
              onPress={() => router.push({ pathname: '/quiz', params: { mode: 'daily', chapter: ch.id } })}>
              {({ pressed }) => (
                <View style={[styles.row, done && { backgroundColor: C.yellow }, pressed && styles.pressed]}>
                  <View style={[styles.rowIcon, { backgroundColor: ch.color }]}>
                    <Icon name={ch.icon} size={26} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowKicker, done && { color: C.onAccent }]}>
                      ARGOMENTO {String(ch.id).padStart(2, '0')}
                    </Text>
                    <Text style={[styles.rowTitle, done && { color: C.onAccent }]}>{ch.short}</Text>
                  </View>
                  {done ? <Icon name="check" size={24} /> : <Icon name="chevron" size={20} />}
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
      <RetroButton
        title="Simulazione d’esame"
        variant="lilac"
        icon={<Icon name="doc" size={20} />}
        style={{ marginTop: 22 }}
        onPress={() => router.push('/exam-session')}
      />
    </Screen>
  );
}

function QuickCard(p: { icon: IconName; title: string; subtitle: string; color: string; onPress: () => void }) {
  const styles = useStyles();
  return (
    <Pressable onPress={p.onPress} style={{ flex: 1 }}>
      {({ pressed }) => (
        <View style={[styles.quick, { backgroundColor: p.color }, pressed && styles.pressed]}>
          <Icon name={p.icon} size={34} />
          <Text style={[styles.quickTitle, styles.onAccent]}>{p.title}</Text>
          <Text style={[styles.quickSub, styles.onAccent]}>{p.subtitle}</Text>
        </View>
      )}
    </Pressable>
  );
}

const useStyles = makeStyles((C) => ({
  headerTitle: { fontFamily: F.pixelBold, fontSize: 18, color: C.text },
  date: { fontFamily: F.mono, color: C.textLight, fontSize: 14, marginTop: 18, textTransform: 'capitalize' },
  section: { fontFamily: F.black, fontSize: 22, color: C.text, marginTop: 28, marginBottom: 6 },
  hint: { fontFamily: F.regular, color: C.textLight, fontSize: 14, marginBottom: 14 },
  quest: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  questBorder: { borderTopWidth: 2, borderTopColor: C.ink, borderStyle: 'dashed' },
  questTitle: { fontFamily: F.bold, color: C.text, fontSize: 15 },
  questBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  questCount: { fontFamily: F.black, color: C.text, fontSize: 13, width: 40, textAlign: 'right' },
  quickRow: { flexDirection: 'row', gap: 14, marginTop: 18 },
  quick: { ...boxed(C), padding: 14, gap: 6, minHeight: 140 },
  onAccent: { color: C.onAccent },
  pressed: { transform: [{ translateX: 4 }, { translateY: 4 }], boxShadow: 'none' },
  signsCard: { ...boxed(C), backgroundColor: C.surface, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  signBox: {
    width: 56,
    height: 56,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: C.ink,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTitle: { fontFamily: F.bold, fontSize: 16, color: C.text },
  quickSub: { fontFamily: F.regular, color: C.textLight, fontSize: 13 },
  row: { ...boxed(C, 3), backgroundColor: C.surface, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10 },
  rowIcon: {
    width: 46,
    height: 46,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: C.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowKicker: { fontFamily: F.pixel, color: C.muted, fontSize: 10 },
  rowTitle: { fontFamily: F.bold, color: C.text, fontSize: 16 },
}));
