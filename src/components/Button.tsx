/**
 * ============================================================================
 * Button - Primary action button with loading and disabled states
 * ============================================================================
 * 
 * A reusable button component with:
 * - Clear visual states (default, loading, disabled)
 * - Haptic feedback on press
 * - Consistent styling
 */

import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    ViewStyle,
} from 'react-native';
import { hapticFeedback } from '../lib';

// =============================================================================
// PROPS
// =============================================================================

export interface ButtonProps {
  /** Button label text */
  label: string;
  
  /** Callback when pressed */
  onPress: () => void;
  
  /** Show loading spinner */
  isLoading?: boolean;
  
  /** Disable the button */
  isDisabled?: boolean;
  
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  
  /** Button size */
  size?: 'small' | 'medium' | 'large';
  
  /** Optional icon (emoji or text) before label */
  icon?: string;
  
  /** Optional subtitle text below label */
  subtitle?: string;
  
  /** Custom container style */
  style?: ViewStyle;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function Button({
  label,
  onPress,
  isLoading = false,
  isDisabled = false,
  variant = 'primary',
  size = 'large',
  icon,
  subtitle,
  style,
}: ButtonProps): React.ReactElement {
  
  const handlePress = async () => {
    if (isLoading || isDisabled) return;
    
    // Haptic feedback on press
    await hapticFeedback('light');
    onPress();
  };

  // Determine if button is interactive
  const isInteractive = !isLoading && !isDisabled;

  // Get styles based on variant and state
  const containerStyle: ViewStyle[] = [
    styles.container,
    styles[`container_${size}`],
    styles[`container_${variant}`],
    !isInteractive && styles.container_disabled,
    style,
  ].filter(Boolean) as ViewStyle[];

  const labelStyle: TextStyle[] = [
    styles.label,
    styles[`label_${size}`],
    styles[`label_${variant}`],
    !isInteractive && styles.label_disabled,
  ].filter(Boolean) as TextStyle[];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={handlePress}
      disabled={!isInteractive}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ disabled: !isInteractive }}
      accessibilityLabel={label}
    >
      {isLoading ? (
        <ActivityIndicator 
          color={variant === 'ghost' ? '#0ea5e9' : '#fff'} 
          size={size === 'small' ? 'small' : 'small'}
        />
      ) : (
        <>
          {icon && <Text style={styles.icon}>{icon}</Text>}
          <Text style={labelStyle}>{label}</Text>
          {subtitle && (
            <Text style={[styles.subtitle, styles[`subtitle_${variant}`]]}>
              {subtitle}
            </Text>
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  
  // Size variants
  container_small: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  container_medium: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  container_large: {
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderRadius: 16,
  },
  
  // Color variants
  container_primary: {
    backgroundColor: '#0ea5e9',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  container_secondary: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  container_danger: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  container_ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  
  container_disabled: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0,
    elevation: 0,
  },
  
  // Icon
  icon: {
    fontSize: 20,
    marginBottom: 4,
  },
  
  // Label
  label: {
    fontWeight: '600',
  },
  
  label_small: {
    fontSize: 14,
  },
  label_medium: {
    fontSize: 16,
  },
  label_large: {
    fontSize: 18,
  },
  
  label_primary: {
    color: '#fff',
  },
  label_secondary: {
    color: '#0f172a',
  },
  label_danger: {
    color: '#fff',
  },
  label_ghost: {
    color: '#64748b',
  },
  
  label_disabled: {
    color: '#fff',
  },
  
  // Subtitle
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  subtitle_primary: {
    color: '#e0f2fe',
  },
  subtitle_secondary: {
    color: '#64748b',
  },
  subtitle_danger: {
    color: '#fecaca',
  },
  subtitle_ghost: {
    color: '#94a3b8',
  },
});
