import { Nunito_600SemiBold, Nunito_800ExtraBold, Nunito_900Black, useFonts } from '@expo-google-fonts/nunito';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { startAutoSync } from '@/lib/sync';
import { useAuth } from '@/store/auth';
import { C } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Nunito_600SemiBold, Nunito_800ExtraBold, Nunito_900Black });

  useEffect(() => {
    const stopAuth = useAuth.getState().init();
    const stopSync = startAutoSync();
    return () => {
      stopAuth();
      stopSync();
    };
  }, []);

  const ready = fontsLoaded || !!fontError;
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.white } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="quiz" options={{ gestureEnabled: false, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="exam-session" options={{ gestureEnabled: false, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="auth" options={{ presentation: 'modal' }} />
        <Stack.Screen name="chapter/[id]" />
      </Stack>
    </SafeAreaProvider>
  );
}
