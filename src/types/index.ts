/**
 * ============================================================================
 * TYPE DEFINITIONS - Core application types
 * ============================================================================
 * 
 * This file contains all TypeScript type definitions used throughout the app.
 * Types are organized by domain (wallet, transaction, UI state, etc.)
 */

import { PublicKey } from '@solana/web3.js';

// =============================================================================
// WALLET STATE TYPES
// =============================================================================

/**
 * Represents the current state of wallet creation/connection
 * 
 * State machine:
 *   NOT_CREATED → CREATING → CREATED → CONNECTING → CONNECTED
 *                    ↓                      ↓
 *                  ERROR                  ERROR
 */
export type WalletCreationState = 
  | 'not-created'    // User has never created a wallet
  | 'creating'       // Wallet creation in progress
  | 'created'        // Wallet exists but not connected
  | 'connecting'     // Connection in progress
  | 'connected'      // Wallet is ready to use
  | 'error';         // Something went wrong

/**
 * Represents wallet lock state (for returning users)
 * 
 * LOCKED: Wallet exists but needs biometric auth
 * UNLOCKED: Wallet is authenticated and ready
 */
export type WalletLockState = 'locked' | 'unlocked';

/**
 * Combined wallet session information
 */
export interface WalletSession {
  /** Smart wallet public key (Solana address) */
  smartWalletPubkey: PublicKey | null;
  
  /** Whether the wallet is connected */
  isConnected: boolean;
  
  /** Current creation/connection state */
  creationState: WalletCreationState;
  
  /** Lock state for biometric protection */
  lockState: WalletLockState;
  
  /** When the session was established */
  connectedAt: Date | null;
}

// =============================================================================
// BALANCE TYPES
// =============================================================================

/**
 * Wallet token balances
 */
export interface WalletBalance {
  /** USDC balance (human-readable, e.g., 100.50) */
  usdc: number;
  
  /** SOL balance (human-readable, e.g., 0.5) */
  sol: number;
  
  /** When balances were last fetched */
  lastUpdated: Date;
  
  /** Whether a fetch is in progress */
  isLoading: boolean;
  
  /** Any error from the last fetch */
  error: string | null;
}

// =============================================================================
// TRANSACTION TYPES
// =============================================================================

/**
 * Transaction lifecycle state
 * 
 * State machine:
 *   UNSIGNED → SIGNING → SIGNED → SUBMITTING → SUBMITTED → CONFIRMING → CONFIRMED
 *                 ↓          ↓          ↓            ↓
 *               ERROR      ERROR      ERROR        FAILED
 */
export type TransactionState =
  | 'unsigned'     // Transaction created but not yet signed
  | 'signing'      // User is signing (biometric prompt shown)
  | 'signed'       // Transaction signed, ready to submit
  | 'submitting'   // Sending to network
  | 'submitted'    // Sent, waiting for confirmation
  | 'confirming'   // Confirming on-chain
  | 'confirmed'    // Successfully confirmed
  | 'failed'       // Transaction failed
  | 'error';       // Pre-submission error

/**
 * Transaction type classification
 */
export type TransactionType = 
  | 'send'      // Outgoing payment
  | 'receive'   // Incoming payment (detected from history)
  | 'unknown';  // Unclassified

/**
 * Complete transaction record
 */
export interface Transaction {
  /** Unique local ID (for list rendering) */
  id: string;
  
  /** On-chain transaction signature (after submission) */
  signature?: string;
  
  /** Transaction type */
  type: TransactionType;
  
  /** Current state */
  state: TransactionState;
  
  /** Amount in USDC (human-readable) */
  amount: number;
  
  /** Fee paid in USDC (for gasless txns) */
  feeUSDC?: number;
  
  /** Sender wallet address */
  from: string;
  
  /** Recipient wallet address */
  to: string;
  
  /** Payment label/description */
  label?: string;
  
  /** Payment memo */
  memo?: string;
  
  /** When transaction was created locally */
  createdAt: Date;
  
  /** When transaction was confirmed on-chain */
  confirmedAt?: Date;
  
  /** Error message if failed */
  error?: string;
}

// =============================================================================
// PAYMENT REQUEST TYPES
// =============================================================================

/**
 * Parsed payment request (from QR code)
 */
export interface PaymentRequest {
  /** Recipient address */
  recipient: string;
  
  /** Requested amount (optional - user can enter if not specified) */
  amount?: number;
  
  /** Payment label/description */
  label?: string;
  
  /** Payment memo */
  memo?: string;
  
  /** Token mint (defaults to USDC if not specified) */
  token?: string;
}

// =============================================================================
// UI STATE TYPES
// =============================================================================

/**
 * Generic async operation state
 * Use this for any operation that can be loading/success/error
 */
export type AsyncState<T> = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

/**
 * Screen navigation options
 */
export type Screen = 'auth' | 'home' | 'scan' | 'receive' | 'send';

/**
 * Modal types that can be shown
 */
export type ModalType = 
  | 'none'
  | 'payment-confirmation'
  | 'transaction-success'
  | 'transaction-error';

// =============================================================================
// COMPONENT PROP TYPES
// =============================================================================

/**
 * Common button state
 */
export interface ButtonState {
  isLoading: boolean;
  isDisabled: boolean;
  label: string;
}

/**
 * Alert/notification data
 */
export interface AlertData {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  actions?: Array<{
    label: string;
    onPress: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>;
}
