/**
 * ============================================================================
 * Card - Container component for content sections
 * ============================================================================
 */

import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'highlight';
  padding?: 'none' | 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

export function Card({
  children,
  variant = 'default',
  padding = 'medium',
  style,
}: CardProps): React.ReactElement {
  return (
    <View style={[
      styles.container,
      styles[`container_${variant}`],
      styles[`padding_${padding}`],
      style,
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
  },
  
  container_default: {
    backgroundColor: '#fff',
  },
  
  container_elevated: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  container_outlined: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  
  container_highlight: {
    backgroundColor: '#0ea5e9',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  
  padding_none: {
    padding: 0,
  },
  
  padding_small: {
    padding: 12,
  },
  
  padding_medium: {
    padding: 20,
  },
  
  padding_large: {
    padding: 32,
  },
});
