/**
 * Segnali stradali disegnati in SVG (sistema di coordinate 100×100).
 * Sono riproduzioni stilizzate dei segnali del Codice della Strada, pensate per l'esercitazione.
 */
import type { ReactNode } from 'react';
import { Platform } from 'react-native';
import Svg, { Circle, G, Line, Path, Polygon, Rect, Text as RawSvgText } from 'react-native-svg';

const RED = '#D7262E';
const BLUE = '#0A5BA8';
const GREEN = '#0F7B3F';
const BROWN = '#7A4A1E';
const YELLOW = '#F7C600';
const BLACK = '#1B1B1B';
const WHITE = '#FFFFFF';
const GRAY = '#8C8C8C';
const ROAD = '#5A5F66';

const MIRROR = 'translate(100,0) scale(-1,1)';
const SIGN_FONT = Platform.select({ ios: 'Helvetica', android: 'sans-serif', default: 'Arial, Helvetica, sans-serif' });

/** Testo dei segnali con carattere senza grazie. */
const SvgText = (props: React.ComponentProps<typeof RawSvgText>) => <RawSvgText fontFamily={SIGN_FONT} {...props} />;

/* ---------- Sagome ---------- */

function Danger({ children, temporary }: { children: ReactNode; temporary?: boolean }) {
  return (
    <G>
      <Polygon points="50,7 95,86 5,86" fill={WHITE} stroke={WHITE} strokeWidth={12} strokeLinejoin="round" />
      <Polygon points="50,9 93,85 7,85" fill={RED} stroke={RED} strokeWidth={6} strokeLinejoin="round" />
      <Polygon points="50,25 80,78 20,78" fill={temporary ? YELLOW : WHITE} />
      {children}
    </G>
  );
}

function Prohibition({ children, blue }: { children?: ReactNode; blue?: boolean }) {
  return (
    <G>
      <Circle cx={50} cy={50} r={48} fill={WHITE} />
      <Circle cx={50} cy={50} r={46} fill={RED} />
      <Circle cx={50} cy={50} r={35} fill={blue ? BLUE : WHITE} />
      {children}
    </G>
  );
}

/** Segnali di fine divieto: fondo bianco, bordo sottile e fascio di linee diagonali. */
function EndSign({ children }: { children?: ReactNode }) {
  return (
    <G>
      <Circle cx={50} cy={50} r={47} fill={WHITE} stroke={GRAY} strokeWidth={2} />
      {children}
      {[-8, -4, 0, 4, 8].map((o) => (
        <Line key={o} x1={78 + o} y1={18 + o} x2={22 + o} y2={82 + o} stroke={BLACK} strokeWidth={1.6} />
      ))}
    </G>
  );
}

function Obligation({ children }: { children: ReactNode }) {
  return (
    <G>
      <Circle cx={50} cy={50} r={48} fill={WHITE} />
      <Circle cx={50} cy={50} r={45} fill={BLUE} />
      {children}
    </G>
  );
}

function Square({ color, children }: { color: string; children: ReactNode }) {
  return (
    <G>
      <Rect x={6} y={6} width={88} height={88} rx={8} fill={WHITE} />
      <Rect x={9} y={9} width={82} height={82} rx={6} fill={color} />
      {children}
    </G>
  );
}

function Panel({ color, text, textColor = WHITE, arrow, size = 15 }: { color: string; text: string; textColor?: string; arrow?: 'left' | 'right'; size?: number }) {
  return (
    <G>
      <Rect x={2} y={26} width={96} height={48} rx={6} fill={color === WHITE ? BLACK : WHITE} />
      <Rect x={4.5} y={28.5} width={91} height={43} rx={5} fill={color} />
      <SvgText x={arrow === 'left' ? 57 : arrow === 'right' ? 43 : 50} y={50 + size * 0.36} fontSize={size} fontWeight="bold" fill={textColor} textAnchor="middle">
        {text}
      </SvgText>
      {arrow && (
        <G transform={arrow === 'left' ? MIRROR : undefined}>
          <Polygon points="82,43 82,57 93,50" fill={textColor} />
          <Rect x={76} y={47.5} width={7} height={5} fill={textColor} />
        </G>
      )}
    </G>
  );
}

/* ---------- Pittogrammi ---------- */

/** Freccia piena centrata in (0,0) rivolta verso l'alto, lunga 44. */
const ARROW = 'M0,-22 L14,-5 L5,-5 L5,22 L-5,22 L-5,-5 L-14,-5 Z';
const arrow = (x: number, y: number, rot: number, color: string, s = 1) => (
  <Path d={ARROW} fill={color} transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`} />
);

const carRear = (cx: number, color: string) => (
  <G key={cx}>
    <Path d={`M${cx - 8},50 L${cx - 6},40 L${cx + 6},40 L${cx + 8},50 Z`} fill={color} />
    <Path d={`M${cx - 5},48 L${cx - 4},42 L${cx + 4},42 L${cx + 5},48 Z`} fill={WHITE} />
    <Rect x={cx - 11} y={49} width={22} height={13} rx={3} fill={color} />
    <Rect x={cx - 10} y={61} width={5} height={7} rx={1} fill={color} />
    <Rect x={cx + 5} y={61} width={5} height={7} rx={1} fill={color} />
  </G>
);

const person = (x: number, y: number, s: number, color: string) => (
  <G transform={`translate(${x},${y}) scale(${s})`}>
    <Circle cx={0} cy={-16} r={4.5} fill={color} />
    <Path d="M0,-10 L-1,4 M-1,4 L-6,15 M-1,4 L5,15 M0,-8 L-7,-1 M0,-8 L6,-2" stroke={color} strokeWidth={4} strokeLinecap="round" fill="none" />
  </G>
);

const trafficLight = (lit?: 'red' | 'yellow' | 'green', scale = 1, x = 50, y = 58) => {
  const dim = (c: string, on: boolean) => (lit === undefined || on ? c : '#3A3A3A');
  return (
    <G transform={`translate(${x},${y}) scale(${scale})`}>
      <Rect x={-8} y={-18} width={16} height={36} rx={4} fill={BLACK} />
      <Circle cx={0} cy={-10} r={4.6} fill={dim('#E53935', lit === 'red')} />
      <Circle cx={0} cy={0} r={4.6} fill={dim('#FFB300', lit === 'yellow')} />
      <Circle cx={0} cy={10} r={4.6} fill={dim('#43A047', lit === 'green')} />
    </G>
  );
};

function TrafficLightBig({ lit }: { lit: 'red' | 'yellow' | 'green' }) {
  return (
    <G>
      <Rect x={30} y={4} width={40} height={92} rx={10} fill="#262626" />
      {(['red', 'yellow', 'green'] as const).map((c, i) => (
        <G key={c}>
          <Circle cx={50} cy={22 + i * 28} r={11} fill={lit === c ? { red: '#FF3B30', yellow: '#FFC400', green: '#34C759' }[c] : '#444'} />
          {lit === c && <Circle cx={50} cy={22 + i * 28} r={13} fill="none" stroke={{ red: '#FF3B30', yellow: '#FFC400', green: '#34C759' }[c]} strokeOpacity={0.4} strokeWidth={3} />}
        </G>
      ))}
    </G>
  );
}

/** Vista dall'alto di una strada per la segnaletica orizzontale. */
function RoadScene({ children }: { children: ReactNode }) {
  return (
    <G>
      <Rect x={4} y={4} width={92} height={92} rx={10} fill="#7FB069" />
      <Rect x={18} y={4} width={64} height={92} fill={ROAD} />
      <Rect x={18} y={4} width={2} height={92} fill={WHITE} />
      <Rect x={80} y={4} width={2} height={92} fill={WHITE} />
      {children}
    </G>
  );
}

/** Tre frecce curve in senso antiorario attorno al centro. */
function roundaboutArrows() {
  const r = 22;
  const pt = (deg: number, rad = r) => {
    const t = (deg * Math.PI) / 180;
    return [50 + rad * Math.cos(t), 50 + rad * Math.sin(t)];
  };
  return [0, 120, 240].map((base) => {
    const start = base + 100;
    const end = base + 22;
    const [sx, sy] = pt(start);
    const [ex, ey] = pt(end);
    const t = (end * Math.PI) / 180;
    const dir = [Math.sin(t), -Math.cos(t)]; // tangente in senso antiorario
    const tip = [ex + dir[0] * 9, ey + dir[1] * 9];
    const [ox, oy] = pt(end, r + 8);
    const [ix, iy] = pt(end, r - 8);
    return (
      <G key={base}>
        <Path d={`M${sx},${sy} A${r},${r} 0 0,0 ${ex},${ey}`} stroke={WHITE} strokeWidth={6.5} fill="none" />
        <Polygon points={`${tip[0]},${tip[1]} ${ox},${oy} ${ix},${iy}`} fill={WHITE} />
      </G>
    );
  });
}

/* ---------- Catalogo ---------- */

export const SIGNS = {
  // Pericolo
  curva_dx: { name: 'Curva pericolosa a destra', draw: () => (
    <Danger>
      <Path d="M44,76 L44,62 Q44,50 56,48" stroke={BLACK} strokeWidth={6} fill="none" />
      <Polygon points="54,40 66,48 54,56" fill={BLACK} />
    </Danger>
  ) },
  curva_sx: { name: 'Curva pericolosa a sinistra', draw: () => (
    <Danger>
      <G transform={MIRROR}>
        <Path d="M44,76 L44,62 Q44,50 56,48" stroke={BLACK} strokeWidth={6} fill="none" />
        <Polygon points="54,40 66,48 54,56" fill={BLACK} />
      </G>
    </Danger>
  ) },
  doppia_curva_dx: { name: 'Doppia curva, la prima a destra', draw: () => (
    <Danger>
      <Path d="M42,78 Q42,64 54,60 Q62,56 56,44" stroke={BLACK} strokeWidth={5.5} fill="none" />
      <Polygon points="52.4,35.8 61.4,41.3 50.6,46.7" fill={BLACK} />
    </Danger>
  ) },
  dosso: { name: 'Dosso', draw: () => (
    <Danger>
      <Path d="M27,74 Q50,46 73,74 Z" fill={BLACK} />
    </Danger>
  ) },
  strettoia: { name: 'Strettoia simmetrica', draw: () => (
    <Danger>
      <Path d="M38,77 L38,64 L44,55 L44,42" stroke={BLACK} strokeWidth={5} fill="none" />
      <Path d="M62,77 L62,64 L56,55 L56,42" stroke={BLACK} strokeWidth={5} fill="none" />
    </Danger>
  ) },
  semaforo_pericolo: { name: 'Semaforo', draw: () => <Danger>{trafficLight(undefined, 0.95, 50, 59)}</Danger> },
  altri_pericoli: { name: 'Altri pericoli', draw: () => (
    <Danger>
      <Rect x={45.5} y={40} width={9} height={24} rx={3} fill={BLACK} />
      <Circle cx={50} cy={71} r={4.8} fill={BLACK} />
    </Danger>
  ) },
  incrocio_dx: { name: 'Intersezione con precedenza a destra', draw: () => (
    <Danger>
      <Rect x={46.5} y={39} width={7} height={39} fill={BLACK} />
      <Rect x={33} y={53} width={34} height={7} fill={BLACK} />
    </Danger>
  ) },
  incrocio_precedenza: { name: 'Intersezione con diritto di precedenza', draw: () => (
    <Danger>
      <Rect x={44.5} y={38} width={11} height={40} fill={BLACK} />
      <Rect x={33} y={55} width={34} height={4} fill={BLACK} />
    </Danger>
  ) },
  pl_barriere: { name: 'Passaggio a livello con barriere', draw: () => (
    <Danger>
      <Rect x={31} y={54} width={38} height={4} fill={BLACK} />
      <Rect x={31} y={64} width={38} height={4} fill={BLACK} />
      {[33, 41, 50, 59, 67].map((x) => (
        <Rect key={x} x={x - 1.5} y={48} width={3} height={27} fill={BLACK} />
      ))}
    </Danger>
  ) },
  pl_senza: { name: 'Passaggio a livello senza barriere', draw: () => (
    <Danger>
      <Rect x={30} y={54} width={30} height={13} rx={2} fill={BLACK} />
      <Rect x={56} y={46} width={14} height={21} rx={2} fill={BLACK} />
      <Rect x={34} y={46} width={6} height={9} fill={BLACK} />
      <Rect x={58.5} y={49} width={9} height={6} fill={WHITE} />
      {[36, 47, 63].map((x) => (
        <Circle key={x} cx={x} cy={71} r={4.5} fill={BLACK} />
      ))}
    </Danger>
  ) },
  sdrucciolevole: { name: 'Strada sdrucciolevole', draw: () => (
    <Danger>
      <G transform="rotate(-12 50 50)">{carRear(50, BLACK)}</G>
      <Path d="M38,78 q-4,-4 0,-8 q4,-4 0,-8" stroke={BLACK} strokeWidth={2.5} fill="none" />
      <Path d="M62,78 q-4,-4 0,-8 q4,-4 0,-8" stroke={BLACK} strokeWidth={2.5} fill="none" />
    </Danger>
  ) },
  bambini: { name: 'Bambini', draw: () => (
    <Danger>
      {person(42, 62, 0.95, BLACK)}
      {person(58, 66, 0.72, BLACK)}
    </Danger>
  ) },
  discesa: { name: 'Discesa pericolosa', draw: () => (
    <Danger>
      <Polygon points="28,52 28,77 72,77" fill={BLACK} />
      <SvgText x={58} y={60} fontSize={11} fontWeight="bold" fill={BLACK} textAnchor="middle">10%</SvgText>
    </Danger>
  ) },
  lavori: { name: 'Lavori in corso (temporaneo)', draw: () => (
    <Danger temporary>
      <Circle cx={43} cy={46} r={4.5} fill={BLACK} />
      <Path d="M44,52 L48,64 M48,64 L44,77 M48,64 L56,75 M45,55 L58,58" stroke={BLACK} strokeWidth={4} strokeLinecap="round" fill="none" />
      <Path d="M58,58 L66,72" stroke={BLACK} strokeWidth={2.5} />
      <Path d="M56,78 Q64,68 74,78 Z" fill={BLACK} />
    </Danger>
  ) },

  // Divieto
  divieto_transito: { name: 'Divieto di transito', draw: () => <Prohibition /> },
  senso_vietato: { name: 'Senso vietato', draw: () => (
    <G>
      <Circle cx={50} cy={50} r={48} fill={WHITE} />
      <Circle cx={50} cy={50} r={46} fill={RED} />
      <Rect x={18} y={42} width={64} height={16} fill={WHITE} />
    </G>
  ) },
  divieto_sorpasso: { name: 'Divieto di sorpasso', draw: () => <Prohibition>{[carRear(36, RED), carRear(64, BLACK)]}</Prohibition> },
  fine_sorpasso: { name: 'Fine del divieto di sorpasso', draw: () => <EndSign>{[carRear(36, GRAY), carRear(64, GRAY)]}</EndSign> },
  limite_50: { name: 'Limite massimo di velocità 50 km/h', draw: () => (
    <Prohibition>
      <SvgText x={50} y={63} fontSize={38} fontWeight="bold" fill={BLACK} textAnchor="middle">50</SvgText>
    </Prohibition>
  ) },
  fine_limite_50: { name: 'Fine limite massimo di velocità 50 km/h', draw: () => (
    <EndSign>
      <SvgText x={50} y={63} fontSize={38} fontWeight="bold" fill={GRAY} textAnchor="middle">50</SvgText>
    </EndSign>
  ) },
  divieto_sosta: { name: 'Divieto di sosta', draw: () => (
    <Prohibition blue>
      <Line x1={26} y1={26} x2={74} y2={74} stroke={RED} strokeWidth={9} />
    </Prohibition>
  ) },
  divieto_fermata: { name: 'Divieto di fermata', draw: () => (
    <Prohibition blue>
      <Line x1={26} y1={26} x2={74} y2={74} stroke={RED} strokeWidth={9} />
      <Line x1={74} y1={26} x2={26} y2={74} stroke={RED} strokeWidth={9} />
    </Prohibition>
  ) },
  divieto_acustiche: { name: 'Divieto di segnalazioni acustiche', draw: () => (
    <Prohibition>
      <Path d="M28,44 L40,44 L64,32 L64,68 L40,56 L28,56 Z" fill={BLACK} />
      <Line x1={26} y1={26} x2={74} y2={74} stroke={RED} strokeWidth={7} />
    </Prohibition>
  ) },
  divieto_svolta_dx: { name: 'Divieto di svolta a destra', draw: () => (
    <Prohibition>
      <Path d="M42,76 L42,52 Q42,42 52,42 L58,42" stroke={BLACK} strokeWidth={9} fill="none" />
      <Polygon points="56,30 72,42 56,54" fill={BLACK} />
      <Line x1={26} y1={26} x2={74} y2={74} stroke={RED} strokeWidth={7} />
    </Prohibition>
  ) },
  divieto_inversione: { name: 'Divieto di inversione del senso di marcia', draw: () => (
    <Prohibition>
      <Path d="M60,76 L60,46 Q60,32 48,32 Q36,32 36,46 L36,52" stroke={BLACK} strokeWidth={8} fill="none" />
      <Polygon points="26,50 46,50 36,64" fill={BLACK} />
      <Line x1={26} y1={26} x2={74} y2={74} stroke={RED} strokeWidth={7} />
    </Prohibition>
  ) },
  via_libera: { name: 'Via libera', draw: () => <EndSign /> },

  // Obbligo
  dir_dritto: { name: 'Direzione obbligatoria diritto', draw: () => <Obligation>{arrow(50, 50, 0, WHITE, 1.25)}</Obligation> },
  dir_destra: { name: 'Direzione obbligatoria a destra', draw: () => <Obligation>{arrow(50, 50, 90, WHITE, 1.25)}</Obligation> },
  dir_sinistra: { name: 'Direzione obbligatoria a sinistra', draw: () => <Obligation>{arrow(50, 50, -90, WHITE, 1.25)}</Obligation> },
  passaggio_dx: { name: 'Passaggio obbligatorio a destra', draw: () => <Obligation>{arrow(50, 50, 135, WHITE, 1.25)}</Obligation> },
  passaggio_sx: { name: 'Passaggio obbligatorio a sinistra', draw: () => <Obligation>{arrow(50, 50, -135, WHITE, 1.25)}</Obligation> },
  rotatoria: { name: 'Rotatoria', draw: () => <Obligation>{roundaboutArrows()}</Obligation> },
  limite_minimo_30: { name: 'Limite minimo di velocità 30 km/h', draw: () => (
    <Obligation>
      <SvgText x={50} y={63} fontSize={38} fontWeight="bold" fill={WHITE} textAnchor="middle">30</SvgText>
    </Obligation>
  ) },
  catene: { name: 'Catene per neve obbligatorie', draw: () => (
    <Obligation>
      <Circle cx={50} cy={50} r={22} stroke={WHITE} strokeWidth={8} fill="none" />
      {[0, 45, 90, 135].map((a) => (
        <Rect key={a} x={46} y={22} width={8} height={56} rx={2} fill="none" stroke={WHITE} strokeWidth={2.5} transform={`rotate(${a} 50 50)`} />
      ))}
    </Obligation>
  ) },
  pedonale: { name: 'Percorso pedonale', draw: () => (
    <Obligation>
      {person(44, 54, 1.25, WHITE)}
      {person(62, 60, 0.85, WHITE)}
    </Obligation>
  ) },
  ciclabile: { name: 'Pista ciclabile', draw: () => (
    <Obligation>
      <Circle cx={32} cy={60} r={11} stroke={WHITE} strokeWidth={3.5} fill="none" />
      <Circle cx={68} cy={60} r={11} stroke={WHITE} strokeWidth={3.5} fill="none" />
      <Path d="M32,60 L44,42 L62,42 L68,60 M44,42 L52,60 L62,42 M40,36 L48,36 M60,42 L58,34 L64,34" stroke={WHITE} strokeWidth={3.5} fill="none" strokeLinejoin="round" />
    </Obligation>
  ) },

  // Precedenza
  dare_precedenza: { name: 'Dare precedenza', draw: () => (
    <G>
      <Polygon points="5,12 95,12 50,92" fill={WHITE} stroke={WHITE} strokeWidth={10} strokeLinejoin="round" />
      <Polygon points="7,13 93,13 50,90" fill={RED} stroke={RED} strokeWidth={6} strokeLinejoin="round" />
      <Polygon points="22,22 78,22 50,72" fill={WHITE} />
    </G>
  ) },
  stop: { name: 'Fermarsi e dare precedenza (STOP)', draw: () => (
    <G>
      <Polygon points="30,2 70,2 98,30 98,70 70,98 30,98 2,70 2,30" fill={WHITE} />
      <Polygon points="31.5,6 68.5,6 94,31.5 94,68.5 68.5,94 31.5,94 6,68.5 6,31.5" fill={RED} />
      <SvgText x={50} y={60} fontSize={27} fontWeight="bold" fill={WHITE} textAnchor="middle">STOP</SvgText>
    </G>
  ) },
  diritto_precedenza: { name: 'Diritto di precedenza', draw: () => (
    <G>
      <Polygon points="50,2 98,50 50,98 2,50" fill={WHITE} stroke="#9A9A9A" strokeWidth={1.5} />
      <Polygon points="50,16 84,50 50,84 16,50" fill={YELLOW} />
    </G>
  ) },
  fine_diritto: { name: 'Fine del diritto di precedenza', draw: () => (
    <G>
      <Polygon points="50,2 98,50 50,98 2,50" fill={WHITE} stroke="#9A9A9A" strokeWidth={1.5} />
      <Polygon points="50,16 84,50 50,84 16,50" fill={YELLOW} />
      {[-6, -3, 0, 3, 6].map((o) => (
        <Line key={o} x1={20 + o} y1={80 + o} x2={80 + o} y2={20 + o} stroke={BLACK} strokeWidth={1.6} />
      ))}
    </G>
  ) },

  // Indicazione
  inizio_centro: { name: 'Inizio centro abitato', draw: () => <Panel color={WHITE} text="ROMA" textColor={BLACK} size={24} /> },
  fine_centro: { name: 'Fine centro abitato', draw: () => (
    <G>
      <Panel color={WHITE} text="ROMA" textColor={BLACK} size={24} />
      <Line x1={10} y1={70} x2={90} y2={30} stroke={RED} strokeWidth={5} />
    </G>
  ) },
  dir_autostrada: { name: 'Direzione autostradale', draw: () => <Panel color={GREEN} text="MILANO" arrow="right" size={14} /> },
  dir_extraurbana: { name: 'Direzione su strada extraurbana', draw: () => <Panel color={BLUE} text="FIRENZE" arrow="right" size={13} /> },
  dir_urbana: { name: 'Direzione in centro abitato', draw: () => <Panel color={WHITE} text="CENTRO" textColor={BLACK} arrow="left" size={14} /> },
  turistico: { name: 'Indicazione turistica', draw: () => <Panel color={BROWN} text="MUSEO" arrow="right" size={15} /> },
  senza_uscita: { name: 'Strada senza uscita', draw: () => (
    <Square color={BLUE}>
      <Rect x={43} y={40} width={14} height={42} fill={WHITE} />
      <Rect x={26} y={24} width={48} height={14} fill={RED} />
    </Square>
  ) },
  ospedale: { name: 'Ospedale', draw: () => (
    <Square color={BLUE}>
      <Rect x={24} y={24} width={52} height={52} rx={4} fill={WHITE} />
      <SvgText x={50} y={66} fontSize={40} fontWeight="bold" fill={BLUE} textAnchor="middle">H</SvgText>
    </Square>
  ) },
  parcheggio: { name: 'Parcheggio', draw: () => (
    <Square color={BLUE}>
      <SvgText x={50} y={72} fontSize={58} fontWeight="bold" fill={WHITE} textAnchor="middle">P</SvgText>
    </Square>
  ) },
  inizio_autostrada: { name: 'Inizio autostrada', draw: () => (
    <Square color={GREEN}>
      <Rect x={18} y={30} width={64} height={10} fill={WHITE} />
      <Rect x={22} y={40} width={6} height={10} fill={WHITE} />
      <Rect x={72} y={40} width={6} height={10} fill={WHITE} />
      <Path d="M30,84 L44,46 L56,46 L70,84 Z" fill={WHITE} />
      <Rect x={48.5} y={52} width={3} height={8} fill={GREEN} />
      <Rect x={48.5} y={66} width={3} height={10} fill={GREEN} />
    </Square>
  ) },

  // Pannelli integrativi
  pannello_distanza: { name: 'Pannello integrativo: distanza', draw: () => <Panel color={WHITE} text="150 m" textColor={BLACK} size={22} /> },
  pannello_estesa: { name: 'Pannello integrativo: estesa', draw: () => (
    <G>
      <Panel color={WHITE} text="500 m" textColor={BLACK} size={20} />
      <Rect x={16} y={36} width={60} height={28} fill={WHITE} />
      <SvgText x={58} y={57} fontSize={20} fontWeight="bold" fill={BLACK} textAnchor="middle">500 m</SvgText>
      <Line x1={22} y1={38} x2={22} y2={62} stroke={BLACK} strokeWidth={2.5} />
      <Polygon points="17,40 27,40 22,32" fill={BLACK} />
      <Polygon points="17,60 27,60 22,68" fill={BLACK} />
    </G>
  ) },
  pannello_orario: { name: 'Pannello integrativo: orario', draw: () => <Panel color={WHITE} text="8 – 20" textColor={BLACK} size={22} /> },
  pannello_rimozione: { name: 'Pannello integrativo: zona rimozione', draw: () => (
    <G>
      <Panel color={WHITE} text="" textColor={BLACK} />
      <SvgText x={50} y={47} fontSize={13} fontWeight="bold" fill={BLACK} textAnchor="middle">ZONA</SvgText>
      <SvgText x={50} y={63} fontSize={13} fontWeight="bold" fill={BLACK} textAnchor="middle">RIMOZIONE</SvgText>
    </G>
  ) },

  // Semafori
  semaforo_rosso: { name: 'Semaforo: luce rossa', draw: () => <TrafficLightBig lit="red" /> },
  semaforo_giallo: { name: 'Semaforo: luce gialla', draw: () => <TrafficLightBig lit="yellow" /> },
  semaforo_verde: { name: 'Semaforo: luce verde', draw: () => <TrafficLightBig lit="green" /> },

  // Segnaletica orizzontale
  striscia_continua: { name: 'Striscia longitudinale continua', draw: () => (
    <RoadScene>
      <Rect x={48.5} y={4} width={3} height={92} fill={WHITE} />
    </RoadScene>
  ) },
  striscia_discontinua: { name: 'Striscia longitudinale discontinua', draw: () => (
    <RoadScene>
      {[8, 32, 56, 80].map((y) => (
        <Rect key={y} x={48.5} y={y} width={3} height={13} fill={WHITE} />
      ))}
    </RoadScene>
  ) },
  striscia_mista: { name: 'Striscia continua affiancata a una discontinua', draw: () => (
    <RoadScene>
      <Rect x={46} y={4} width={3} height={92} fill={WHITE} />
      {[8, 32, 56, 80].map((y) => (
        <Rect key={y} x={52} y={y} width={3} height={13} fill={WHITE} />
      ))}
    </RoadScene>
  ) },
  strisce_pedonali: { name: 'Attraversamento pedonale', draw: () => (
    <RoadScene>
      {[24, 34, 44, 54, 64, 74].map((x) => (
        <Rect key={x} x={x - 2} y={36} width={6} height={28} fill={WHITE} />
      ))}
    </RoadScene>
  ) },
  stalli_blu: { name: 'Stalli di sosta a pagamento', draw: () => (
    <RoadScene>
      {[10, 38, 66].map((y) => (
        <Rect key={y} x={60} y={y} width={18} height={24} fill="none" stroke="#2F7DE1" strokeWidth={2.5} />
      ))}
    </RoadScene>
  ) },
  linea_arresto: { name: 'Linea di arresto con STOP', draw: () => (
    <RoadScene>
      <Rect x={50} y={36} width={30} height={5} fill={WHITE} />
      <SvgText x={65} y={58} fontSize={12} fontWeight="bold" fill={WHITE} textAnchor="middle">STOP</SvgText>
      <Rect x={48.5} y={4} width={3} height={37} fill={WHITE} />
    </RoadScene>
  ) },
  isola_zebrata: { name: 'Isola di traffico zebrata', draw: () => (
    <RoadScene>
      <Polygon points="50,14 60,86 40,86" fill="none" stroke={WHITE} strokeWidth={2} />
      {[30, 42, 54, 66, 78].map((y) => (
        <Line key={y} x1={50 - (y - 14) * 0.13} y1={y + 3} x2={50 + (y - 14) * 0.13} y2={y - 3} stroke={WHITE} strokeWidth={2.5} />
      ))}
    </RoadScene>
  ) },
} satisfies Record<string, { name: string; draw: () => ReactNode }>;

export type SignId = keyof typeof SIGNS;

export function RoadSign({ id, size = 120 }: { id: SignId; size?: number }) {
  const sign = SIGNS[id];
  if (!sign) return null;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel={`Segnale: ${sign.name}`}>
      {sign.draw()}
    </Svg>
  );
}
