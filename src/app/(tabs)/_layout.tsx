import { Tabs } from 'expo-router/js-tabs';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { F, makeStyles, useColors } from '@/theme';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  const styles = useStyles();
  return (
    <View style={[styles.icon, focused && styles.iconFocused]}>
      <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.55 }}>{emoji}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const C = useColors();
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
          backgroundColor: C.bg,
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

const useStyles = makeStyles((C) => ({
  icon: { width: 44, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  iconFocused: { backgroundColor: C.blueLight, borderColor: C.blueBorder },
}));
