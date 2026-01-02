/**
 * App Configuration
 * 
 * All configuration values are defined here.
 * Change these when switching between devnet and mainnet.
 */

import * as Linking from 'expo-linking';

// Network Configuration
export const RPC_URL = 'https://api.devnet.solana.com';
export const PORTAL_URL = 'https://portal.lazor.sh';
export const NETWORK = 'devnet' as const;

// Paymaster (enables gasless transactions)
export const PAYMASTER_URL = 'https://kora.devnet.lazorkit.com';
export const PAYMASTER_CONFIG = {
  paymasterUrl: PAYMASTER_URL,
} as const;

// Token Configuration
export const USDC_MINT = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'; // Devnet USDC
export const USDC_DECIMALS = 6;

// =============================================================================
// DEEP LINKING CONFIGURATION
// =============================================================================

/**
 * App URL scheme for deep linking (production builds)
 * 
 * WHY THIS IS NEEDED:
 * After authenticating on the LazorKit portal (in browser),
 * the portal redirects back to your app using this URL.
 * 
 * MUST MATCH: The "scheme" value in app.json
 * 
 * NOTE: When running in Expo Go, use getRedirectUrl() instead
 * which handles the Expo development URL automatically.
 * 
 * Format: scheme://path
 * - scheme: "lazorkitapp" (defined in app.json)
 * - path: empty (just redirect to app root)
 */
export const APP_SCHEME = 'lazorkitapp://';

/**
 * Get the appropriate redirect URL based on environment
 * 
 * - In Expo Go: Returns exp://... URL
 * - In standalone/dev build: Returns lazorkitapp://
 */
export const getRedirectUrl = (): string => {
  // Linking.createURL generates the correct URL for the current environment:
  // - Expo Go: exp://192.168.x.x:8081 (or similar)
  // - Development build: lazorkitapp://
  // - Production: lazorkitapp://
  const url = Linking.createURL('/');
  console.log('[DeepLink] Redirect URL:', url);
  return url;
};

// =============================================================================
// PAYMENT LIMITS
// =============================================================================

/**
 * Minimum payment amount in USDC
 * Prevents dust transactions
 */
export const MIN_PAYMENT_AMOUNT = 0.01;

/**
 * Maximum payment amount in USDC
 * Safety limit to prevent accidents
 */
export const MAX_PAYMENT_AMOUNT = 10000;

// Timing
export const BALANCE_REFRESH_INTERVAL = 30000; // 30 seconds
export const TRANSACTION_TIMEOUT = 60000; // 60 seconds

// Explorer URLs
export const getExplorerTxUrl = (signature: string): string => {
  return `https://explorer.solana.com/tx/${signature}?cluster=${NETWORK}`;
};

export const getExplorerAddressUrl = (address: string): string => {
  return `https://explorer.solana.com/address/${address}?cluster=${NETWORK}`;
};

// Solana Pay
export const SOLANA_PAY_PROTOCOL = 'solana:';
