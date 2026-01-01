/**
 * ============================================================================
 * APP - Main application with LazorKit integration
 * ============================================================================
 * 
 * This is the main app component that:
 * 1. Wraps the app with LazorKitProvider for wallet functionality
 * 2. Manages screen navigation state
 * 3. Renders the appropriate screen based on state
 * 
 * SCREEN FLOW:
 * 
 *   [Auth Screen]
 *        │
 *        ▼ (on authenticate)
 *   [Home Screen] ◄──────────┐
 *        │                   │
 *        ├──▶ [Scan Screen] ─┘ (on back)
 *        │
 *        └──▶ [Receive Screen] ─┘ (on back)
 * 
 * STATE MANAGEMENT:
 * - Simple useState for navigation (no complex router needed)
 * - LazorKitProvider manages wallet state globally
 * - Each screen is self-contained with clear props interface
 */

import { LazorKitProvider } from '@lazorkit/wallet-mobile-adapter';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';

// Import from new src structure
import {
    PAYMASTER_CONFIG,
    PORTAL_URL,
    RPC_URL,
    logger,
} from '../src/lib';
import {
    AuthScreen,
    HomeScreen,
    ReceiveScreen,
    ScanScreen,
} from '../src/screens';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Available screens in the app
 */
type Screen = 'auth' | 'home' | 'scan' | 'receive';

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function App(): React.ReactElement {
  // Current screen state
  const [currentScreen, setCurrentScreen] = useState<Screen>('auth');

  // ============================================
  // NAVIGATION HANDLERS
  // ============================================

  /**
   * Called when user successfully authenticates
   */
  const handleAuthenticated = useCallback(() => {
    logger.info('App', 'User authenticated, navigating to home');
    setCurrentScreen('home');
  }, []);

  /**
   * Called when user taps an action on home screen
   */
  const handleNavigate = useCallback((screen: 'scan' | 'receive') => {
    logger.info('App', `Navigating to ${screen}`);
    setCurrentScreen(screen);
  }, []);

  /**
   * Called when user wants to go back to home
   */
  const handleBack = useCallback(() => {
    logger.info('App', 'Navigating back to home');
    setCurrentScreen('home');
  }, []);

  /**
   * Called when user logs out
   */
  const handleLogout = useCallback(() => {
    logger.info('App', 'User logged out, navigating to auth');
    setCurrentScreen('auth');
  }, []);

  // ============================================
  // SCREEN RENDERER
  // ============================================

  const renderScreen = () => {
    switch (currentScreen) {
      case 'auth':
        return (
          <AuthScreen 
            onAuthenticated={handleAuthenticated} 
          />
        );
      
      case 'home':
        return (
          <HomeScreen 
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        );
      
      case 'scan':
        return (
          <ScanScreen 
            onBack={handleBack} 
          />
        );
      
      case 'receive':
        return (
          <ReceiveScreen 
            onBack={handleBack} 
          />
        );
      
      default:
        // Fallback to auth (should never happen with TypeScript)
        return (
          <AuthScreen 
            onAuthenticated={handleAuthenticated} 
          />
        );
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <LazorKitProvider
      rpcUrl={RPC_URL}
      portalUrl={PORTAL_URL}
      configPaymaster={PAYMASTER_CONFIG}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        {renderScreen()}
      </SafeAreaView>
    </LazorKitProvider>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});