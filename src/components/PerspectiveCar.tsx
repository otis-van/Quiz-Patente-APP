import { memo } from 'react';
import Svg, { G, Path } from 'react-native-svg';

/**
 * Auto d'epoca disegnate in prospettiva (vista 3/4 dall'alto), in stile illustrazione
 * flat con contorni neri. Ogni modello è un profilo laterale (con angoli arrotondati)
 * estruso in larghezza e proiettato: così la prospettiva resta coerente e le
 * superfici curve si ombreggiano in modo naturale.
 * L'auto è rivolta verso il basso a sinistra.
 */

const INK = '#1B1B1F';

type P2 = [number, number]; // profilo: [y (lunghezza, avanti = +), z (altezza)]
type P3 = [number, number, number]; // x = larghezza (lato visibile = W), y, z

const COS = Math.cos(Math.PI / 6);
const SIN = Math.sin(Math.PI / 6);
const proj = ([x, y, z]: P3): P2 => [(x - y) * COS, (x + y) * SIN - z];

const toPath = (pts: P3[], close = true) =>
  pts.map((p, i) => `${i ? 'L' : 'M'}${proj(p)[0].toFixed(3)} ${proj(p)[1].toFixed(3)}`).join(' ') + (close ? ' Z' : '');

/**
 * Arrotonda gli angoli di un poligono (profilo laterale). `r` è il raggio per vertice
 * (numero unico o elenco). I vertici sono in senso antiorario visti dal lato visibile.
 */
function roundPoly(pts: P2[], r: number | number[], steps = 5): P2[] {
  const out: P2[] = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n];
    const cur = pts[i];
    const next = pts[(i + 1) % n];
    const ri = Array.isArray(r) ? r[i] : r;
    if (!ri) {
      out.push(cur);
      continue;
    }
    const d1 = Math.hypot(cur[0] - prev[0], cur[1] - prev[1]);
    const d2 = Math.hypot(next[0] - cur[0], next[1] - cur[1]);
    const k = Math.min(ri, d1 / 2, d2 / 2);
    const a: P2 = [cur[0] + ((prev[0] - cur[0]) * k) / d1, cur[1] + ((prev[1] - cur[1]) * k) / d1];
    const b: P2 = [cur[0] + ((next[0] - cur[0]) * k) / d2, cur[1] + ((next[1] - cur[1]) * k) / d2];
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      // curva quadratica a → cur → b
      out.push([
        (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * cur[0] + t * t * b[0],
        (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * cur[1] + t * t * b[1],
      ]);
    }
  }
  return out;
}

/** Mescola un colore esadecimale con il bianco (k > 0) o con il nero (k < 0). */
export function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.round(k >= 0 ? c + (255 - c) * k : c * (1 + k)));
  return `#${ch.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

interface Shape {
  d: string;
  fill: string;
  stroke?: string;
  sw?: number;
}

/**
 * Solido estruso: profilo `prof` (y,z) da x = x0 a x = x1. Il bordo superiore
 * può rientrare (`topInset`) per dare la "bombatura" dei tetti.
 * Restituisce le facce visibili, già ombreggiate, più i contorni.
 */
function extrude(prof: P2[], x0: number, x1: number, color: string, topInset = 0, zMid = 0): Shape[] {
  const shapes: Shape[] = [];
  const n = prof.length;
  const xin = (z: number) => (z > zMid && topInset ? topInset * Math.min(1, (z - zMid) / 0.35) : 0);
  const near = (p: P2): P3 => [x1 - xin(p[1]), p[0], p[1]];
  const far = (p: P2): P3 => [x0 + xin(p[1]), p[0], p[1]];
  const visible: boolean[] = [];
  for (let i = 0; i < n; i++) {
    const a = prof[i];
    const b = prof[(i + 1) % n];
    // normale esterna del segmento (profilo antiorario): (dz, -dy) in (y, z)
    const ny = b[1] - a[1];
    const nz = -(b[0] - a[0]);
    const len = Math.hypot(ny, nz) || 1;
    const vis = ny / len + nz / len > 0.02;
    visible.push(vis);
    if (!vis) continue;
    // tono: tetto (nz) più chiaro, frontale (ny) più scuro
    const tone = (nz / len) * 0.3 - (ny / len) * 0.2;
    const fill = shade(color, tone);
    shapes.push({ d: toPath([far(a), far(b), near(b), near(a)]), fill, stroke: fill, sw: 0.012 });
  }
  // fianco visibile
  shapes.push({ d: toPath(prof.map(near)), fill: color, stroke: INK, sw: 1 });
  // contorno lontano (sagoma) e spigoli dove la superficie diventa nascosta
  for (let i = 0; i < n; i++) {
    const b = prof[(i + 1) % n];
    if (visible[i]) shapes.push({ d: toPath([far(prof[i]), far(b)], false), fill: 'none', stroke: INK, sw: 1 });
    const next = visible[(i + 1) % n];
    if (visible[i] !== next) shapes.push({ d: toPath([far(b), near(b)], false), fill: 'none', stroke: INK, sw: 1 });
  }
  return shapes;
}

/** Cerchio sul fianco (piano y-z, x costante). */
const sideCircle = (x: number, y: number, z: number, r: number, from = 0, to = Math.PI * 2) => {
  const pts: P3[] = [];
  for (let i = 0; i <= 28; i++) {
    const a = from + ((to - from) * i) / 28;
    pts.push([x, y + Math.cos(a) * r, z + Math.sin(a) * r]);
  }
  return toPath(pts, to - from >= Math.PI * 2 - 0.001);
};
/** Cerchio sul frontale (piano x-z, y costante). */
const frontCircle = (x: number, y: number, z: number, r: number) => {
  const pts: P3[] = [];
  for (let i = 0; i <= 24; i++) {
    const a = (Math.PI * 2 * i) / 24;
    pts.push([x + Math.cos(a) * r, y, z + Math.sin(a) * r]);
  }
  return toPath(pts);
};
const quadSide = (x: number, y0: number, y1: number, z0: number, z1: number) =>
  toPath([[x, y0, z0], [x, y1, z0], [x, y1, z1], [x, y0, z1]]);
const quadFront = (y: number, x0: number, x1: number, z0: number, z1: number) =>
  toPath([[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]]);
const line = (pts: P3[]) => toPath(pts, false);

/** Finestrino: poligono del profilo dell'abitacolo rimpicciolito verso il centro. */
function insetProfile(pts: P2[], k: number): P2[] {
  const c: P2 = [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
  return pts.map(([y, z]) => [y + (c[0] - y) * k, z + (c[1] - z) * k]);
}

/* ---------- Modelli ---------- */

interface Model {
  W: number;
  L: number;
  build: (color: string) => Shape[];
}

const DARK_PLASTIC = '#3A3A40';
const RIM = '#CFC8BC';

function wheels(W: number, ys: number[], z: number, r: number): Shape[] {
  const out: Shape[] = [];
  for (const y of ys) out.push({ d: sideCircle(W + 0.002, y, z + 0.03, r * 1.22, 0, Math.PI), fill: INK });
  for (const y of ys) {
    out.push({ d: sideCircle(W - 0.12, y, z, r), fill: INK, stroke: INK, sw: 1 });
    out.push({ d: sideCircle(W + 0.02, y, z, r), fill: '#2A2A30', stroke: INK, sw: 1 });
    out.push({ d: sideCircle(W + 0.03, y, z, r * 0.55), fill: RIM, stroke: INK, sw: 0.8 });
    out.push({ d: sideCircle(W + 0.035, y, z, r * 0.16), fill: '#7A756E' });
  }
  return out;
}

/** Utilitaria squadrata anni '80: tutta spigoli smussati, plastica grigia in basso. */
const BOXY: Model = (() => {
  const W = 1.5;
  const L = 3.25;
  const zb = 0.3;
  const bodyProf = roundPoly(
    [
      [0, zb],
      [L, zb],
      [L, 0.78],
      [2.55, 0.84],
      [0, 0.86],
    ],
    [0.08, 0.08, 0.12, 0.08, 0.12],
  );
  const cabProf0: P2[] = [
    [0.06, 0.84],
    [2.55, 0.83],
    [2.1, 1.4],
    [0.14, 1.42],
  ];
  const cabProf = roundPoly(cabProf0, [0, 0, 0.09, 0.09]);
  const win = insetProfile(cabProf0, 0.14);
  const pillarAt = (t: number): P2 => [win[0][0] + (win[1][0] - win[0][0]) * t, 0];
  return {
    W,
    L,
    build: (color) => {
      const s: Shape[] = [];
      s.push(...extrude(bodyProf, 0, W, color));
      // fascia in plastica grigia sul fianco e paraurti
      s.push({ d: quadSide(W + 0.005, 0.02, L - 0.02, zb + 0.02, 0.48), fill: DARK_PLASTIC, stroke: INK, sw: 0.8 });
      s.push({ d: quadFront(L + 0.02, 0.02, W - 0.02, zb, 0.46), fill: DARK_PLASTIC, stroke: INK, sw: 0.8 });
      s.push(...extrude(cabProf, 0.08, W - 0.08, color, 0.1, 1.1));
      // finestrini laterali: tre luci separate da montanti
      const z0 = win[0][1];
      const z1 = win[3][1];
      const cuts = [0, 0.36, 0.4, 0.78, 0.82, 1];
      for (let i = 0; i < cuts.length; i += 2) {
        const ya = pillarAt(cuts[i])[0];
        const yb = pillarAt(cuts[i + 1])[0];
        const slope = (y: number) => (y > 2.0 ? z1 - ((y - 2.0) / 0.45) * (z1 - z0) : z1);
        s.push({
          d: toPath([[W - 0.08 - 0.03, ya, z0], [W - 0.11, yb, z0], [W - 0.11, yb, slope(yb)], [W - 0.11, ya, slope(ya)]]),
          fill: INK,
          stroke: INK,
          sw: 0.8,
        });
      }
      // parabrezza con riflesso
      const ws: P3[] = [[0.2, 2.5, 0.88], [W - 0.2, 2.5, 0.88], [W - 0.2, 2.15, 1.36], [0.2, 2.15, 1.36]];
      s.push({ d: toPath(ws), fill: INK, stroke: INK, sw: 0.8 });
      s.push({ d: glare(ws), fill: '#FFFFFF' });
      // dettagli
      s.push({ d: line([[W + 0.006, 1.45, 0.5], [W + 0.006, 1.45, 0.82]]), fill: 'none', stroke: INK, sw: 0.7 });
      s.push({ d: line([[W + 0.006, 1.15, 0.74], [W + 0.006, 1.35, 0.74]]), fill: 'none', stroke: INK, sw: 1.2 });
      s.push({ d: quadSide(W + 0.006, 0, 0.16, 0.6, 0.8), fill: '#FF6B6B', stroke: INK, sw: 0.7 });
      s.push({ d: quadFront(L + 0.01, 0.1, 0.45, 0.58, 0.76), fill: '#FFF1B8', stroke: INK, sw: 0.8 });
      s.push({ d: quadFront(L + 0.01, W - 0.45, W - 0.1, 0.58, 0.76), fill: '#FFF1B8', stroke: INK, sw: 0.8 });
      s.push({ d: quadFront(L + 0.01, 0.52, W - 0.52, 0.6, 0.74), fill: DARK_PLASTIC, stroke: INK, sw: 0.8 });
      for (const z of [0.64, 0.68, 0.72]) s.push({ d: line([[0.55, L + 0.012, z], [W - 0.55, L + 0.012, z]]), fill: 'none', stroke: '#8A857E', sw: 0.5 });
      s.push({ d: quadFront(L + 0.03, 0.5, W - 0.5, 0.33, 0.43), fill: '#FFD54A', stroke: INK, sw: 0.6 });
      s.push({ d: toPath([[W, 2.42, 0.86], [W + 0.16, 2.4, 0.9], [W + 0.16, 2.52, 0.96], [W, 2.52, 0.91]]), fill: DARK_PLASTIC, stroke: INK, sw: 0.8 });
      s.push(...wheels(W, [0.6, 2.7], zb + 0.02, 0.29));
      return s;
    },
  };
})();

/** Utilitaria tonda anni '60: carrozzeria a goccia, fari tondi, tetto a cupola. */
const BUBBLE: Model = (() => {
  const W = 1.35;
  const L = 3.0;
  const zb = 0.3;
  const bodyProf = roundPoly(
    [
      [0, zb],
      [L, zb],
      [L, 0.62],
      [2.2, 0.86],
      [0.15, 0.9],
    ],
    [0.25, 0.12, 0.3, 0.3, 0.45],
    7,
  );
  const cabProf0: P2[] = [
    [0.35, 0.86],
    [2.2, 0.84],
    [1.75, 1.42],
    [0.75, 1.44],
  ];
  const cabProf = roundPoly(cabProf0, [0, 0, 0.3, 0.35], 7);
  return {
    W,
    L,
    build: (color) => {
      const s: Shape[] = [];
      s.push(...extrude(bodyProf, 0, W, color));
      s.push(...extrude(cabProf, 0.1, W - 0.1, color, 0.16, 1.0));
      // finestrino laterale arrotondato e montante
      const win = roundPoly(insetProfile(cabProf0, 0.18), [0, 0, 0.22, 0.25], 6).map(([y, z]) => [W - 0.15, y, z] as P3);
      s.push({ d: toPath(win), fill: INK, stroke: INK, sw: 0.8 });
      s.push({ d: line([[W - 0.14, 1.38, 0.92], [W - 0.14, 1.36, 1.36]]), fill: 'none', stroke: color, sw: 2.2 });
      // parabrezza
      const ws: P3[] = [[0.24, 2.16, 0.9], [W - 0.24, 2.16, 0.9], [W - 0.28, 1.82, 1.36], [0.28, 1.82, 1.36]];
      s.push({ d: toPath(ws), fill: INK, stroke: INK, sw: 0.8 });
      s.push({ d: glare(ws), fill: '#FFFFFF' });
      // fari tondi, "baffi" cromati, paraurti sottile
      s.push({ d: frontCircle(0.32, L + 0.005, 0.58, 0.13), fill: '#FFF1B8', stroke: INK, sw: 0.9 });
      s.push({ d: frontCircle(W - 0.32, L + 0.005, 0.58, 0.13), fill: '#FFF1B8', stroke: INK, sw: 0.9 });
      s.push({ d: line([[0.5, L + 0.01, 0.5], [W / 2, L + 0.01, 0.44], [W - 0.5, L + 0.01, 0.5]]), fill: 'none', stroke: '#E8E2D6', sw: 1.6 });
      s.push({ d: quadFront(L + 0.03, 0.05, W - 0.05, zb + 0.02, 0.38), fill: '#E8E2D6', stroke: INK, sw: 0.8 });
      s.push({ d: quadSide(W + 0.005, L - 0.35, L + 0.03, zb + 0.02, 0.38), fill: '#E8E2D6', stroke: INK, sw: 0.8 });
      s.push({ d: quadFront(L + 0.04, 0.48, W - 0.48, 0.32, 0.4), fill: '#FFD54A', stroke: INK, sw: 0.6 });
      // dettagli del fianco
      s.push({ d: line([[W + 0.004, 1.2, 0.42], [W + 0.004, 1.2, 0.84]]), fill: 'none', stroke: INK, sw: 0.7 });
      s.push({ d: line([[W + 0.004, 0.95, 0.74], [W + 0.004, 1.1, 0.74]]), fill: 'none', stroke: INK, sw: 1.2 });
      s.push({ d: sideCircle(W + 0.004, 0.18, 0.66, 0.06), fill: '#FF6B6B', stroke: INK, sw: 0.7 });
      s.push(...wheels(W, [0.55, 2.45], zb + 0.01, 0.27));
      return s;
    },
  };
})();

/** Riflesso bianco "a fulmine" su un vetro (quadrilatero). */
function glare(q: P3[]) {
  const lerp3 = (a: P3, b: P3, t: number): P3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  // q: [basso sx, basso dx, alto dx, alto sx]
  const at = (u: number, v: number) => lerp3(lerp3(q[3], q[2], u), lerp3(q[0], q[1], u), v);
  return toPath([at(0.52, 0.1), at(0.66, 0.1), at(0.5, 0.5), at(0.62, 0.5), at(0.36, 0.92), at(0.44, 0.54), at(0.34, 0.54)]);
}

export const CAR_MODELS = { boxy: BOXY, bubble: BUBBLE };
export type CarModel = keyof typeof CAR_MODELS;

function bounds(m: Model) {
  const pts: P3[] = [];
  for (const x of [-0.2, m.W + 0.3]) for (const y of [-0.3, m.L + 0.3]) for (const z of [0, 1.8]) pts.push([x, y, z]);
  const s = pts.map(proj);
  const xs = s.map((p) => p[0]);
  const ys = s.map((p) => p[1]);
  return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
}

export const carAspect = (model: CarModel) => {
  const b = bounds(CAR_MODELS[model]);
  return b.h / b.w;
};

export const PerspectiveCar = memo(function PerspectiveCar({
  model,
  color,
  width,
}: {
  model: CarModel;
  color: string;
  width: number;
}) {
  const m = CAR_MODELS[model];
  const b = bounds(m);
  const px = b.w / width; // unità per pixel
  const shapes = m.build(color);
  const shadow = toPath([[-0.15, -0.2, 0], [m.W + 0.35, -0.2, 0], [m.W + 0.35, m.L + 0.2, 0], [-0.15, m.L + 0.2, 0]]);
  return (
    <Svg width={width} height={width * (b.h / b.w)} viewBox={`${b.x} ${b.y} ${b.w} ${b.h}`}>
      <Path d={shadow} fill={INK} opacity={0.18} />
      <G strokeLinejoin="round" strokeLinecap="round">
        {shapes.map((sh, i) => (
          <Path
            key={i}
            d={sh.d}
            fill={sh.fill}
            stroke={sh.stroke ?? 'none'}
            // sw è in "pixel" (≈2.4 px per 1), tranne i bordi interni anti-fessura (in unità)
            strokeWidth={sh.sw === undefined ? 0 : sh.sw < 0.05 ? sh.sw : sh.sw * 2.4 * px}
          />
        ))}
      </G>
    </Svg>
  );
});
