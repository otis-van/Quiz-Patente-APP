import { Silkscreen_400Regular, Silkscreen_700Bold } from '@expo-google-fonts/silkscreen';
import { SpaceGrotesk_500Medium, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { IntroAnimation } from '@/components/IntroAnimation';
import { startReminderScheduler } from '@/lib/reminders';
import { preloadSounds } from '@/lib/sounds';
import { startAutoSync } from '@/lib/sync';
import { useAuth } from '@/store/auth';
import { useSettings, useSettingsHydrated } from '@/store/settings';
import { useColors } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const C = useColors();
  const [fontsLoaded, fontError] = useFonts({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
    SpaceMono_400Regular,
    SpaceMono_700Bold,
    Silkscreen_400Regular,
    Silkscreen_700Bold,
  });

  const hydrated = useSettingsHydrated();
  const introEnabled = useSettings((s) => s.introEnabled);
  const [introDone, setIntroDone] = useState(false);
  const finishIntro = useCallback(() => setIntroDone(true), []);

  useEffect(() => {
    const stopAuth = useAuth.getState().init();
    const stopSync = startAutoSync();
    const stopReminders = startReminderScheduler();
    preloadSounds();
    return () => {
      stopAuth();
      stopSync();
      stopReminders();
    };
  }, []);

  const ready = (fontsLoaded || !!fontError) && hydrated;
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  const base = C.dark ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: { ...base.colors, background: C.bg, card: C.surface, border: C.ink, text: C.text, primary: C.lilac },
  };

  return (
    <SafeAreaProvider>
      <ThemeProvider value={navTheme}>
        <StatusBar style={C.dark ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="quiz" options={{ gestureEnabled: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="exam-session" options={{ gestureEnabled: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="auth" options={{ presentation: 'modal' }} />
          <Stack.Screen name="chapter/[id]" />
          <Stack.Screen name="signs" />
        </Stack>
        {introEnabled && !introDone && <IntroAnimation onDone={finishIntro} />}
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
