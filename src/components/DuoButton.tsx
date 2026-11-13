import { Pressable, StyleProp, Text, View, ViewStyle } from 'react-native';

import { haptic } from '@/lib/haptics';
import { F, makeStyles, Palette, useColors } from '@/theme';

type Variant = 'green' | 'blue' | 'red' | 'yellow' | 'purple' | 'white' | 'ghost';

const variants = (C: Palette): Record<Variant, { bg: string; edge: string; fg: string; border?: string }> => ({
  green: { bg: C.green, edge: C.greenDark, fg: C.white },
  blue: { bg: C.blue, edge: C.blueDark, fg: C.white },
  red: { bg: C.red, edge: C.redDark, fg: C.white },
  yellow: { bg: C.yellow, edge: C.yellowDark, fg: C.white },
  purple: { bg: C.purple, edge: C.purpleDark, fg: C.white },
  white: { bg: C.bg, edge: C.grayLight, fg: C.blue, border: C.grayLight },
  ghost: { bg: 'transparent', edge: 'transparent', fg: C.blue },
});

interface Props {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  icon?: React.ReactNode;
  small?: boolean;
}

/** Bottone "3D" con bordo inferiore che si schiaccia alla pressione, come in Duolingo. */
export function DuoButton({ title, onPress, variant = 'green', disabled, style, icon, small }: Props) {
  const C = useColors();
  const styles = useStyles();
  const v = disabled
    ? { bg: C.grayLight, edge: C.grayLight, fg: C.gray, border: undefined }
    : variants(C)[variant];
  const depth = variant === 'ghost' ? 0 : 4;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => {
        haptic('light');
        onPress?.();
      }}
      style={style}>
      {({ pressed }) => (
        <View
          style={[
            styles.base,
            small && styles.small,
            {
              backgroundColor: v.bg,
              borderColor: v.border ?? v.edge,
              borderWidth: v.border ? 2 : 0,
              borderBottomColor: v.edge,
              borderBottomWidth: pressed ? (v.border ? 2 : 0) : depth + (v.border ? 2 : 0),
              marginTop: pressed ? depth : 0,
            },
          ]}>
          {icon}
          <Text style={[styles.text, small && styles.smallText, { color: v.fg }]}>{title.toUpperCase()}</Text>
        </View>
      )}
    </Pressable>
  );
}

const useStyles = makeStyles((C) => ({
  base: {
    minHeight: 50,
    borderRadius: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  small: { minHeight: 40, paddingHorizontal: 14, borderRadius: 12 },
  text: { fontFamily: F.bold, fontSize: 16, letterSpacing: 0.8 },
  smallText: { fontSize: 13 },
}));
