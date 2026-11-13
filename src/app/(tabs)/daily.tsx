import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { DuoButton } from '@/components/DuoButton';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { StatsBar } from '@/components/StatsBar';
import { CHAPTERS } from '@/data/chapters';
import { dayKey } from '@/lib/date';
import { DAILY_SIZE } from '@/lib/quiz';
import { mistakeIds, todayXp, useProgress } from '@/store/progress';
import { C, F } from '@/theme';

const EMPTY: number[] = [];

export default function DailyScreen() {
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

  const quests = [
    { icon: '⚡', title: `Guadagna ${goal} XP`, value: xp, target: goal },
    { icon: '📅', title: 'Completa 3 esercizi del giorno', value: doneToday.length, target: 3 },
    { icon: '📝', title: 'Fai una simulazione d’esame', value: examsToday, target: 1 },
  ];

  const dateLabel = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <Screen header={<StatsBar left={<Text style={styles.headerTitle}>Oggi</Text>} />}>
      <Text style={styles.date}>{dateLabel}</Text>

      <Text style={styles.section}>Missioni del giorno</Text>
      <View style={styles.card}>
        {quests.map((q, i) => (
          <View key={q.title} style={[styles.quest, i > 0 && styles.questBorder]}>
            <Text style={styles.questIcon}>{q.icon}</Text>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={styles.questTitle}>{q.title}</Text>
              <View style={styles.questBarRow}>
                <ProgressBar value={q.value / q.target} color={C.yellow} height={14} />
                <Text style={styles.questCount}>
                  {Math.min(q.value, q.target)}/{q.target}
                </Text>
              </View>
            </View>
            <Text style={styles.chest}>{q.value >= q.target ? '🎁' : '📦'}</Text>
          </View>
        ))}
      </View>

      <View style={styles.quickRow}>
        <QuickCard
          emoji="🎯"
          title="Allenamento rapido"
          subtitle="10 domande sui tuoi punti deboli"
          color={C.blue}
          onPress={() => router.push({ pathname: '/quiz', params: { mode: 'practice' } })}
        />
        <QuickCard
          emoji="🔁"
          title="Ripassa errori"
          subtitle={mistakes ? `${mistakes} domande da ripassare` : 'Nessun errore 🎉'}
          color={C.red}
          onPress={() => router.push({ pathname: '/quiz', params: { mode: 'review' } })}
        />
      </View>

      <Text style={styles.section}>Esercizi del giorno per argomento</Text>
      <Text style={styles.hint}>
        Ogni giorno {DAILY_SIZE} domande nuove per ciascuno dei 25 argomenti. Completati oggi: {doneToday.length}/25
      </Text>
      <View style={{ gap: 10 }}>
        {CHAPTERS.map((ch) => {
          const done = doneToday.includes(ch.id);
          return (
            <Pressable
              key={ch.id}
              onPress={() => router.push({ pathname: '/quiz', params: { mode: 'daily', chapter: ch.id } })}
              style={({ pressed }) => [styles.row, done && styles.rowDone, pressed && { opacity: 0.7 }]}>
              <View style={[styles.rowIcon, { backgroundColor: done ? C.yellow : ch.color }]}>
                <Text style={{ fontSize: 22 }}>{ch.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowKicker}>ARGOMENTO {ch.id}</Text>
                <Text style={styles.rowTitle}>{ch.short}</Text>
              </View>
              {done ? <Text style={styles.check}>✓</Text> : <Text style={styles.go}>›</Text>}
            </Pressable>
          );
        })}
      </View>
      <DuoButton
        title="Simulazione d’esame"
        variant="purple"
        style={{ marginTop: 20 }}
        onPress={() => router.push('/exam-session')}
      />
    </Screen>
  );
}

function QuickCard(p: { emoji: string; title: string; subtitle: string; color: string; onPress: () => void }) {
  return (
    <Pressable onPress={p.onPress} style={{ flex: 1 }}>
      {({ pressed }) => (
        <View style={[styles.quick, { borderBottomWidth: pressed ? 2 : 5, marginTop: pressed ? 3 : 0 }]}>
          <Text style={{ fontSize: 30 }}>{p.emoji}</Text>
          <Text style={[styles.quickTitle, { color: p.color }]}>{p.title}</Text>
          <Text style={styles.quickSub}>{p.subtitle}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerTitle: { fontFamily: F.black, fontSize: 20, color: C.text },
  date: { fontFamily: F.bold, color: C.gray, fontSize: 15, marginTop: 16, textTransform: 'capitalize' },
  section: { fontFamily: F.black, fontSize: 21, color: C.text, marginTop: 22, marginBottom: 10 },
  hint: { fontFamily: F.regular, color: C.textLight, fontSize: 14, marginTop: -4, marginBottom: 12 },
  card: { borderWidth: 2, borderColor: C.grayLight, borderRadius: 16 },
  quest: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  questBorder: { borderTopWidth: 2, borderTopColor: C.grayLight },
  questIcon: { fontSize: 30 },
  questTitle: { fontFamily: F.bold, color: C.text, fontSize: 16 },
  questBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  questCount: { fontFamily: F.bold, color: C.gray, fontSize: 13, width: 40, textAlign: 'right' },
  chest: { fontSize: 28 },
  quickRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  quick: { borderWidth: 2, borderColor: C.grayLight, borderRadius: 16, padding: 14, gap: 4, minHeight: 130 },
  quickTitle: { fontFamily: F.black, fontSize: 16 },
  quickSub: { fontFamily: F.regular, color: C.textLight, fontSize: 13 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: C.grayLight,
    borderBottomWidth: 4,
    borderRadius: 16,
    padding: 10,
  },
  rowDone: { backgroundColor: '#FFF9E0', borderColor: '#FFE580' },
  rowIcon: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowKicker: { fontFamily: F.bold, color: C.gray, fontSize: 11, letterSpacing: 0.6 },
  rowTitle: { fontFamily: F.bold, color: C.text, fontSize: 16 },
  check: { fontFamily: F.black, color: C.yellowDark, fontSize: 24, paddingHorizontal: 8 },
  go: { fontFamily: F.black, color: C.gray, fontSize: 28, paddingHorizontal: 8 },
});
