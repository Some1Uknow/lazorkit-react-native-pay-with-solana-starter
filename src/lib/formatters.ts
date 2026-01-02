// Display formatting utilities

import { USDC_DECIMALS } from './constants';

// Format USDC amount for display
export function formatUSDC(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Format SOL amount for display
export function formatSOL(amount: number): string {
  return `${amount.toFixed(4)} SOL`;
}

// Convert USDC base units (6 decimals) to human-readable amount
export function usdcFromBaseUnits(baseUnits: number): number {
  return baseUnits / Math.pow(10, USDC_DECIMALS);
}

// Convert human-readable USDC amount to base units
export function usdcToBaseUnits(amount: number): number {
  return Math.floor(amount * Math.pow(10, USDC_DECIMALS));
}

// Shorten a Solana address for display
export function shortenAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  if (diffMs < 60_000) {
    return 'Just now';
  }
  
  if (diffMs < 3_600_000) {
    const minutes = Math.floor(diffMs / 60_000);
    return `${minutes}m ago`;
  }
  
  if (diffMs < 86_400_000) {
    const hours = Math.floor(diffMs / 3_600_000);
    return `${hours}h ago`;
  }
  
  if (diffMs < 604_800_000) {
    const days = Math.floor(diffMs / 86_400_000);
    return `${days}d ago`;
  }
  
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  }).format(date);
}

// Format a date with full timestamp
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

// Format a large number with compact notation
export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(value);
}
