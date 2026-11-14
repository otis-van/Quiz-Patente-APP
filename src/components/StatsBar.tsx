import { Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { Icon, IconName } from '@/components/Icon';
import { streakOf, todayXp, totalXp, useProgress } from '@/store/progress';
import { F, makeStyles } from '@/theme';

/** Barra superiore con serie, XP di oggi e XP totali. */
export function StatsBar({ left }: { left?: React.ReactNode }) {
  const styles = useStyles();
  const { streak, today, total, goal } = useProgress(
    useShallow((s) => ({ streak: streakOf(s), today: todayXp(s), total: totalXp(s), goal: s.dailyGoal })),
  );
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>{left}</View>
      <Stat icon="fire" value={streak} label="giorni di serie" />
      <Stat icon={today >= goal ? 'target' : 'bolt'} value={`${today}/${goal}`} label="XP oggi" />
      <Stat icon="gem" value={total} label="XP totali" />
    </View>
  );
}

function Stat({ icon, value, label, dim }: { icon: IconName; value: string | number; label: string; dim?: boolean }) {
  const styles = useStyles();
  return (
    <View style={styles.stat} accessibilityLabel={`${value} ${label}`}>
      <Icon name={icon} size={20} dim={dim} />
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const useStyles = makeStyles((C) => ({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 12 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  value: { fontFamily: F.black, fontSize: 14, color: C.text },
}));
