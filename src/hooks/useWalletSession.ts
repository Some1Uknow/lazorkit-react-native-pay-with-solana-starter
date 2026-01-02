// Manages wallet authentication and session state

import { useWallet } from '@lazorkit/wallet-mobile-adapter';
import * as LocalAuthentication from 'expo-local-authentication';
import { useCallback, useMemo, useState } from 'react';
import {
    ErrorCodes,
    ErrorMessages,
    getRedirectUrl,
    logger,
    parseError,
    WalletError
} from '../lib';
import type { WalletCreationState, WalletLockState, WalletSession } from '../types';

export interface UseWalletSessionReturn {
  session: WalletSession;
  isConnecting: boolean;
  isConnected: boolean;
  hasWallet: boolean;
  walletAddress: string | null;
  authenticate: () => Promise<void>;
  disconnect: () => Promise<void>;
  error: WalletError | null;
  clearError: () => void;
}

export function useWalletSession(): UseWalletSessionReturn {
  const wallet = useWallet();
  
  const [creationState, setCreationState] = useState<WalletCreationState>(
    wallet.isConnected ? 'connected' : 'not-created'
  );
  const [lockState, setLockState] = useState<WalletLockState>('locked');
  const [error, setError] = useState<WalletError | null>(null);
  const [connectedAt, setConnectedAt] = useState<Date | null>(
    wallet.isConnected ? new Date() : null
  );

  const checkBiometricAvailability = useCallback(async (): Promise<void> => {
    logger.debug('WalletSession', 'Checking biometric availability');
    
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) {
      throw new WalletError({
        message: 'No biometric hardware',
        userMessage: ErrorMessages[ErrorCodes.AUTH_BIOMETRIC_NOT_AVAILABLE],
        code: ErrorCodes.AUTH_BIOMETRIC_NOT_AVAILABLE,
        isRecoverable: false,
      });
    }
    
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) {
      throw new WalletError({
        message: 'No biometric credentials enrolled',
        userMessage: ErrorMessages[ErrorCodes.AUTH_BIOMETRIC_NOT_ENROLLED],
        code: ErrorCodes.AUTH_BIOMETRIC_NOT_ENROLLED,
        isRecoverable: false,
      });
    }
    
    logger.debug('WalletSession', 'Biometric authentication available');
  }, []);

  const promptBiometric = useCallback(async (): Promise<void> => {
    logger.info('WalletSession', 'Prompting for biometric authentication');
    
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to access your wallet',
      fallbackLabel: 'Use passcode',
      disableDeviceFallback: false,
      cancelLabel: 'Cancel',
    });
    
    if (result.success) {
      logger.info('WalletSession', 'Biometric authentication successful');
      setLockState('unlocked');
      return;
    }
    
    if (result.error === 'user_cancel') {
      throw new WalletError({
        message: 'User cancelled biometric auth',
        userMessage: ErrorMessages[ErrorCodes.AUTH_CANCELLED],
        code: ErrorCodes.AUTH_CANCELLED,
        isRecoverable: true,
      });
    }
    
    throw new WalletError({
      message: `Biometric auth failed: ${result.error}`,
      userMessage: ErrorMessages[ErrorCodes.AUTH_BIOMETRIC_FAILED],
      code: ErrorCodes.AUTH_BIOMETRIC_FAILED,
      isRecoverable: true,
    });
  }, []);

  const authenticate = useCallback(async (): Promise<void> => {
    logger.info('WalletSession', 'Starting authentication flow');
    setError(null);
    
    try {
      setCreationState('creating');
      await checkBiometricAvailability();
      await promptBiometric();
      
      setCreationState('connecting');
      logger.info('WalletSession', 'Connecting to LazorKit wallet');
      
      const redirectUrl = getRedirectUrl();
      logger.info('WalletSession', `Using redirect URL: ${redirectUrl}`);
      
      await wallet.connect({ redirectUrl });
      
      setCreationState('connected');
      setConnectedAt(new Date());
      logger.info('WalletSession', 'Wallet connected successfully', {
        address: wallet.smartWalletPubkey?.toString(),
      });
      
    } catch (err) {
      const walletError = parseError(err);
      setError(walletError);
      setCreationState('error');
      logger.error('WalletSession', 'Authentication failed', err);
    }
  }, [wallet, checkBiometricAvailability, promptBiometric]);

  const disconnect = useCallback(async (): Promise<void> => {
    logger.info('WalletSession', 'Disconnecting wallet');
    
    try {
      await wallet.disconnect();
      setCreationState('not-created');
      setLockState('locked');
      setConnectedAt(null);
      setError(null);
      logger.info('WalletSession', 'Wallet disconnected');
    } catch (err) {
      logger.error('WalletSession', 'Disconnect failed', err);
      setCreationState('not-created');
      setLockState('locked');
    }
  }, [wallet]);

  const clearError = useCallback(() => {
    setError(null);
    setCreationState(wallet.isConnected ? 'connected' : 'not-created');
  }, [wallet.isConnected]);

  const session = useMemo<WalletSession>(() => ({
    smartWalletPubkey: wallet.smartWalletPubkey,
    isConnected: wallet.isConnected,
    creationState,
    lockState,
    connectedAt,
  }), [wallet.smartWalletPubkey, wallet.isConnected, creationState, lockState, connectedAt]);

  const walletAddress = useMemo(() => {
    return wallet.smartWalletPubkey?.toString() ?? null;
  }, [wallet.smartWalletPubkey]);

  const isConnecting = useMemo(() => {
    return creationState === 'creating' || creationState === 'connecting' || wallet.isConnecting;
  }, [creationState, wallet.isConnecting]);

  return {
    session,
    isConnecting,
    isConnected: wallet.isConnected,
    hasWallet: wallet.smartWalletPubkey !== null,
    walletAddress,
    authenticate,
    disconnect,
    error,
    clearError,
  };
}
