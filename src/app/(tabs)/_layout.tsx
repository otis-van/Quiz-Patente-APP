import { Tabs } from 'expo-router/js-tabs';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, F } from '@/theme';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <View style={[styles.icon, focused && styles.iconFocused]}>
      <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.55 }}>{emoji}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const tab = (title: string, emoji: string) => ({
    title,
    tabBarIcon: ({ focused }: { focused: boolean }) => <TabIcon emoji={emoji} focused={focused} />,
  });
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.blue,
        tabBarInactiveTintColor: C.gray,
        tabBarLabelStyle: { fontFamily: F.bold, fontSize: 11 },
        tabBarStyle: {
          borderTopWidth: 2,
          borderTopColor: C.grayLight,
          height: 64 + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom + 6,
        },
      }}>
      <Tabs.Screen name="index" options={tab('Percorso', '🏠')} />
      <Tabs.Screen name="daily" options={tab('Oggi', '📅')} />
      <Tabs.Screen name="exam" options={tab('Esame', '📝')} />
      <Tabs.Screen name="profile" options={tab('Profilo', '👤')} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  icon: { width: 44, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  iconFocused: { backgroundColor: C.blueLight, borderColor: '#84D8FF' },
});
