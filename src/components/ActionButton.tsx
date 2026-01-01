/**
 * ============================================================================
 * ActionButton - Grid action button with icon
 * ============================================================================
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { hapticFeedback } from '../lib';

export interface ActionButtonProps {
  icon: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
  color?: string;
  disabled?: boolean;
}

export function ActionButton({
  icon,
  label,
  subtitle,
  onPress,
  color = '#0ea5e9',
  disabled = false,
}: ActionButtonProps): React.ReactElement {
  
  const handlePress = async () => {
    if (disabled) return;
    await hapticFeedback('light');
    onPress();
  };

  return (
    <TouchableOpacity
      style={[styles.container, disabled && styles.disabled]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  
  disabled: {
    opacity: 0.5,
  },
  
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  icon: {
    fontSize: 28,
  },
  
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
});
