/**
 * ============================================================================
 * useBalance - Wallet balance fetching and management
 * ============================================================================
 * 
 * This hook handles:
 * - Fetching SOL and USDC balances
 * - Automatic refresh on interval
 * - Manual refresh on demand
 * - Loading and error states
 * 
 * WHY THIS HOOK EXISTS:
 * - Centralizes balance fetching logic
 * - Provides consistent loading/error states
 * - Handles the complexity of token account lookup
 * - Auto-refreshes to keep balances current
 */

import { useWallet } from '@lazorkit/wallet-mobile-adapter';
import { getAccount, getAssociatedTokenAddress } from '@solana/spl-token';
import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { useCallback, useEffect, useState } from 'react';
import {
    BALANCE_REFRESH_INTERVAL,
    logger,
    RPC_URL,
    USDC_MINT,
    usdcFromBaseUnits,
} from '../lib';
import type { WalletBalance } from '../types';

// =============================================================================
// HOOK RETURN TYPE
// =============================================================================

export interface UseBalanceReturn {
  /** Current balance state */
  balance: WalletBalance;
  
  /** Fetch balances (call on mount and for manual refresh) */
  refresh: () => Promise<void>;
  
  /** Whether currently fetching */
  isLoading: boolean;
  
  /** Last error message */
  error: string | null;
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialBalance: WalletBalance = {
  usdc: 0,
  sol: 0,
  lastUpdated: new Date(),
  isLoading: false,
  error: null,
};

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function useBalance(): UseBalanceReturn {
  const { smartWalletPubkey, isConnected } = useWallet();
  
  const [balance, setBalance] = useState<WalletBalance>(initialBalance);
  
  // Convert PublicKey to string to avoid reference changes triggering useEffect
  // PublicKey objects are recreated on every render with new references
  const walletAddressString = smartWalletPubkey?.toString() ?? null;

  /**
   * Fetch current balances from Solana network
   * 
   * This function:
   * 1. Creates RPC connection
   * 2. Fetches native SOL balance
   * 3. Looks up USDC token account
   * 4. Fetches USDC balance (if account exists)
   * 5. Updates state with results
   */
  const fetchBalance = useCallback(async () => {
    // Can't fetch without a connected wallet
    if (!walletAddressString || !isConnected) {
      logger.debug('Balance', 'Skipping fetch - wallet not connected');
      return;
    }

    logger.info('Balance', 'Fetching balances', { 
      wallet: walletAddressString.slice(0, 8) + '...' 
    });

    // Mark as loading
    setBalance(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Create RPC connection
      const connection = new Connection(RPC_URL, 'confirmed');
      
      // Convert string back to PublicKey for RPC calls
      const walletPubkey = new PublicKey(walletAddressString);
      
      // ========================================
      // FETCH SOL BALANCE
      // ========================================
      // Native SOL balance is stored directly on the account
      // Returns lamports (1 SOL = 1,000,000,000 lamports)
      const lamports = await connection.getBalance(walletPubkey);
      const solBalance = lamports / LAMPORTS_PER_SOL;
      
      logger.debug('Balance', 'SOL balance fetched', { sol: solBalance });

      // ========================================
      // FETCH USDC BALANCE
      // ========================================
      // SPL tokens are stored in "Associated Token Accounts" (ATAs)
      // Each wallet has a unique ATA for each token type
      let usdcBalance = 0;
      
      try {
        const usdcMint = new PublicKey(USDC_MINT);
        
        // Derive the ATA address for USDC
        // This is deterministic: same wallet + mint = same ATA address
        const tokenAccountAddress = await getAssociatedTokenAddress(
          usdcMint,       // Token mint (which token)
          walletPubkey,   // Owner wallet
          true            // Allow owner off curve (for PDAs/smart wallets)
        );
        
        // Fetch the token account data
        const tokenAccount = await getAccount(connection, tokenAccountAddress);
        
        // Convert from base units (6 decimals for USDC)
        usdcBalance = usdcFromBaseUnits(Number(tokenAccount.amount));
        
        logger.debug('Balance', 'USDC balance fetched', { usdc: usdcBalance });
        
      } catch (tokenError) {
        // Token account might not exist yet (new wallet, never received USDC)
        // This is normal and expected - not an error
        if (String(tokenError).includes('could not find account')) {
          logger.debug('Balance', 'No USDC token account found (wallet has not received USDC yet)');
        } else {
          // Log unexpected token errors but don't fail the whole balance fetch
          logger.warn('Balance', 'Error fetching USDC balance', { 
            error: tokenError instanceof Error ? tokenError.name : String(tokenError) 
          });
        }
        // Keep usdcBalance at 0
      }

      // ========================================
      // UPDATE STATE
      // ========================================
      setBalance({
        usdc: usdcBalance,
        sol: solBalance,
        lastUpdated: new Date(),
        isLoading: false,
        error: null,
      });

      logger.info('Balance', 'Balances updated', { 
        usdc: usdcBalance, 
        sol: solBalance 
      });

    } catch (error) {
      // Network or RPC error
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch balance';
      logger.error('Balance', 'Failed to fetch balances', error);
      
      setBalance(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, [walletAddressString, isConnected]);

  // ==========================================================================
  // AUTO-REFRESH
  // ==========================================================================

  useEffect(() => {
    // Only fetch if wallet is connected
    if (!isConnected || !walletAddressString) {
      return;
    }
    
    // Fetch immediately when wallet connects
    fetchBalance();
    
    // Set up auto-refresh interval
    const intervalId = setInterval(fetchBalance, BALANCE_REFRESH_INTERVAL);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [isConnected, walletAddressString, fetchBalance]);

  // ==========================================================================
  // RESET ON DISCONNECT
  // ==========================================================================

  useEffect(() => {
    if (!isConnected) {
      setBalance(initialBalance);
    }
  }, [isConnected]);

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    balance,
    refresh: fetchBalance,
    isLoading: balance.isLoading,
    error: balance.error,
  };
}
