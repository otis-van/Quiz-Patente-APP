import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemeMode = 'system' | 'light' | 'dark';

/** Preferenze legate al singolo dispositivo (non sincronizzate). */
interface SettingsState {
  themeMode: ThemeMode;
  reminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
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
      setThemeMode: (themeMode) => set({ themeMode }),
      setReminder: (r) => set(r),
    }),
    { name: 'quiz-patente-settings', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
