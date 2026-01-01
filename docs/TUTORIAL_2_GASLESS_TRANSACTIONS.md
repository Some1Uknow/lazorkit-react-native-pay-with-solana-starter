# Tutorial 2: Sending Gasless Transactions with LazorKit

> **Goal**: Learn how to send transactions where users pay fees in USDC instead of SOL using LazorKit's paymaster infrastructure.

---

## Overview

One of Solana's biggest UX barriers is requiring users to hold SOL for transaction fees. **LazorKit's gasless transactions** solve this by letting users pay fees in any SPL token (like USDC).

**What you'll learn:**
- How gasless transactions work
- Setting up the paymaster
- Creating and sending USDC transfers
- Handling transaction states and errors
- Implementing transaction confirmation UX
- Verifying transactions on-chain

---

## Prerequisites

Before starting:
- ✅ Completed [Tutorial 1: Passkey Wallet](./TUTORIAL_1_PASSKEY_WALLET.md)
- ✅ Connected wallet with LazorKit
- ✅ Wallet funded with Devnet USDC ([get USDC here](https://spl-token-faucet.com))
- ✅ Basic understanding of Solana transactions

---

## Step 1: Understanding Gasless Transactions

### Traditional Solana Transaction Flow

```
User signs transaction
       ↓
Transaction sent to network
       ↓
SOL deducted from wallet for fees
       ↓
Transaction executed
```

**Problem**: User must always hold SOL, even if they only want to use USDC.

### LazorKit Gasless Transaction Flow

```
User signs transaction
       ↓
LazorKit Paymaster receives transaction
       ↓
Paymaster covers SOL fees
       ↓
Equivalent USDC deducted from user's wallet
       ↓
Transaction executed
```

**Benefit**: Users only need the token they're using (USDC), no SOL required!

### How It Works Under the Hood

1. **Transaction Created**: Your app creates normal Solana instructions
2. **Fee Conversion**: Paymaster calculates SOL fee equivalent in USDC
3. **Fee Payment**: User signs approval to deduct USDC for fees
4. **Execution**: Paymaster pays SOL fees, gets reimbursed in USDC
5. **Completion**: Original transaction executes successfully

---

## Step 2: Configure Paymaster

Ensure your config includes paymaster settings:

```typescript
// src/lib/constants.ts
// Solana Network
export const RPC_URL = 'https://api.devnet.solana.com';

// LazorKit Configuration
export const PORTAL_URL = 'https://portal.lazor.sh';

// Paymaster Configuration - THIS ENABLES GASLESS TRANSACTIONS
export const PAYMASTER_CONFIG = {
  paymasterUrl: 'https://kora.devnet.lazorkit.com',
  // apiKey: 'YOUR_API_KEY' // Optional: Add for production rate limits
};

// USDC Token (Devnet)
export const USDC_MINT = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';

// Deep Linking
export const APP_SCHEME = 'lazorkitapp://home';
```

**Configuration Notes:**
- **paymasterUrl**: Devnet paymaster endpoint for testing
- **apiKey**: Optional for dev, required for production to prevent abuse
- Production paymaster URL: `https://kora.mainnet.lazorkit.com`

---

## Step 3: Create Transfer Instruction

Let's build a USDC transfer with proper error handling:

```typescript
import { useWallet } from '@lazorkit/wallet-mobile-adapter';
import { createTransferInstruction, getAssociatedTokenAddress } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { USDC_MINT, APP_SCHEME } from '../lib/constants';

export function useUSDCTransfer() {
  const { signAndSendTransaction, smartWalletPubkey } = useWallet();

  const sendUSDC = async (recipientAddress: string, amount: number) => {
    // Validation: Check wallet is connected
    if (!smartWalletPubkey) {
      throw new Error('Wallet not connected');
    }

    try {
      // Step 1: Convert addresses to PublicKey objects
      const recipient = new PublicKey(recipientAddress);
      const usdcMint = new PublicKey(USDC_MINT);

      // Step 2: Get Associated Token Accounts (ATA)
      // These are the USDC accounts for sender and recipient
      const sourceAccount = await getAssociatedTokenAddress(
        usdcMint,           // USDC token mint
        smartWalletPubkey   // Sender's wallet
      );

      const destAccount = await getAssociatedTokenAddress(
        usdcMint,    // USDC token mint
        recipient    // Recipient's wallet
      );

      // Step 3: Create USDC transfer instruction
      // USDC has 6 decimals, so multiply by 1,000,000
      const instruction = createTransferInstruction(
        sourceAccount,                    // From: sender's USDC account
        destAccount,                      // To: recipient's USDC account
        smartWalletPubkey,               // Authority: sender's wallet
        amount * 1_000_000               // Amount: convert to smallest unit
      );

      // Step 4: Send transaction with gasless fees
      // This is where the magic happens!
      const signature = await signAndSendTransaction(
        {
          // Array of instructions to execute
          instructions: [instruction],
          
          // Transaction configuration
          transactionOptions: {
            feeToken: 'USDC',              // Pay fees in USDC instead of SOL
            clusterSimulation: 'devnet',   // Network for simulation
            computeUnitLimit: 200_000,     // Max compute units (optional)
          },
        },
        {
          // Callback configuration
          redirectUrl: APP_SCHEME,  // Where to return after signing
          
          // Success callback
          onSuccess: (sig) => {
            console.log('✅ Transaction successful:', sig);
          },
          
          // Error callback
          onFail: (error) => {
            console.error('❌ Transaction failed:', error);
          },
        }
      );

      return signature;

    } catch (error) {
      console.error('Transfer error:', error);
      throw error;
    }
  };

  return { sendUSDC };
}
```

**Key Points:**
- **Associated Token Accounts**: Every wallet needs a specific account for each token type
- **Amount Conversion**: USDC uses 6 decimals (unlike SOL's 9)
- **feeToken**: This parameter enables gasless transactions
- **clusterSimulation**: Must match your network (devnet/mainnet)

---

## Step 4: Implement Transaction UI

Create a payment screen with proper UX:

```typescript
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useWallet } from '@lazorkit/wallet-mobile-adapter';
import { getExplorerTxUrl } from '../lib/constants';

export function PaymentScreen() {
  const { smartWalletPubkey, isSigning } = useWallet();
  const { sendUSDC } = useUSDCTransfer();
  
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    // Validation
    if (!recipient || !amount) {
      Alert.alert('Error', 'Please enter recipient and amount');
      return;
    }

    const payAmount = parseFloat(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    // Show confirmation dialog
    Alert.alert(
      'Confirm Payment',
      `Send $${payAmount} USDC to ${recipient.slice(0, 8)}...?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setLoading(true);
            try {
              // Send transaction
              const signature = await sendUSDC(recipient, payAmount);

              // Success feedback
              Alert.alert(
                'Payment Sent! 🎉',
                `Transaction: ${signature.slice(0, 8)}...`,
                [
                  {
                    text: 'View on Explorer',
                    onPress: () => {
                      const explorerUrl = getExplorerTxUrl(signature);
                      console.log('Open:', explorerUrl);
                      // In production: Linking.openURL(explorerUrl)
                    },
                  },
                  { text: 'Done' },
                ]
              );

              // Reset form
              setRecipient('');
              setAmount('');

            } catch (error) {
              // Error handling
              const errorMessage = error instanceof Error 
                ? error.message 
                : 'Transaction failed';
              
              Alert.alert('Transaction Failed', errorMessage);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Show loading state during signing
  if (loading || isSigning) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={styles.loadingText}>
          {isSigning ? 'Waiting for signature...' : 'Processing transaction...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Send USDC</Text>

      {/* Recipient Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Recipient Address</Text>
        <TextInput
          style={styles.input}
          value={recipient}
          onChangeText={setRecipient}
          placeholder="Enter Solana address"
          placeholderTextColor="#999"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Amount Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Amount (USDC)</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          placeholderTextColor="#999"
          keyboardType="decimal-pad"
        />
        <Text style={styles.hint}>
          💡 Fees will be paid in USDC (no SOL required)
        </Text>
      </View>

      {/* Send Button */}
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handlePayment}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          ⚡ Send Payment (Gasless)
        </Text>
      </TouchableOpacity>

      {/* Info Text */}
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          🔐 This transaction is gasless - fees are automatically paid in USDC
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  hint: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
  },
  button: {
    backgroundColor: '#0ea5e9',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  infoBox: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#0369a1',
  },
});
```

---

## Step 5: Check Balance Before Transaction

Always verify sufficient balance before sending:

```typescript
import { Connection } from '@solana/web3.js';
import { getAccount, getAssociatedTokenAddress } from '@solana/spl-token';
import { RPC_URL, USDC_MINT } from '../lib/constants';

async function checkUSDCBalance(walletPubkey: PublicKey): Promise<number> {
  const connection = new Connection(RPC_URL);
  const usdcMint = new PublicKey(USDC_MINT);

  try {
    // Get user's USDC token account
    const tokenAccount = await getAssociatedTokenAddress(
      usdcMint,
      walletPubkey
    );

    // Fetch account info
    const accountInfo = await getAccount(connection, tokenAccount);
    
    // Convert from smallest unit (6 decimals for USDC)
    return Number(accountInfo.amount) / 1_000_000;

  } catch (error) {
    // Token account might not exist yet
    console.log('No USDC account found');
    return 0;
  }
}

// Usage in component
const handlePayment = async () => {
  const balance = await checkUSDCBalance(smartWalletPubkey!);
  const payAmount = parseFloat(amount);

  if (balance < payAmount) {
    Alert.alert(
      'Insufficient Balance',
      `You need ${payAmount} USDC but only have ${balance} USDC.\n\nGet test USDC at spl-token-faucet.com`
    );
    return;
  }

  // Proceed with transaction
  await sendUSDC(recipient, payAmount);
};
```

---

## Step 6: Handle Transaction Errors

Implement comprehensive error handling:

```typescript
const handleTransaction = async () => {
  try {
    setLoading(true);
    const signature = await sendUSDC(recipient, amount);
    
    // Success
    Alert.alert('Success', `Transaction: ${signature}`);

  } catch (error: any) {
    // Parse error and provide helpful message
    let errorMessage = 'Transaction failed';

    if (error.message?.includes('insufficient funds')) {
      errorMessage = 'Insufficient USDC balance for this transaction';
    } else if (error.message?.includes('blockhash')) {
      errorMessage = 'Network congestion. Please try again';
    } else if (error.message?.includes('account not found')) {
      errorMessage = 'Recipient wallet not found. Please verify address';
    } else if (error.message?.includes('User rejected')) {
      errorMessage = 'Transaction cancelled by user';
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    Alert.alert('Transaction Failed', errorMessage);
    console.error('Transaction error:', error);

  } finally {
    setLoading(false);
  }
};
```

---

## Step 7: Verify Transaction on Explorer

After successful transaction, allow users to verify on-chain:

```typescript
import { getExplorerTxUrl } from '../lib/constants';

const openExplorer = (signature: string) => {
  const url = getExplorerTxUrlring) => {
  const url = ENDPOINTS.EXPLORER.tx(signature);
  Linking.openURL(url).catch((err) => {
    console.error('Failed to open explorer:', err);
  });
};

// After successful transaction
Alert.alert(
  'Payment Sent! 🎉',
  `Transaction confirmed on-chain`,
  [
    {
      text: 'View on Explorer',
      onPress: () => openExplorer(signature),
    },
    { text: 'Done', style: 'cancel' },
  ]
);
```

---

## Advanced: Batch Multiple Instructions

Send multiple operations in one transaction:

```typescript
const sendMultipleTransfers = async () => {
  const instructions = [
    // Transfer 1
    createTransferInstruction(
      sourceAccount1,
      destAccount1,
      smartWalletPubkey,
      10 * 1_000_000
    ),
    // Transfer 2
    createTransferInstruction(
      sourceAccount2,
      destAccount2,
      smartWalletPubkey,
      5 * 1_000_000
    ),
  ];

  const signature = await signAndSendTransaction(
    {
      instructions,  // Multiple instructions
      transactionOptions: {
        feeToken: 'USDC',
        clusterSimulation: 'devnet',
        computeUnitLimit: 400_000,  // Increase for multiple ops
      },
    },
    { redirectUrl: CONFIG.APP_SCHEME }
  );

  return signature;
};
```

---

## Common Issues & Solutions

### Issue 1: "Insufficient Funds" Error

**Causes**:
1. Not enough USDC for the transfer amount
2. Not enough USDC for the transaction fee

**Solution**:
```typescript
// Estimate fee (approximately 0.00001 USDC)
const estimatedFee = 0.00001;
const totalNeeded = amount + estimatedFee;

if (balance < totalNeeded) {
  Alert.alert('Insufficient Balance', 
    `You need ${totalNeeded} USDC (${amount} + ~${estimatedFee} fee)`
  );
}
```

### Issue 2: "Token Account Not Found"

**Problem**: Recipient doesn't have a USDC token account.

**Solution**: Create the account first:
```typescript
import { createAssociatedTokenAccountInstruction } from '@solana/spl-token';

// Check if account exists, create if not
const recipientTokenAccount = await getAssociatedTokenAddress(
  usdcMint,
  recipientPubkey
);

const accountInfo = await connection.getAccountInfo(recipientTokenAccount);

if (!accountInfo) {
  // Account doesn't exist, create it
  const createAccountIx = createAssociatedTokenAccountInstruction(
    smartWalletPubkey,    // Payer
    recipientTokenAccount,
    recipientPubkey,
    usdcMint
  );
  
  instructions.unshift(createAccountIx);  // Add to start of array
}
```

### Issue 3: Transaction Timeout

**Problem**: Transaction takes too long.

**Solution**:
```typescript
// Add timeout wrapper
const sendWithTimeout = async (timeout = 30000) => {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Transaction timeout')), timeout)
  );

  return Promise.race([
    sendUSDC(recipient, amount),
    timeoutPromise,
  ]);
};
```

---

## Testing Your Implementation

### 1. Test with Small Amounts

```typescript
// Start with small test amounts
const testAmount = 0.01; // $0.01 USDC
await sendUSDC(recipientAddress, testAmount);
```

### 2. Test Error Cases

```typescript
// Test insufficient balance
await sendUSDC(recipient, 999999); // Should fail

// Test invalid address
await sendUSDC('invalid-address', 1); // Should fail

// Test zero amount
await sendUSDC(recipient, 0); // Should fail
```

### 3. Verify on Explorer

After each transaction, check Solana Explorer:
- Verify transaction status
- Check fee was paid in USDC
- Confirm recipient received funds

---

## Production Checklist

Before going to mainnet:

- [ ] Switch to mainnet RPC URL
- [ ] Update USDC mint to mainnet address
- [ ] Add LazorKit API key for rate limiting
- [ ] Implement proper error tracking (Sentry)
- [ ] Add transaction retry logic
- [ ] Test with real funds (small amounts first)
- [ ] Implement balance checks before all transactions
- [ ] Add proper loading states and user feedback
- [ ] Test on both iOS and Android devices
- [ ] Monitor failed transaction rates

---

## Key Takeaways

✅ **Gasless = Better UX**: Users only need USDC, not SOL
✅ **Simple API**: Just add `feeToken: 'USDC'` to transaction options
✅ **Error Handling**: Always validate balance and provide clear feedback
✅ **User Confirmation**: Show transaction details before execution
✅ **Transaction Verification**: Let users verify on block explorer

---

## Next Steps

1. ✅ Implement QR code scanning for recipient addresses
2. 📖 Add transaction history tracking
3. 🔍 Explore [Advanced Transaction Patterns](../README.md#advanced-usage)
4. 🎨 Customize UI for your brand

---

**Need Help?**
- [LazorKit Documentation](https://docs.lazorkit.com/)
- [Solana Transaction Guide](https://docs.solana.com/developing/programming-model/transactions)
- [GitHub Issues](https://github.com/your-repo/issues)
