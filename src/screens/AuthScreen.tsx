/**
 * ============================================================================
 * AuthScreen - Passkey authentication entry point
 * ============================================================================
 * 
 * This is the first screen users see. It handles:
 * - Explaining what the app does
 * - Initiating biometric + passkey authentication
 * - Showing clear loading/error states
 * - Transitioning to home on success
 * 
 * STATE MACHINE:
 * [Idle] → [Authenticating] → [Success] → Navigate to Home
 *              ↓
 *           [Error] → Retry → [Authenticating]
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Card, StateMessage } from '../components';
import { useWalletSession } from '../hooks';

// =============================================================================
// PROPS
// =============================================================================

export interface AuthScreenProps {
  /** Called when authentication succeeds */
  onAuthenticated: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function AuthScreen({ onAuthenticated }: AuthScreenProps): React.ReactElement {
  const { 
    authenticate, 
    isConnecting, 
    isConnected,
    error, 
    clearError,
  } = useWalletSession();

  // Handle authentication success
  React.useEffect(() => {
    if (isConnected) {
      onAuthenticated();
    }
  }, [isConnected, onAuthenticated]);

  // Handle the main authentication flow
  const handleAuthenticate = async () => {
    clearError();
    await authenticate();
  };

  return (
    <View style={styles.container}>
      {/* ============================================ */}
      {/* LOGO SECTION */}
      {/* ============================================ */}
      <View style={styles.logoSection}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>⚡</Text>
        </View>
        <Text style={styles.appName}>SolPay</Text>
        <Text style={styles.tagline}>Pay with Solana. No SOL required.</Text>
      </View>

      {/* ============================================ */}
      {/* FEATURES SECTION */}
      {/* ============================================ */}
      <View style={styles.featuresSection}>
        <FeatureCard
          icon="🔐"
          title="Passkey Authentication"
          description="Sign in with Face ID or Touch ID. No seed phrases to remember."
        />
        <FeatureCard
          icon="⚡"
          title="Gasless Transactions"
          description="Pay transaction fees in USDC. No need to hold SOL."
        />
        <FeatureCard
          icon="📱"
          title="Scan & Pay"
          description="Scan a QR code to pay anyone instantly."
        />
      </View>

      {/* ============================================ */}
      {/* ERROR STATE */}
      {/* ============================================ */}
      {error && (
        <View style={styles.errorSection}>
          <StateMessage
            type="error"
            title="Authentication Failed"
            message={error.userMessage}
            action={{
              label: 'Try Again',
              onPress: handleAuthenticate,
            }}
          />
        </View>
      )}

      {/* ============================================ */}
      {/* ACTION BUTTON */}
      {/* ============================================ */}
      {!error && (
        <View style={styles.actionSection}>
          <Button
            label="Get Started"
            subtitle="Authenticate with biometrics"
            onPress={handleAuthenticate}
            isLoading={isConnecting}
          />
        </View>
      )}

      {/* ============================================ */}
      {/* FOOTER */}
      {/* ============================================ */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Powered by <Text style={styles.footerBold}>LazorKit SDK</Text>
        </Text>
        <Text style={styles.footerSubtext}>
          Devnet • No seed phrases • Non-custodial
        </Text>
      </View>
    </View>
  );
}

// =============================================================================
// FEATURE CARD COMPONENT
// =============================================================================

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps): React.ReactElement {
  return (
    <Card variant="elevated" padding="medium" style={styles.featureCard}>
      <View style={styles.featureRow}>
        <Text style={styles.featureIcon}>{icon}</Text>
        <View style={styles.featureContent}>
          <Text style={styles.featureTitle}>{title}</Text>
          <Text style={styles.featureDescription}>{description}</Text>
        </View>
      </View>
    </Card>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  
  // Logo Section
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#0ea5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoEmoji: {
    fontSize: 48,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  
  // Features Section
  featuresSection: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
  },
  featureCard: {
    marginBottom: 0,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  
  // Error Section
  errorSection: {
    marginBottom: 24,
  },
  
  // Action Section
  actionSection: {
    marginTop: 24,
  },
  
  // Footer
  footer: {
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  footerBold: {
    fontWeight: '600',
    color: '#0ea5e9',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#94a3b8',
  },
});
