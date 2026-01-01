/**
 * ============================================================================
 * ReceiveScreen - Generate QR code to receive payments
 * ============================================================================
 * 
 * This screen allows users to:
 * - Generate a Solana Pay compatible QR code
 * - Optionally set an amount
 * - Share the payment request
 * - Copy their wallet address
 */

import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Button, Card, Header, InfoBanner } from '../components';
import { useWalletSession } from '../hooks';
import {
    copyToClipboard,
    formatUSDC,
    generatePaymentQR,
    hapticFeedback,
    parsePaymentAmount,
    shortenAddress,
    USDC_MINT,
} from '../lib';

// =============================================================================
// PROPS
// =============================================================================

export interface ReceiveScreenProps {
  onBack: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ReceiveScreen({ onBack }: ReceiveScreenProps): React.ReactElement {
  const { walletAddress } = useWalletSession();
  
  // Form state
  const [amount, setAmount] = useState('');
  const [label, setLabel] = useState('');
  const [showQR, setShowQR] = useState(false);

  // Generate QR code data
  const qrData = walletAddress 
    ? generatePaymentQR({
        address: walletAddress,
        amount: parsePaymentAmount(amount) || undefined,
        label: label || undefined,
        token: USDC_MINT,
      })
    : '';

  // ============================================
  // HANDLERS
  // ============================================

  const handleGenerateQR = async () => {
    // Validate amount if provided
    if (amount) {
      const parsed = parsePaymentAmount(amount);
      if (parsed === null) {
        Alert.alert('Invalid Amount', 'Please enter a valid number.');
        return;
      }
    }
    
    await hapticFeedback('medium');
    setShowQR(true);
  };

  const handleCopyAddress = async () => {
    if (!walletAddress) return;
    
    const success = await copyToClipboard(walletAddress);
    if (success) {
      await hapticFeedback('success');
      Alert.alert('Copied!', 'Wallet address copied to clipboard.');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Pay me via Solana: ${qrData}`,
        title: 'SolPay Payment Request',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleNewQR = async () => {
    await hapticFeedback('light');
    setShowQR(false);
    setAmount('');
    setLabel('');
  };

  // ============================================
  // RENDER: QR CODE VIEW
  // ============================================

  if (showQR) {
    const parsedAmount = parsePaymentAmount(amount);
    
    return (
      <View style={styles.container}>
        <Header title="Receive Payment" onBack={onBack} />
        
        <ScrollView 
          contentContainerStyle={styles.qrContent}
          showsVerticalScrollIndicator={false}
        >
          {/* QR Code Card */}
          <Card variant="elevated" padding="large" style={styles.qrCard}>
            <Text style={styles.qrTitle}>Scan to Pay</Text>
            
            {/* QR Code */}
            <View style={styles.qrWrapper}>
              <QRCode
                value={qrData}
                size={220}
                backgroundColor="white"
                color="black"
              />
            </View>

            {/* Payment Details */}
            <View style={styles.paymentDetails}>
              {parsedAmount && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Amount:</Text>
                  <Text style={styles.detailValue}>{formatUSDC(parsedAmount)}</Text>
                </View>
              )}
              {label && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>For:</Text>
                  <Text style={styles.detailValue}>{label}</Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>To:</Text>
                <Text style={styles.detailValueMono}>
                  {walletAddress ? shortenAddress(walletAddress, 6) : '...'}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.qrActions}>
              <Button
                label="📤 Share"
                variant="secondary"
                size="medium"
                onPress={handleShare}
              />
              <View style={styles.buttonSpacer} />
              <Button
                label="📋 Copy Address"
                variant="secondary"
                size="medium"
                onPress={handleCopyAddress}
              />
            </View>

            {/* New QR Button */}
            <Button
              label="Generate New QR"
              variant="ghost"
              size="medium"
              onPress={handleNewQR}
            />
          </Card>

          {/* Info */}
          <View style={styles.infoSection}>
            <InfoBanner
              icon="💡"
              title="Compatible with Solana Pay"
              message="This QR code works with any wallet that supports Solana Pay."
              variant="info"
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  // ============================================
  // RENDER: INPUT FORM
  // ============================================

  return (
    <View style={styles.container}>
      <Header title="Receive Payment" onBack={onBack} />
      
      <ScrollView 
        contentContainerStyle={styles.formContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.formTitle}>Request Payment</Text>
          <Text style={styles.formSubtitle}>
            Create a QR code for someone to scan and pay you
          </Text>
        </View>

        {/* Amount Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Amount (Optional)</Text>
          <View style={styles.amountInputRow}>
            <Text style={styles.currencyPrefix}>$</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor="#94a3b8"
              keyboardType="decimal-pad"
            />
            <Text style={styles.currencySuffix}>USDC</Text>
          </View>
          <Text style={styles.inputHint}>
            Leave empty to let the payer enter any amount
          </Text>
        </View>

        {/* Label Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Label (Optional)</Text>
          <TextInput
            style={styles.textInput}
            value={label}
            onChangeText={setLabel}
            placeholder="e.g., Coffee, Lunch, Rent..."
            placeholderTextColor="#94a3b8"
          />
          <Text style={styles.inputHint}>
            Add a description for this payment request
          </Text>
        </View>

        {/* Wallet Address Display */}
        <Card variant="outlined" padding="medium" style={styles.addressCard}>
          <Text style={styles.addressLabel}>Your Wallet Address</Text>
          <Text style={styles.addressValue}>
            {walletAddress ? shortenAddress(walletAddress, 8) : '...'}
          </Text>
          <Button
            label="Copy Full Address"
            variant="ghost"
            size="small"
            onPress={handleCopyAddress}
          />
        </Card>

        {/* Generate Button */}
        <Button
          label="Generate QR Code"
          icon="📱"
          onPress={handleGenerateQR}
        />
      </ScrollView>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  
  // Form View
  formContent: {
    padding: 24,
    paddingBottom: 40,
  },
  
  titleSection: {
    marginBottom: 32,
  },
  
  formTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  
  formSubtitle: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
  },
  
  inputGroup: {
    marginBottom: 24,
  },
  
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
  },
  
  currencyPrefix: {
    fontSize: 24,
    fontWeight: '600',
    color: '#64748b',
  },
  
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: '#0f172a',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  
  currencySuffix: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#0f172a',
  },
  
  inputHint: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 8,
  },
  
  addressCard: {
    alignItems: 'center',
    marginBottom: 32,
  },
  
  addressLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  addressValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  
  // QR View
  qrContent: {
    padding: 24,
    alignItems: 'center',
  },
  
  qrCard: {
    alignItems: 'center',
    width: '100%',
  },
  
  qrTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 24,
  },
  
  qrWrapper: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  paymentDetails: {
    width: '100%',
    marginTop: 24,
    marginBottom: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  
  detailValueMono: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: 'monospace',
  },
  
  qrActions: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  
  buttonSpacer: {
    width: 12,
  },
  
  infoSection: {
    width: '100%',
    marginTop: 24,
  },
});
