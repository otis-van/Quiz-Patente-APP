import { StyleSheet, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { streakOf, todayXp, totalXp, useProgress } from '@/store/progress';
import { C, F } from '@/theme';

/** Barra superiore con serie, XP di oggi e XP totali. */
export function StatsBar({ left }: { left?: React.ReactNode }) {
  const { streak, today, total, goal } = useProgress(
    useShallow((s) => ({ streak: streakOf(s), today: todayXp(s), total: totalXp(s), goal: s.dailyGoal })),
  );
  const goalReached = today >= goal;
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>{left}</View>
      <Stat icon="🔥" value={streak} color={streak > 0 ? C.orange : C.gray} label="giorni di serie" />
      <Stat icon={goalReached ? '🎯' : '⚡'} value={`${today}/${goal}`} color={goalReached ? C.green : C.yellowDark} label="XP oggi" />
      <Stat icon="💎" value={total} color={C.blue} label="XP totali" />
    </View>
  );
}

function Stat({ icon, value, color, label }: { icon: string; value: string | number; color: string; label: string }) {
  return (
    <View style={styles.stat} accessibilityLabel={`${value} ${label}`}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 14 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  icon: { fontSize: 20 },
  value: { fontFamily: F.bold, fontSize: 16 },
});
