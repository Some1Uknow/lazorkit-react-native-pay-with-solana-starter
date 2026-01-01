/**
 * ============================================================================
 * NetworkBadge - Display current network connection
 * ============================================================================
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NETWORK } from '../lib';

export function NetworkBadge(): React.ReactElement {
  const isDevnet = NETWORK === 'devnet';
  
  return (
    <View style={styles.container}>
      <View style={[styles.dot, isDevnet ? styles.dotDevnet : styles.dotMainnet]} />
      <Text style={styles.text}>
        Connected to {NETWORK.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  
  dotDevnet: {
    backgroundColor: '#f59e0b',
  },
  
  dotMainnet: {
    backgroundColor: '#22c55e',
  },
  
  text: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
});
