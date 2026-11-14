import { Pressable, StyleProp, Text, View, ViewStyle } from 'react-native';

import { haptic } from '@/lib/haptics';
import { playSound } from '@/lib/sounds';
import { F, hardShadow, makeStyles, Palette, RADIUS, useColors } from '@/theme';

export type Variant = 'yellow' | 'lime' | 'lilac' | 'blue' | 'pink' | 'mint' | 'green' | 'red' | 'surface' | 'ghost';

const fill = (C: Palette, v: Variant) => (v === 'surface' ? C.surface : v === 'ghost' ? 'transparent' : C[v]);

interface Props {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  icon?: React.ReactNode;
  small?: boolean;
}

/** Bottone neo-brutalista: contorno nero e ombra netta che sparisce alla pressione. */
export function RetroButton({ title, onPress, variant = 'yellow', disabled, style, icon, small }: Props) {
  const C = useColors();
  const styles = useStyles();
  const ghost = variant === 'ghost';
  const shadow = small ? 3 : 4;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title || undefined}
      disabled={disabled}
      onPress={() => {
        haptic('light');
        playSound('tap');
        onPress?.();
      }}
      style={style}>
      {({ pressed }) => (
        <View
          style={[
            styles.base,
            small && styles.small,
            ghost
              ? styles.ghost
              : disabled
                ? styles.disabled
                : [
                    { backgroundColor: fill(C, variant) },
                    pressed ? { transform: [{ translateX: shadow }, { translateY: shadow }] } : hardShadow(C, shadow),
                  ],
          ]}>
          {icon}
          {!!title && <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[
              styles.text,
              small && styles.smallText,
              { color: ghost ? C.text : disabled ? C.muted : variant === 'surface' ? C.text : C.onAccent },
            ]}>
            {title.toUpperCase()}
          </Text>}
        </View>
      )}
    </Pressable>
  );
}

const useStyles = makeStyles((C) => ({
  base: {
    minHeight: 52,
    borderRadius: RADIUS,
    borderWidth: 2,
    borderColor: C.ink,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  small: { minHeight: 40, paddingHorizontal: 12 },
  ghost: { borderColor: 'transparent', backgroundColor: 'transparent' },
  disabled: { backgroundColor: C.surfaceAlt, borderColor: C.muted, borderStyle: 'dashed' },
  text: { fontFamily: F.pixel, fontSize: 16, flexShrink: 1 },
  smallText: { fontSize: 13 },
}));
