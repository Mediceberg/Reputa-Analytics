# 🔧 Referral System - Developer Integration Guide

## Fully Integrated & Production Ready ✅

The referral system has been completely integrated into your application. No additional setup required!

---

## 📂 File Structure

```
src/
├── app/
│   ├── components/
│   │   └── ReferralSection.tsx          ✅ UI Component
│   ├── hooks/
│   │   └── useReferral.ts                ✅ React Hook
│   ├── services/
│   │   └── referralService.ts            ✅ Business Logic
│   ├── App.tsx                           ✅ Integration Point (modified)
│   └── pages/
│       └── ProfilePage.tsx               ← Displays referrals
│
api/
└── referral.ts                           ✅ API Endpoints

src/db/
└── mongodb.ts                            ✅ Database Schema (updated)
```

---

## 🔌 Integration Points

### 1. **App.tsx** - Login & Initialization
```typescript
import { 
  initializeReferralOnLogin, 
  captureReferralCodeFromUrl,
  dispatchWalletAnalysisCompleteEvent 
} from './services/referralService';

// In useEffect after authentication:
if (user.wallet_address) {
  captureReferralCodeFromUrl();  // Check URL for ?ref=CODE
  await initializeReferralOnLogin(user.wallet_address);
}

// In handleWalletCheck after analysis complete:
dispatchWalletAnalysisCompleteEvent();
```

### 2. **ProfileSection.tsx** - Display Component
```typescript
import { ReferralSection } from './ReferralSection';

<ReferralSection 
  walletAddress={walletData.address}
  username={username}
/>
```

### 3. **ReferralSection.tsx** - Uses useReferral Hook
```typescript
const { stats, loading, error, fetchStats, claimPoints } = useReferral();
```

---

## 📊 Data Flow

### User Signup Flow
```
1. User visits: https://app.com/?ref=CODE
   └─ captureReferralCodeFromUrl() stores ref code

2. User logs in with wallet
   └─ initializeReferralOnLogin() is called
   └─ trackReferral() creates pending record
   └─ Status: PENDING

3. User analyzes wallet (first time)
   └─ dispatchWalletAnalysisCompleteEvent() triggers
   └─ confirmReferral() updates referrer's claimablePoints
   └─ Status: CONFIRMED

4. Referrer claims points
   └─ claimPoints() moves points to pointsBalance
   └─ Status: CLAIMED
```

---

## 🔗 API Endpoints Available

All endpoints are already deployed at `/api/referral/`:

### Endpoint Matrix

| Method | Endpoint | Purpose | User |
|--------|----------|---------|------|
| POST | `/api/referral/track` | Register referral | Referred User |
| POST | `/api/referral/confirm` | Confirm after analysis | System (auto) |
| POST | `/api/referral/claim-points` | Claim earned points | Referrer |
| GET | `/api/referral/stats` | Get user stats | Referrer |
| GET | `/api/referral/code` | Get/Generate code | Any User |

---

## 🪝 Using the useReferral Hook

### Basic Usage
```typescript
import { useReferral } from '@/hooks/useReferral';

function MyComponent() {
  const { stats, loading, error, fetchStats } = useReferral();

  useEffect(() => {
    fetchStats(walletAddress);
  }, [walletAddress]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <p>Confirmed: {stats?.confirmedReferrals}</p>
      <p>Claimable: {stats?.claimablePoints}</p>
    </div>
  );
}
```

### Hook Methods
```typescript
const {
  // State
  stats,                              // ReferralStats | null
  loading,                           // boolean
  error,                             // string | null

  // Methods
  fetchStats,                        // (wallet: string) => Promise<void>
  trackReferral,                     // (wallet: string, code: string) => Promise<boolean>
  confirmReferral,                   // (wallet: string) => Promise<boolean>
  claimPoints,                       // (wallet: string) => Promise<boolean>
  getReferralCode,                   // (wallet: string) => Promise<string | null>
} = useReferral();
```

---

## 🎛️ Service Methods

### referralService.ts Methods

#### 1. Initialize on Login
```typescript
await initializeReferralOnLogin(walletAddress);
// - Checks for ref code in URL/localStorage
// - Tracks referral if found
// - Generates user's referral code
```

#### 2. Capture Referral Code
```typescript
const refCode = captureReferralCodeFromUrl();
// - Checks URL: ?ref=CODE
// - Stores to localStorage & sessionStorage
// - Returns code or null
```

#### 3. Track Referral
```typescript
const success = await trackReferral(walletAddress, referralCode);
// - Creates pending referral record
// - Returns true/false
```

#### 4. Confirm Referral
```typescript
const success = await confirmReferral(walletAddress);
// - Called after wallet analysis
// - Updates pending → confirmed
// - Adds claimablePoints to referrer
```

#### 5. Claim Points
```typescript
const success = await claimPoints(walletAddress);
// - Sums all confirmed referrals
// - Adds to pointsBalance
// - Updates referral status → claimed
```

#### 6. Dispatch Event
```typescript
dispatchWalletAnalysisCompleteEvent();
// - Triggers automatic referral confirmation
// - Should be called after first wallet analysis
```

---

## 🗄️ Database Schema

### Users Collection (Updated)
```typescript
{
  pioneerId: string,
  email: string,
  primaryWallet: string,      // New
  referralCode: string,        // New! First 6 chars of wallet
  pointsBalance: int,         // New! Claimed points
  claimablePoints: int,       // New! Pending points
  // ... other fields
}
```

### Referrals Collection
```typescript
{
  referrerWallet: string,     // Who referred
  referredWallet: string,     // Who was referred (unique)
  status: 'pending' | 'confirmed' | 'claimed',
  rewardPoints: 30,           // Fixed value
  createdAt: date,            // When user signed up with ref
  confirmedAt?: date,         // When analysis completed
  claimedAt?: date,           // When points claimed
}
```

---

## 🚀 Deployment Notes

### Production Checklist
- [x] Database schema migrated
- [x] API endpoints deployed
- [x] Frontend components integrated
- [x] Event listeners set up
- [x] Error handling implemented
- [x] CORS headers configured
- [ ] Rate limiting (recommended)
- [ ] Analytics tracking (optional)
- [ ] Email notifications (future)

### Environment Variables
**No special variables needed!** The system uses:
- Existing MongoDB connection
- Existing Express/API setup
- Existing authentication

---

## 🧪 Testing

### Test Endpoints with cURL

```bash
# 1. Track referral
curl -X POST http://localhost:5000/api/referral/track \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x123...",
    "referralCode": "ABC123"
  }'

# 2. Get stats
curl "http://localhost:5000/api/referral/stats?walletAddress=0x456..."

# 3. Claim points
curl -X POST http://localhost:5000/api/referral/claim-points \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x456..."
  }'
```

### Test Flow
1. Sign up user A
2. Get referral code: `curl http://localhost:5000/api/referral/code?walletAddress=USER_A_WALLET`
3. Sign up user B with code: `http://localhost:3000/?ref=CODE`
4. Complete wallet analysis for user B
5. Check referrer stats: `curl http://localhost:5000/api/referral/stats?walletAddress=USER_A_WALLET`
6. Claim points: `curl -X POST http://localhost:5000/api/referral/claim-points ...`

---

## 🐛 Debug Mode

### Enable Console Logging
All services include detailed console logging:

```
🎯 Initializing Referral System...
📌 Found referral code: ABC123
✅ Referral tracked: {...}
✅ Referral confirmed: {...}
💜 Points claimed: 30
```

### Check LocalStorage
```javascript
// In console:
console.log(localStorage.getItem('ref_code'));
console.log(localStorage.getItem('referral_code_0x...'));
```

### Monitor Events
```javascript
// In console:
window.addEventListener('wallet:analysis:complete', (e) => {
  console.log('Analysis complete:', e.detail);
});
```

---

## 🔐 Security Features

### Implemented
✅ Self-referral prevention  
✅ Duplicate referral prevention  
✅ One-time confirmation  
✅ Atomic point claiming  
✅ Wallet address validation  

### Additional Recommendations
- [ ] Rate limiting on endpoints
- [ ] IP-based fraud detection
- [ ] Email verification before claiming
- [ ] Suspicious pattern monitoring
- [ ] Admin review for large claims

---

## 📈 Monitoring & Analytics

### Key Metrics to Track
- Total referrals created
- Conversion rate (pending → confirmed)
- Average points per user
- Most popular referral codes
- Referral source (organic, social, etc.)

### Queries for Analytics
```javascript
// Total confirmed referrals
db.referrals.countDocuments({ status: 'confirmed' })

// Total points claimed
db.referrals.aggregate([
  { $match: { status: 'claimed' } },
  { $sum: '$rewardPoints' }
])

// Top referrers
db.referrals.aggregate([
  { $match: { status: 'confirmed' } },
  { $group: { _id: '$referrerWallet', count: { $sum: 1 } } },
  { $sort: { count: -1 } },
  { $limit: 10 }
])
```

---

## 🎨 Customization

### Change Reward Points
Edit in `api/referral.ts`:
```typescript
rewardPoints: 30  // Change this value
```

### Change Referral Code Format
Edit in `src/app/services/referralService.ts`:
```typescript
function generateReferralCode(walletAddress: string): string {
  // Customize code generation here
  return walletAddress.substring(0, 6).toUpperCase();
}
```

### Customize UI
Edit `src/app/components/ReferralSection.tsx`:
- Colors
- Icons
- Layout
- Text labels
- Button styles

---

## 📚 Related Files

| File | Purpose |
|------|---------|
| `src/db/mongodb.ts` | Database schema |
| `api/referral.ts` | API endpoints |
| `src/app/hooks/useReferral.ts` | React hook |
| `src/app/services/referralService.ts` | Business logic |
| `src/app/components/ReferralSection.tsx` | UI component |
| `src/app/App.tsx` | Integration point |
| `src/app/pages/ProfilePage.tsx` | Shows component |
| `src/app/components/ProfileSection.tsx` | Contains component |

---

## 🔄 Upgrade & Migration

### Adding New Fields
```typescript
// In mongodb.ts, add to Users schema:
newField: { bsonType: 'type', description: 'description' }

// In UI, update ReferralSection.tsx
```

### Changing API Response Format
```typescript
// In api/referral.ts, modify response:
return res.status(200).json({
  success: true,
  data: { /* new format */ }
});
```

---

## 🆘 Common Issues & Fixes

### Issue: Stats not loading
```typescript
// Solution: Ensure walletAddress is lowercase
const normalized = walletAddress.toLowerCase();
```

### Issue: Points not claiming
```typescript
// Solution: Check status is 'confirmed' not 'pending'
// Add validation in API
```

### Issue: Duplicate referral errors
```typescript
// Solution: Clear localStorage and retry
localStorage.removeItem('ref_code');
```

---

## 📞 Support

- **Documentation**: See `REFERRAL_SYSTEM_DOCS.md`
- **Quick Start**: See `REFERRAL_QUICK_START.md`
- **Code Comments**: Check inline comments in source files
- **Issues**: Check GitHub issues or contact support

---

**Last Updated**: January 2024  
**Version**: 1.0.0  
**Status**: ✅ Production Ready  
**Maintainer**: Dev Team
