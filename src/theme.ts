import { StyleSheet, useColorScheme } from 'react-native';

import { useSettings } from '@/store/settings';

/**
 * Stile Y2K / neo-brutalista: sfondo crema (chiaro) o grigio (scuro),
 * contorni neri, ombre "dure" e accenti pastello.
 */
const accents = {
  yellow: '#FFD54A',
  lime: '#D4F25A',
  mint: '#9DEBDC',
  lilac: '#C9B5FF',
  pink: '#FF9ECF',
  blue: '#8DB9FF',
  orange: '#FFA866',
  red: '#FF6B6B',
  green: '#7EDC82',
  white: '#FFFFFF',
  /** Testo e icone sopra un colore d'accento: sempre inchiostro scuro. */
  onAccent: '#1B1B1F',
};

const light = {
  ...accents,
  dark: false,
  bg: '#FFF3DC',
  grid: '#F5E4C3',
  surface: '#FFFBF2',
  surfaceAlt: '#F6E8CD',
  ink: '#1B1B1F',
  text: '#1B1B1F',
  textLight: '#5F5648',
  muted: '#968A78',
  greenText: '#1F7A35',
  redText: '#C62D2D',
};

export type Palette = typeof light;

const dark: Palette = {
  ...accents,
  dark: true,
  bg: '#2C2C31',
  grid: '#35353B',
  surface: '#3C3C43',
  surfaceAlt: '#4A4A52',
  ink: '#0F0F12',
  text: '#F7EFDF',
  textLight: '#CFC6B6',
  muted: '#9A958D',
  greenText: '#9BEA9F',
  redText: '#FF9A9A',
};

/** Tavolozza attiva: segue la preferenza dell'utente o quella del sistema. */
export function useColors(): Palette {
  const system = useColorScheme();
  const mode = useSettings((s) => s.themeMode);
  const isDark = mode === 'dark' || (mode === 'system' && system === 'dark');
  return isDark ? dark : light;
}

type Styles = Parameters<typeof StyleSheet.create>[0];

/** Crea un hook di stili che si ricalcola (una volta sola) per ciascun tema. */
export function makeStyles<S extends Styles>(factory: (c: Palette) => S & Styles) {
  const cache = new Map<Palette, Readonly<S>>();
  return function useStyles(): Readonly<S> {
    const c = useColors();
    const hit = cache.get(c);
    if (hit) return hit;
    const created = StyleSheet.create(factory(c)) as Readonly<S>;
    cache.set(c, created);
    return created;
  };
}

/** Ombra netta, senza sfocatura, spostata in basso a destra. */
export const hardShadow = (c: Palette, size = 4) => ({ boxShadow: `${size}px ${size}px 0px ${c.ink}` });

/** Bordo + ombra standard dei riquadri. */
export const boxed = (c: Palette, size = 4) => ({
  borderWidth: 2,
  borderColor: c.ink,
  borderRadius: RADIUS,
  ...hardShadow(c, size),
});

export const RADIUS = 6;

/**
 * Font: Space Grotesk per i testi, Space Mono per i titoli,
 * Silkscreen (pixel) per etichette, bottoni e barre delle finestre.
 */
export const F = {
  regular: 'SpaceGrotesk_500Medium',
  bold: 'SpaceGrotesk_700Bold',
  black: 'SpaceMono_700Bold',
  mono: 'SpaceMono_400Regular',
  pixel: 'Silkscreen_400Regular',
  pixelBold: 'Silkscreen_700Bold',
} as const;

export const MAX_WIDTH = 640;
