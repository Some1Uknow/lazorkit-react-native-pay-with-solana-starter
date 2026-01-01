/**
 * ============================================================================
 * StateMessage - Display loading, error, success, and empty states
 * ============================================================================
 * 
 * A reusable component for displaying different UI states:
 * - Loading: Shows spinner with message
 * - Error: Shows error with retry button
 * - Success: Shows success with action button
 * - Empty: Shows empty state with action
 * 
 * WHY THIS COMPONENT EXISTS:
 * - Consistent state display across the app
 * - Clear feedback for users
 * - Built-in retry functionality for errors
 */

import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { hapticFeedback } from '../lib';

// =============================================================================
// PROPS
// =============================================================================

export type StateType = 'loading' | 'error' | 'success' | 'empty' | 'info';

export interface StateMessageProps {
  /** Type of state to display */
  type: StateType;
  
  /** Main message text */
  message: string;
  
  /** Optional title (shown above message) */
  title?: string;
  
  /** Optional action button */
  action?: {
    label: string;
    onPress: () => void;
  };
  
  /** Optional secondary action */
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
  
  /** Make it fullscreen centered */
  fullScreen?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function StateMessage({
  type,
  message,
  title,
  action,
  secondaryAction,
  fullScreen = false,
}: StateMessageProps): React.ReactElement {
  
  const handleAction = async () => {
    if (action) {
      await hapticFeedback(type === 'error' ? 'medium' : 'light');
      action.onPress();
    }
  };

  const handleSecondaryAction = async () => {
    if (secondaryAction) {
      await hapticFeedback('light');
      secondaryAction.onPress();
    }
  };

  // Get icon/emoji for each state type
  const getIcon = () => {
    switch (type) {
      case 'loading':
        return null; // Will show ActivityIndicator instead
      case 'error':
        return '❌';
      case 'success':
        return '✅';
      case 'empty':
        return '📭';
      case 'info':
        return 'ℹ️';
    }
  };

  const icon = getIcon();

  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      {/* Icon/Spinner */}
      <View style={styles.iconContainer}>
        {type === 'loading' ? (
          <ActivityIndicator size="large" color="#0ea5e9" />
        ) : (
          <Text style={styles.icon}>{icon}</Text>
        )}
      </View>

      {/* Title */}
      {title && (
        <Text style={[styles.title, styles[`title_${type}`]]}>
          {title}
        </Text>
      )}

      {/* Message */}
      <Text style={[styles.message, styles[`message_${type}`]]}>
        {message}
      </Text>

      {/* Primary Action */}
      {action && (
        <TouchableOpacity
          style={[styles.actionButton, styles[`actionButton_${type}`]]}
          onPress={handleAction}
          activeOpacity={0.7}
        >
          <Text style={[styles.actionLabel, styles[`actionLabel_${type}`]]}>
            {action.label}
          </Text>
        </TouchableOpacity>
      )}

      {/* Secondary Action */}
      {secondaryAction && (
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleSecondaryAction}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryLabel}>
            {secondaryAction.label}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  
  fullScreen: {
    flex: 1,
  },
  
  iconContainer: {
    marginBottom: 16,
  },
  
  icon: {
    fontSize: 48,
  },
  
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  
  title_loading: { color: '#0f172a' },
  title_error: { color: '#dc2626' },
  title_success: { color: '#16a34a' },
  title_empty: { color: '#64748b' },
  title_info: { color: '#0ea5e9' },
  
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  
  message_loading: { color: '#64748b' },
  message_error: { color: '#64748b' },
  message_success: { color: '#64748b' },
  message_empty: { color: '#94a3b8' },
  message_info: { color: '#64748b' },
  
  actionButton: {
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  
  actionButton_loading: { display: 'none' },
  actionButton_error: { backgroundColor: '#ef4444' },
  actionButton_success: { backgroundColor: '#0ea5e9' },
  actionButton_empty: { backgroundColor: '#0ea5e9' },
  actionButton_info: { backgroundColor: '#0ea5e9' },
  
  actionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  
  actionLabel_loading: {},
  actionLabel_error: { color: '#fff' },
  actionLabel_success: { color: '#fff' },
  actionLabel_empty: { color: '#fff' },
  actionLabel_info: { color: '#fff' },
  
  secondaryButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  
  secondaryLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
});
