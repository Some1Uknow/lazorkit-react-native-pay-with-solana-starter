/**
 * ============================================================================
 * ScanScreen - QR code scanner for payments
 * ============================================================================
 * 
 * This screen handles:
 * - Camera permission request
 * - QR code scanning
 * - Payment confirmation modal
 * - Gasless transaction execution
 * - Success/error states
 * 
 * FLOW:
 * 1. Request camera permission
 * 2. Scan QR code
 * 3. Parse Solana Pay data
 * 4. Show confirmation modal
 * 5. Execute gasless payment
 * 6. Show result
 */

import { Camera, CameraView } from 'expo-camera';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Button, Header, InfoBanner, StateMessage } from '../components';
import { useTransaction } from '../hooks';
import {
  formatUSDC,
  getExplorerTxUrl,
  hapticFeedback,
  isValidPaymentQR,
  logger,
  parsePaymentAmount,
  parsePaymentQR,
  shortenAddress,
} from '../lib';
import type { ParsedPaymentQR } from '../lib/validators';

// =============================================================================
// PROPS
// =============================================================================

export interface ScanScreenProps {
  onBack: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ScanScreen({ onBack }: ScanScreenProps): React.ReactElement {
  // Camera state
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  
  // Payment state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState<ParsedPaymentQR | null>(null);
  const [amount, setAmount] = useState('');
  
  // Transaction hook
  const { sendPayment, state, error, explorerUrl, reset } = useTransaction();

  // ============================================
  // CAMERA PERMISSION
  // ============================================
  
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      logger.info('ScanScreen', 'Camera permission', { status });
    })();
  }, []);

  // ============================================
  // QR CODE HANDLING
  // ============================================
  
  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    
    logger.info('ScanScreen', 'QR code scanned', { data: data.slice(0, 50) + '...' });
    setScanned(true);
    await hapticFeedback('medium');

    // Validate QR code
    if (!isValidPaymentQR(data)) {
      Alert.alert(
        'Invalid QR Code',
        'This is not a valid Solana payment QR code. Please scan a valid payment request.',
        [{ text: 'Try Again', onPress: () => setScanned(false) }]
      );
      return;
    }

    // Parse payment data
    const parsed = parsePaymentQR(data);
    if (!parsed) {
      Alert.alert(
        'Cannot Read QR Code',
        'Unable to parse the payment information.',
        [{ text: 'Try Again', onPress: () => setScanned(false) }]
      );
      return;
    }

    setPaymentData(parsed);
    setAmount(parsed.amount?.toString() || '');
    setShowPaymentModal(true);
  };

  // ============================================
  // PAYMENT EXECUTION
  // ============================================
  
  const handlePay = async () => {
    if (!paymentData) return;

    const parsedAmount = parsePaymentAmount(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payment amount.');
      return;
    }

    try {
      await hapticFeedback('medium');
      
      const signature = await sendPayment({
        recipient: paymentData.address,
        amount: parsedAmount,
      });

      await hapticFeedback('success');
      
      // Generate explorer URL from the signature
      const txExplorerUrl = getExplorerTxUrl(signature);
      
      Alert.alert(
        '✅ Payment Sent!',
        `${formatUSDC(parsedAmount)} sent successfully.`,
        [
          {
            text: 'View Transaction',
            onPress: () => {
              Linking.openURL(txExplorerUrl);
            },
          },
          { 
            text: 'Done', 
            onPress: handleClose,
            style: 'cancel',
          },
        ]
      );
    } catch (err) {
      await hapticFeedback('error');
      
      Alert.alert(
        '❌ Payment Failed',
        error?.userMessage || 'Transaction failed. Please try again.',
        [
          { text: 'Try Again', onPress: () => {} },
          { text: 'Cancel', onPress: handleClose, style: 'cancel' },
        ]
      );
    }
  };

  // ============================================
  // MODAL CLOSE
  // ============================================
  
  const handleClose = () => {
    setShowPaymentModal(false);
    setPaymentData(null);
    setAmount('');
    setScanned(false);
    reset();
  };

  // ============================================
  // RENDER: PERMISSION LOADING
  // ============================================
  
  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Header title="Scan to Pay" onBack={onBack} />
        <StateMessage
          type="loading"
          message="Requesting camera permission..."
          fullScreen
        />
      </View>
    );
  }

  // ============================================
  // RENDER: PERMISSION DENIED
  // ============================================
  
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Header title="Scan to Pay" onBack={onBack} />
        <StateMessage
          type="error"
          title="Camera Permission Required"
          message="Camera access is needed to scan QR codes. Please enable camera access in your device settings."
          action={{
            label: 'Open Settings',
            onPress: () => Linking.openSettings(),
          }}
          secondaryAction={{
            label: 'Go Back',
            onPress: onBack,
          }}
          fullScreen
        />
      </View>
    );
  }

  // ============================================
  // RENDER: SCANNER
  // ============================================
  
  return (
    <View style={styles.container}>
      {/* Camera View */}
      <CameraView
        style={styles.camera}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        {/* Header Overlay */}
        <View style={styles.headerOverlay}>
          <Header title="Scan to Pay" onBack={onBack} skipSafeArea />
        </View>

        {/* Scan Frame */}
        <View style={styles.scanFrame}>
          <View style={styles.scanBorder}>
            {/* Corner indicators */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <Text style={styles.scanText}>
            {scanned ? 'Processing...' : 'Point camera at QR code'}
          </Text>
        </View>

        {/* Bottom Info */}
        <View style={styles.bottomOverlay}>
          <Text style={styles.bottomText}>
            Scan a Solana Pay QR code to send USDC
          </Text>
        </View>
      </CameraView>

      {/* ============================================ */}
      {/* PAYMENT CONFIRMATION MODAL */}
      {/* ============================================ */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent
        onRequestClose={handleClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirm Payment</Text>
              <Button
                label="✕"
                variant="ghost"
                size="small"
                onPress={handleClose}
              />
            </View>

            {/* Recipient Info */}
            <View style={styles.recipientSection}>
              <Text style={styles.recipientLabel}>Paying to:</Text>
              <Text style={styles.recipientAddress}>
                {paymentData ? shortenAddress(paymentData.address, 8) : '...'}
              </Text>
              {paymentData?.label && (
                <Text style={styles.recipientLabel}>{paymentData.label}</Text>
              )}
            </View>

            {/* Amount Input */}
            <View style={styles.amountSection}>
              <Text style={styles.amountLabel}>Amount (USDC)</Text>
              <View style={styles.amountInputRow}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor="#94a3b8"
                  editable={state !== 'signing' && state !== 'submitting'}
                />
              </View>
            </View>

            {/* Gasless Info */}
            <InfoBanner
              icon="⚡"
              title="Gasless Payment"
              message="Transaction fee will be paid in USDC, not SOL."
              variant="info"
            />

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <View style={styles.cancelButtonWrapper}>
                <Button
                  label="Cancel"
                  variant="danger"
                  onPress={handleClose}
                  isDisabled={state === 'signing' || state === 'submitting'}
                />
              </View>
              <View style={styles.payButtonWrapper}>
                <Button
                  label={`Pay ${formatUSDC(parseFloat(amount) || 0)}`}
                  onPress={handlePay}
                  isLoading={state === 'signing' || state === 'submitting'}
                  isDisabled={!amount || parseFloat(amount) <= 0}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  
  camera: {
    flex: 1,
  },
  
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 48,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 10,
  },
  
  scanFrame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  scanBorder: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#0ea5e9',
    borderWidth: 4,
  },
  
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  
  scanText: {
    marginTop: 24,
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '500',
  },
  
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 32,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  
  bottomText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.8,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  
  recipientSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
  },
  
  recipientLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  
  recipientAddress: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: 'monospace',
  },
  
  amountSection: {
    marginBottom: 24,
  },
  
  amountLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  
  currencySymbol: {
    fontSize: 32,
    fontWeight: '600',
    color: '#64748b',
  },
  
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '600',
    color: '#0f172a',
    paddingVertical: 16,
    paddingLeft: 8,
  },
  
  modalActions: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  
  cancelButtonWrapper: {
    flex: 1,
  },
  
  payButtonWrapper: {
    flex: 1,
  },
});
