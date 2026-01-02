# 🎯 Reputa Protocol v2.5 - Complete Implementation Guide

## 📚 Overview

The Reputa Protocol is a comprehensive reputation system for Pi Network that analyzes wallet behavior, transactions, staking activity, and mining history to generate a trust score (0-1000).

---

## 🏗️ Architecture

```
reputa-score/
├── api/                          # Serverless Functions (Vercel)
│   ├── approve.ts               # Payment approval endpoint
│   ├── complete.ts              # Payment completion endpoint
│   ├── get-wallet.ts            # Wallet data fetching
│   └── auth.ts                  # Pi Network authentication
│
├── .well-known/
│   └── pi.toml                  # Pi Network app configuration
│
├── src/
│   ├── app/
│   │   ├── protocol/            # Core Reputation Protocol
│   │   │   ├── types.ts         # TypeScript interfaces
│   │   │   ├── wallet.ts        # Wallet data fetching
│   │   │   ├── transactions.ts  # Transaction analysis + scoring
│   │   │   ├── staking.ts       # Staking analysis
│   │   │   ├── mining.ts        # Mining OCR + verification
│   │   │   ├── imageVerification.ts  # Image validation
│   │   │   ├── scoring.ts       # Comprehensive score calculation
│   │   │   ├── report.ts        # Report generation (VIP/Regular)
│   │   │   └── index.ts         # Unified entry point
│   │   │
│   │   ├── services/            # Pi Network Integration
│   │   │   ├── piSdk.ts         # Pi SDK wrapper (login, payments, wallet)
│   │   │   └── piPayments.ts    # Payment handling (VIP, send, receive)
│   │   │
│   │   ├── config/              # Configuration
│   │   │   └── constants.ts     # App constants & scoring rules
│   │   │
│   │   ├── components/          # React components
│   │   ├── pages/               # Page components
│   │   │   └── ReputaDashboard.tsx
│   │   └── hooks/               # Custom React hooks
│   │
│   ├── main.tsx                 # App entry point (DO NOT MODIFY)
│   └── App.tsx                  # Main app component (MODIFIED)
│
├── vercel.json                  # Vercel deployment config
└── package.json                 # Dependencies & scripts
```

---

## 🔐 Pi SDK Integration

### Authentication Flow

```typescript
import { authenticateUser, getCurrentUser } from './services/piSdk';

// Authenticate user
const user = await authenticateUser(['username', 'payments']);
console.log(user.username, user.uid);

// Get current user
const currentUser = await getCurrentUser();
```

### Payment Flow

```typescript
import { createVIPSubscription } from './services/piPayments';

// Create VIP subscription (1 Pi)
const payment = await createVIPSubscription();

// Backend automatically handles:
// 1. /api/approve - Validates payment
// 2. /api/complete - Confirms & activates VIP
```

---

## 📊 Reputation Scoring System

### Score Components (0-1000 scale)

| Component | Max Points | Description |
|-----------|------------|-------------|
| **Wallet Age** | 200 (20%) | Age-based trust |
| **Transactions** | 400 (40%) | Transaction quality & history |
| **Staking** | 300 (30%) | Staking commitment |
| **Mining Bonus** | 100 (10%) | *Optional* - Upload "Year with Pi" |

### Scoring Formula

```
totalScore = walletAgeScore + transactionScore + stakingScore + miningBonus - penalties
```

### Transaction Scoring

```typescript
// Internal transactions (Pi Apps): +10 points
// External transactions (exchanges): -15 points
// Large transactions (>100 Pi): +5 bonus
// Small/suspicious transactions (<1 Pi): -3 to -10 penalty
```

### Penalties

```
- External transactions: -2 points each (max -20)
- Suspicious activity: -5 points each (max -30)
```

---

## 🖼️ Mining OCR System

### Upload "Year with Pi" Image

```typescript
import { processYearWithPiImage } from './protocol/mining';

const result = await processYearWithPiImage(imageFile, walletCreationDate);

if (result.verified) {
  // Mining data extracted successfully
  console.log(result.extractedData.totalDays);
  console.log(result.extractedData.score); // 0-10 bonus points
}
```

### Verification Process

1. **Image validation** - Format, size, resolution
2. **OCR extraction** - Mining days, sessions, Pi earned
3. **Cross-verification** - Compare with wallet creation date
4. **Score calculation** - Based on consistency & engagement

### Alerts

- ✅ **Success**: "Year with Pi image verified successfully"
- ⚠️ **Suspicious**: "Mining days exceed account age - possible forgery"
- ❌ **Error**: "Image processing failed"

---

## 📝 Report Generation

### VIP Report (Full Access)

```typescript
import { generateCompleteReport, formatVIPReport } from './protocol';

const report = await generateCompleteReport(
  walletAddress,
  userId,
  miningData,
  true // isVIP
);

const vipReport = formatVIPReport(report);
```

**VIP Features**:
- All transactions with detailed scoring
- Complete score breakdown
- Mining insights
- Staking analysis
- AI-generated recommendations
- Export to JSON/PDF

### Regular Report (Limited)

```typescript
const regularReport = formatRegularReport(report);
```

**Regular Features**:
- Last 3 transactions only
- Basic scores (no breakdown)
- Mining bonus (if uploaded)
- Upgrade prompt for full access

---

## 🔄 Complete Workflow Example

```typescript
import { generateCompleteReport } from './protocol';

// 1. User connects wallet
const user = await authenticateUser();

// 2. Fetch wallet address
const walletAddress = await getWalletAddress();

// 3. (Optional) User uploads mining image
const miningImage = await processYearWithPiImage(file, createdAt);

// 4. Generate complete report
const report = await generateCompleteReport(
  walletAddress,
  user.uid,
  miningImage.extractedData,
  isVIP
);

// 5. Display results
console.log('Total Score:', report.scores.totalScore);
console.log('Trust Level:', report.trustLevel);
console.log('Alerts:', report.alerts);
```

---

## 🎨 Component Integration

### In Your React Component

```typescript
import { useState } from 'react';
import { generateCompleteReport } from './protocol';
import type { ReputationReport } from './protocol/types';

function MyComponent() {
  const [report, setReport] = useState<ReputationReport | null>(null);

  const analyzeWallet = async (address: string) => {
    const result = await generateCompleteReport(address);
    setReport(result);
  };

  return (
    <div>
      {report && (
        <>
          <h2>Score: {report.scores.totalScore}/1000</h2>
          <p>Trust: {report.trustLevel}</p>
        </>
      )}
    </div>
  );
}
```

---

## 🚀 Deployment

### Environment Variables

Create `.env.local`:

```env
# Pi Network Configuration
VITE_PI_NETWORK=testnet  # or 'mainnet'
VITE_PI_API_KEY=your_pi_api_key_here

# Optional: App wallet for receiving payments
APP_WALLET_SEED=your_wallet_seed_here
```

### Vercel Deployment

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy
vercel --prod

# 3. Set environment variables in Vercel Dashboard
```

### Testing in Pi Browser

1. Deploy to Vercel
2. Configure `.well-known/pi.toml` with your URL
3. Open in Pi Browser
4. Test authentication & payments

---

## 📦 API Endpoints

### POST /api/auth
Authenticate user with Pi Network

**Request**:
```json
{
  "accessToken": "pi_access_token",
  "user": {
    "uid": "user_123",
    "username": "pioneer"
  }
}
```

**Response**:
```json
{
  "authenticated": true,
  "session": { ... }
}
```

### POST /api/approve
Approve payment before blockchain submission

**Request**:
```json
{
  "paymentId": "payment_123",
  "userId": "user_123",
  "amount": 1
}
```

**Response**:
```json
{
  "approved": true,
  "paymentId": "payment_123"
}
```

### POST /api/complete
Complete payment after blockchain confirmation

**Request**:
```json
{
  "paymentId": "payment_123",
  "txid": "blockchain_tx_id",
  "userId": "user_123",
  "amount": 1
}
```

**Response**:
```json
{
  "completed": true,
  "subscription": { ... }
}
```

### POST /api/get-wallet
Fetch wallet data and balance

**Request**:
```json
{
  "userId": "user_123",
  "walletAddress": "G..."
}
```

**Response**:
```json
{
  "success": true,
  "wallet": {
    "walletAddress": "G...",
    "balance": 123.45,
    "network": "testnet"
  }
}
```

---

## 🔧 Customization

### Modify Scoring Rules

Edit `/src/app/config/constants.ts`:

```typescript
export const SCORE_CONFIG = {
  maxWalletAgeScore: 20,  // Change max wallet age points
  maxTransactionScore: 40, // Change max transaction points
  maxStakingScore: 30,     // Change max staking points
  maxMiningBonus: 10,      // Change max mining bonus
  scale: 1000              // Total score scale
};
```

### Add New Scoring Criteria

1. Add type to `/src/app/protocol/types.ts`
2. Create analyzer in `/src/app/protocol/`
3. Update `/src/app/protocol/scoring.ts`
4. Export from `/src/app/protocol/index.ts`

---

## 🐛 Troubleshooting

### Pi SDK not available
**Solution**: Ensure running in Pi Browser or add fallback logic

### Payment fails
**Solution**: Check Pi Browser permissions & testnet status

### Image upload fails
**Solution**: Verify image format (JPEG/PNG) and size (<10MB)

### Build errors
**Solution**: Run `rm -rf node_modules dist && npm install && npm run build`

---

## ✅ Checklist

Before deploying to production:

- [ ] Update `.well-known/pi.toml` with production URLs
- [ ] Set `VITE_PI_NETWORK=mainnet` in Vercel
- [ ] Test all payment flows in Pi Browser
- [ ] Verify OCR accuracy with real "Year with Pi" images
- [ ] Implement proper database for user data
- [ ] Add error tracking (Sentry)
- [ ] Set up monitoring (Vercel Analytics)

---

## 📞 Support

For issues or questions:
- Protocol documentation: `/PROTOCOL_README.md` (this file)
- Deployment guide: `/DEPLOYMENT_GUIDE.md`
- Quick start: `/QUICKSTART.md`

---

**Built with ❤️ for Pi Network Community**

**Version**: 2.5.0  
**Status**: Production Ready ✅  
**Pi Network**: Testnet & Mainnet Compatible
