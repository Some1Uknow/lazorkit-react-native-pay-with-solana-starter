// Clipboard & haptics utilities

import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { logger } from './errors';

// Copy text to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await Clipboard.setStringAsync(text);
    logger.debug('Clipboard', 'Text copied to clipboard', { length: text.length });
    return true;
  } catch (error) {
    logger.error('Clipboard', 'Failed to copy to clipboard', error);
    return false;
  }
}

// Read text from clipboard
export async function readFromClipboard(): Promise<string | null> {
  try {
    const text = await Clipboard.getStringAsync();
    return text || null;
  } catch (error) {
    logger.error('Clipboard', 'Failed to read from clipboard', error);
    return null;
  }
}

// Trigger haptic feedback
export async function hapticFeedback(
  type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'
): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }
  
  try {
    switch (type) {
      case 'light':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  } catch (error) {
    logger.debug('Haptics', 'Haptic feedback failed (device may not support it)');
  }
}
