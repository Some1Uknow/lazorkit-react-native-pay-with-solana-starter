# 📦 Deployment Guide - SolPay

Complete guide to deploying your LazorKit-powered Solana mobile app to production.

---

## Table of Contents

- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [iOS Deployment](#ios-deployment)
- [Android Deployment](#android-deployment)
- [Mainnet Configuration](#mainnet-configuration)
- [Testing in Production](#testing-in-production)
- [Monitoring & Maintenance](#monitoring--maintenance)

---

## Pre-Deployment Checklist

### 1. Code Review

- [ ] All console.logs removed or wrapped in `__DEV__` checks
- [ ] All TODO comments resolved
- [ ] Code properly commented and documented
- [ ] No hardcoded secrets or API keys
- [ ] Error handling implemented for all async operations

### 2. Configuration

- [ ] Update `app.json` with production app name and identifiers
- [ ] Set proper bundle identifiers for iOS and Android
- [ ] Configure app icons and splash screens
- [ ] Update privacy policy and terms of service URLs

### 3. Security

- [ ] Environment variables properly configured
- [ ] LazorKit API key added for rate limiting
- [ ] Deep linking schemes properly secured
- [ ] Session timeout implemented
- [ ] Biometric authentication required for transactions

### 4. Testing

- [ ] Tested on physical iOS device
- [ ] Tested on physical Android device
- [ ] Tested with poor network conditions
- [ ] Tested edge cases (insufficient balance, invalid addresses, etc.)
- [ ] Verified deep linking works correctly

---

## iOS Deployment

### Step 1: Prepare Xcode Project

```bash
# Install CocoaPods dependencies
cd ios && pod install && cd ..

# Or use Expo prebuild
npx expo prebuild --platform ios --clean
```

### Step 2: Configure Signing

1. Open `ios/SolPay.xcworkspace` in Xcode
2. Select your project in the navigator
3. Go to **Signing & Capabilities**
4. Select your **Team**
5. Ensure **Bundle Identifier** matches `app.json`

### Step 3: Configure Deep Linking

In Xcode, verify **Associated Domains** capability includes:
```
applinks:portal.lazor.sh
```

### Step 4: App Store Connect Setup

1. Create app in [App Store Connect](https://appstoreconnect.apple.com)
2. Fill in app information:
   - App Name: SolPay
   - Primary Language: English
   - Category: Finance
   - Content Rights: Your Name/Company

3. Add app description highlighting:
   - No seed phrases required
   - Gasless transactions
   - Secure passkey authentication

### Step 5: Build and Upload

```bash
# Build for App Store
npx expo build:ios --release-channel production

# Or with EAS Build
eas build --platform ios --profile production
```

### Step 6: Submit for Review

1. Upload build to App Store Connect
2. Complete **App Review Information**
3. Add screenshots (use iOS Simulator)
4. Submit for review

**Review Tips:**
- Explain that this is a Solana blockchain wallet
- Provide test account if needed
- Include video demo if app functionality is complex

---

## Android Deployment

### Step 1: Prepare Android Project

```bash
# Generate Android build
npx expo prebuild --platform android --clean
```

### Step 2: Generate Signing Key

```bash
# Create keystore for release builds
keytool -genkeypair -v -storetype PKCS12 -keystore solpay-upload-key.keystore -alias solpay-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

**Important**: Save this keystore file securely! You'll need it for all future updates.

### Step 3: Configure Gradle

Update `android/gradle.properties`:

```properties
MYAPP_UPLOAD_STORE_FILE=solpay-upload-key.keystore
MYAPP_UPLOAD_KEY_ALIAS=solpay-key-alias
MYAPP_UPLOAD_STORE_PASSWORD=****
MYAPP_UPLOAD_KEY_PASSWORD=****
```

Update `android/app/build.gradle`:

```gradle
signingConfigs {
    release {
        storeFile file(MYAPP_UPLOAD_STORE_FILE)
        storePassword MYAPP_UPLOAD_STORE_PASSWORD
        keyAlias MYAPP_UPLOAD_KEY_ALIAS
        keyPassword MYAPP_UPLOAD_KEY_PASSWORD
    }
}
```

### Step 4: Build APK/AAB

```bash
# Build Android App Bundle (recommended)
cd android
./gradlew bundleRelease

# Output: android/app/build/outputs/bundle/release/app-release.aab

# Or with EAS Build
eas build --platform android --profile production
```

### Step 5: Google Play Console Setup

1. Create app in [Google Play Console](https://play.google.com/console)
2. Complete **App Content** questionnaire
3. Set up **Store Listing**:
   - Title: SolPay - Solana Payments
   - Short description: Pay with crypto using just Face ID
   - Full description: Highlight passkey auth and gasless transactions

### Step 6: Upload and Release

1. Upload AAB to **Internal Testing** track first
2. Test thoroughly
3. Promote to **Production** when ready
4. Submit for review

---

## Mainnet Configuration

### Step 1: Update Network Settings

Update `config/index.ts`:

```typescript
export const CONFIG = {
  // MAINNET Configuration
  RPC_URL: 'https://api.mainnet-beta.solana.com', // Or use private RPC
  PORTAL_URL: 'https://portal.lazor.sh',
  
  // MAINNET Paymaster
  PAYMASTER_CONFIG: {
    paymasterUrl: 'https://kora.mainnet.lazorkit.com',
    apiKey: process.env.LAZORKIT_API_KEY, // REQUIRED for mainnet
  },
  
  // MAINNET USDC
  USDC_MINT: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  
  APP_SCHEME: 'solpay://home',
  
  // Mainnet safety limits
  MIN_PAYMENT: 0.01,
  MAX_PAYMENT: 1000, // Add reasonable limits
} as const;
```

### Step 2: Get LazorKit API Key

1. Sign up at [LazorKit Dashboard](https://dashboard.lazorkit.com)
2. Create API key for mainnet
3. Add to environment variables
4. **Never commit API keys to git!**

### Step 3: Consider Private RPC

For production, use a private RPC provider:

**Recommended Providers:**
- [Helius](https://helius.xyz) - Great for apps, generous free tier
- [QuickNode](https://quicknode.com) - Reliable, multiple regions
- [Triton](https://triton.one) - Purpose-built for high-throughput

Benefits:
- Higher rate limits
- Better reliability
- Faster response times
- Advanced features (webhooks, priority fees)

### Step 4: Update Explorer Links

```typescript
export const ENDPOINTS = {
  EXPLORER: {
    tx: (signature: string) => 
      `https://explorer.solana.com/tx/${signature}`, // No cluster param for mainnet
    address: (address: string) => 
      `https://explorer.solana.com/address/${address}`,
  },
} as const;
```

---

## Testing in Production

### Start Small

1. **Fund with minimal amounts** (start with 0.01 USDC)
2. **Test all flows**:
   - Authentication
   - Receiving payments
   - Sending payments
   - Error handling
3. **Monitor closely** for first 24-48 hours

### Test Scenarios

```typescript
// Test 1: Small payment
await sendUSDC(testRecipient, 0.01);

// Test 2: Verify balance updates
const balanceBefore = await fetchBalance();
await sendUSDC(testRecipient, 1);
const balanceAfter = await fetchBalance();
assert(balanceBefore - balanceAfter === 1);

// Test 3: Error handling
try {
  await sendUSDC(testRecipient, 999999); // Should fail
} catch (error) {
  assert(error.message.includes('Insufficient balance'));
}
```

### Monitoring Checklist

- [ ] Transaction success rate > 95%
- [ ] Average transaction time < 30 seconds
- [ ] No critical errors in logs
- [ ] Deep linking works consistently
- [ ] Session persistence reliable

---

## Monitoring & Maintenance

### Setup Error Tracking

Install Sentry for error monitoring:

```bash
npm install @sentry/react-native
```

Configure in `app/_layout.tsx`:

```typescript
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: __DEV__ ? 'development' : 'production',
  enableAutoSessionTracking: true,
  tracesSampleRate: 1.0,
});
```

### Key Metrics to Monitor

1. **Transaction Metrics**
   - Success rate
   - Average confirmation time
   - Failed transaction reasons

2. **User Engagement**
   - Daily active users
   - Authentication success rate
   - Average transactions per user

3. **Technical Metrics**
   - App crash rate
   - API response times
   - Deep link success rate

### Regular Maintenance

**Weekly:**
- Review error logs
- Check transaction success rates
- Monitor RPC performance

**Monthly:**
- Update dependencies
- Review and optimize RPC usage
- Analyze user feedback

**Quarterly:**
- Security audit
- Performance optimization
- Feature planning based on usage data

### Handling Issues

**If transaction success rate drops:**
1. Check RPC provider status
2. Verify LazorKit paymaster is operational
3. Check for Solana network congestion
4. Review recent code changes

**If authentication fails:**
1. Verify deep linking configuration
2. Check portal.lazor.sh is accessible
3. Ensure API keys are valid
4. Review device compatibility

---

## Cost Considerations

### Estimated Monthly Costs (1000 users)

- **RPC Provider**: $0-100 (depends on tier)
- **LazorKit API**: Contact for pricing
- **Error Tracking (Sentry)**: $0-26
- **App Store**: $99/year (Apple)
- **Play Store**: $25 one-time (Google)

### Optimizing Costs

1. **Batch RPC calls** where possible
2. **Cache balance data** (30s intervals)
3. **Use free tier RPC** for development
4. **Monitor rate limits** to avoid overages

---

## Support & Resources

**Need help deploying?**

- [Expo Deployment Docs](https://docs.expo.dev/distribution/introduction/)
- [LazorKit Support](https://discord.gg/lazorkit)
- [Solana Developer Discord](https://discord.gg/solana)

**Issues?** Open an issue on GitHub or reach out to the community!

---

**Ready to ship?** Follow this guide step-by-step and your app will be live in no time! 🚀
