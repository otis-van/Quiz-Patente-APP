import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { useSettings } from '@/store/settings';

/**
 * Effetti sonori originali (sintetizzati per l'app, nessun diritto di terzi).
 * Rispettano l'interruttore "Effetti sonori" del Profilo; su iPhone/iPad anche il tasto silenzioso,
 * su Android il volume multimediale.
 */
const SOURCES = {
  jingle: require('../../assets/sounds/jingle.wav'),
  tap: require('../../assets/sounds/tap.wav'),
  correct: require('../../assets/sounds/correct.wav'),
  wrong: require('../../assets/sounds/wrong.wav'),
  complete: require('../../assets/sounds/complete.wav'),
  fail: require('../../assets/sounds/fail.wav'),
  tab: require('../../assets/sounds/tab.wav'),
  open: require('../../assets/sounds/open.wav'),
};

export type SoundName = keyof typeof SOURCES;

const players: Partial<Record<SoundName, AudioPlayer>> = {};
let modeSet = false;

function player(name: SoundName) {
  if (!players[name]) {
    const p = createAudioPlayer(SOURCES[name]);
    p.volume = name === 'tap' || name === 'tab' ? 0.45 : name === 'open' ? 0.6 : 0.8;
    players[name] = p;
  }
  return players[name];
}

/** Carica in anticipo i suoni brevi, così partono senza ritardo. */
export function preloadSounds() {
  (['tap', 'tab', 'open', 'correct', 'wrong'] as SoundName[]).forEach((n) => {
    try {
      player(n);
    } catch {
      // ignora: i suoni sono un extra
    }
  });
}

export function playSound(name: SoundName) {
  if (!useSettings.getState().soundEnabled) return;
  try {
    if (!modeSet) {
      modeSet = true;
      // iPhone/iPad: rispetta il tasto silenzioso. Android: segue il volume multimediale
      // (in modalità vibrazione o silenziosa le suonerie tacciono, ma i suoni dell'app no).
      setAudioModeAsync({ playsInSilentMode: Platform.OS !== 'ios' }).catch(() => {});
    }
    const p = player(name);
    p.seekTo(0).catch(() => {});
    p.play();
  } catch {
    // sul web il browser può bloccare l'audio prima di un'interazione: va bene così
  }
}

export function stopSound(name: SoundName) {
  try {
    players[name]?.pause();
  } catch {
    // niente
  }
}

/** Suono di apertura di una schermata (da chiamare una volta nel componente della schermata). */
export function useOpenSound() {
  useEffect(() => {
    playSound('open');
  }, []);
}
