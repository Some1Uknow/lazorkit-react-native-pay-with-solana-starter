// Fetches and manages wallet balances (SOL and USDC)

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

export interface UseBalanceReturn {
  balance: WalletBalance;
  refresh: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const initialBalance: WalletBalance = {
  usdc: 0,
  sol: 0,
  lastUpdated: new Date(),
  isLoading: false,
  error: null,
};

export function useBalance(): UseBalanceReturn {
  const { smartWalletPubkey, isConnected } = useWallet();
  const [balance, setBalance] = useState<WalletBalance>(initialBalance);
  const walletAddressString = smartWalletPubkey?.toString() ?? null;

  const fetchBalance = useCallback(async () => {
    if (!walletAddressString || !isConnected) {
      logger.debug('Balance', 'Skipping fetch - wallet not connected');
      return;
    }

    logger.info('Balance', 'Fetching balances', { 
      wallet: walletAddressString.slice(0, 8) + '...' 
    });

    setBalance(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const connection = new Connection(RPC_URL, 'confirmed');
      const walletPubkey = new PublicKey(walletAddressString);
      
      // Fetch SOL balance (native token)
      const lamports = await connection.getBalance(walletPubkey);
      const solBalance = lamports / LAMPORTS_PER_SOL;
      
      logger.debug('Balance', 'SOL balance fetched', { sol: solBalance });

      // Fetch USDC balance (SPL token)
      let usdcBalance = 0;
      
      try {
        const usdcMint = new PublicKey(USDC_MINT);
        const tokenAccountAddress = await getAssociatedTokenAddress(
          usdcMint,
          walletPubkey,
          true // Allow owner off curve (for smart wallets)
        );
        
        const tokenAccount = await getAccount(connection, tokenAccountAddress);
        usdcBalance = usdcFromBaseUnits(Number(tokenAccount.amount));
        
        logger.debug('Balance', 'USDC balance fetched', { usdc: usdcBalance });
        
      } catch (tokenError) {
        if (String(tokenError).includes('could not find account')) {
          logger.debug('Balance', 'No USDC token account found yet');
        } else {
          logger.warn('Balance', 'Error fetching USDC balance', { 
            error: tokenError instanceof Error ? tokenError.name : String(tokenError) 
          });
        }
      }

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
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch balance';
      logger.error('Balance', 'Failed to fetch balances', error);
      
      setBalance(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, [walletAddressString, isConnected]);

  // Auto-refresh balance on interval
  useEffect(() => {
    if (!isConnected || !walletAddressString) {
      return;
    }
    
    fetchBalance();
    const intervalId = setInterval(fetchBalance, BALANCE_REFRESH_INTERVAL);
    return () => clearInterval(intervalId);
  }, [isConnected, walletAddressString, fetchBalance]);

  // Reset balance when disconnected
  useEffect(() => {
    if (!isConnected) {
      setBalance(initialBalance);
    }
  }, [isConnected]);

  return {
    balance,
    refresh: fetchBalance,
    isLoading: balance.isLoading,
    error: balance.error,
  };
}
