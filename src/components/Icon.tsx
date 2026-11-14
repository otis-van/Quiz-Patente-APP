import { memo } from 'react';
import Svg, { G, Path } from 'react-native-svg';

import { Palette, useColors } from '@/theme';

/**
 * Icone vettoriali in stile "sticker" neo-brutalista: forme piene a colori,
 * contorno nero spesso e ombra netta spostata in basso a destra.
 * Ogni icona è un elenco di forme in una griglia 24×24.
 */
type Col = 'yellow' | 'orange' | 'red' | 'pink' | 'lilac' | 'blue' | 'mint' | 'green' | 'white' | 'dark' | 'light' | 'ink' | 'none';

interface Shape {
  d: string;
  /** Riempimento (default: none). */
  f?: Col;
  /** Colore del tratto (default: inchiostro). */
  s?: Col;
  /** Spessore del tratto (default 1.6; 0 = nessun tratto). */
  w?: number;
}

interface IconDef {
  shapes: Shape[];
  /** Icona "glifo" (frecce, chiudi): solo tratto nel colore del testo, senza ombra. */
  glyph?: boolean;
}

const circle = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0 Z`;

const ICONS = {
  home: { shapes: [
    { d: 'M4.5 11 L12 4 L19.5 11 V20.5 H4.5 Z', f: 'pink' },
    { d: 'M10 20.5 V15 H14 V20.5', f: 'yellow' },
  ] },
  calendar: { shapes: [
    { d: 'M3.5 5.5 H20.5 V20.5 H3.5 Z', f: 'white' },
    { d: 'M3.5 5.5 H20.5 V10 H3.5 Z', f: 'red' },
    { d: 'M8 3.5 V7.5 M16 3.5 V7.5', w: 1.8 },
    { d: 'M7 13 h2 v2 h-2 Z M11 13 h2 v2 h-2 Z M15 13 h2 v2 h-2 Z M7 16.5 h2 v2 h-2 Z', f: 'ink', w: 0 },
  ] },
  doc: { shapes: [
    { d: 'M5.5 2.5 H14 L18.5 7 V21.5 H5.5 Z', f: 'white' },
    { d: 'M14 2.5 V7 H18.5', f: 'light' },
    { d: 'M8.5 11 H15.5 M8.5 14 H15.5 M8.5 17 H12.5', w: 1.5 },
  ] },
  smiley: { shapes: [
    { d: circle(12, 12, 9), f: 'yellow' },
    { d: 'M9.2 9.3 v1.6 M14.8 9.3 v1.6', w: 2 },
    { d: 'M8.3 14 Q12 18 15.7 14', w: 1.8 },
  ] },
  fire: { shapes: [
    { d: 'M12 2.5 C13 6 18 8.5 18 14 A6 6 0 0 1 6 14 C6 11 8 9.5 8.8 7.2 C9.8 9 11 9.6 11 9.6 C10.8 7 11.4 4.8 12 2.5 Z', f: 'orange' },
    { d: 'M12 12 C13.6 13.6 14.6 14.6 14.6 16.3 A2.6 2.6 0 0 1 9.4 16.3 C9.4 14.6 10.8 13.4 12 12 Z', f: 'yellow' },
  ] },
  bolt: { shapes: [{ d: 'M13.5 2.5 L5 13.5 H11 L9.5 21.5 L19 9.5 H13 Z', f: 'yellow' }] },
  gem: { shapes: [
    { d: 'M7 4 H17 L21 9 L12 20.5 L3 9 Z', f: 'blue' },
    { d: 'M3 9 H21 M9 4 L7.8 9 L12 20.5 L16.2 9 L15 4', w: 1.2 },
  ] },
  target: { shapes: [
    { d: circle(12, 12, 9.2), f: 'red' },
    { d: circle(12, 12, 6), f: 'white' },
    { d: circle(12, 12, 2.8), f: 'red' },
  ] },
  trophy: { shapes: [
    { d: 'M7 6.5 H4.5 V8.3 A3.2 3.2 0 0 0 7.8 11.3 M17 6.5 H19.5 V8.3 A3.2 3.2 0 0 1 16.2 11.3', w: 1.6 },
    { d: 'M10.5 13.5 H13.5 V17.5 H10.5 Z', f: 'yellow' },
    { d: 'M7 3.5 H17 V9 A5 5 0 0 1 7 9 Z', f: 'yellow' },
    { d: 'M7.5 17.5 H16.5 V20.8 H7.5 Z', f: 'yellow' },
  ] },
  star: { shapes: [{ d: 'M12 2.6 L14.8 8.5 L21.2 9.3 L16.4 13.7 L17.7 20.1 L12 16.9 L6.3 20.1 L7.6 13.7 L2.8 9.3 L9.2 8.5 Z', f: 'yellow' }] },
  check: { shapes: [
    { d: circle(12, 12, 9.2), f: 'green' },
    { d: 'M7.6 12.4 L10.6 15.4 L16.4 9.2', w: 2.2 },
  ] },
  cross: { shapes: [
    { d: circle(12, 12, 9.2), f: 'red' },
    { d: 'M9 9 L15 15 M15 9 L9 15', w: 2.2 },
  ] },
  lock: { shapes: [
    { d: 'M8 10.5 V7.5 A4 4 0 0 1 16 7.5 V10.5', w: 2 },
    { d: 'M4.5 10.5 H19.5 V20.8 H4.5 Z', f: 'blue' },
    { d: 'M12 14 V17', w: 2 },
  ] },
  heart: { shapes: [{ d: 'M12 20.5 C6 16.5 3 13 3 9.3 A4.3 4.3 0 0 1 12 7.2 A4.3 4.3 0 0 1 21 9.3 C21 13 18 16.5 12 20.5 Z', f: 'pink' }] },
  clock: { shapes: [
    { d: circle(12, 12, 9.2), f: 'red' },
    { d: 'M12 6.8 V12 L15.6 14.2', w: 1.9 },
  ] },
  book: { shapes: [
    { d: 'M5 3.5 H18.8 V20.8 H7.2 A2.2 2.2 0 0 1 5 18.6 Z', f: 'blue' },
    { d: 'M5 18.6 A2.2 2.2 0 0 1 7.2 16.4 H18.8', f: 'white' },
    { d: 'M9 7.5 H15', w: 1.6 },
  ] },
  question: { shapes: [
    { d: 'M3.5 3.5 H20.5 V16 H11 L6.5 20.5 V16 H3.5 Z', f: 'lilac' },
    { d: 'M9.8 8.4 A2.2 2.2 0 1 1 12 10.6 V11.8', w: 1.7 },
    { d: 'M12 13.9 v0.1', w: 2.2 },
  ] },
  cloud: { shapes: [{ d: 'M7 19 A4.2 4.2 0 0 1 6.4 10.6 A5.6 5.6 0 0 1 17 9.3 A4.9 4.9 0 0 1 17.4 19 Z', f: 'white' }] },
  warning: { shapes: [
    { d: 'M12 3 L21.8 20 H2.2 Z', f: 'yellow' },
    { d: 'M12 9.2 V13.8', w: 2 },
    { d: 'M12 16.6 v0.1', w: 2.3 },
  ] },
  gift: { shapes: [
    { d: 'M12 7 C10 2.5 5.8 4 8.3 7 M12 7 C14 2.5 18.2 4 15.7 7', w: 1.6 },
    { d: 'M4.5 10 H19.5 V20.8 H4.5 Z', f: 'pink' },
    { d: 'M3.5 7 H20.5 V10.5 H3.5 Z', f: 'pink' },
    { d: 'M10.5 7 H13.5 V20.8 H10.5 Z', f: 'yellow' },
  ] },
  box: { shapes: [
    { d: 'M3.5 8 L12 4 L20.5 8 V17 L12 21 L3.5 17 Z', f: 'orange' },
    { d: 'M3.5 8 L12 12 L20.5 8 M12 12 V21', w: 1.5 },
  ] },
  bell: { shapes: [
    { d: 'M12 3 V5', w: 1.8 },
    { d: 'M9.8 19 A2.2 2.2 0 0 0 14.2 19', w: 1.6 },
    { d: 'M6 16.5 V11 A6 6 0 0 1 18 11 V16.5 L19.8 18.5 H4.2 Z', f: 'yellow' },
  ] },
  sun: { shapes: [
    { d: 'M12 1.8 v2.6 M12 19.6 v2.6 M1.8 12 h2.6 M19.6 12 h2.6 M4.8 4.8 l1.8 1.8 M17.4 17.4 l1.8 1.8 M4.8 19.2 l1.8 -1.8 M17.4 6.6 l1.8 -1.8', w: 1.9 },
    { d: circle(12, 12, 4.8), f: 'yellow' },
  ] },
  moon: { shapes: [{ d: 'M15 3.2 A8.8 8.8 0 1 0 20.8 15.2 A7.2 7.2 0 0 1 15 3.2 Z', f: 'lilac' }] },
  phone: { shapes: [
    { d: 'M8 2.5 H16 A1.5 1.5 0 0 1 17.5 4 V20 A1.5 1.5 0 0 1 16 21.5 H8 A1.5 1.5 0 0 1 6.5 20 V4 A1.5 1.5 0 0 1 8 2.5 Z', f: 'blue' },
    { d: 'M10.5 18.5 H13.5', w: 1.6 },
  ] },
  arrow: { glyph: true, shapes: [{ d: 'M19.5 12 H5 M11 5.8 L4.8 12 L11 18.2', w: 2.6 }] },
  close: { glyph: true, shapes: [{ d: 'M6 6 L18 18 M18 6 L6 18', w: 2.8 }] },
  chevron: { glyph: true, shapes: [{ d: 'M9 5 L16 12 L9 19', w: 2.6 }] },
  trafficLight: { shapes: [
    { d: 'M12 18.5 V22', w: 2 },
    { d: 'M8 2 H16 V18.5 H8 Z', f: 'dark' },
    { d: circle(12, 5.8, 1.9), f: 'red', w: 1.2 },
    { d: circle(12, 10.3, 1.9), f: 'yellow', w: 1.2 },
    { d: circle(12, 14.8, 1.9), f: 'green', w: 1.2 },
  ] },
  car: { shapes: [
    { d: 'M2.5 16.5 V13 Q2.8 11 5.5 10.6 L8 7.2 Q9 6 10.5 6 H15 Q16.5 6 17.5 7.4 L19.6 10.6 Q21.5 11 21.5 13 V16.5 Z', f: 'pink' },
    { d: 'M9.2 7.8 H12 V10.6 H7.4 Z M13.6 7.8 H15 Q15.9 7.8 16.4 8.6 L17.6 10.6 H13.6 Z', f: 'blue', w: 1.2 },
    { d: circle(7, 16.6, 2.4), f: 'dark' },
    { d: circle(17, 16.6, 2.4), f: 'dark' },
  ] },
  panda: { shapes: [
    { d: 'M2 15.6 V10.8 Q2 9.8 3.1 9.6 L6.6 9.2 L8.6 4.6 Q8.9 4 9.6 4 H20.6 Q21.8 4 21.8 5.2 V15.6 Z', f: 'red', w: 1.3 },
    { d: 'M9.3 5.4 H13.4 V9 H7.7 Z M14.5 5.4 H17.4 V9 H14.5 Z M18.5 5.4 H20.4 V9 H18.5 Z', f: 'blue', w: 1.1 },
    { d: 'M2 13.6 H21.8 V15.6 H2 Z', f: 'dark', w: 1.1 },
    { d: 'M14 9 V13.6', w: 1 },
    { d: 'M2.1 10.4 H3.9 V11.8 H2.1 Z', f: 'yellow', w: 0.9 },
    { d: circle(6.3, 16.2, 2.3), f: 'dark' },
    { d: circle(6.3, 16.2, 0.9), f: 'light', w: 0.9 },
    { d: circle(17.6, 16.2, 2.3), f: 'dark' },
    { d: circle(17.6, 16.2, 0.9), f: 'light', w: 0.9 },
  ] },
  cap: { shapes: [
    { d: 'M6 11 V15.5 Q12 19.2 18 15.5 V11', f: 'lilac' },
    { d: 'M2 9 L12 4.5 L22 9 L12 13.5 Z', f: 'lilac' },
    { d: 'M19.5 10 V15.5', w: 1.6 },
    { d: circle(19.5, 16.3, 0.9), f: 'yellow', w: 1.2 },
  ] },
  sparkle: { shapes: [{ d: 'M12 2.5 Q13 11 21.5 12 Q13 13 12 21.5 Q11 13 2.5 12 Q11 11 12 2.5 Z', f: 'yellow' }] },
  road: { shapes: [
    { d: 'M8.5 2.5 H15.5 L20.5 21.5 H3.5 Z', f: 'dark' },
    { d: 'M12 4.5 V7.5 M12 10.5 V13.5 M12 16.5 V19.5', s: 'white', w: 1.6 },
  ] },
  noEntry: { shapes: [
    { d: circle(12, 12, 9.3), f: 'red' },
    { d: 'M6.3 10.4 H17.7 V13.6 H6.3 Z', f: 'white', w: 1.4 },
  ] },
  mandatory: { shapes: [
    { d: circle(12, 12, 9.3), f: 'blue' },
    { d: 'M12 17.8 V7 M8 10.8 L12 6.8 L16 10.8', s: 'white', w: 2.2 },
  ] },
  yield: { shapes: [
    { d: 'M2.5 3.8 H21.5 L12 21 Z', f: 'red' },
    { d: 'M7.2 6.5 H16.8 L12 15.2 Z', f: 'white', w: 1.2 },
  ] },
  signpost: { shapes: [
    { d: 'M10.5 11 H13.5 V21.5 H10.5 Z', f: 'dark' },
    { d: 'M3 4.5 H17.5 L21 8 L17.5 11.5 H3 Z', f: 'blue' },
  ] },
  cone: { shapes: [
    { d: 'M10 3 H14 L18.5 19 H5.5 Z', f: 'orange' },
    { d: 'M8.5 9.8 H15.5 L16.4 13 H7.6 Z', f: 'white', w: 1.2 },
    { d: 'M3.5 19 H20.5 V21.5 H3.5 Z', f: 'orange' },
  ] },
  panel: { shapes: [
    { d: 'M2.5 6.5 H21.5 V17.5 H2.5 Z', f: 'white' },
    { d: 'M5.5 10.3 H14 M5.5 13.7 H18.5', w: 1.6 },
  ] },
  gauge: { shapes: [
    { d: 'M2.8 17 A9.2 9.2 0 0 1 21.2 17 Z', f: 'white' },
    { d: 'M6 13.5 L7.2 14.2 M12 8 V9.5 M18 13.5 L16.8 14.2', w: 1.4 },
    { d: 'M12 17 L16.4 10.6', s: 'red', w: 2 },
  ] },
  arrows: { shapes: [
    { d: 'M3 12 H21', w: 2.2 },
    { d: 'M7.5 7.5 L2.8 12 L7.5 16.5 Z M16.5 7.5 L21.2 12 L16.5 16.5 Z', f: 'blue', w: 1.4 },
  ] },
  crossroad: { shapes: [
    { d: 'M9 2.5 H15 V9 H21.5 V15 H15 V21.5 H9 V15 H2.5 V9 H9 Z', f: 'dark' },
    { d: 'M12 4 V7 M12 17 V20 M4 12 H7 M17 12 H20', s: 'white', w: 1.4 },
  ] },
  overtake: { shapes: [
    { d: 'M3.5 5 L11 12 L3.5 19 Z', f: 'green' },
    { d: 'M11.5 5 L19 12 L11.5 19 Z', f: 'green' },
  ] },
  parking: { shapes: [
    { d: 'M3.5 3.5 H20.5 V20.5 H3.5 Z', f: 'blue' },
    { d: 'M9.3 17.5 V7 H13 A3 3 0 0 1 13 13 H9.3', s: 'white', w: 2.4 },
  ] },
  wheel: { shapes: [
    { d: circle(12, 12, 9.2), f: 'dark' },
    { d: circle(12, 12, 4.2), f: 'light' },
    { d: circle(12, 12, 1.2), f: 'ink', w: 0 },
  ] },
  bulb: { shapes: [
    { d: 'M10.5 21 H13.5', w: 1.6 },
    { d: 'M8.5 16 H15.5 V19 H8.5 Z', f: 'light' },
    { d: 'M12 2.5 A6.5 6.5 0 0 1 16 14 V16 H8 V14 A6.5 6.5 0 0 1 12 2.5 Z', f: 'yellow' },
  ] },
  shield: { shapes: [
    { d: 'M12 2.5 L20 5.5 V11 C20 16 16.5 19.5 12 21.5 C7.5 19.5 4 16 4 11 V5.5 Z', f: 'mint' },
    { d: 'M8.5 12 L11 14.5 L15.5 9.5', w: 1.9 },
  ] },
  idCard: { shapes: [
    { d: 'M2.5 5.5 H21.5 V18.5 H2.5 Z', f: 'lilac' },
    { d: 'M5 9 H10 V15.5 H5 Z', f: 'yellow', w: 1.3 },
    { d: 'M12.5 10 H19 M12.5 13.3 H17', w: 1.5 },
  ] },
  aid: { shapes: [
    { d: 'M3.5 3.5 H20.5 V20.5 H3.5 Z', f: 'white' },
    { d: 'M10 6.5 H14 V10 H17.5 V14 H14 V17.5 H10 V14 H6.5 V10 H10 Z', f: 'red', w: 1.3 },
  ] },
  glass: { shapes: [
    { d: 'M12 12.5 V19.5 M8 20.3 H16', w: 1.8 },
    { d: 'M6.5 3 H17.5 V7 A5.5 5.5 0 0 1 6.5 7 Z', f: 'red' },
  ] },
  leaf: { shapes: [
    { d: 'M4 20 C4 10 10 4 20 4 C20 14 14 20 4 20 Z', f: 'green' },
    { d: 'M4.5 19.5 L14.5 9.5', w: 1.5 },
  ] },
  drop: { shapes: [
    { d: 'M12 2.5 C15 7 18.5 10.5 18.5 14.5 A6.5 6.5 0 0 1 5.5 14.5 C5.5 10.5 9 7 12 2.5 Z', f: 'orange' },
    { d: 'M8.6 14.5 A3.4 3.4 0 0 0 11 17.6', s: 'white', w: 1.5 },
  ] },
} satisfies Record<string, IconDef>;

export type IconName = keyof typeof ICONS;

const color = (c: Col, C: Palette): string => {
  switch (c) {
    case 'white': return '#FFFFFF';
    case 'dark': return '#5E5E66';
    case 'light': return '#D9D2C5';
    case 'ink': return C.ink;
    case 'none': return 'none';
    default: return C[c];
  }
};

/** Spostamento dell'ombra, in unità della griglia 24×24. */
const SHADOW = 1.3;

interface Props {
  name: IconName;
  size?: number;
  /** Specchia orizzontalmente (es. freccia "avanti"). */
  flip?: boolean;
  /** Versione spenta (es. lucchetto, elementi bloccati). */
  dim?: boolean;
}

export const Icon = memo(function Icon({ name, size = 24, flip, dim }: Props) {
  const C = useColors();
  const def: IconDef = ICONS[name];
  const style = [flip && { transform: [{ scaleX: -1 }] }, dim && { opacity: 0.4 }];

  if (def.glyph) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
        {def.shapes.map((sh, i) => (
          <Path key={i} d={sh.d} fill="none" stroke={C.text} strokeWidth={sh.w ?? 2.4} strokeLinecap="round" strokeLinejoin="round" />
        ))}
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 25.5 25.5" style={style}>
      <G transform={`translate(${SHADOW + 0.4} ${SHADOW + 0.4})`}>
        {def.shapes.map((sh, i) => (
          <Path
            key={i}
            d={sh.d}
            fill={sh.f && sh.f !== 'none' ? C.ink : 'none'}
            stroke={sh.w === 0 ? 'none' : C.ink}
            strokeWidth={sh.w ?? 1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </G>
      <G transform="translate(0.4 0.4)">
        {def.shapes.map((sh, i) => (
          <Path
            key={i}
            d={sh.d}
            fill={color(sh.f ?? 'none', C)}
            stroke={sh.w === 0 ? 'none' : color(sh.s ?? 'ink', C)}
            strokeWidth={sh.w ?? 1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </G>
    </Svg>
  );
});
