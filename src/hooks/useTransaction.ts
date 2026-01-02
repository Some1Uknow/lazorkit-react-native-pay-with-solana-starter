/**
 * useTransaction Hook
 * 
 * This hook handles sending USDC payments with LazorKit.
 * It manages the entire payment flow from validation to confirmation.
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
// Types
// =============================================================================

export interface UseTransactionReturn {
  state: TransactionState;
  transaction: Transaction | null;
  sendPayment: (params: SendPaymentParams) => Promise<string>;
  reset: () => void;
  error: WalletError | null;
  explorerUrl: string | null;
}

export interface SendPaymentParams {
  recipient: string;
  amount: number;
}

// =============================================================================
// Hook
// =============================================================================

export function useTransaction(): UseTransactionReturn {
  const { signAndSendTransaction, smartWalletPubkey } = useWallet();
  
  const [state, setState] = useState<TransactionState>('unsigned');
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [error, setError] = useState<WalletError | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  const generateTxId = useCallback(() => {
    return `tx_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }, []);

  const sendPayment = useCallback(async (params: SendPaymentParams): Promise<string> => {
    const { recipient, amount } = params;
    
    logger.info('Transaction', 'Starting payment', { 
      recipient: recipient.slice(0, 8) + '...', 
      amount,
    });

    setError(null);
    setSignature(null);

    // Validate wallet is connected
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

    // Create transaction record
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
      logger.debug('Transaction', 'Creating transfer instruction');
      
      const recipientPubkey = new PublicKey(recipient);
      const usdcMint = new PublicKey(USDC_MINT);

      // Get token accounts for sender and recipient
      // allowOwnerOffCurve=true is required for LazorKit smart wallets (PDAs)
      const sourceATA = await getAssociatedTokenAddress(
        usdcMint,
        smartWalletPubkey,
        true
      );

      const destinationATA = await getAssociatedTokenAddress(
        usdcMint,
        recipientPubkey,
        true
      );

      // Create the transfer instruction
      const transferInstruction = createTransferInstruction(
        sourceATA,
        destinationATA,
        smartWalletPubkey,
        usdcToBaseUnits(amount)
      );

      logger.debug('Transaction', 'Transfer instruction created');

      // Sign and send transaction
      setState('signing');
      setTransaction(prev => prev ? { ...prev, state: 'signing' } : null);
      
      logger.info('Transaction', 'Requesting signature via LazorKit');

      const txSignature = await signAndSendTransaction(
        {
          instructions: [transferInstruction],
          transactionOptions: {
            feeToken: 'USDC',
            clusterSimulation: NETWORK,
          },
        },
        { redirectUrl: getRedirectUrl() }
      );

      // Transaction successful
      logger.info('Transaction', 'Transaction successful!', { 
        signature: txSignature,
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

  const reset = useCallback(() => {
    setState('unsigned');
    setTransaction(null);
    setError(null);
    setSignature(null);
  }, []);

  return {
    state,
    transaction,
    sendPayment,
    reset,
    error,
    explorerUrl: signature ? getExplorerTxUrl(signature) : null,
  };
}
