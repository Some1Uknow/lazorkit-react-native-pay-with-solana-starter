/**
 * ============================================================================
 * Header - Screen header with back button and title
 * ============================================================================
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hapticFeedback } from '../lib';

export interface HeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: {
    label: string;
    onPress: () => void;
  };
  /** Skip safe area top padding (e.g., when used inside a modal or overlay) */
  skipSafeArea?: boolean;
}

export function Header({
  title,
  onBack,
  rightAction,
  skipSafeArea = false,
}: HeaderProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  
  const handleBack = async () => {
    if (onBack) {
      await hapticFeedback('light');
      onBack();
    }
  };

  return (
    <View style={[styles.container, !skipSafeArea && { paddingTop: insets.top + 12 }]}>
      {/* Left: Back button */}
      <View style={styles.left}>
        {onBack && (
          <TouchableOpacity 
            onPress={handleBack} 
            style={styles.backButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Center: Title */}
      <Text style={styles.title}>{title}</Text>
      
      {/* Right: Action */}
      <View style={styles.right}>
        {rightAction && (
          <TouchableOpacity onPress={rightAction.onPress}>
            <Text style={styles.actionText}>{rightAction.label}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  
  left: {
    width: 80,
    alignItems: 'flex-start',
  },
  
  right: {
    width: 80,
    alignItems: 'flex-end',
  },
  
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'center',
    flex: 1,
  },
  
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginLeft: -8,
  },
  
  backText: {
    fontSize: 16,
    color: '#0ea5e9',
    fontWeight: '500',
  },
  
  actionText: {
    fontSize: 16,
    color: '#0ea5e9',
    fontWeight: '500',
  },
});
