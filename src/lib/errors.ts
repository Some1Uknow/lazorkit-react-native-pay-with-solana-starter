/**
 * ============================================================================
 * ERROR HANDLING - User-friendly error messages and logging
 * ============================================================================
 * 
 * WHY THIS FILE EXISTS:
 * - Transform cryptic technical errors into human-readable messages
 * - Provide consistent error handling across the app
 * - Enable easy debugging with structured logging
 * - Give users actionable feedback when things go wrong
 */

// =============================================================================
// ERROR TYPES
// =============================================================================

/**
 * Custom error class for wallet-related errors
 * Includes user-friendly message separate from technical details
 */
export class WalletError extends Error {
  /** User-friendly message to display in UI */
  public readonly userMessage: string;
  
  /** Error code for programmatic handling */
  public readonly code: string;
  
  /** Whether the error is recoverable (user can retry) */
  public readonly isRecoverable: boolean;
  
  /** Original error for debugging */
  public readonly originalError?: Error;

  constructor(options: {
    message: string;
    userMessage: string;
    code: string;
    isRecoverable?: boolean;
    originalError?: Error;
  }) {
    super(options.message);
    this.name = 'WalletError';
    this.userMessage = options.userMessage;
    this.code = options.code;
    this.isRecoverable = options.isRecoverable ?? true;
    this.originalError = options.originalError;
  }
}

// =============================================================================
// ERROR CODES
// =============================================================================

export const ErrorCodes = {
  // Authentication errors
  AUTH_BIOMETRIC_NOT_AVAILABLE: 'AUTH_BIOMETRIC_NOT_AVAILABLE',
  AUTH_BIOMETRIC_NOT_ENROLLED: 'AUTH_BIOMETRIC_NOT_ENROLLED',
  AUTH_BIOMETRIC_FAILED: 'AUTH_BIOMETRIC_FAILED',
  AUTH_CANCELLED: 'AUTH_CANCELLED',
  AUTH_CONNECTION_FAILED: 'AUTH_CONNECTION_FAILED',
  
  // Wallet errors
  WALLET_NOT_CONNECTED: 'WALLET_NOT_CONNECTED',
  WALLET_SESSION_EXPIRED: 'WALLET_SESSION_EXPIRED',
  
  // Transaction errors
  TX_INSUFFICIENT_BALANCE: 'TX_INSUFFICIENT_BALANCE',
  TX_INVALID_AMOUNT: 'TX_INVALID_AMOUNT',
  TX_INVALID_RECIPIENT: 'TX_INVALID_RECIPIENT',
  TX_SIGNING_FAILED: 'TX_SIGNING_FAILED',
  TX_SUBMISSION_FAILED: 'TX_SUBMISSION_FAILED',
  TX_CONFIRMATION_TIMEOUT: 'TX_CONFIRMATION_TIMEOUT',
  
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  RPC_ERROR: 'RPC_ERROR',
  
  // QR errors
  QR_INVALID: 'QR_INVALID',
  QR_CAMERA_PERMISSION: 'QR_CAMERA_PERMISSION',
  
  // Unknown
  UNKNOWN: 'UNKNOWN',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// =============================================================================
// ERROR MESSAGES (User-Friendly)
// =============================================================================

/**
 * Map error codes to user-friendly messages
 */
export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCodes.AUTH_BIOMETRIC_NOT_AVAILABLE]: 
    'Biometric authentication is not available on this device. Please set up Face ID or Touch ID in your device settings.',
  
  [ErrorCodes.AUTH_BIOMETRIC_NOT_ENROLLED]: 
    'No biometric credentials found. Please set up Face ID or Touch ID in your device settings first.',
  
  [ErrorCodes.AUTH_BIOMETRIC_FAILED]: 
    'Biometric authentication failed. Please try again.',
  
  [ErrorCodes.AUTH_CANCELLED]: 
    'Authentication was cancelled. Tap "Get Started" to try again.',
  
  [ErrorCodes.AUTH_CONNECTION_FAILED]: 
    'Could not connect to wallet service. Please check your internet connection and try again.',
  
  [ErrorCodes.WALLET_NOT_CONNECTED]: 
    'Wallet is not connected. Please authenticate first.',
  
  [ErrorCodes.WALLET_SESSION_EXPIRED]: 
    'Your session has expired. Please authenticate again.',
  
  [ErrorCodes.TX_INSUFFICIENT_BALANCE]: 
    'Insufficient balance to complete this transaction. Please add funds to your wallet.',
  
  [ErrorCodes.TX_INVALID_AMOUNT]: 
    'Invalid amount entered. Please enter a valid number between $0.01 and $10,000.',
  
  [ErrorCodes.TX_INVALID_RECIPIENT]: 
    'Invalid recipient address. Please scan a valid Solana payment QR code.',
  
  [ErrorCodes.TX_SIGNING_FAILED]: 
    'Failed to sign the transaction. Please try again.',
  
  [ErrorCodes.TX_SUBMISSION_FAILED]: 
    'Failed to submit the transaction to the network. Please try again.',
  
  [ErrorCodes.TX_CONFIRMATION_TIMEOUT]: 
    'Transaction is taking longer than expected. It may still complete. Check your transaction history.',
  
  [ErrorCodes.NETWORK_ERROR]: 
    'Network connection failed. Please check your internet connection.',
  
  [ErrorCodes.RPC_ERROR]: 
    'Could not connect to Solana network. Please try again later.',
  
  [ErrorCodes.QR_INVALID]: 
    'This is not a valid Solana payment QR code. Please scan a valid QR code.',
  
  [ErrorCodes.QR_CAMERA_PERMISSION]: 
    'Camera permission is required to scan QR codes. Please enable camera access in your device settings.',
  
  [ErrorCodes.UNKNOWN]: 
    'An unexpected error occurred. Please try again.',
};

// =============================================================================
// ERROR PARSING UTILITIES
// =============================================================================

/**
 * Parse an unknown error into a WalletError with user-friendly message
 * 
 * @example
 * try {
 *   await sendTransaction();
 * } catch (error) {
 *   const walletError = parseError(error);
 *   showAlert(walletError.userMessage);
 * }
 */
export function parseError(error: unknown): WalletError {
  // Already a WalletError, return as-is
  if (error instanceof WalletError) {
    return error;
  }

  const originalError = error instanceof Error ? error : undefined;
  const message = originalError?.message || String(error);
  
  // Pattern match common error messages to provide better UX
  const lowerMessage = message.toLowerCase();
  
  // Insufficient balance patterns
  if (lowerMessage.includes('insufficient') || 
      lowerMessage.includes('not enough') ||
      lowerMessage.includes('balance')) {
    return new WalletError({
      message,
      userMessage: ErrorMessages[ErrorCodes.TX_INSUFFICIENT_BALANCE],
      code: ErrorCodes.TX_INSUFFICIENT_BALANCE,
      isRecoverable: true,
      originalError,
    });
  }
  
  // Network error patterns
  if (lowerMessage.includes('network') || 
      lowerMessage.includes('timeout') ||
      lowerMessage.includes('connection')) {
    return new WalletError({
      message,
      userMessage: ErrorMessages[ErrorCodes.NETWORK_ERROR],
      code: ErrorCodes.NETWORK_ERROR,
      isRecoverable: true,
      originalError,
    });
  }
  
  // User cancelled patterns
  if (lowerMessage.includes('cancel') || 
      lowerMessage.includes('abort') ||
      lowerMessage.includes('user rejected')) {
    return new WalletError({
      message,
      userMessage: ErrorMessages[ErrorCodes.AUTH_CANCELLED],
      code: ErrorCodes.AUTH_CANCELLED,
      isRecoverable: true,
      originalError,
    });
  }
  
  // Token/SPL errors - TokenOwnerOffCurveError
  if (lowerMessage.includes('offcurve') || 
      lowerMessage.includes('off curve') ||
      lowerMessage.includes('tokenowneroffcurve')) {
    return new WalletError({
      message,
      userMessage: 'Invalid recipient address for token transfer. The address may not be a valid wallet.',
      code: ErrorCodes.TX_INVALID_RECIPIENT,
      isRecoverable: true,
      originalError,
    });
  }
  
  // Invalid address patterns
  if (lowerMessage.includes('invalid') && lowerMessage.includes('address')) {
    return new WalletError({
      message,
      userMessage: ErrorMessages[ErrorCodes.TX_INVALID_RECIPIENT],
      code: ErrorCodes.TX_INVALID_RECIPIENT,
      isRecoverable: true,
      originalError,
    });
  }
  
  // Default to unknown error
  return new WalletError({
    message,
    userMessage: ErrorMessages[ErrorCodes.UNKNOWN],
    code: ErrorCodes.UNKNOWN,
    isRecoverable: true,
    originalError,
  });
}

// =============================================================================
// LOGGING UTILITIES
// =============================================================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Structured logger for consistent, developer-friendly output
 * 
 * In development: Logs to console with formatting
 * In production: Could be configured to send to logging service
 */
export const logger = {
  debug: (context: string, message: string, data?: object) => {
    logWithLevel('debug', context, message, data);
  },
  
  info: (context: string, message: string, data?: object) => {
    logWithLevel('info', context, message, data);
  },
  
  warn: (context: string, message: string, data?: object) => {
    logWithLevel('warn', context, message, data);
  },
  
  error: (context: string, message: string, error?: unknown, data?: object) => {
    const parsedError = error ? parseError(error) : undefined;
    logWithLevel('error', context, message, {
      ...data,
      error: parsedError ? {
        code: parsedError.code,
        message: parsedError.message,
        userMessage: parsedError.userMessage,
      } : undefined,
    });
  },
};

function logWithLevel(level: LogLevel, context: string, message: string, data?: object) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}] [${context}]`;
  
  const logFn = level === 'error' ? console.error 
              : level === 'warn' ? console.warn 
              : level === 'info' ? console.info 
              : console.log;
  
  if (data && Object.keys(data).length > 0) {
    logFn(`${prefix} ${message}`, data);
  } else {
    logFn(`${prefix} ${message}`);
  }
}
