import { StyleProp, Text, View, ViewStyle } from 'react-native';

import { boxed, F, makeStyles, useColors } from '@/theme';

interface Props {
  title?: string;
  /** Colore della barra del titolo. */
  color?: string;
  /** Colore del corpo della finestra (default: superficie). */
  bodyColor?: string;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  bodyStyle?: StyleProp<ViewStyle>;
  /** Contenuto a destra nella barra (al posto dei pulsanti finestra). */
  right?: React.ReactNode;
}

/** Riquadro in stile finestra di un vecchio sistema operativo. */
export function Window({ title, color, bodyColor, children, style, bodyStyle, right }: Props) {
  const C = useColors();
  const styles = useStyles();
  return (
    <View style={[styles.win, bodyColor ? { backgroundColor: bodyColor } : null, style]}>
      {title !== undefined && (
        <View style={[styles.bar, { backgroundColor: color ?? C.lilac }]}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {right ?? (
            <View style={styles.controls}>
              <View style={styles.ctrl}><View style={styles.min} /></View>
              <View style={styles.ctrl}><View style={styles.max} /></View>
              <View style={styles.ctrl}><Text style={styles.x}>×</Text></View>
            </View>
          )}
        </View>
      )}
      <View style={[styles.body, bodyStyle]}>{children}</View>
    </View>
  );
}

const useStyles = makeStyles((C) => ({
  win: { ...boxed(C), backgroundColor: C.surface, overflow: 'hidden' },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomWidth: 2,
    borderBottomColor: C.ink,
  },
  title: { flex: 1, fontFamily: F.pixel, fontSize: 12, color: C.onAccent, letterSpacing: 0.5 },
  controls: { flexDirection: 'row', gap: 4 },
  ctrl: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    borderColor: C.ink,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  min: { width: 7, height: 2, backgroundColor: C.ink, marginTop: 5 },
  max: { width: 8, height: 7, borderWidth: 1.5, borderColor: C.ink },
  x: { fontFamily: F.bold, fontSize: 13, lineHeight: 14, color: C.ink },
  body: { padding: 14 },
}));
