/**
 * ============================================================================
 * BalanceCard - Display wallet balance prominently
 * ============================================================================
 */

import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { formatSOL, formatTimeAgo, formatUSDC } from '../lib';
import type { WalletBalance } from '../types';
import { Card } from './Card';

export interface BalanceCardProps {
  balance: WalletBalance;
}

export function BalanceCard({ balance }: BalanceCardProps): React.ReactElement {
  return (
    <Card variant="highlight" padding="large">
      {/* Label */}
      <Text style={styles.label}>Total Balance</Text>
      
      {/* Main balance (USDC) */}
      <Text style={styles.amount}>{formatUSDC(balance.usdc)}</Text>
      
      {/* SOL balance */}
      <Text style={styles.secondary}>
        {formatSOL(balance.sol)} available
      </Text>
      
      {/* Last updated */}
      <Text style={styles.updated}>
        {balance.isLoading 
          ? 'Updating...' 
          : `Updated ${formatTimeAgo(balance.lastUpdated)}`
        }
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    color: '#bae6fd',
    fontWeight: '500',
    marginBottom: 8,
  },
  
  amount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  
  secondary: {
    fontSize: 16,
    color: '#7dd3fc',
    marginBottom: 16,
  },
  
  updated: {
    fontSize: 12,
    color: '#7dd3fc',
    opacity: 0.8,
  },
});
