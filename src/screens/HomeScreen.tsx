/**
 * ============================================================================
 * HomeScreen - Main dashboard after authentication
 * ============================================================================
 * 
 * This screen displays:
 * - Wallet address
 * - Token balances (SOL + USDC)
 * - Quick action buttons (Scan, Receive)
 * - Network status
 * 
 * Key features:
 * - Auto-refreshing balance
 * - Pull-to-refresh
 * - Clear navigation to other screens
 */

import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
    ActionButton,
    BalanceCard,
    Button,
    InfoBanner,
    NetworkBadge,
} from '../components';
import { useBalance, useWalletSession } from '../hooks';
import { copyToClipboard, hapticFeedback, shortenAddress } from '../lib';

// =============================================================================
// PROPS
// =============================================================================

export interface HomeScreenProps {
  /** Navigate to another screen */
  onNavigate: (screen: 'scan' | 'receive') => void;
  
  /** Called when user logs out */
  onLogout: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function HomeScreen({ onNavigate, onLogout }: HomeScreenProps): React.ReactElement {
  const { walletAddress, disconnect } = useWalletSession();
  const { balance, refresh, isLoading } = useBalance();

  const handleLogout = async () => {
    await disconnect();
    onLogout();
  };

  const handleCopyAddress = async () => {
    if (walletAddress) {
      const success = await copyToClipboard(walletAddress);
      if (success) {
        await hapticFeedback('success');
      }
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={refresh}
          tintColor="#0ea5e9"
        />
      }
    >
      {/* ============================================ */}
      {/* HEADER */}
      {/* ============================================ */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>Welcome to SolPay</Text>
          <Text 
            style={styles.address}
            onPress={handleCopyAddress}
          >
            {walletAddress ? shortenAddress(walletAddress, 6) : '...'}
            <Text style={styles.copyHint}> (tap to copy)</Text>
          </Text>
        </View>
        <Button
          label="Logout"
          variant="ghost"
          size="small"
          onPress={handleLogout}
        />
      </View>

      {/* ============================================ */}
      {/* BALANCE CARD */}
      {/* ============================================ */}
      <View style={styles.balanceSection}>
        <BalanceCard balance={balance} />
      </View>

      {/* ============================================ */}
      {/* QUICK ACTIONS */}
      {/* ============================================ */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <View style={styles.actionsRow}>
          <ActionButton
            icon="📸"
            label="Scan QR"
            subtitle="Pay someone"
            color="#0ea5e9"
            onPress={() => onNavigate('scan')}
          />
          <View style={styles.actionSpacer} />
          <ActionButton
            icon="📱"
            label="Receive"
            subtitle="Get paid"
            color="#22c55e"
            onPress={() => onNavigate('receive')}
          />
        </View>
      </View>

      {/* ============================================ */}
      {/* INFO BANNER */}
      {/* ============================================ */}
      <View style={styles.infoSection}>
        <InfoBanner
          icon="⚡"
          title="Gasless Transactions"
          message="All transaction fees are paid in USDC. No need to hold SOL!"
          variant="warning"
        />
      </View>

      {/* ============================================ */}
      {/* DEVNET FUNDING INFO */}
      {/* ============================================ */}
      <View style={styles.infoSection}>
        <InfoBanner
          icon="💰"
          title="Need Test Tokens?"
          message="Get free Devnet USDC from spl-token-faucet.com to test payments."
          variant="info"
        />
      </View>

      {/* ============================================ */}
      {/* NETWORK BADGE */}
      {/* ============================================ */}
      <NetworkBadge />

      {/* Bottom padding */}
      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  
  contentContainer: {
    paddingBottom: 24,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'monospace',
  },
  copyHint: {
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: 'System',
  },
  
  // Balance Section
  balanceSection: {
    padding: 20,
  },
  
  // Actions Section
  actionsSection: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: 'row',
  },
  actionSpacer: {
    width: 12,
  },
  
  // Info Section
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  
  // Bottom
  bottomPadding: {
    height: 20,
  },
});
