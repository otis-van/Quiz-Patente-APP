import { useEffect, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { GridBackground } from '@/components/GridBackground';
import { Icon, IconName } from '@/components/Icon';
import { F, hardShadow, makeStyles, Palette, useColors } from '@/theme';

/**
 * Animazione d'apertura in stile "vecchio sistema operativo", coerente con l'interfaccia:
 * si apre una finestra .exe con barra di caricamento, compaiono degli sticker e
 * un'auto attraversa lo schermo. Ogni volta una variante diversa; si salta con un tocco.
 */

const DURATION = 3000;
const native = Platform.OS !== 'web';
type V = Animated.Value;

interface Variant {
  file: string;
  bar: (c: Palette) => string;
  loading: string;
  stickers: IconName[];
  /** La variante "semaforo" mostra un semaforo che diventa verde al posto della barra. */
  trafficLight?: boolean;
}

const VARIANTS: Variant[] = [
  { file: 'patente.exe', bar: (c) => c.lilac, loading: 'Caricamento segnali…', stickers: ['star', 'sparkle', 'heart', 'bolt'] },
  { file: 'motore.exe', bar: (c) => c.mint, loading: 'Accensione motore…', stickers: ['fire', 'bolt', 'sparkle', 'wheel'] },
  { file: 'cinture.exe', bar: (c) => c.yellow, loading: 'Allacciare le cinture…', stickers: ['shield', 'star', 'heart', 'sparkle'] },
  { file: 'semaforo.exe', bar: (c) => c.pink, loading: 'Attendere il verde…', stickers: ['sparkle', 'star', 'bolt', 'heart'], trafficLight: true },
];

const lerp = (t: V, input: number[], output: number[]) =>
  t.interpolate({ inputRange: input, outputRange: output, extrapolate: 'clamp' });

/** Oscilla tra a e b n volte (sobbalzi). */
function wave(t: V, n: number, a: number, b: number) {
  const inputRange: number[] = [];
  const outputRange: number[] = [];
  for (let i = 0; i <= n; i++) {
    inputRange.push(i / n);
    outputRange.push(i % 2 ? b : a);
  }
  return t.interpolate({ inputRange, outputRange });
}

/** Comparsa "a molla" di uno sticker o di una finestra all'istante `at`. */
const popIn = (t: V, at: number, len = 0.08) => ({
  opacity: lerp(t, [at, at + 0.02], [0, 1]),
  scale: lerp(t, [at, at + len * 0.6, at + len], [0.3, 1.15, 1]),
});

const BLOCKS = 12;

export function IntroAnimation({ onDone }: { onDone: () => void }) {
  const C = useColors();
  const styles = useStyles();
  const { width: W, height: H } = useWindowDimensions();
  const [variant] = useState(() => {
    // Sul web si può scegliere la variante con ?intro=1..4 (utile per provarle).
    const forced = Platform.OS === 'web' ? Number(new URLSearchParams(globalThis.location?.search).get('intro')) : 0;
    return VARIANTS[forced >= 1 && forced <= VARIANTS.length ? forced - 1 : Math.floor(Math.random() * VARIANTS.length)];
  });
  const [t] = useState(() => new Animated.Value(0));
  const [fade] = useState(() => new Animated.Value(1));
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const anim = Animated.timing(t, { toValue: 1, duration: DURATION, easing: Easing.linear, useNativeDriver: native });
    anim.start(({ finished }) => {
      if (finished) setClosing(true);
    });
    return () => anim.stop();
  }, [t]);

  useEffect(() => {
    if (!closing) return;
    Animated.timing(fade, { toValue: 0, duration: 300, useNativeDriver: native }).start(() => onDone());
  }, [closing, fade, onDone]);

  const winW = Math.min(W - 48, 340);
  const win = popIn(t, 0.02, 0.12);
  const winClose = lerp(t, [0.9, 1], [1, 0.85]);
  const back1 = popIn(t, 0, 0.1);
  const back2 = popIn(t, 0.01, 0.1);

  // Auto che attraversa lo schermo sotto la finestra.
  const carSize = 96;
  const carX = lerp(t, [0.3, 0.92], [-carSize - 20, W + 20]);
  const carBounce = wave(t, 24, 0, -3);
  const dust = lerp(t, [0.3, 0.92], [-carSize - 60, W - 40]);

  // Sticker sparsi intorno alla finestra.
  const spots = [
    { x: W * 0.08, y: H * 0.14, r: '-12deg', at: 0.16 },
    { x: W * 0.78, y: H * 0.12, r: '10deg', at: 0.24 },
    { x: W * 0.84, y: H * 0.6, r: '-8deg', at: 0.32 },
    { x: W * 0.06, y: H * 0.62, r: '14deg', at: 0.4 },
  ];

  const done = lerp(t, [0.8, 0.82], [0, 1]);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, { opacity: fade }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={() => setClosing(true)} accessibilityLabel="Salta animazione">
        <GridBackground />

        {variant.stickers.map((name, i) => {
          const s = spots[i];
          const p = popIn(t, s.at);
          return (
            <Animated.View
              key={i}
              style={{ position: 'absolute', left: s.x, top: s.y, opacity: p.opacity, transform: [{ scale: p.scale }, { rotate: s.r }] }}>
              <Icon name={name} size={50} />
            </Animated.View>
          );
        })}

        <View style={[styles.center, { top: H * 0.26 }]}>
          {/* finestre "impilate" dietro, come una pila di errori di sistema */}
          <Animated.View
            style={[styles.backWin, { width: winW, opacity: back1.opacity, transform: [{ translateX: 16 }, { translateY: -16 }, { scale: back1.scale }] }]}>
            <View style={[styles.bar, { backgroundColor: C.blue }]} />
          </Animated.View>
          <Animated.View
            style={[styles.backWin, { width: winW, opacity: back2.opacity, transform: [{ translateX: 8 }, { translateY: -8 }, { scale: back2.scale }] }]}>
            <View style={[styles.bar, { backgroundColor: C.orange }]} />
          </Animated.View>

          <Animated.View style={[styles.win, { width: winW, opacity: win.opacity, transform: [{ scale: Animated.multiply(win.scale, winClose) }] }]}>
            <View style={[styles.bar, styles.barRow, { backgroundColor: variant.bar(C) }]}>
              <Text style={styles.barTitle}>{variant.file}</Text>
              <View style={styles.controls}>
                <View style={styles.ctrl}><View style={styles.min} /></View>
                <View style={styles.ctrl}><View style={styles.max} /></View>
                <View style={styles.ctrl}><Text style={styles.x}>×</Text></View>
              </View>
            </View>
            <View style={styles.body}>
              <View style={styles.logoRow}>
                <Icon name="car" size={44} />
                <Text style={styles.logo}>PATENTE.B</Text>
              </View>

              {variant.trafficLight ? (
                <TrafficLight t={t} />
              ) : (
                <View style={styles.progress}>
                  {Array.from({ length: BLOCKS }, (_, i) => {
                    const at = 0.18 + (i / BLOCKS) * 0.58;
                    return <Animated.View key={i} style={[styles.block, { opacity: lerp(t, [at, at + 0.015], [0, 1]) }]} />;
                  })}
                </View>
              )}

              <View>
                <Animated.Text style={[styles.loading, { opacity: Animated.subtract(1, done) }]}>{variant.loading}</Animated.Text>
                <Animated.Text style={[styles.loading, styles.ready, { opacity: done }]}>Pronto! Si parte.</Animated.Text>
              </View>
            </View>
          </Animated.View>
        </View>

        {/* strada + auto */}
        <View style={[styles.road, { top: H * 0.78 }]} />
        <Animated.View style={{ position: 'absolute', top: H * 0.78 - 34, transform: [{ translateX: dust }] }}>
          <Icon name="cloud" size={34} />
        </Animated.View>
        <Animated.View
          style={{ position: 'absolute', top: H * 0.78 - carSize * 0.78, transform: [{ translateX: carX }, { translateY: carBounce }] }}>
          <Icon name="car" size={carSize} />
        </Animated.View>

        <View style={styles.skip}>
          <Text style={styles.skipText}>TOCCA PER SALTARE</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

/** Semaforo che passa da rosso a giallo a verde. */
function TrafficLight({ t }: { t: V }) {
  const C = useColors();
  const styles = useStyles();
  const lights = [
    { color: C.red, on: lerp(t, [0.15, 0.17, 0.4, 0.42], [0.2, 1, 1, 0.2]) },
    { color: C.yellow, on: lerp(t, [0.4, 0.42, 0.62, 0.64], [0.2, 1, 1, 0.2]) },
    { color: C.green, on: lerp(t, [0.62, 0.64], [0.2, 1]) },
  ];
  return (
    <View style={styles.tl}>
      {lights.map((l, i) => (
        <Animated.View key={i} style={[styles.tlLight, { backgroundColor: l.color, opacity: l.on }]} />
      ))}
    </View>
  );
}

const useStyles = makeStyles((C) => ({
  root: { zIndex: 100, elevation: 100, overflow: 'hidden', backgroundColor: C.bg },
  center: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  backWin: {
    position: 'absolute',
    height: 200,
    backgroundColor: C.surface,
    borderWidth: 2,
    borderColor: C.ink,
    borderRadius: 6,
    overflow: 'hidden',
    ...hardShadow(C, 4),
  },
  win: {
    backgroundColor: C.surface,
    borderWidth: 2,
    borderColor: C.ink,
    borderRadius: 6,
    overflow: 'hidden',
    ...hardShadow(C, 6),
  },
  bar: { height: 30, borderBottomWidth: 2, borderBottomColor: C.ink },
  barRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, gap: 8 },
  barTitle: { flex: 1, fontFamily: F.pixel, fontSize: 12, color: C.onAccent },
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
  body: { padding: 18, gap: 16 },
  logoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  logo: { fontFamily: F.black, fontSize: 32, color: C.text, letterSpacing: -0.5 },
  progress: {
    flexDirection: 'row',
    gap: 3,
    padding: 3,
    height: 26,
    borderWidth: 2,
    borderColor: C.ink,
    borderRadius: 4,
    backgroundColor: C.bg,
  },
  block: { flex: 1, backgroundColor: C.blue, borderRadius: 1 },
  loading: { fontFamily: F.mono, fontSize: 14, color: C.textLight, textAlign: 'center' },
  ready: { position: 'absolute', left: 0, right: 0, color: C.text, fontFamily: F.black },
  tl: {
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 10,
    padding: 8,
    borderWidth: 2,
    borderColor: C.ink,
    borderRadius: 20,
    backgroundColor: '#5E5E66',
    ...hardShadow(C, 3),
  },
  tlLight: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: C.ink },
  road: { position: 'absolute', left: 0, right: 0, height: 3, backgroundColor: C.ink },
  skip: {
    position: 'absolute',
    bottom: 36,
    alignSelf: 'center',
    backgroundColor: C.surface,
    borderWidth: 2,
    borderColor: C.ink,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  skipText: { fontFamily: F.pixel, fontSize: 10, color: C.text },
}));
