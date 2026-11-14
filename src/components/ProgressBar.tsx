import { View } from 'react-native';

import { makeStyles, useColors } from '@/theme';

/** Barra "di caricamento" a blocchi, come nei vecchi sistemi operativi. */
export function ProgressBar({ value, color, height = 18 }: { value: number; color?: string; height?: number }) {
  const C = useColors();
  const styles = useStyles();
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View style={[styles.track, { height }]}>
      {pct > 0 && (
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color ?? C.lime }]}>
          <View style={styles.shine} />
        </View>
      )}
    </View>
  );
}

const useStyles = makeStyles((C) => ({
  track: {
    flex: 1,
    backgroundColor: C.surface,
    borderWidth: 2,
    borderColor: C.ink,
    borderRadius: 4,
    padding: 2,
    overflow: 'hidden',
  },
  fill: { height: '100%', minWidth: 6, borderRadius: 1, overflow: 'hidden' },
  shine: { position: 'absolute', left: 3, right: 3, top: 2, height: 2, backgroundColor: 'rgba(255,255,255,0.55)' },
}));
