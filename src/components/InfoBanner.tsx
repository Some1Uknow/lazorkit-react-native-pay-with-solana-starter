/**
 * ============================================================================
 * InfoBanner - Display contextual information
 * ============================================================================
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export interface InfoBannerProps {
  icon: string;
  title: string;
  message: string;
  variant?: 'info' | 'warning' | 'success' | 'error';
}

export function InfoBanner({
  icon,
  title,
  message,
  variant = 'info',
}: InfoBannerProps): React.ReactElement {
  return (
    <View style={[styles.container, styles[`container_${variant}`]]}>
      <Text style={styles.icon}>{icon}</Text>
      <View style={styles.content}>
        <Text style={[styles.title, styles[`title_${variant}`]]}>{title}</Text>
        <Text style={[styles.message, styles[`message_${variant}`]]}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  
  container_info: {
    backgroundColor: '#e0f2fe',
    borderColor: '#0ea5e9',
  },
  container_warning: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  container_success: {
    backgroundColor: '#dcfce7',
    borderColor: '#22c55e',
  },
  container_error: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
  },
  
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  
  content: {
    flex: 1,
  },
  
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  
  title_info: { color: '#0369a1' },
  title_warning: { color: '#b45309' },
  title_success: { color: '#16a34a' },
  title_error: { color: '#dc2626' },
  
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  
  message_info: { color: '#0c4a6e' },
  message_warning: { color: '#78350f' },
  message_success: { color: '#166534' },
  message_error: { color: '#991b1b' },
});
