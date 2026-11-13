import { StyleSheet, useColorScheme } from 'react-native';

import { useSettings } from '@/store/settings';

/** Colori del marchio: uguali in tema chiaro e scuro. */
const brand = {
  green: '#58CC02',
  greenDark: '#58A700',
  blue: '#1CB0F6',
  blueDark: '#1899D6',
  red: '#FF4B4B',
  redDark: '#EA2B2B',
  yellow: '#FFC800',
  yellowDark: '#E5A400',
  orange: '#FF9600',
  purple: '#CE82FF',
  purpleDark: '#A568CC',
  /** Bianco "vero": testo sui bottoni colorati, icone, ecc. */
  white: '#FFFFFF',
};

const light = {
  ...brand,
  dark: false,
  bg: '#FFFFFF',
  text: '#4B4B4B',
  textLight: '#777777',
  gray: '#AFAFAF',
  grayLight: '#E5E5E5',
  grayBg: '#F7F7F7',
  greenLight: '#D7FFB8',
  redLight: '#FFDFE0',
  blueLight: '#DDF4FF',
  blueBorder: '#84D8FF',
  yellowLight: '#FFF9E0',
  yellowBorder: '#FFE580',
  lockedEdge: '#CECECE',
  greenText: '#58A700',
  redText: '#EA2B2B',
};

export type Palette = typeof light;

const dark: Palette = {
  ...brand,
  dark: true,
  bg: '#131F24',
  text: '#F1F7FB',
  textLight: '#AFC2CB',
  gray: '#6F8590',
  grayLight: '#37464F',
  grayBg: '#202F36',
  greenLight: '#1F3416',
  redLight: '#3B1E23',
  blueLight: '#173A4D',
  blueBorder: '#1F6E94',
  yellowLight: '#332C10',
  yellowBorder: '#6B5A12',
  lockedEdge: '#2A363C',
  greenText: '#79C33A',
  redText: '#FF7B7B',
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

export const F = {
  regular: 'Nunito_600SemiBold',
  bold: 'Nunito_800ExtraBold',
  black: 'Nunito_900Black',
} as const;

export const MAX_WIDTH = 640;
