import { memo } from 'react';
import Svg, { Path } from 'react-native-svg';

/**
 * Berlina disegnata in prospettiva (vista 3/4 dall'alto) in stile illustrazione
 * flat con contorni neri. Il modello è costruito con poligoni 3D proiettati,
 * così la prospettiva resta coerente. L'auto è rivolta verso il basso a sinistra.
 */

const INK = '#1B1B1F';

type P3 = [number, number, number]; // x = larghezza, y = lunghezza (avanti = +y), z = altezza

const COS = Math.cos(Math.PI / 6);
const SIN = Math.sin(Math.PI / 6);
const proj = ([x, y, z]: P3): [number, number] => [(x - y) * COS, (x + y) * SIN - z];

const W = 1.8; // larghezza
const L = 4.4; // lunghezza

const poly = (pts: P3[]) =>
  pts
    .map((p, i) => {
      const [sx, sy] = proj(p);
      return `${i ? 'L' : 'M'}${sx.toFixed(3)} ${sy.toFixed(3)}`;
    })
    .join(' ') + ' Z';

/** Cerchio sul fianco visibile (piano y-z, a x costante). */
const wheelPath = (x: number, y: number, z: number, r: number, from = 0, to = Math.PI * 2, close = true) => {
  const pts: P3[] = [];
  const n = 24;
  for (let i = 0; i <= n; i++) {
    const a = from + ((to - from) * i) / n;
    pts.push([x, y + Math.cos(a) * r, z + Math.sin(a) * r]);
  }
  return close ? poly(pts) : poly(pts).replace(' Z', '');
};

const lerp3 = (a: P3, b: P3, t: number): P3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/* ---------- Geometria ---------- */

// Carrozzeria: profilo a cuneo, estruso lungo x.
const ZB = 0.36; // fondo
const rearTop = 0.94;
const frontTop = 0.8;
const body = {
  side: poly([[W, 0, ZB], [W, 0, rearTop], [W, L, frontTop], [W, L, ZB]]),
  top: poly([[0, 0, rearTop], [W, 0, rearTop], [W, L, frontTop], [0, L, frontTop]]),
  front: poly([[0, L, ZB], [W, L, ZB], [W, L, frontTop], [0, L, frontTop]]),
};

// Abitacolo: lunotto, tetto, parabrezza; leggermente rientrato verso l'alto.
const si = 0.1; // rientro alla base
const ri = 0.3; // rientro del tetto
const zr = 1.48;
const zBase = (y: number) => rearTop + ((frontTop - rearTop) * y) / L;
const cab = {
  rb: [W - si, 0.55, zBase(0.55)] as P3,
  rt: [W - ri, 1.35, zr] as P3,
  ft: [W - ri, 2.55, zr] as P3,
  fb: [W - si, 3.2, zBase(3.2)] as P3,
};
const mirrorX = (p: P3): P3 => [W - p[0], p[1], p[2]];
const cabin = {
  side: poly([cab.rb, cab.rt, cab.ft, cab.fb]),
  roof: poly([mirrorX(cab.rt), cab.rt, cab.ft, mirrorX(cab.ft)]),
  windshield: poly([mirrorX(cab.ft), cab.ft, cab.fb, mirrorX(cab.fb)]),
};

// Finestrini laterali (rientrati dentro il fianco dell'abitacolo).
const inset = (a: P3, b: P3, c: P3, d: P3, k: number) => {
  const cx: P3 = [(a[0] + b[0] + c[0] + d[0]) / 4, (a[1] + b[1] + c[1] + d[1]) / 4, (a[2] + b[2] + c[2] + d[2]) / 4];
  return [a, b, c, d].map((p) => lerp3(p, cx, k));
};
const [wa, wb, wc, wd] = inset(cab.rb, cab.rt, cab.ft, cab.fb, 0.16);
const pillar = 0.52;
const sideWindows = [
  poly([wa, wb, lerp3(wb, wc, pillar - 0.04), lerp3(wa, wd, pillar - 0.04)]),
  poly([lerp3(wa, wd, pillar + 0.04), lerp3(wb, wc, pillar + 0.04), wc, wd]),
];
// Parabrezza: vetro nero con riflesso bianco a "fulmine".
const ws = inset(mirrorX(cab.ft), cab.ft, cab.fb, mirrorX(cab.fb), 0.1);
const glare = (() => {
  const at = (u: number, v: number) => lerp3(lerp3(ws[0], ws[1], u), lerp3(ws[3], ws[2], u), v);
  return poly([at(0.52, 0.08), at(0.66, 0.08), at(0.5, 0.48), at(0.62, 0.48), at(0.36, 0.92), at(0.44, 0.52), at(0.34, 0.52)]);
})();

// Dettagli del fianco e del frontale.
const doorLines = [1.95, 3.05].map((y) => poly([[W, y, ZB + 0.06], [W, y, zBase(y) - 0.02]]).replace(' Z', ''));
const sideTrim = poly([[W, 0.05, 0.5], [W, L - 0.05, 0.5]]).replace(' Z', '');
const tailLight = poly([[W, 0, 0.7], [W, 0.22, 0.7], [W, 0.22, 0.86], [W, 0, 0.88]]);
const handle = poly([[W, 2.2, 0.76], [W, 2.45, 0.76]]).replace(' Z', '');
const mirror = poly([[W, 3.05, 0.86], [W + 0.22, 3.0, 0.92], [W + 0.22, 3.18, 0.98], [W, 3.2, 0.9]]);
const headlights = [
  poly([[0.12, L, 0.6], [0.5, L, 0.6], [0.5, L, 0.74], [0.12, L, 0.74]]),
  poly([[W - 0.5, L, 0.6], [W - 0.12, L, 0.6], [W - 0.12, L, 0.74], [W - 0.5, L, 0.74]]),
];
const indicator = poly([[W - 0.12, L, 0.6], [W, L - 0.06, 0.6], [W, L - 0.06, 0.73], [W - 0.12, L, 0.74]]);
const grille = poly([[0.62, L, 0.58], [W - 0.62, L, 0.58], [W - 0.62, L, 0.74], [0.62, L, 0.74]]);
const grilleBars = [0.75, 0.88, 1.01, 1.14].map((x) => poly([[x, L, 0.6], [x, L, 0.72]]).replace(' Z', ''));
const bumperFront = poly([[-0.04, L + 0.06, ZB - 0.04], [W + 0.04, L + 0.06, ZB - 0.04], [W + 0.04, L + 0.06, 0.5], [-0.04, L + 0.06, 0.5]]);
const bumperSide = poly([[W + 0.04, L - 0.5, ZB - 0.04], [W + 0.04, L + 0.06, ZB - 0.04], [W + 0.04, L + 0.06, 0.5], [W + 0.04, L - 0.5, 0.5]]);
const plate = poly([[0.62, L + 0.07, 0.38], [W - 0.62, L + 0.07, 0.38], [W - 0.62, L + 0.07, 0.48], [0.62, L + 0.07, 0.48]]);
const antenna = poly([[W - 0.5, 0.75, zBase(0.75)], [W - 0.4, 0.15, zBase(0.15) + 0.5]]).replace(' Z', '');

const wheels = [0.95, 3.45].map((y) => ({
  arch: wheelPath(W + 0.001, y, ZB + 0.02, 0.5, 0, Math.PI),
  tire: wheelPath(W + 0.02, y, ZB, 0.4),
  rim: wheelPath(W + 0.03, y, ZB, 0.24),
  hub: wheelPath(W + 0.035, y, ZB, 0.07),
}));

const shadowPath = poly([[-0.2, -0.3, 0], [W + 0.5, -0.3, 0], [W + 0.5, L + 0.3, 0], [-0.2, L + 0.3, 0]]);

// Riquadro: calcolato una volta proiettando gli estremi.
const box = (() => {
  const pts: P3[] = [];
  for (const x of [-0.3, W + 0.5]) for (const y of [-0.4, L + 0.4]) for (const z of [0, zr + 0.6]) pts.push([x, y, z]);
  const s = pts.map(proj);
  const xs = s.map((p) => p[0]);
  const ys = s.map((p) => p[1]);
  return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
})();

/** Mescola un colore esadecimale con il bianco (k > 0) o con il nero (k < 0). */
export function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) =>
    Math.round(k >= 0 ? c + (255 - c) * k : c * (1 + k)),
  );
  return `#${ch.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

export const CAR_ASPECT = box.h / box.w;

export const PerspectiveCar = memo(function PerspectiveCar({ color, width }: { color: string; width: number }) {
  const sw = (box.w / width) * 2.4; // tratto di ~2.4 px a qualsiasi dimensione
  const line = { stroke: INK, strokeWidth: sw, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  const top = shade(color, 0.28);
  const front = shade(color, -0.18);
  return (
    <Svg width={width} height={width * CAR_ASPECT} viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}>
      <Path d={shadowPath} fill={INK} opacity={0.18} />
      <Path d={antenna} fill="none" {...line} />
      <Path d={body.top} fill={top} {...line} />
      <Path d={body.side} fill={color} {...line} />
      <Path d={body.front} fill={front} {...line} />
      <Path d={sideTrim} fill="none" {...line} strokeWidth={sw * 0.7} />
      {doorLines.map((d, i) => <Path key={i} d={d} fill="none" {...line} strokeWidth={sw * 0.7} />)}
      <Path d={handle} fill="none" {...line} />
      <Path d={tailLight} fill="#FF6B6B" {...line} />
      <Path d={cabin.side} fill={color} {...line} />
      <Path d={cabin.roof} fill={top} {...line} />
      <Path d={cabin.windshield} fill={INK} {...line} />
      <Path d={glare} fill="#FFFFFF" />
      {sideWindows.map((d, i) => <Path key={i} d={d} fill={INK} {...line} />)}
      <Path d={mirror} fill={front} {...line} />
      <Path d={grille} fill={INK} {...line} />
      {grilleBars.map((d, i) => <Path key={i} d={d} fill="none" stroke="#9A958D" strokeWidth={sw * 0.6} />)}
      {headlights.map((d, i) => <Path key={i} d={d} fill="#FFF1B8" {...line} />)}
      <Path d={indicator} fill="#FFA866" {...line} />
      <Path d={bumperSide} fill="#3A3A40" {...line} />
      <Path d={bumperFront} fill="#3A3A40" {...line} />
      <Path d={plate} fill="#FFD54A" {...line} strokeWidth={sw * 0.6} />
      {wheels.map((w, i) => (
        <Path key={`a${i}`} d={w.arch} fill={INK} />
      ))}
      {wheels.map((w, i) => (
        <Path key={`t${i}`} d={w.tire} fill={INK} {...line} />
      ))}
      {wheels.map((w, i) => (
        <Path key={`r${i}`} d={w.rim} fill="#CFC8BC" {...line} strokeWidth={sw * 0.7} />
      ))}
      {wheels.map((w, i) => (
        <Path key={`h${i}`} d={w.hub} fill="#7A756E" />
      ))}
    </Svg>
  );
});
