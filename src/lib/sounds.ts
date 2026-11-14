import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

import { useSettings } from '@/store/settings';

/**
 * Effetti sonori originali (sintetizzati per l'app, nessun diritto di terzi).
 * Rispettano l'interruttore "Suoni" del Profilo e, su iPhone/iPad, il tasto silenzioso.
 */
const SOURCES = {
  jingle: require('../../assets/sounds/jingle.wav'),
  tap: require('../../assets/sounds/tap.wav'),
  correct: require('../../assets/sounds/correct.wav'),
  wrong: require('../../assets/sounds/wrong.wav'),
  complete: require('../../assets/sounds/complete.wav'),
  fail: require('../../assets/sounds/fail.wav'),
};

export type SoundName = keyof typeof SOURCES;

const players: Partial<Record<SoundName, AudioPlayer>> = {};
let modeSet = false;

function player(name: SoundName) {
  if (!players[name]) {
    const p = createAudioPlayer(SOURCES[name]);
    p.volume = name === 'tap' ? 0.4 : 0.8;
    players[name] = p;
  }
  return players[name];
}

/** Carica in anticipo i suoni brevi, così partono senza ritardo. */
export function preloadSounds() {
  (['tap', 'correct', 'wrong'] as SoundName[]).forEach((n) => {
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
      setAudioModeAsync({ playsInSilentMode: false }).catch(() => {});
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
