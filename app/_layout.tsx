/**
 * ============================================================================
 * ROOT LAYOUT - App entry point with required polyfills
 * ============================================================================
 * 
 * CRITICAL: The polyfill imports MUST be at the very top of this file,
 * before any other imports. They provide:
 * 
 * 1. react-native-get-random-values: Secure random number generation
 *    Required by: Solana keypair generation, transaction signing
 * 
 * 2. react-native-url-polyfill: URL parsing in React Native
 *    Required by: Deep linking, API calls
 * 
 * 3. buffer: Node.js Buffer API for React Native
 *    Required by: @solana/web3.js for binary data handling
 */

// ⚠️ POLYFILLS - MUST BE FIRST
import { Buffer } from 'buffer';
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
global.Buffer = global.Buffer || Buffer;

// Now safe to import other modules
import { Stack } from 'expo-router';

/**
 * Root layout component
 * Uses expo-router's Stack navigator for screen management
 * 
 * Note: The actual app content is in app/index.tsx
 * This file is primarily for polyfill initialization
 */
export default function RootLayout() {
  return (
    <Stack 
      screenOptions={{
        headerShown: false, // We use custom headers in screens
      }}
    />
  );
}
