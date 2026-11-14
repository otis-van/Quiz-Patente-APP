import { useEffect, useState } from 'react';
import { Animated, Easing, Image, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

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

/** Le due auto dell'illustrazione, in più colori: ogni apertura una combinazione diversa. */
const PANDA = {
  verde: require('../../assets/intro/panda-verde.png'),
  rossa: require('../../assets/intro/panda-rossa.png'),
  gialla: require('../../assets/intro/panda-gialla.png'),
  lilla: require('../../assets/intro/panda-lilla.png'),
};
const MINI = {
  azzurra: require('../../assets/intro/mini-azzurra.png'),
  rossa: require('../../assets/intro/mini-rossa.png'),
  gialla: require('../../assets/intro/mini-gialla.png'),
  menta: require('../../assets/intro/mini-menta.png'),
};
const PANDA_ASPECT = 488 / 640;
const MINI_ASPECT = 477 / 640;
const SMOKE = [
  { src: require('../../assets/intro/smoke0.png'), aspect: 289 / 520, tip: { x: 0.01, y: 0.97 } },
  { src: require('../../assets/intro/smoke1.png'), aspect: 265 / 272, tip: { x: 0.015, y: 0.96 } },
];
const GRAIN = require('../../assets/images/grain.png');
const LOGO = require('../../assets/images/logo.png');

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
    const pandaKey = pick(Object.keys(PANDA)) as keyof typeof PANDA;
    const miniKey = pick(Object.keys(MINI).filter((k) => k !== pandaKey)) as keyof typeof MINI;
    const bg = pick(BACKGROUNDS)[1];
    const freeze = q?.get('freeze') ? Number(q.get('freeze')) : null;
    return { variant, panda: PANDA[pandaKey], mini: MINI[miniKey], bg, freeze };
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

  /* ---------- Auto (due, in gara) ---------- */
  const D = Math.hypot(W, H) * 0.8;
  const pw = Math.min(W * 0.56, 270);
  const mw = pw * 0.94;
  const cars = [
    // la Panda sulla corsia più in alto, la Mini su quella più in basso e un po' più indietro
    { key: 'panda', src: look.panda, w: pw, h: pw * PANDA_ASPECT, n: -half * 0.42, TS: [0.02, 0.3, 0.6, 0.9], lag: 0, smoke: SMOKE[0], smokeW: pw * 1.6, rear: { x: 0.93, y: 0.52 } },
    { key: 'mini', src: look.mini, w: mw, h: mw * MINI_ASPECT, n: half * 0.5, TS: [0.06, 0.36, 0.64, 0.96], lag: 0.12, smoke: SMOKE[1], smokeW: mw * 1.0, rear: { x: 0.96, y: 0.34 } },
  ].map((c, i) => {
    const s = lerp(t, c.TS, [-D, -c.w * (0.1 + c.lag), c.w * (0.06 - c.lag), D]);
    const base = at(0, c.n);
    return {
      ...c,
      x: Animated.add(base.x - c.w / 2, Animated.multiply(s, DIR.x)),
      y: Animated.add(base.y - c.h * 0.7, Animated.multiply(s, DIR.y)),
      bounce: wave(t, 28 + i * 4, 0, -2.5),
    };
  });

  // Linee di velocità ("whoosh") che seguono le auto, parallele alla strada.
  const whoosh = [
    { n: -0.36, len: 0.7, off: 0.4, w: 3 },
    { n: -0.12, len: 1.0, off: 0.48, w: 3.5 },
    { n: 0.12, len: 0.55, off: 0.56, w: 2.5 },
    { n: 0.32, len: 0.85, off: 0.44, w: 3 },
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

        {cars.map((car) => (
          <View key={car.key} style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* nuvola di fumo che esce dal retro e si allarga */}
            <Animated.Image
              source={car.smoke.src}
              style={{
                position: 'absolute',
                left: car.rear.x * car.w - car.smoke.tip.x * car.smokeW,
                top: car.rear.y * car.h - car.smoke.tip.y * car.smokeW * car.smoke.aspect,
                width: car.smokeW,
                height: car.smokeW * car.smoke.aspect,
                transformOrigin: `${car.smoke.tip.x * 100}% ${car.smoke.tip.y * 100}%`,
                opacity: lerp(t, [car.TS[0] + 0.06, car.TS[0] + 0.14, car.TS[3] - 0.08, car.TS[3]], [0, 1, 1, 0]),
                transform: [
                  { translateX: car.x },
                  { translateY: car.y },
                  { scale: lerp(t, [car.TS[0] + 0.06, car.TS[1] + 0.05, car.TS[2], car.TS[3]], [0.25, 1, 1.08, 1.25]) },
                ],
              }}
            />
            {whoosh.map((l, i) => {
              const len = l.len * car.w;
              const ax = -DIR.x * car.w * l.off + NRM.x * l.n * car.h;
              const ay = -DIR.y * car.w * l.off + NRM.y * l.n * car.h;
              // le linee "sfrecciano" all'indietro e ricompaiono, ognuna con il suo ritmo
              const slide = saw(t, 9 + i, 0, car.w * 0.35);
              return (
                <Animated.View
                  key={i}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    opacity: lerp(t, [car.TS[0] + 0.02, car.TS[0] + 0.08, car.TS[1], car.TS[1] + 0.06, car.TS[2] - 0.04, car.TS[2] + 0.02, car.TS[3] - 0.06, car.TS[3]], [0, 1, 1, 0.6, 0.6, 1, 1, 0]),
                    transform: [
                      { translateX: Animated.add(Animated.add(car.x, car.w / 2 + ax), Animated.multiply(slide, -DIR.x)) },
                      { translateY: Animated.add(Animated.add(car.y, car.h * 0.6 + ay), Animated.multiply(slide, -DIR.y)) },
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
            <Animated.Image
              source={car.src}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: car.w,
                height: car.h,
                transform: [{ translateX: car.x }, { translateY: Animated.add(car.y, car.bounce) }],
              }}
            />
          </View>
        ))}

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
              <Image source={LOGO} style={{ width: winW - 48, height: (winW - 48) * (307 / 1169), alignSelf: 'center' }} resizeMode="contain" />
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
