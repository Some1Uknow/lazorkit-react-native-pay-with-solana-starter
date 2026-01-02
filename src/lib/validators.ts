// Input validation utilities

import { PublicKey } from '@solana/web3.js';
import { MAX_PAYMENT_AMOUNT, MIN_PAYMENT_AMOUNT, SOLANA_PAY_PROTOCOL } from './constants';

// Check if a string is a valid Solana public key
export function isValidSolanaAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }
  
  if (address.length < 32 || address.length > 44) {
    return false;
  }
  
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

// Check if a payment amount is valid
export function isValidPaymentAmount(amount: number): boolean {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return false;
  }
  
  return amount >= MIN_PAYMENT_AMOUNT && amount <= MAX_PAYMENT_AMOUNT;
}

// Parse a string to a valid payment amount (returns null if invalid)
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
  
  
  if (parsed < 0) {
    return null;
  }
  
  return parsed;
}

// Parsed payment data from a QR code
export interface ParsedPaymentQR {
  address: string;
  amount?: number;
  label?: string;
  memo?: string;
  token?: string;
}

// Check if a string is a valid Solana Pay QR code
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

// Parse a Solana Pay QR code into structured data
// Format: solana:<address>?amount=<amount>&label=<label>&memo=<memo>&spl-token=<mint>
export function parsePaymentQR(data: string): ParsedPaymentQR | null {
  try {
    if (!data || !data.startsWith(SOLANA_PAY_PROTOCOL)) {
      return null;
    }
    
    const withoutProtocol = data.slice(SOLANA_PAY_PROTOCOL.length);
    const [address, queryString] = withoutProtocol.split('?');
    
    if (!address || !isValidSolanaAddress(address)) {
      return null;
    }
    
    const params = new URLSearchParams(queryString || '');
    const result: ParsedPaymentQR = { address };
    
    const amountStr = params.get('amount');
    if (amountStr) {
      const amount = parseFloat(amountStr);
      if (!isNaN(amount) && amount > 0) {
        result.amount = amount;
      }
    }
    
    const label = params.get('label');
    if (label) {
      result.label = decodeURIComponent(label);
    }
    
    const memo = params.get('memo');
    if (memo) {
      result.memo = decodeURIComponent(memo);
    }
    
    const token = params.get('spl-token');
    if (token && isValidSolanaAddress(token)) {
      result.token = token;
    }
    
    return result;
  } catch (error) {
    return null;
  }
}

// Generate a Solana Pay QR code string
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
