import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemeMode = 'system' | 'light' | 'dark';

/** Preferenze legate al singolo dispositivo (non sincronizzate). */
interface SettingsState {
  themeMode: ThemeMode;
  reminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  /** Animazione con l'auto all'apertura dell'app. */
  introEnabled: boolean;
  setIntroEnabled: (on: boolean) => void;
  /** Effetti sonori e jingle d'apertura. */
  soundEnabled: boolean;
  setSoundEnabled: (on: boolean) => void;
  setThemeMode: (m: ThemeMode) => void;
  setReminder: (r: Partial<Pick<SettingsState, 'reminderEnabled' | 'reminderHour' | 'reminderMinute'>>) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      themeMode: 'system',
      reminderEnabled: false,
      reminderHour: 19,
      reminderMinute: 0,
      introEnabled: true,
      setIntroEnabled: (introEnabled) => set({ introEnabled }),
      soundEnabled: true,
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      setThemeMode: (themeMode) => set({ themeMode }),
      setReminder: (r) => set(r),
    }),
    { name: 'quiz-patente-settings', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

/** true quando le preferenze salvate sono state caricate dal dispositivo. */
export function useSettingsHydrated() {
  return useSyncExternalStore(
    (cb) => useSettings.persist.onFinishHydration(cb),
    () => useSettings.persist.hasHydrated(),
    () => false,
  );
}
