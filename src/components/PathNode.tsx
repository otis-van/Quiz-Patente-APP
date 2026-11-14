import { Pressable, Text, View } from 'react-native';

import { Icon, IconName } from '@/components/Icon';
import { haptic } from '@/lib/haptics';
import { playSound } from '@/lib/sounds';
import { F, hardShadow, makeStyles, useColors } from '@/theme';

export type NodeState = 'done' | 'current' | 'locked';

interface Props {
  state: NodeState;
  color: string;
  icon: IconName;
  offset: number;
  onPress: () => void;
  label?: string;
}

/** Tasto del percorso, in stile icona del desktop, con etichetta "INIZIA" sul nodo attivo. */
export function PathNode({ state, color, icon, offset, onPress, label }: Props) {
  const C = useColors();
  const styles = useStyles();
  const bg = state === 'locked' ? C.surfaceAlt : state === 'done' ? C.yellow : color;
  return (
    <View style={[styles.wrap, { transform: [{ translateX: offset }] }]}>
      {state === 'current' && (
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>{label ?? 'INIZIA'}</Text>
          <View style={styles.bubbleArrow} />
        </View>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => {
          haptic('light');
          playSound('tap');
          onPress();
        }}>
        {({ pressed }) => (
          <View
            style={[
              styles.node,
              { backgroundColor: bg },
              state === 'locked' && styles.locked,
              state !== 'locked' && (pressed ? { transform: [{ translateX: 5 }, { translateY: 5 }] } : hardShadow(C, 5)),
            ]}>
            <Icon name={icon} size={36} dim={state === 'locked'} />
          </View>
        )}
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles((C) => ({
  wrap: { alignItems: 'center', marginVertical: 10 },
  node: {
    width: 72,
    height: 72,
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: C.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locked: { borderStyle: 'dashed', borderColor: C.muted },
  bubble: {
    backgroundColor: C.surface,
    borderWidth: 2,
    borderColor: C.ink,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
    alignItems: 'center',
    ...hardShadow(C, 3),
  },
  bubbleText: { fontFamily: F.pixel, fontSize: 12, color: C.text },
  bubbleArrow: {
    position: 'absolute',
    bottom: -7,
    width: 12,
    height: 12,
    backgroundColor: C.surface,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: C.ink,
    transform: [{ rotate: '45deg' }],
  },
}));
