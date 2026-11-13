import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export function haptic(kind: 'light' | 'success' | 'error') {
  if (Platform.OS === 'web') return;
  try {
    if (kind === 'light') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    else
      void Haptics.notificationAsync(
        kind === 'success' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
      );
  } catch {
    // feedback aptico non disponibile
  }
}
