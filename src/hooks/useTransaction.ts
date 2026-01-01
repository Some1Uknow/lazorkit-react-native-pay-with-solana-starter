/**
 * ============================================================================
 * useTransaction - Send gasless USDC transactions
 * ============================================================================
 * 
 * This hook handles:
 * - Creating USDC transfer instructions
 * - Signing via LazorKit
 * - Sending gasless transactions
 * - Tracking transaction state
 * - Error handling with user-friendly messages
 * 
 * WHY THIS HOOK EXISTS:
 * - Encapsulates all transaction logic in one place
 * - Provides clear state machine for UI
 * - Handles the complexity of SPL token transfers
 * - Makes gasless transactions easy to use
 */

import { useWallet } from '@lazorkit/wallet-mobile-adapter';
import { createTransferInstruction, getAssociatedTokenAddress } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { useCallback, useState } from 'react';
import {
  ErrorCodes,
  ErrorMessages,
  getExplorerTxUrl,
  getRedirectUrl,
  isValidPaymentAmount,
  isValidSolanaAddress,
  logger,
  NETWORK,
  parseError,
  USDC_MINT,
  usdcToBaseUnits,
  WalletError,
} from '../lib';
import type { Transaction, TransactionState } from '../types';

// =============================================================================
// HOOK RETURN TYPE
// =============================================================================

export interface UseTransactionReturn {
  /** Current transaction state */
  state: TransactionState;
  
  /** Current transaction (null if none in progress) */
  transaction: Transaction | null;
  
  /** Send a USDC payment */
  sendPayment: (params: SendPaymentParams) => Promise<string>;
  
  /** Reset state for new transaction */
  reset: () => void;
  
  /** Last error */
  error: WalletError | null;
  
  /** Explorer URL for last successful transaction */
  explorerUrl: string | null;
}

export interface SendPaymentParams {
  /** Recipient wallet address */
  recipient: string;
  
  /** Amount in USDC (human-readable, e.g., 10.50) */
  amount: number;
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function useTransaction(): UseTransactionReturn {
  const { signAndSendTransaction, smartWalletPubkey } = useWallet();
  
  const [state, setState] = useState<TransactionState>('unsigned');
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [error, setError] = useState<WalletError | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  /**
   * Generate unique transaction ID
   */
  const generateTxId = useCallback(() => {
    return `tx_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }, []);

  /**
   * Send a USDC payment
   * 
   * FLOW:
   * 1. Validate inputs
   * 2. Create transfer instruction
   * 3. Sign with LazorKit (user authenticates with passkey)
   * 4. Submit to network (via paymaster for gasless)
   * 5. Return signature
   */
  const sendPayment = useCallback(async (params: SendPaymentParams): Promise<string> => {
    const { recipient, amount } = params;
    
    logger.info('Transaction', 'Starting payment', { 
      recipient: recipient.slice(0, 8) + '...', 
      amount,
    });

    // Reset previous state
    setError(null);
    setSignature(null);

    // ========================================
    // STEP 1: VALIDATION
    // ========================================
    
    // Check wallet is connected
    if (!smartWalletPubkey) {
      const err = new WalletError({
        message: 'Wallet not connected',
        userMessage: ErrorMessages[ErrorCodes.WALLET_NOT_CONNECTED],
        code: ErrorCodes.WALLET_NOT_CONNECTED,
        isRecoverable: false,
      });
      setError(err);
      setState('error');
      throw err;
    }

    // Validate recipient address
    if (!isValidSolanaAddress(recipient)) {
      const err = new WalletError({
        message: `Invalid recipient address: ${recipient}`,
        userMessage: ErrorMessages[ErrorCodes.TX_INVALID_RECIPIENT],
        code: ErrorCodes.TX_INVALID_RECIPIENT,
        isRecoverable: true,
      });
      setError(err);
      setState('error');
      throw err;
    }

    // Validate amount
    if (!isValidPaymentAmount(amount)) {
      const err = new WalletError({
        message: `Invalid amount: ${amount}`,
        userMessage: ErrorMessages[ErrorCodes.TX_INVALID_AMOUNT],
        code: ErrorCodes.TX_INVALID_AMOUNT,
        isRecoverable: true,
      });
      setError(err);
      setState('error');
      throw err;
    }

    // ========================================
    // STEP 2: CREATE TRANSACTION RECORD
    // ========================================
    
    const txId = generateTxId();
    const newTransaction: Transaction = {
      id: txId,
      type: 'send',
      state: 'unsigned',
      amount,
      from: smartWalletPubkey.toString(),
      to: recipient,
      createdAt: new Date(),
    };
    
    setTransaction(newTransaction);
    setState('unsigned');

    try {
      // ========================================
      // STEP 3: CREATE TRANSFER INSTRUCTION
      // ========================================
      
      logger.debug('Transaction', 'Creating transfer instruction');
      
      const recipientPubkey = new PublicKey(recipient);
      const usdcMint = new PublicKey(USDC_MINT);

      // Get Associated Token Accounts (ATAs)
      // Every wallet needs a specific account for each token type
      // IMPORTANT: allowOwnerOffCurve=true is required because:
      // - LazorKit smart wallets are PDAs (Program Derived Addresses)
      // - PDAs are intentionally "off curve" (not valid ed25519 public keys)
      // - Without this flag, getAssociatedTokenAddress throws TokenOwnerOffCurveError
      const sourceATA = await getAssociatedTokenAddress(
        usdcMint,
        smartWalletPubkey,
        true  // allowOwnerOffCurve - required for PDA/smart wallet owners
      );

      const destinationATA = await getAssociatedTokenAddress(
        usdcMint,
        recipientPubkey,
        true  // allowOwnerOffCurve - recipient might also be a smart wallet
      );

      // Create the transfer instruction
      // IMPORTANT: USDC has 6 decimals, so we convert to base units
      const transferInstruction = createTransferInstruction(
        sourceATA,                    // From: sender's USDC account
        destinationATA,               // To: recipient's USDC account
        smartWalletPubkey,            // Authority: who approves the transfer
        usdcToBaseUnits(amount)       // Amount: in base units (1 USDC = 1,000,000)
      );

      logger.debug('Transaction', 'Transfer instruction created', {
        from: sourceATA.toString().slice(0, 8) + '...',
        to: destinationATA.toString().slice(0, 8) + '...',
        amount: usdcToBaseUnits(amount),
      });

      // ========================================
      // STEP 4: SIGN AND SEND VIA LAZORKIT (WITH RETRY)
      // ========================================
      
      setState('signing');
      setTransaction(prev => prev ? { ...prev, state: 'signing' } : null);
      
      logger.info('Transaction', 'Requesting signature via LazorKit');

      // Retry up to 3 times for transaction size errors
      let txSignature: string | null = null;
      let lastError: Error | null = null;
      const maxRetries = 3;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          logger.info('Transaction', `Attempt ${attempt}/${maxRetries}`);
          
          txSignature = await signAndSendTransaction(
            {
              instructions: [transferInstruction],
              transactionOptions: {
                feeToken: 'USDC',
                clusterSimulation: NETWORK,
              },
            },
            { redirectUrl: getRedirectUrl() }
          );
          
          break;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          const isTransactionTooLarge = lastError.message.toLowerCase().includes('transaction too large');
          
          if (isTransactionTooLarge && attempt < maxRetries) {
            logger.warn('Transaction', `Attempt ${attempt} failed, retrying...`);
            await new Promise(resolve => setTimeout(resolve, 500));
            continue;
          }
          
          throw lastError;
        }
      }
      
      if (!txSignature) {
        throw lastError || new Error('Transaction failed');
      }

      // ========================================
      // STEP 5: SUCCESS
      // ========================================
      
      logger.info('Transaction', 'Transaction successful!', { 
        signature: txSignature,
        explorerUrl: getExplorerTxUrl(txSignature),
      });

      setSignature(txSignature);
      setState('confirmed');
      setTransaction(prev => prev ? { 
        ...prev, 
        state: 'confirmed',
        signature: txSignature,
        confirmedAt: new Date(),
      } : null);

      return txSignature;

    } catch (err) {
      // ========================================
      // ERROR HANDLING
      // ========================================
      
      const walletError = parseError(err);
      setError(walletError);
      setState('failed');
      setTransaction(prev => prev ? { 
        ...prev, 
        state: 'failed',
        error: walletError.userMessage,
      } : null);
      
      logger.error('Transaction', 'Transaction failed', err);
      
      throw walletError;
    }
  }, [smartWalletPubkey, signAndSendTransaction, generateTxId]);

  /**
   * Reset state for new transaction
   */
  const reset = useCallback(() => {
    setState('unsigned');
    setTransaction(null);
    setError(null);
    setSignature(null);
  }, []);

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    state,
    transaction,
    sendPayment,
    reset,
    error,
    explorerUrl: signature ? getExplorerTxUrl(signature) : null,
  };
}
