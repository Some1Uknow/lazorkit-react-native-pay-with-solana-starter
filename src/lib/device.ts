/**
 * ============================================================================
 * CLIPBOARD & HAPTICS - Device utilities
 * ============================================================================
 */

import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { logger } from './errors';

// =============================================================================
// CLIPBOARD UTILITIES
// =============================================================================

/**
 * Copy text to clipboard
 * 
 * @returns true if successful, false otherwise
 * 
 * @example
 * const success = await copyToClipboard("5FHw...X6Pr");
 * if (success) {
 *   showToast("Address copied!");
 * }
 */
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

/**
 * Read text from clipboard
 * 
 * @returns Clipboard text or null if failed
 */
export async function readFromClipboard(): Promise<string | null> {
  try {
    const text = await Clipboard.getStringAsync();
    return text || null;
  } catch (error) {
    logger.error('Clipboard', 'Failed to read from clipboard', error);
    return null;
  }
}

// =============================================================================
// HAPTIC FEEDBACK
// =============================================================================

/**
 * Trigger haptic feedback
 * 
 * Types:
 * - 'light': Subtle feedback (e.g., button tap)
 * - 'medium': Standard feedback (e.g., selection change)
 * - 'heavy': Strong feedback (e.g., action completed)
 * - 'success': Success pattern
 * - 'warning': Warning pattern
 * - 'error': Error pattern
 * 
 * @example
 * // On button press
 * await hapticFeedback('light');
 * 
 * // On successful payment
 * await hapticFeedback('success');
 */
export async function hapticFeedback(
  type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'
): Promise<void> {
  // Haptics only work on iOS and Android, not web
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
    // Haptics can fail on some devices, don't crash the app
    logger.debug('Haptics', 'Haptic feedback failed (device may not support it)');
  }
}
