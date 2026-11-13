import { ScrollView, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MAX_WIDTH, makeStyles } from '@/theme';

interface Props {
  children: React.ReactNode;
  header?: React.ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
}

/** Contenitore standard: area sicura, larghezza massima (tablet/web) e scroll opzionale. */
export function Screen({ children, header, scroll = true, contentStyle }: Props) {
  const styles = useStyles();
  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      {header && <View style={styles.headerWrap}><View style={styles.inner}>{header}</View></View>}
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={[styles.inner, styles.pad, contentStyle]}>{children}</View>
        </ScrollView>
      ) : (
        <View style={[styles.inner, styles.pad, { flex: 1 }, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const useStyles = makeStyles((C) => ({
  root: { flex: 1, backgroundColor: C.bg },
  headerWrap: { borderBottomWidth: 2, borderBottomColor: C.grayLight, backgroundColor: C.bg },
  scroll: { flexGrow: 1, paddingBottom: 32 },
  inner: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center' },
  pad: { paddingHorizontal: 16 },
}));
