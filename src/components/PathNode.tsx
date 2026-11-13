import { Pressable, Text, View } from 'react-native';

import { haptic } from '@/lib/haptics';
import { F, makeStyles, useColors } from '@/theme';

export type NodeState = 'done' | 'current' | 'locked';

interface Props {
  state: NodeState;
  color: string;
  colorDark: string;
  icon: string;
  offset: number;
  onPress: () => void;
  label?: string;
}

/** Nodo circolare del percorso, con bordo 3D e fumetto "INIZIA" sul nodo attivo. */
export function PathNode({ state, color, colorDark, icon, offset, onPress, label }: Props) {
  const C = useColors();
  const styles = useStyles();
  const bg = state === 'locked' ? C.grayLight : state === 'done' ? C.yellow : color;
  const edge = state === 'locked' ? C.lockedEdge : state === 'done' ? C.yellowDark : colorDark;
  return (
    <View style={[styles.wrap, { transform: [{ translateX: offset }] }]}>
      {state === 'current' && (
        <View style={styles.bubble}>
          <Text style={[styles.bubbleText, { color }]}>{label ?? 'INIZIA'}</Text>
          <View style={styles.bubbleArrow} />
        </View>
      )}
      <View style={[styles.ring, state === 'current' && { borderColor: C.grayLight }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          onPress={() => {
            haptic('light');
            onPress();
          }}>
          {({ pressed }) => (
            <View
              style={[
                styles.node,
                {
                  backgroundColor: bg,
                  borderBottomColor: edge,
                  borderBottomWidth: pressed ? 0 : 8,
                  marginTop: pressed ? 8 : 0,
                },
              ]}>
              <Text style={[styles.icon, state === 'locked' && { opacity: 0.4 }]}>{icon}</Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const useStyles = makeStyles((C) => ({
  wrap: { alignItems: 'center', marginVertical: 6 },
  ring: { padding: 6, borderRadius: 50, borderWidth: 6, borderColor: 'transparent' },
  node: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 30, color: C.white, fontFamily: F.black },
  bubble: {
    backgroundColor: C.bg,
    borderWidth: 2,
    borderColor: C.grayLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 4,
    alignItems: 'center',
  },
  bubbleText: { fontFamily: F.bold, fontSize: 14, letterSpacing: 0.5 },
  bubbleArrow: {
    position: 'absolute',
    bottom: -8,
    width: 14,
    height: 14,
    backgroundColor: C.bg,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: C.grayLight,
    transform: [{ rotate: '45deg' }],
  },
}));
