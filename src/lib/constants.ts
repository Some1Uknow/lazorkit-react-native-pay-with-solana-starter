/**
 * ============================================================================
 * CONSTANTS - Application-wide configuration values
 * ============================================================================
 * 
 * This file contains all configuration constants for the application.
 * Modify these values when switching between Devnet and Mainnet.
 * 
 * WHY THIS FILE EXISTS:
 * - Single source of truth for all configuration
 * - Easy environment switching (devnet → mainnet)
 * - No magic numbers scattered throughout codebase
 * - Clear documentation of what each value means
 */

import * as Linking from 'expo-linking';

// =============================================================================
// NETWORK CONFIGURATION
// =============================================================================

/**
 * Solana RPC endpoint for connecting to the blockchain
 * 
 * DEVNET: Free, for testing. Tokens have no real value.
 * MAINNET: Real network, real value. Requires paid RPC for production.
 * 
 * For production, use a dedicated RPC provider like:
 * - Helius: https://helius.xyz
 * - QuickNode: https://quicknode.com
 * - Triton: https://triton.one
 */
export const RPC_URL = 'https://api.devnet.solana.com';

/**
 * LazorKit Portal URL
 * 
 * This is where users authenticate with passkeys.
 * The portal handles:
 * - Passkey creation (first time users)
 * - Passkey retrieval (returning users)
 * - Smart wallet creation/lookup
 */
export const PORTAL_URL = 'https://portal.lazor.sh';

/**
 * Current network identifier
 * Used for display and explorer links
 */
export const NETWORK = 'devnet' as const;

// =============================================================================
// PAYMASTER CONFIGURATION (GASLESS TRANSACTIONS)
// =============================================================================

/**
 * Paymaster URL for gasless transactions
 * 
 * HOW IT WORKS:
 * 1. User creates a transaction (e.g., send USDC)
 * 2. Paymaster calculates SOL fee equivalent in USDC
 * 3. User signs approval to pay fee in USDC
 * 4. Paymaster pays SOL fee to network
 * 5. Paymaster receives USDC reimbursement
 * 
 * RESULT: User pays fees in USDC, never needs to hold SOL!
 */
export const PAYMASTER_URL = 'https://kora.devnet.lazorkit.com';

/**
 * Combined paymaster configuration object
 * Pass this to LazorKitProvider
 */
export const PAYMASTER_CONFIG = {
  paymasterUrl: PAYMASTER_URL,
  // apiKey: 'YOUR_API_KEY', // Required for production rate limiting
} as const;

// =============================================================================
// TOKEN CONFIGURATION
// =============================================================================

/**
 * USDC Token Mint Address (Devnet)
 * 
 * IMPORTANT: This address is different on Mainnet!
 * - Devnet USDC: 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
 * - Mainnet USDC: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
 * 
 * USDC has 6 decimals (not 9 like SOL)
 * So $1.00 USDC = 1,000,000 base units
 */
export const USDC_MINT = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';

/**
 * USDC decimal places
 * Used for converting between human-readable amounts and base units
 */
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

// =============================================================================
// TIMING CONFIGURATION
// =============================================================================

/**
 * How often to refresh balance (milliseconds)
 * 30 seconds is a good balance between freshness and rate limits
 */
export const BALANCE_REFRESH_INTERVAL = 30000;

/**
 * Transaction confirmation timeout (milliseconds)
 * How long to wait for transaction to confirm
 */
export const TRANSACTION_TIMEOUT = 60000;

// =============================================================================
// EXPLORER URLS
// =============================================================================

/**
 * Generate Solana Explorer URL for a transaction
 */
export const getExplorerTxUrl = (signature: string): string => {
  return `https://explorer.solana.com/tx/${signature}?cluster=${NETWORK}`;
};

/**
 * Generate Solana Explorer URL for an address
 */
export const getExplorerAddressUrl = (address: string): string => {
  return `https://explorer.solana.com/address/${address}?cluster=${NETWORK}`;
};

// =============================================================================
// QR CODE FORMAT (SOLANA PAY COMPATIBLE)
// =============================================================================

/**
 * Solana Pay protocol prefix
 * All Solana Pay URLs start with "solana:"
 */
export const SOLANA_PAY_PROTOCOL = 'solana:';
