# Tutorial 1: Creating a Passkey-Based Wallet with LazorKit

> **Goal**: Learn how to implement passkey authentication and create a smart wallet without seed phrases.

---

## Overview

Traditional crypto wallets require users to manage seed phrases - a major UX barrier. LazorKit eliminates this by using **passkeys** (WebAuthn), allowing users to authenticate with Face ID, Touch ID, or device PIN.

**What you'll learn:**
- Setting up LazorKit provider
- Implementing biometric authentication
- Connecting a passkey-based smart wallet
- Handling authentication states
- Managing deep linking for wallet callbacks

---

## Prerequisites

Before starting, ensure you have:
- ✅ Completed the [Quick Start guide](../README.md#-quick-start)
- ✅ Basic understanding of React Native hooks
- ✅ Device with Face ID/Touch ID (or simulator)
- ✅ `expo-local-authentication` installed

---

## Step 1: Understanding the Architecture

### How Passkey Authentication Works

```
User taps "Connect Wallet"
       ↓
App opens biometric prompt (Face ID/Touch ID)
       ↓
On success, LazorKit SDK opens portal URL
       ↓
Portal creates/retrieves passkey credential
       ↓
Portal redirects back to app via deep link
       ↓
SDK establishes wallet session
       ↓
User is authenticated with smart wallet
```

### Key Components

1. **Biometric Layer**: Device-level authentication (optional but recommended)
2. **LazorKit Portal**: Handles passkey creation/retrieval
3. **Deep Linking**: Returns control to your app
4. **Smart Wallet**: No seed phrase, no private key management needed

---

## Step 2: Configure Polyfills

LazorKit requires specific polyfills for React Native compatibility.

Create or update `app/_layout.tsx`:

```typescript
// CRITICAL: These imports MUST be at the very top, before any other imports
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { Buffer } from 'buffer';
global.Buffer = global.Buffer || Buffer;

import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack />;
}
```

**Why these polyfills?**
- `react-native-get-random-values`: Provides secure random number generation for crypto operations
- `react-native-url-polyfill`: Enables URL parsing in React Native environment
- `buffer`: Required by Solana's web3.js library

---

## Step 3: Setup LazorKit Provider

Wrap your app with `LazorKitProvider` to enable wallet functionality throughout your app.

In `app/index.tsx`:

```typescript
import { LazorKitProvider } from '@lazorkit/wallet-mobile-adapter';
import { SafeAreaView, StyleSheet } from 'react-native';
import { RPC_URL, PORTAL_URL, PAYMASTER_CONFIG } from '../src/lib/constants';

export default function App() {
  return (
    <LazorKitProvider
      rpcUrl={RPC_URL}                    // Solana RPC endpoint
      portalUrl={PORTAL_URL}              // LazorKit authentication portal
      configPaymaster={PAYMASTER_CONFIG}  // Enables gasless transactions
    >
      <SafeAreaView style={styles.container}>
        {/* Your app screens */}
      </SafeAreaView>
    </LazorKitProvider>
  );
}
```

**Configuration Breakdown:**
- **rpcUrl**: Connects to Solana network (Devnet for testing)
- **portalUrl**: LazorKit's authentication service
- **configPaymaster**: Enables paying fees in USDC instead of SOL

---

## Step 4: Configure Deep Linking

LazorKit needs to redirect back to your app after authentication.

Update `app.json`:

```json
{
  "expo": {
    "scheme": "lazorkitapp",
    "ios": {
      "bundleIdentifier": "com.yourcompany.solpay"
    },
    "android": {
      "package": "com.yourcompany.solpay"
    }
  }
}
```

Then update your config:

```typescript
// src/lib/constants.ts
export const APP_SCHEME = 'lazorkitapp://home';  // Must match app.json scheme
```

**Testing deep links:**
```bash
# iOS Simulator
xcrun simctl openurl booted lazorkitapp://home

# Android
adb shell am start -W -a android.intent.action.VIEW -d "lazorkitapp://home"
```

---

## Step 5: Create Authentication Screen

Now let's build the authentication screen with biometric support.

Create `src/screens/AuthScreen.tsx`:

```typescript
import { useWallet } from '@lazorkit/wallet-mobile-adapter';
import * as LocalAuthentication from 'expo-local-authentication';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { APP_SCHEME } from '../lib/constants';

interface AuthScreenProps {
  onAuthenticated: () => void;  // Callback when auth succeeds
}

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  // Access LazorKit wallet functions
  const { connect, isConnecting } = useWallet();
  const [error, setError] = useState<string | null>(null);

  const handleAuthenticate = async () => {
    try {
      setError(null);

      // Step 1: Check device biometric availability
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        setError('Biometric authentication not available. Please set up Face ID or Touch ID.');
        return;
      }

      // Step 2: Authenticate with device biometrics
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access your wallet',
        fallbackLabel: 'Use passcode',
        disableDeviceFallback: false,  // Allow PIN fallback
      });

      if (!result.success) {
        setError('Authentication failed. Please try again.');
        return;
      }

      // Step 3: Connect wallet with LazorKit
      // This will:
      // 1. Open LazorKit portal in browser
      // 2. Create/retrieve passkey
      // 3. Redirect back to app
      // 4. Establish wallet session
      await connect({ 
        redirectUrl: APP_SCHEME,  // Where to return after auth
      });

      // Step 4: Success! Navigate to home screen
      onAuthenticated();
      
    } catch (err) {
      console.error('Authentication error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo Section */}
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>⚡</Text>
        <Text style={styles.title}>SolPay</Text>
        <Text style={styles.subtitle}>Solana payments without seed phrases</Text>
      </View>

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Authentication Button */}
      <TouchableOpacity
        style={[styles.button, isConnecting && styles.buttonDisabled]}
        onPress={handleAuthenticate}
        disabled={isConnecting}
      >
        {isConnecting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            🔐 Connect with Passkey
          </Text>
        )}
      </TouchableOpacity>

      {/* Info Text */}
      <Text style={styles.infoText}>
        No seed phrases. No passwords. Just Face ID.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#fee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#c00',
  },
  button: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 200,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  infoText: {
    marginTop: 20,
    color: '#666',
    fontSize: 14,
  },
});
```

---

## Step 6: Access Wallet State

After authentication, access wallet information throughout your app:

```typescript
import { useWallet } from '@lazorkit/wallet-mobile-adapter';

function HomeScreen() {
  const { 
    smartWalletPubkey,  // PublicKey | null - Wallet address
    isConnected,        // boolean - Connection status
    isLoading,          // boolean - Any operation in progress
    disconnect,         // Function to disconnect wallet
  } = useWallet();

  if (!isConnected || !smartWalletPubkey) {
    return <Text>Please connect your wallet</Text>;
  }

  return (
    <View>
      <Text>Connected Wallet:</Text>
      <Text>{smartWalletPubkey.toString()}</Text>
      
      <TouchableOpacity onPress={disconnect}>
        <Text>Disconnect</Text>
      </TouchableOpacity>
    </View>
  );
}
```

---

## Step 7: Handle Session Persistence

LazorKit automatically persists sessions. Users won't need to re-authenticate every time they open the app.

```typescript
import { useWallet } from '@lazorkit/wallet-mobile-adapter';
import { useEffect } from 'react';

function App() {
  const { isConnected, isConnecting } = useWallet();

  useEffect(() => {
    // Check if user has an existing session
    if (isConnected) {
      console.log('User already authenticated');
      // Navigate to home screen
    }
  }, [isConnected]);

  if (isConnecting) {
    return <LoadingScreen />;
  }

  return isConnected ? <HomeScreen /> : <AuthScreen />;
}
```

---

## Common Issues & Solutions

### Issue 1: Deep Link Not Working

**Problem**: App doesn't return after authentication.

**Solution**:
1. Verify scheme in `app.json` matches `CONFIG.APP_SCHEME`
2. Rebuild app after changing `app.json`: `expo prebuild --clean`
3. Test deep link manually (see Step 4)

### Issue 2: "Cannot find name 'global'" Error

**Problem**: TypeScript error on `global.Buffer`.

**Solution**: Use `globalThis` instead:
```typescript
globalThis.Buffer = globalThis.Buffer || Buffer;
```

### Issue 3: Biometric Not Available

**Problem**: LocalAuthentication returns false.

**Solution**:
- **iOS Simulator**: Enable Face ID in Settings → Face ID → Enrolled
- **Android Emulator**: Must use device with biometric support or skip biometric step

### Issue 4: Connection Timeout

**Problem**: `connect()` takes too long or fails.

**Solution**:
1. Check network connection
2. Verify RPC_URL is accessible
3. Ensure portal URL is correct
4. Check device time is synchronized

---

## Testing Your Implementation

### 1. Test Biometric Authentication

```typescript
const testBiometric = async () => {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Test authentication',
  });
  console.log('Biometric result:', result);
};
```

### 2. Test Wallet Connection

```typescript
const { connect } = useWallet();

const testConnection = async () => {
  try {
    await connect({ redirectUrl: CONFIG.APP_SCHEME });
    console.log('✅ Connection successful');
  } catch (error) {
    console.error('❌ Connection failed:', error);
  }
};
```

### 3. Test Session Persistence

1. Connect wallet
2. Close app completely
3. Reopen app
4. Verify wallet is still connected without re-authentication

---

## Next Steps

Now that you have passkey authentication working:

1. ✅ [Tutorial 2: Sending Gasless Transactions](./TUTORIAL_2_GASLESS_TRANSACTIONS.md)
2. 📖 Explore [useWallet API Reference](../README.md#-api-reference)
3. 🔍 Check [Troubleshooting Guide](../README.md#-troubleshooting)

---

## Key Takeaways

✅ **No Seed Phrases**: Users authenticate with device biometrics
✅ **Smart Wallet**: Wallet is managed by LazorKit's infrastructure
✅ **Session Persistence**: Users stay logged in across app restarts
✅ **Deep Linking**: Essential for portal authentication flow
✅ **Error Handling**: Always provide clear feedback to users

---

**Need Help?**
- [LazorKit Documentation](https://docs.lazorkit.com/)
- [GitHub Issues](https://github.com/your-repo/issues)
- [LazorKit Discord](https://discord.gg/lazorkit)
