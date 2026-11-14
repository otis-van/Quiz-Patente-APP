import { useEffect, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { F } from '@/theme';

/**
 * Animazione d'apertura: ogni volta una scena diversa con un'auto in stile
 * illustrazione flat con contorni neri (coerente con lo stile Y2K dell'app).
 * Si chiude da sola dopo ~3 secondi oppure con un tocco.
 */

const DURATION = 2900;
const INK = '#1B1B1F';
const CREAM = '#FFF3DC';
const native = Platform.OS !== 'web';

type V = Animated.Value;
type SceneProps = { t: V; W: number; H: number };

/* ---------- Funzioni di supporto per le interpolazioni ---------- */

/** Oscilla tra a e b n volte (sobbalzi, lampeggi). */
function wave(t: V, n: number, a: number, b: number) {
  const inputRange: number[] = [];
  const outputRange: number[] = [];
  for (let i = 0; i <= n; i++) {
    inputRange.push(i / n);
    outputRange.push(i % 2 ? b : a);
  }
  return t.interpolate({ inputRange, outputRange });
}

/** Dente di sega: va da `from` a `to` e riparte, `cycles` volte (strisce che scorrono). */
function saw(t: V, cycles: number, from: number, to: number) {
  const inputRange: number[] = [];
  const outputRange: number[] = [];
  for (let k = 0; k < cycles; k++) {
    inputRange.push(k / cycles + (k ? 0.0001 : 0), (k + 1) / cycles);
    outputRange.push(from, to);
  }
  return t.interpolate({ inputRange, outputRange });
}

const lerp = (t: V, input: number[], output: number[]) =>
  t.interpolate({ inputRange: input, outputRange: output, extrapolate: 'clamp' });

/* ---------- Disegni delle auto (rivolte verso destra) ---------- */

function Wheel({ cx, cy, r, tire = INK, hub = CREAM }: { cx: number; cy: number; r: number; tire?: string; hub?: string }) {
  return (
    <>
      <Circle cx={cx} cy={cy} r={r} fill={tire} stroke={INK} strokeWidth={3} />
      <Circle cx={cx} cy={cy} r={r * 0.45} fill={hub} stroke={INK} strokeWidth={2.5} />
    </>
  );
}

function Van({ width }: { width: number }) {
  return (
    <Svg width={width} height={width * 0.5} viewBox="0 0 240 120">
      <Ellipse cx={120} cy={112} rx={108} ry={6} fill={INK} opacity={0.25} />
      <Path
        d="M14 92 L14 46 Q16 22 44 20 L176 20 Q192 20 202 36 L222 66 Q228 74 226 92 Z"
        fill="#3FB868"
        stroke={INK}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <Rect x={14} y={64} width={212} height={7} fill={CREAM} stroke={INK} strokeWidth={2} />
      <Rect x={28} y={30} width={44} height={26} rx={3} fill={CREAM} stroke={INK} strokeWidth={2.5} />
      <Rect x={80} y={30} width={44} height={26} rx={3} fill={CREAM} stroke={INK} strokeWidth={2.5} />
      <Rect x={132} y={30} width={40} height={26} rx={3} fill={CREAM} stroke={INK} strokeWidth={2.5} />
      <Path d="M180 30 L196 30 Q200 30 204 36 L216 56 L180 56 Z" fill={CREAM} stroke={INK} strokeWidth={2.5} />
      {/* autista */}
      <Path d="M184 38 L188 30 L191 37 L196 29 L198 38 Z" fill="#FF6B3D" stroke={INK} strokeWidth={2} />
      <Circle cx={192} cy={46} r={8} fill="#FFA866" stroke={INK} strokeWidth={2} />
      <Circle cx={195} cy={45} r={1.4} fill={INK} />
      <Path d="M150 74 L150 90" stroke={INK} strokeWidth={2} />
      <Rect x={212} y={74} width={13} height={8} rx={2} fill="#FFD54A" stroke={INK} strokeWidth={2} />
      <Rect x={8} y={86} width={224} height={8} rx={3} fill={INK} />
      <Wheel cx={62} cy={94} r={17} />
      <Wheel cx={184} cy={94} r={17} />
    </Svg>
  );
}

function SportsCar({ width }: { width: number }) {
  return (
    <Svg width={width} height={width * (100 / 240)} viewBox="0 0 240 100">
      <Ellipse cx={120} cy={92} rx={108} ry={5} fill="#000" opacity={0.3} />
      <Path d="M6 40 L36 40 L36 46 L6 46 Z" fill="#5FE0C1" stroke={INK} strokeWidth={2.5} />
      <Path d="M20 46 L24 56" stroke={INK} strokeWidth={3} />
      <Path
        d="M10 74 L14 56 Q20 48 40 46 L80 44 Q100 26 130 24 L160 26 Q178 30 196 44 L226 52 Q234 56 232 74 Z"
        fill="#5FE0C1"
        stroke={INK}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <Path d="M92 44 Q108 30 130 30 L156 32 Q168 36 180 44 Z" fill="#2D2A6E" stroke={INK} strokeWidth={2.5} />
      <Path d="M30 62 L212 62" stroke={INK} strokeWidth={2} />
      <Path d="M214 55 L229 58 L227 64 L212 61 Z" fill="#FFFFFF" stroke={INK} strokeWidth={2} />
      <Wheel cx={58} cy={76} r={15} hub="#CFC8BC" />
      <Wheel cx={192} cy={76} r={15} hub="#CFC8BC" />
    </Svg>
  );
}

function Convertible({ width }: { width: number }) {
  return (
    <Svg width={width} height={width * 0.5} viewBox="0 0 240 120">
      <Ellipse cx={122} cy={113} rx={106} ry={5} fill={INK} opacity={0.2} />
      {/* autista con occhiali da sole */}
      <Path d="M114 56 Q116 42 128 42 Q142 42 142 56 Z" fill="#7EDC82" stroke={INK} strokeWidth={2.5} />
      <Circle cx={128} cy={32} r={10} fill="#FFA866" stroke={INK} strokeWidth={2.5} />
      <Path d="M117 30 Q118 18 130 19 Q142 20 139 30 Q132 24 117 30 Z" fill={INK} />
      <Rect x={126} y={29} width={13} height={5} rx={2} fill={INK} />
      <Path d="M140 50 Q146 40 154 48" stroke="#FF6B6B" strokeWidth={4} fill="none" strokeLinecap="round" />
      <Path d="M150 54 L162 26 L168 28 L158 56 Z" fill="#8DB9FF" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      <Path
        d="M12 94 L12 72 Q14 58 30 56 L104 54 L160 54 Q166 54 172 58 L206 62 Q228 66 230 82 L230 94 Z"
        fill="#FFD54A"
        stroke={INK}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <Path d="M28 74 Q120 66 210 72" stroke="#FF6B6B" strokeWidth={4} fill="none" strokeLinecap="round" />
      <Circle cx={220} cy={74} r={6} fill="#FFA866" stroke={INK} strokeWidth={2} />
      <Rect x={196} y={86} width={40} height={7} rx={3} fill="#8DB9FF" stroke={INK} strokeWidth={2} />
      <Path d="M160 60 L160 86" stroke={INK} strokeWidth={2} />
      <Wheel cx={62} cy={96} r={17} tire="#2D2A6E" hub="#CFC8BC" />
      <Wheel cx={184} cy={96} r={17} tire="#2D2A6E" hub="#CFC8BC" />
    </Svg>
  );
}

function Puff({ size, color = CREAM }: { size: number; color?: string }) {
  return (
    <Svg width={size} height={size * 0.7} viewBox="0 0 60 42">
      <Path
        d="M10 38 Q0 38 2 28 Q4 20 12 21 Q12 8 26 8 Q36 2 44 12 Q58 12 57 26 Q60 38 48 38 Z"
        fill={color}
        stroke={INK}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function Sparkle({ size, color = '#FFD54A' }: { size: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="-10 -10 20 20">
      <Path d="M0 -9 L2.2 -2.2 L9 0 L2.2 2.2 L0 9 L-2.2 2.2 L-9 0 L-2.2 -2.2 Z" fill={color} stroke={INK} strokeWidth={1.4} />
    </Svg>
  );
}

/* ---------- Titolo comune ---------- */

function Title({ t, top, color = INK, sub }: { t: V; top: number; color?: string; sub: string }) {
  const scale = lerp(t, [0.18, 0.28, 0.33], [0.3, 1.12, 1]);
  const opacity = lerp(t, [0.18, 0.24], [0, 1]);
  return (
    <Animated.View style={[styles.title, { top, opacity, transform: [{ scale }, { rotate: '-3deg' }] }]}>
      <Text style={[styles.titleText, { color }]}>PATENTE.B</Text>
      <Text style={[styles.sub, { color }]}>{sub}</Text>
    </Animated.View>
  );
}

/* ---------- Scene ---------- */

/** 1 · Furgoncino verde che attraversa una strada su sfondo giallo. */
function VanScene({ t, W, H }: SceneProps) {
  const cw = Math.min(W * 0.7, 340);
  const roadY = H * 0.64;
  // Entra, rallenta sotto il titolo e riparte.
  const mid = (W - cw) / 2;
  const x = lerp(t, [0, 0.32, 0.62, 0.92], [-cw - 60, mid - 14, mid + 14, W + 60]);
  const bounce = wave(t, 18, 0, -3);
  const dashes = saw(t, 4, 0, -80);
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#FFD54A' }]}>
      <Title t={t} top={H * 0.16} sub="SI PARTE!" />
      <View style={[styles.road, { top: roadY, height: 74 }]}>
        <Animated.View style={[styles.dashRow, { transform: [{ translateX: dashes }] }]}>
          {Array.from({ length: Math.ceil(W / 80) + 3 }, (_, i) => (
            <View key={i} style={styles.dash} />
          ))}
        </Animated.View>
      </View>
      <Animated.View
        style={{ position: 'absolute', top: roadY - cw * 0.5 + 30, transform: [{ translateX: x }, { translateY: bounce }] }}>
        <Animated.View style={{ position: 'absolute', left: -50, top: cw * 0.28, opacity: wave(t, 10, 1, 0.4) }}>
          <Puff size={56} />
        </Animated.View>
        <Van width={cw} />
      </Animated.View>
    </View>
  );
}

/** 2 · Auto sportiva menta che derapa su una curva corallo, con il fumo. */
function DriftScene({ t, W, H }: SceneProps) {
  const cw = Math.min(W * 0.66, 320);
  const x = lerp(t, [0, 0.45, 1], [W + 40, W * 0.5 - cw * 0.55, W * 0.5 - cw * 0.65]);
  const rot = t.interpolate({ inputRange: [0, 0.45, 0.7, 1], outputRange: ['14deg', '-6deg', '0deg', '0deg'] });
  const puffs = [0, 1, 2, 3];
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#2D2A6E' }]}>
      <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
        <Path d={`M ${-60} ${H * 1.05} Q ${W * 0.15} ${H * 0.42} ${W + 80} ${H * 0.36}`} stroke="#FF6B6B" strokeWidth={170} fill="none" />
        <Path d={`M ${-60} ${H * 1.05} Q ${W * 0.15} ${H * 0.42} ${W + 80} ${H * 0.36}`} stroke="#C9B5FF" strokeWidth={8} strokeDasharray="40 30" fill="none" />
        <Path d={`M ${-80} ${H * 0.82} Q ${W * 0.05} ${H * 0.28} ${W + 80} ${H * 0.2}`} stroke={CREAM} strokeWidth={10} fill="none" />
      </Svg>
      <Title t={t} top={H * 0.08} color={CREAM} sub="SEMAFORO VERDE" />
      <Animated.View
        style={{ position: 'absolute', top: H * 0.52, transform: [{ translateX: x }, { rotate: rot }] }}>
        {puffs.map((i) => {
          const start = 0.08 + i * 0.12;
          return (
            <Animated.View
              key={i}
              style={{
                position: 'absolute',
                left: cw * 0.75 + i * 34,
                top: cw * 0.12 - i * 14,
                opacity: lerp(t, [start, start + 0.05, 0.95, 1], [0, 1, 1, 0.6]),
                transform: [{ scale: lerp(t, [start, start + 0.3], [0.3, 1.5 + i * 0.3]) }],
              }}>
              <Puff size={70} color="#FFFFFF" />
            </Animated.View>
          );
        })}
        <View style={{ transform: [{ scaleX: -1 }] }}>
          <SportsCar width={cw} />
        </View>
      </Animated.View>
    </View>
  );
}

/** 3 · Lo specchietto retrovisore che scende, con la strada che scorre nel riflesso. */
function MirrorScene({ t, W, H }: SceneProps) {
  const mw = Math.min(W * 0.84, 380);
  const mh = mw * 0.34;
  const drop = lerp(t, [0, 0.22, 0.3, 0.36], [-mh - 120, H * 0.36 + 18, H * 0.36 - 6, H * 0.36]);
  const lines = saw(t, 6, 0, mh * 0.5);
  return (
    <View style={StyleSheet.absoluteFill}>
      <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#4B9BFF" />
            <Stop offset="1" stopColor="#E3EEFF" />
          </LinearGradient>
        </Defs>
        <Rect width={W} height={H} fill="url(#sky)" />
        <Path
          d={`M0 0 L${W} 0 L${W} ${H * 0.22} Q${W * 0.75} ${H * 0.3} ${W * 0.55} ${H * 0.36} L${W * 0.42} ${H * 0.36} Q${W * 0.2} ${H * 0.2} 0 ${H * 0.18} Z`}
          fill="#3E4E63"
          stroke={INK}
          strokeWidth={3}
        />
      </Svg>
      <Animated.View style={{ position: 'absolute', left: (W - mw) / 2, top: 0, transform: [{ translateY: drop }] }}>
        <View style={[styles.mirrorStem, { left: mw / 2 - 18 }]} />
        <View style={[styles.mirror, { width: mw, height: mh, borderRadius: mh / 2 }]}>
          <View style={[styles.glass, { borderRadius: mh / 2 - 8 }]}>
            <View style={{ flex: 1, backgroundColor: '#4B9BFF' }} />
            <View style={{ flex: 1, backgroundColor: '#2A3140' }} />
            <Svg width={mw} height={mh} style={StyleSheet.absoluteFill}>
              <Path d={`M${mw * 0.5} ${mh * 0.5} L${mw * 0.25} ${mh} L${mw * 0.75} ${mh} Z`} fill="#4A5366" />
              <Path d={`M${mw * 0.49} ${mh * 0.5} L${mw * 0.36} ${mh}`} stroke="#FFFFFF" strokeWidth={3} />
              <Path d={`M${mw * 0.51} ${mh * 0.5} L${mw * 0.64} ${mh}`} stroke="#FFFFFF" strokeWidth={3} />
              <Path d={`M${mw * 0.1} ${mh * 0.5} Q${mw * 0.2} ${mh * 0.36} ${mw * 0.3} ${mh * 0.5} Q${mw * 0.42} ${mh * 0.4} ${mw * 0.55} ${mh * 0.5} Q${mw * 0.7} ${mh * 0.34} ${mw * 0.9} ${mh * 0.5} Z`} fill="#2E6FD0" />
            </Svg>
            <Animated.View style={{ position: 'absolute', left: mw / 2 - 3, top: mh * 0.5, transform: [{ translateY: lines }] }}>
              <View style={styles.mirrorDash} />
            </Animated.View>
          </View>
        </View>
      </Animated.View>
      <Title t={t} top={H * 0.62} color={INK} sub="OCCHI SULLA STRADA" />
    </View>
  );
}

/** 4 · Cabriolet gialla che sfreccia con linee di velocità e scintille. */
function CabrioScene({ t, W, H }: SceneProps) {
  const cw = Math.min(W * 0.8, 380);
  const x = lerp(t, [0, 0.2, 0.78, 1], [-cw - 40, (W - cw) / 2, (W - cw) / 2 + 10, W + 40]);
  const bounce = wave(t, 22, 0, -4);
  const speed = saw(t, 5, W, -160);
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: CREAM }]}>
      <Title t={t} top={H * 0.16} sub="PRONTI, PARTENZA, QUIZ!" />
      {[0, 1, 2, 3].map((i) => (
        <Animated.View
          key={i}
          style={[
            styles.speedLine,
            { top: H * 0.52 + i * 34, width: 80 + (i % 2) * 50, transform: [{ translateX: Animated.add(speed, i * 70) }] },
          ]}
        />
      ))}
      <Animated.View style={{ position: 'absolute', top: H * 0.48, transform: [{ translateX: x }, { translateY: bounce }] }}>
        <Convertible width={cw} />
        {[
          [cw * 0.92, cw * 0.18, 0],
          [cw * 0.98, cw * 0.3, 3],
          [cw * 0.82, cw * 0.06, 6],
        ].map(([left, top, phase], i) => (
          <Animated.View key={i} style={{ position: 'absolute', left, top, opacity: wave(t, 8 + phase, 0, 1) }}>
            <Sparkle size={22} />
          </Animated.View>
        ))}
      </Animated.View>
    </View>
  );
}

const SCENES = [VanScene, DriftScene, MirrorScene, CabrioScene];

export function IntroAnimation({ onDone }: { onDone: () => void }) {
  const { width: W, height: H } = useWindowDimensions();
  const [sceneIndex] = useState(() => {
    // Sul web si può scegliere la scena con ?intro=1..4 (utile per provarle).
    const forced = Platform.OS === 'web' ? Number(new URLSearchParams(globalThis.location?.search).get('intro')) : 0;
    return forced >= 1 && forced <= SCENES.length ? forced - 1 : Math.floor(Math.random() * SCENES.length);
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
    Animated.timing(fade, { toValue: 0, duration: 320, useNativeDriver: native }).start(() => onDone());
  }, [closing, fade, onDone]);

  const Scene = SCENES[sceneIndex];
  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, { opacity: fade }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={() => setClosing(true)} accessibilityLabel="Salta animazione">
        <Scene t={t} W={W} H={H} />
        <View style={styles.skip}>
          <Text style={styles.skipText}>TOCCA PER SALTARE</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { zIndex: 100, elevation: 100, overflow: 'hidden' },
  title: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  titleText: { fontFamily: F.black, fontSize: 46, letterSpacing: -1 },
  sub: { fontFamily: F.pixel, fontSize: 14, marginTop: 2, letterSpacing: 1 },
  road: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: INK,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  dashRow: { flexDirection: 'row', gap: 40, paddingLeft: 10 },
  dash: { width: 40, height: 6, backgroundColor: CREAM },
  mirror: { backgroundColor: '#1E2430', borderWidth: 3, borderColor: INK, padding: 8, boxShadow: `6px 6px 0px ${INK}` },
  mirrorStem: { position: 'absolute', top: -26, width: 36, height: 30, backgroundColor: '#1E2430', borderWidth: 3, borderColor: INK, borderRadius: 6 },
  glass: { flex: 1, overflow: 'hidden', borderWidth: 2, borderColor: INK },
  mirrorDash: { width: 6, height: 12, backgroundColor: '#FFFFFF' },
  speedLine: { position: 'absolute', left: 0, height: 4, borderRadius: 2, backgroundColor: INK },
  skip: {
    position: 'absolute',
    bottom: 36,
    alignSelf: 'center',
    backgroundColor: CREAM,
    borderWidth: 2,
    borderColor: INK,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  skipText: { fontFamily: F.pixel, fontSize: 10, color: INK },
});
