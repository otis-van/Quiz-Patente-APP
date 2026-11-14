import { StyleProp, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MAX_WIDTH, makeStyles } from '@/theme';

/**
 * Barra in fondo allo schermo: lo sfondo e il bordo occupano tutta la larghezza
 * (anche su iPad), mentre il contenuto resta centrato e largo al massimo MAX_WIDTH.
 */
export function FooterBar({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: 16 + insets.bottom }]}>
      <View style={[styles.inner, style]}>{children}</View>
    </View>
  );
}

const useStyles = makeStyles((C) => ({
  bar: { paddingTop: 16, paddingHorizontal: 16, borderTopWidth: 2, borderTopColor: C.ink, backgroundColor: C.surface },
  inner: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center' },
}));
