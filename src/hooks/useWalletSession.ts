/**
 * ============================================================================
 * useWalletSession - Wallet connection and session management
 * ============================================================================
 * 
 * This hook wraps LazorKit's useWallet and adds:
 * - Clear state machine transitions
 * - Biometric authentication
 * - User-friendly error handling
 * - Session persistence awareness
 * 
 * WHY THIS HOOK EXISTS:
 * - Provides a unified interface for wallet operations
 * - Handles the complexity of biometric + wallet auth
 * - Gives clear status for UI state management
 * - Makes error handling consistent across the app
 */

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

// =============================================================================
// HOOK RETURN TYPE
// =============================================================================

export interface UseWalletSessionReturn {
  // Session state
  session: WalletSession;
  
  // Derived state flags
  isConnecting: boolean;
  isConnected: boolean;
  hasWallet: boolean;
  
  // Wallet address (string, for easy display)
  walletAddress: string | null;
  
  // Actions
  authenticate: () => Promise<void>;
  disconnect: () => Promise<void>;
  
  // Error state
  error: WalletError | null;
  clearError: () => void;
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function useWalletSession(): UseWalletSessionReturn {
  // LazorKit wallet hook
  const wallet = useWallet();
  
  // Local state
  const [creationState, setCreationState] = useState<WalletCreationState>(
    wallet.isConnected ? 'connected' : 'not-created'
  );
  const [lockState, setLockState] = useState<WalletLockState>('locked');
  const [error, setError] = useState<WalletError | null>(null);
  const [connectedAt, setConnectedAt] = useState<Date | null>(
    wallet.isConnected ? new Date() : null
  );

  // ==========================================================================
  // BIOMETRIC AUTHENTICATION
  // ==========================================================================

  /**
   * Check if device supports biometric authentication
   */
  const checkBiometricAvailability = useCallback(async (): Promise<void> => {
    logger.debug('WalletSession', 'Checking biometric availability');
    
    // Check hardware capability
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) {
      throw new WalletError({
        message: 'No biometric hardware',
        userMessage: ErrorMessages[ErrorCodes.AUTH_BIOMETRIC_NOT_AVAILABLE],
        code: ErrorCodes.AUTH_BIOMETRIC_NOT_AVAILABLE,
        isRecoverable: false,
      });
    }
    
    // Check if biometrics are enrolled
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

  /**
   * Prompt user for biometric authentication
   */
  const promptBiometric = useCallback(async (): Promise<void> => {
    logger.info('WalletSession', 'Prompting for biometric authentication');
    
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to access your wallet',
      fallbackLabel: 'Use passcode',
      disableDeviceFallback: false, // Allow PIN/passcode as fallback
      cancelLabel: 'Cancel',
    });
    
    if (result.success) {
      logger.info('WalletSession', 'Biometric authentication successful');
      setLockState('unlocked');
      return;
    }
    
    // Handle specific failure reasons
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

  // ==========================================================================
  // WALLET AUTHENTICATION
  // ==========================================================================

  /**
   * Full authentication flow:
   * 1. Check biometric availability
   * 2. Prompt for biometric auth
   * 3. Connect wallet via LazorKit
   */
  const authenticate = useCallback(async (): Promise<void> => {
    logger.info('WalletSession', 'Starting authentication flow');
    
    // Clear any previous errors
    setError(null);
    
    try {
      // STEP 1: Check biometric availability
      setCreationState('creating');
      await checkBiometricAvailability();
      
      // STEP 2: Prompt for biometric authentication
      await promptBiometric();
      
      // STEP 3: Connect wallet via LazorKit
      setCreationState('connecting');
      logger.info('WalletSession', 'Connecting to LazorKit wallet');
      
      // Get the appropriate redirect URL for the current environment
      // (Expo Go uses exp://, standalone uses lazorkitapp://)
      const redirectUrl = getRedirectUrl();
      logger.info('WalletSession', `Using redirect URL: ${redirectUrl}`);
      
      await wallet.connect({
        redirectUrl,
      });
      
      // STEP 4: Success!
      setCreationState('connected');
      setConnectedAt(new Date());
      logger.info('WalletSession', 'Wallet connected successfully', {
        address: wallet.smartWalletPubkey?.toString(),
      });
      
    } catch (err) {
      // Handle and categorize the error
      const walletError = parseError(err);
      setError(walletError);
      setCreationState('error');
      logger.error('WalletSession', 'Authentication failed', err);
      
      // Don't re-throw - let the UI handle via error state
    }
  }, [wallet, checkBiometricAvailability, promptBiometric]);

  /**
   * Disconnect and clear session
   */
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
      // Force disconnect locally even if remote call fails
      setCreationState('not-created');
      setLockState('locked');
    }
  }, [wallet]);

  /**
   * Clear error state (for retry flows)
   */
  const clearError = useCallback(() => {
    setError(null);
    setCreationState(wallet.isConnected ? 'connected' : 'not-created');
  }, [wallet.isConnected]);

  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================

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

  // ==========================================================================
  // RETURN
  // ==========================================================================

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
