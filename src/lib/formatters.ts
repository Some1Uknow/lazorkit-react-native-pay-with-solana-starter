/**
 * ============================================================================
 * FORMATTERS - Display formatting utilities
 * ============================================================================
 * 
 * Pure utility functions for formatting data for display.
 * No side effects, no external dependencies (except constants).
 */

import { USDC_DECIMALS } from './constants';

// =============================================================================
// CURRENCY FORMATTING
// =============================================================================

/**
 * Format USDC amount for display
 * 
 * @example
 * formatUSDC(1.5)     // "$1.50"
 * formatUSDC(0)       // "$0.00"
 * formatUSDC(1000.5)  // "$1,000.50"
 */
export function formatUSDC(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format SOL amount for display
 * 
 * @example
 * formatSOL(1.5)      // "1.5000 SOL"
 * formatSOL(0.00001)  // "0.0000 SOL"
 */
export function formatSOL(amount: number): string {
  return `${amount.toFixed(4)} SOL`;
}

/**
 * Convert USDC base units to human-readable amount
 * USDC has 6 decimals, so 1,000,000 base units = $1.00
 * 
 * @example
 * usdcFromBaseUnits(1_000_000) // 1.00
 * usdcFromBaseUnits(500_000)   // 0.50
 */
export function usdcFromBaseUnits(baseUnits: number): number {
  return baseUnits / Math.pow(10, USDC_DECIMALS);
}

/**
 * Convert human-readable USDC amount to base units
 * 
 * @example
 * usdcToBaseUnits(1.00)  // 1_000_000
 * usdcToBaseUnits(0.50)  // 500_000
 */
export function usdcToBaseUnits(amount: number): number {
  return Math.floor(amount * Math.pow(10, USDC_DECIMALS));
}

// =============================================================================
// ADDRESS FORMATTING
// =============================================================================

/**
 * Shorten a Solana address for display
 * 
 * @example
 * shortenAddress("5FHwkrdxntdK24hgQU8qgBjn35Y1zwhz1GZwCNA9X6Pr", 4)
 * // "5FHw...X6Pr"
 * 
 * shortenAddress("5FHwkrdxntdK24hgQU8qgBjn35Y1zwhz1GZwCNA9X6Pr", 8)
 * // "5FHwkrdx...CNA9X6Pr"
 */
export function shortenAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  if (address.length <= chars * 2 + 3) return address;
  
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

// =============================================================================
// TIME FORMATTING
// =============================================================================

/**
 * Format a timestamp relative to now
 * 
 * @example
 * formatTimeAgo(new Date())                        // "Just now"
 * formatTimeAgo(new Date(Date.now() - 60000))      // "1m ago"
 * formatTimeAgo(new Date(Date.now() - 3600000))    // "1h ago"
 * formatTimeAgo(new Date(Date.now() - 86400000))   // "1d ago"
 */
export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  // Less than 1 minute
  if (diffMs < 60_000) {
    return 'Just now';
  }
  
  // Less than 1 hour
  if (diffMs < 3_600_000) {
    const minutes = Math.floor(diffMs / 60_000);
    return `${minutes}m ago`;
  }
  
  // Less than 24 hours
  if (diffMs < 86_400_000) {
    const hours = Math.floor(diffMs / 3_600_000);
    return `${hours}h ago`;
  }
  
  // Less than 7 days
  if (diffMs < 604_800_000) {
    const days = Math.floor(diffMs / 86_400_000);
    return `${days}d ago`;
  }
  
  // Format as date
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  }).format(date);
}

/**
 * Format a date with full timestamp
 * 
 * @example
 * formatFullDate(new Date()) // "Jan 1, 2026, 10:30 AM"
 */
export function formatFullDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

// =============================================================================
// NUMBER FORMATTING
// =============================================================================

/**
 * Format a large number with compact notation
 * 
 * @example
 * formatCompactNumber(1000)      // "1K"
 * formatCompactNumber(1500000)   // "1.5M"
 */
export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(value);
}
