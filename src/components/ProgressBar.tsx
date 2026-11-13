import { View } from 'react-native';

import { makeStyles, useColors } from '@/theme';

export function ProgressBar({ value, color, height = 16 }: { value: number; color?: string; height?: number }) {
  const C = useColors();
  const styles = useStyles();
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      {pct > 0 && (
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color ?? C.green, borderRadius: height / 2 }]}>
          <View style={[styles.shine, { top: height * 0.22, height: Math.max(3, height * 0.22) }]} />
        </View>
      )}
    </View>
  );
}

const useStyles = makeStyles((C) => ({
  track: { backgroundColor: C.grayLight, overflow: 'hidden', flex: 1 },
  fill: { height: '100%', minWidth: 16 },
  shine: { position: 'absolute', left: 8, right: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)' },
}));
