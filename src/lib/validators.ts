/**
 * ============================================================================
 * VALIDATORS - Input validation utilities
 * ============================================================================
 * 
 * Pure functions for validating user input and data.
 * Each validator returns a boolean and has no side effects.
 */

import { PublicKey } from '@solana/web3.js';
import { MAX_PAYMENT_AMOUNT, MIN_PAYMENT_AMOUNT, SOLANA_PAY_PROTOCOL } from './constants';

// =============================================================================
// ADDRESS VALIDATION
// =============================================================================

/**
 * Check if a string is a valid Solana public key (address)
 * 
 * A valid Solana address is:
 * - 32-44 characters long
 * - Base58 encoded
 * - Creates a valid PublicKey object
 * 
 * @example
 * isValidSolanaAddress("5FHwkrdxntdK24hgQU8qgBjn35Y1zwhz1GZwCNA9X6Pr") // true
 * isValidSolanaAddress("invalid-address")                                // false
 * isValidSolanaAddress("")                                               // false
 */
export function isValidSolanaAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }
  
  // Solana addresses are 32-44 characters (base58 encoding of 32 bytes)
  if (address.length < 32 || address.length > 44) {
    return false;
  }
  
  try {
    // PublicKey constructor validates the address format
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

// =============================================================================
// AMOUNT VALIDATION
// =============================================================================

/**
 * Check if a payment amount is valid
 * 
 * Valid amounts:
 * - Are numbers (not NaN)
 * - Are positive
 * - Are within min/max limits
 * 
 * @example
 * isValidPaymentAmount(10)      // true
 * isValidPaymentAmount(0)       // false
 * isValidPaymentAmount(-5)      // false
 * isValidPaymentAmount(NaN)     // false
 * isValidPaymentAmount(100000)  // false (exceeds max)
 */
export function isValidPaymentAmount(amount: number): boolean {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return false;
  }
  
  return amount >= MIN_PAYMENT_AMOUNT && amount <= MAX_PAYMENT_AMOUNT;
}

/**
 * Parse a string to a valid payment amount
 * Returns null if parsing fails or amount is invalid
 * 
 * @example
 * parsePaymentAmount("10.50")   // 10.50
 * parsePaymentAmount("abc")     // null
 * parsePaymentAmount("-5")      // null
 * parsePaymentAmount("")        // null
 */
export function parsePaymentAmount(input: string): number | null {
  if (!input || typeof input !== 'string') {
    return null;
  }
  
  const trimmed = input.trim();
  if (trimmed === '') {
    return null;
  }
  
  const parsed = parseFloat(trimmed);
  
  if (isNaN(parsed)) {
    return null;
  }
  
  // Allow 0 for parsing (caller decides if 0 is valid)
  if (parsed < 0) {
    return null;
  }
  
  return parsed;
}

// =============================================================================
// QR CODE VALIDATION
// =============================================================================

/**
 * Parsed payment data from a QR code
 */
export interface ParsedPaymentQR {
  /** Recipient wallet address */
  address: string;
  
  /** Payment amount in USDC (optional) */
  amount?: number;
  
  /** Payment label/description (optional) */
  label?: string;
  
  /** Payment memo (optional) */
  memo?: string;
  
  /** SPL token mint address (optional) */
  token?: string;
}

/**
 * Check if a string is a valid Solana Pay QR code
 * 
 * Valid Solana Pay QR codes:
 * - Start with "solana:" protocol
 * - Contain a valid Solana address
 * - May include optional parameters (amount, label, memo)
 * 
 * @example
 * isValidPaymentQR("solana:5FHw...X6Pr?amount=10")  // true
 * isValidPaymentQR("solana:invalid")                // false
 * isValidPaymentQR("bitcoin:abc123")                // false
 */
export function isValidPaymentQR(data: string): boolean {
  if (!data || typeof data !== 'string') {
    return false;
  }
  
  if (!data.startsWith(SOLANA_PAY_PROTOCOL)) {
    return false;
  }
  
  const parsed = parsePaymentQR(data);
  return parsed !== null && isValidSolanaAddress(parsed.address);
}

/**
 * Parse a Solana Pay QR code into structured data
 * 
 * Format: solana:<address>?amount=<amount>&label=<label>&memo=<memo>&spl-token=<mint>
 * 
 * @example
 * parsePaymentQR("solana:5FHw...X6Pr?amount=10&label=Coffee")
 * // { address: "5FHw...X6Pr", amount: 10, label: "Coffee" }
 * 
 * @returns Parsed payment data or null if invalid
 */
export function parsePaymentQR(data: string): ParsedPaymentQR | null {
  try {
    if (!data || !data.startsWith(SOLANA_PAY_PROTOCOL)) {
      return null;
    }
    
    // Remove protocol prefix
    const withoutProtocol = data.slice(SOLANA_PAY_PROTOCOL.length);
    
    // Split address from query parameters
    const [address, queryString] = withoutProtocol.split('?');
    
    if (!address || !isValidSolanaAddress(address)) {
      return null;
    }
    
    // Parse query parameters
    const params = new URLSearchParams(queryString || '');
    
    const result: ParsedPaymentQR = { address };
    
    // Parse amount (optional)
    const amountStr = params.get('amount');
    if (amountStr) {
      const amount = parseFloat(amountStr);
      if (!isNaN(amount) && amount > 0) {
        result.amount = amount;
      }
    }
    
    // Parse label (optional)
    const label = params.get('label');
    if (label) {
      result.label = decodeURIComponent(label);
    }
    
    // Parse memo (optional)
    const memo = params.get('memo');
    if (memo) {
      result.memo = decodeURIComponent(memo);
    }
    
    // Parse token (optional)
    const token = params.get('spl-token');
    if (token && isValidSolanaAddress(token)) {
      result.token = token;
    }
    
    return result;
  } catch (error) {
    // Any parsing error means invalid QR code
    return null;
  }
}

/**
 * Generate a Solana Pay QR code string
 * 
 * @example
 * generatePaymentQR({
 *   address: "5FHw...X6Pr",
 *   amount: 10,
 *   label: "Coffee",
 *   token: "4zMM...ncDU"
 * })
 * // "solana:5FHw...X6Pr?amount=10&label=Coffee&spl-token=4zMM...ncDU"
 */
export function generatePaymentQR(options: {
  address: string;
  amount?: number;
  label?: string;
  memo?: string;
  token?: string;
}): string {
  const { address, amount, label, memo, token } = options;
  
  const params = new URLSearchParams();
  
  if (amount !== undefined && amount > 0) {
    params.append('amount', amount.toString());
  }
  
  if (label) {
    params.append('label', label);
  }
  
  if (memo) {
    params.append('memo', memo);
  }
  
  if (token) {
    params.append('spl-token', token);
  }
  
  const queryString = params.toString();
  return `${SOLANA_PAY_PROTOCOL}${address}${queryString ? '?' + queryString : ''}`;
}
