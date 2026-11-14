import { useEffect, useState } from 'react';
import { Animated, Easing, Image, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Icon } from '@/components/Icon';
import { CarModel, carAspect, PerspectiveCar } from '@/components/PerspectiveCar';
import { playSound, stopSound } from '@/lib/sounds';
import { useSettings } from '@/store/settings';
import { F, hardShadow, makeStyles, Palette, useColors } from '@/theme';

/**
 * Animazione d'apertura: una finestra ".exe" in stile vecchio sistema operativo si apre
 * mentre un'auto disegnata in prospettiva sfreccia lungo una strada in diagonale,
 * lasciando nuvole di fumo e stelline. Colore dell'auto, sfondo e finestra cambiano
 * a ogni apertura. Si salta con un tocco.
 */

const DURATION = 3200;
const INK = '#1B1B1F';
const native = Platform.OS !== 'web';
type V = Animated.Value;

interface Variant {
  file: string;
  bar: (c: Palette) => string;
  loading: string;
  /** Mostra un semaforo che diventa verde al posto della barra di caricamento. */
  trafficLight?: boolean;
}

const VARIANTS: Variant[] = [
  { file: 'patente.exe', bar: (c) => c.lilac, loading: 'Caricamento segnali…' },
  { file: 'motore.exe', bar: (c) => c.mint, loading: 'Accensione motore…' },
  { file: 'cinture.exe', bar: (c) => c.yellow, loading: 'Allacciare le cinture…' },
  { file: 'semaforo.exe', bar: (c) => c.pink, loading: 'Attendere il verde…', trafficLight: true },
];

const CAR_COLORS: [string, string][] = [
  ['green', '#3DAA5C'],
  ['blue', '#7FB2F0'],
  ['red', '#F0554A'],
  ['yellow', '#FFC93C'],
  ['lilac', '#A78BFA'],
  ['pink', '#FF7FBF'],
  ['teal', '#2EC4B6'],
  ['orange', '#FF8A3D'],
  ['cream', '#F2E6C9'],
];

const MODELS: CarModel[] = ['boxy', 'bubble'];
const GRAIN = require('../../assets/images/grain.png');

const BACKGROUNDS: [string, string][] = [
  ['pink', '#F6A6DA'],
  ['lilac', '#C9B5FF'],
  ['teal', '#9DEBDC'],
  ['yellow', '#FFE07A'],
  ['blue', '#A9CBFF'],
  ['orange', '#FFB98A'],
  ['green', '#C8EF7A'],
];

const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

const lerp = (t: V, input: number[], output: number[]) =>
  t.interpolate({ inputRange: input, outputRange: output, extrapolate: 'clamp' });

/** Oscilla tra a e b n volte. */
function wave(t: V, n: number, a: number, b: number) {
  const inputRange: number[] = [];
  const outputRange: number[] = [];
  for (let i = 0; i <= n; i++) {
    inputRange.push(i / n);
    outputRange.push(i % 2 ? b : a);
  }
  return t.interpolate({ inputRange, outputRange });
}

/** Dente di sega: va da `from` a `to` e riparte, `cycles` volte. */
function saw(t: V, cycles: number, from: number, to: number) {
  const inputRange: number[] = [];
  const outputRange: number[] = [];
  for (let k = 0; k < cycles; k++) {
    inputRange.push(k / cycles + (k ? 0.0001 : 0), (k + 1) / cycles);
    outputRange.push(from, to);
  }
  return t.interpolate({ inputRange, outputRange });
}

const popIn = (t: V, at: number, len = 0.08) => ({
  opacity: lerp(t, [at, at + 0.02], [0, 1]),
  scale: lerp(t, [at, at + len * 0.6, at + len], [0.3, 1.15, 1]),
});

// Direzione di marcia sullo schermo (verso il basso a sinistra) e normale.
const DIR = { x: -Math.cos(Math.PI / 6), y: Math.sin(Math.PI / 6) };
const NRM = { x: DIR.y, y: -DIR.x }; // verso il basso a destra

const COS30 = Math.cos(Math.PI / 6);
const SIN30 = Math.sin(Math.PI / 6);
const BLOCKS = 12;

export function IntroAnimation({ onDone }: { onDone: () => void }) {
  const C = useColors();
  const styles = useStyles();
  const { width: W, height: H } = useWindowDimensions();
  const [look] = useState(() => {
    // Sul web si può scegliere la variante con ?intro=1..4 (utile per provarle).
    const forced = Platform.OS === 'web' ? Number(new URLSearchParams(globalThis.location?.search).get('intro')) : 0;
    const variant = VARIANTS[forced >= 1 && forced <= VARIANTS.length ? forced - 1 : Math.floor(Math.random() * VARIANTS.length)];
    const q = Platform.OS === 'web' ? new URLSearchParams(globalThis.location?.search) : null;
    const [carName, car] = pick(CAR_COLORS);
    const bg = pick(BACKGROUNDS.filter(([name]) => name !== carName))[1];
    const model = (MODELS as string[]).includes(q?.get('car') ?? '') ? (q!.get('car') as CarModel) : pick(MODELS);
    const freeze = q?.get('freeze') ? Number(q.get('freeze')) : null;
    return { variant, car: q?.get('color') ? `#${q.get('color')}` : car, bg, model, freeze };
  });
  const { variant } = look;
  const [t] = useState(() => new Animated.Value(look.freeze ?? 0));
  const [fade] = useState(() => new Animated.Value(1));
  const [closing, setClosing] = useState<null | 'end' | 'skip'>(null);
  // Sul web il browser blocca l'audio finché non si tocca la pagina: per sentire il jingle
  // si parte con un "PREMI START" (il suono parte dentro il gesto dell'utente).
  const [started, setStarted] = useState(
    () => Platform.OS !== 'web' || look.freeze !== null || !useSettings.getState().soundEnabled,
  );
  const start = () => {
    playSound('jingle');
    setStarted(true);
  };

  useEffect(() => {
    if (look.freeze !== null || !started) return;
    if (Platform.OS !== 'web') playSound('jingle');
    const anim = Animated.timing(t, { toValue: 1, duration: DURATION, easing: Easing.linear, useNativeDriver: native });
    anim.start(({ finished }) => {
      if (finished) setClosing('end');
    });
    return () => anim.stop();
  }, [t, look.freeze, started]);

  useEffect(() => {
    if (!closing) return;
    if (closing === 'skip') stopSound('jingle');
    Animated.timing(fade, { toValue: 0, duration: 300, useNativeDriver: native }).start(() => onDone());
  }, [closing, fade, onDone]);

  /* ---------- Strada ---------- */
  const cx = W * 0.5;
  const cy = H * 0.66;
  const half = Math.min(W, 420) * 0.36; // metà larghezza della strada
  const far = Math.hypot(W, H) * 1.5;
  const at = (s: number, n: number) => ({ x: cx + DIR.x * s + NRM.x * n, y: cy + DIR.y * s + NRM.y * n });
  const quad = (s0: number, s1: number, n0: number, n1: number) => {
    const p = [at(s0, n0), at(s1, n0), at(s1, n1), at(s0, n1)];
    return `M${p.map((q) => `${q.x} ${q.y}`).join(' L')} Z`;
  };
  const roadPath = quad(-far, far, -half, half);
  const curb = quad(-far, far, -half - 10, -half);
  // Striscia gialla "a fulmine": due tratti sfalsati che si sovrappongono.
  const stripeW = half * 0.2;
  const stripe = `${quad(-far, half * 0.35, -stripeW - half * 0.1, stripeW - half * 0.1)} ${quad(-half * 0.35, far, -stripeW + half * 0.25, stripeW + half * 0.25)}`;

  /* ---------- Auto ---------- */
  const cw = Math.min(W * (look.model === 'bubble' ? 0.6 : 0.64), 300);
  const ch = cw * carAspect(look.model);
  const D = Math.hypot(W, H) * 0.75;
  const TS = [0.02, 0.3, 0.6, 0.92];
  const SS = [-D, -cw * 0.08, cw * 0.08, D];
  const s = lerp(t, TS, SS);
  const carX = Animated.add(cx - cw / 2, Animated.multiply(s, DIR.x));
  const carY = Animated.add(cy - ch * 0.62, Animated.multiply(s, DIR.y));
  const bounce = wave(t, 30, 0, -2.5);

  // Linee di velocità ("whoosh") che seguono l'auto, parallele alla strada.
  const whoosh = [
    { n: -0.42, len: 0.8, off: 0.42, w: 3 },
    { n: -0.22, len: 1.2, off: 0.5, w: 3.5 },
    { n: -0.02, len: 0.6, off: 0.58, w: 2.5 },
    { n: 0.18, len: 1.0, off: 0.46, w: 3 },
    { n: 0.36, len: 0.55, off: 0.55, w: 2.5 },
  ];
  const stars = [
    { x: W * 0.12, y: H * 0.5, at: 0.3, c: '#FF7FBF' },
    { x: W * 0.82, y: H * 0.46, at: 0.22, c: '#F0554A' },
    { x: W * 0.7, y: H * 0.86, at: 0.5, c: '#FF7FBF' },
    { x: W * 0.2, y: H * 0.82, at: 0.42, c: '#F0554A' },
    { x: W * 0.55, y: H * 0.5, at: 0.6, c: '#FFFFFF' },
  ];

  /* ---------- Finestra ---------- */
  const winW = Math.min(W - 48, 340);
  const win = popIn(t, 0.02, 0.12);
  const winClose = lerp(t, [0.9, 1], [1, 0.85]);
  const back1 = popIn(t, 0, 0.1);
  const back2 = popIn(t, 0.01, 0.1);
  const done = lerp(t, [0.8, 0.82], [0, 1]);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, { opacity: fade, backgroundColor: look.bg }]}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={() => (started ? setClosing('skip') : start())}
        accessibilityLabel={started ? 'Salta animazione' : 'Avvia'}>
        <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
          <Path d={curb} fill="#A9A49B" stroke={INK} strokeWidth={2} />
          <Path d={roadPath} fill="#D9D5CE" />
          <Path d={stripe} fill="#FFF1A8" />
        </Svg>

        {whoosh.map((l, i) => {
          // segmento dietro all'auto (in alto a destra), lungo la direzione di marcia
          const len = l.len * cw;
          const ax = -DIR.x * cw * l.off + NRM.x * l.n * ch;
          const ay = -DIR.y * cw * l.off + NRM.y * l.n * ch;
          // le linee "sfrecciano" all'indietro e ricompaiono, ognuna con il suo ritmo
          const slide = saw(t, 9 + i, 0, cw * 0.35);
          return (
            <Animated.View
              key={i}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                opacity: lerp(t, [0.04, 0.1, 0.3, 0.36, 0.56, 0.62, 0.86, 0.92], [0, 1, 1, 0.6, 0.6, 1, 1, 0]),
                transform: [
                  { translateX: Animated.add(Animated.add(carX, cw / 2 + ax), Animated.multiply(slide, -DIR.x)) },
                  { translateY: Animated.add(Animated.add(carY, ch * 0.55 + ay), Animated.multiply(slide, -DIR.y)) },
                ],
              }}>
              <Svg width={len * COS30 + 4} height={len * SIN30 + 4} style={{ position: 'absolute', left: -2, top: -len * SIN30 - 2 }}>
                <Path
                  d={`M2 ${len * SIN30 + 2} L${len * COS30 + 2} 2`}
                  stroke={i % 2 ? '#FFFFFF' : INK}
                  strokeWidth={l.w}
                  strokeLinecap="round"
                  strokeDasharray={i === 2 ? '18 10' : undefined}
                />
              </Svg>
            </Animated.View>
          );
        })}

        <Animated.View style={{ position: 'absolute', left: 0, top: 0, transform: [{ translateX: carX }, { translateY: Animated.add(carY, bounce) }] }}>
          <PerspectiveCar model={look.model} color={look.car} width={cw} />
        </Animated.View>

        {stars.map((st, i) => (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: st.x,
              top: st.y,
              opacity: lerp(t, [st.at, st.at + 0.04, st.at + 0.25, st.at + 0.3], [0, 1, 1, 0.2]),
              transform: [{ scale: lerp(t, [st.at, st.at + 0.05], [0.2, 1]) }, { rotate: `${i * 17}deg` }],
            }}>
            <Star color={st.c} />
          </Animated.View>
        ))}

        <View style={[styles.center, { top: H * 0.1 }]}>
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
                <Icon name="car" size={40} />
                <Text style={styles.logo}>PATENTE.B</Text>
              </View>
              {variant.trafficLight ? (
                <TrafficLight t={t} />
              ) : (
                <View style={styles.progress}>
                  {Array.from({ length: BLOCKS }, (_, i) => {
                    const a = 0.18 + (i / BLOCKS) * 0.58;
                    return <Animated.View key={i} style={[styles.block, { opacity: lerp(t, [a, a + 0.015], [0, 1]) }]} />;
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

        <Image source={GRAIN} resizeMode="repeat" style={[StyleSheet.absoluteFill, { width: W, height: H, opacity: 0.9 }]} />

        {!started && (
          <View style={styles.startWrap} pointerEvents="none">
            <View style={styles.startBtn}>
              <Text style={styles.startText}>▶ PREMI START</Text>
            </View>
          </View>
        )}

        {started ? (
          <View style={styles.skip}>
            <Text style={styles.skipText}>TOCCA PER SALTARE</Text>
          </View>
        ) : (
          <Pressable style={styles.skip} onPress={() => setClosing('skip')} hitSlop={10} accessibilityLabel="Salta animazione">
            <Text style={styles.skipText}>SALTA</Text>
          </Pressable>
        )}
      </Pressable>
    </Animated.View>
  );
}

function Star({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="-10 -10 20 20">
      <Path d="M0 -9 L2.4 -3 L9 -2.8 L3.8 1.3 L5.6 7.8 L0 4 L-5.6 7.8 L-3.8 1.3 L-9 -2.8 L-2.4 -3 Z" fill={color} stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />
    </Svg>
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
  root: { zIndex: 100, elevation: 100, overflow: 'hidden' },
  center: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  backWin: {
    position: 'absolute',
    height: 180,
    backgroundColor: C.surface,
    borderWidth: 2,
    borderColor: C.ink,
    borderRadius: 12,
    overflow: 'hidden',
    ...hardShadow(C, 4),
  },
  win: {
    backgroundColor: C.surface,
    borderWidth: 2,
    borderColor: C.ink,
    borderRadius: 12,
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
  body: { padding: 16, gap: 14 },
  logoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  logo: { fontFamily: F.black, fontSize: 30, color: C.text, letterSpacing: -0.5 },
  progress: {
    flexDirection: 'row',
    gap: 3,
    padding: 3,
    height: 24,
    borderWidth: 2,
    borderColor: C.ink,
    borderRadius: 10,
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
  skip: {
    position: 'absolute',
    bottom: 36,
    alignSelf: 'center',
    backgroundColor: C.surface,
    borderWidth: 2,
    borderColor: C.ink,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  skipText: { fontFamily: F.pixel, fontSize: 10, color: C.text },
  startWrap: { position: 'absolute', left: 0, right: 0, top: '42%', alignItems: 'center', gap: 12 },
  startBtn: {
    backgroundColor: C.yellow,
    borderWidth: 3,
    borderColor: C.ink,
    borderRadius: 18,
    paddingHorizontal: 26,
    paddingVertical: 16,
    ...hardShadow(C, 6),
  },
  startText: { fontFamily: F.pixel, fontSize: 22, color: C.onAccent },
}));
