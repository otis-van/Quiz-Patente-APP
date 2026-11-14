import { Tabs } from 'expo-router/js-tabs';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, IconName } from '@/components/Icon';
import { F, makeStyles, useColors } from '@/theme';

function TabIcon({ icon, focused }: { icon: IconName; focused: boolean }) {
  const styles = useStyles();
  return (
    <View style={[styles.icon, focused && styles.iconFocused]}>
      <Icon name={icon} size={24} />
    </View>
  );
}

export default function TabsLayout() {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const tab = (title: string, icon: IconName) => ({
    title,
    tabBarIcon: ({ focused }: { focused: boolean }) => <TabIcon icon={icon} focused={focused} />,
  });
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.text,
        tabBarInactiveTintColor: C.muted,
        tabBarLabelStyle: { fontFamily: F.pixel, fontSize: 10, marginTop: 2 },
        tabBarStyle: {
          backgroundColor: C.surface,
          borderTopWidth: 2,
          borderTopColor: C.ink,
          height: 68 + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom + 6,
        },
      }}>
      <Tabs.Screen name="index" options={tab('Percorso', 'home')} />
      <Tabs.Screen name="daily" options={tab('Oggi', 'calendar')} />
      <Tabs.Screen name="exam" options={tab('Esame', 'doc')} />
      <Tabs.Screen name="profile" options={tab('Profilo', 'smiley')} />
    </Tabs>
  );
}

const useStyles = makeStyles((C) => ({
  icon: {
    width: 46,
    height: 34,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconFocused: { backgroundColor: C.yellow, borderColor: C.ink, boxShadow: `2px 2px 0px ${C.ink}` },
}));
