# 🎁 Referral System Documentation

## نظام الإحالات المتكامل | Integrated Referral System

---

## 📋 نظرة عامة | Overview

نظام الإحالات يسمح لكل مستخدم بدعوة مستخدمين جدد والحصول على نقاط مكافأة مقابل كل إحالة ناجحة.

The referral system allows each user to invite new users and earn reward points for each successful referral.

---

## 🎯 الميزات الرئيسية | Key Features

✅ **Unique Referral Code** - رمز إحالة فريد لكل مستخدم  
✅ **Copy & Share** - نسخ الرابط ومشاركته بسهولة  
✅ **Real-time Stats** - إحصائيات فورية للإحالات  
✅ **Points Claiming** - جمع النقاط المكتسبة  
✅ **Referral Tracking** - تتبع حالة الإحالات

---

## 🏗️ البنية المعمارية | Architecture

### Database Schema

#### `Users` Collection
```json
{
  "_id": "ObjectId",
  "pioneerId": "string",
  "primaryWallet": "string",
  "referralCode": "string",          // Unique code (first 6 chars of wallet)
  "pointsBalance": "int",            // Total claimed points
  "claimablePoints": "int",          // Points ready to claim
  "createdAt": "date"
}
```

#### `Referrals` Collection
```json
{
  "_id": "ObjectId",
  "referrerWallet": "string",        // Who referred
  "referredWallet": "string",        // Who was referred (unique)
  "status": "pending|confirmed|claimed",
  "rewardPoints": 30,                // Fixed 30 points per referral
  "createdAt": "date",
  "confirmedAt": "date",             // When wallet analysis was completed
  "claimedAt": "date"                // When points were claimed
}
```

---

## 🔄 الفلو الكامل | Complete Flow

### 1️⃣ User Login & Referral Code Capture
```
User visits: https://app.com/?ref=CODE
│
├─ captureReferralCodeFromUrl()
│  └─ Stored in localStorage & sessionStorage
│
└─ initializeReferralOnLogin(walletAddress)
   └─ Calls trackReferral() if ref code exists
```

### 2️⃣ Track Referral
```
POST /api/referral/track
{
  "walletAddress": "0x123...",
  "referralCode": "ABC123"
}
│
├─ Validate: Not self-referral
├─ Validate: Not duplicate referral
├─ Find referrer by code
│
└─ Create referral record → Status: "pending"
```

### 3️⃣ Confirm Referral (After First Wallet Analysis)
```
Event: wallet:analysis:complete
│
└─ POST /api/referral/confirm
   {
     "walletAddress": "0x123..."
   }
   │
   ├─ Find pending referral
   ├─ Update status → "confirmed"
   │
   └─ Add claimablePoints to referrer's account
```

### 4️⃣ Claim Points
```
POST /api/referral/claim-points
{
  "walletAddress": "0x456..." (referrer)
}
│
├─ Sum all confirmed referrals' rewards
├─ Update user.pointsBalance += totalPoints
│
└─ Mark all as status: "claimed"
```

---

## 📡 API Endpoints

### 1. Track Referral
```http
POST /api/referral/track
Content-Type: application/json

{
  "walletAddress": "0x123...",
  "referralCode": "ABC123"
}

Response:
{
  "success": true,
  "message": "Referral tracked successfully",
  "referral": {
    "referrerWallet": "0x456...",
    "referredWallet": "0x123...",
    "status": "pending",
    "rewardPoints": 30
  }
}
```

### 2. Confirm Referral
```http
POST /api/referral/confirm
Content-Type: application/json

{
  "walletAddress": "0x123..."
}

Response:
{
  "success": true,
  "message": "Referral confirmed successfully",
  "referral": {
    "status": "confirmed",
    "confirmedAt": "2024-01-15T10:30:00Z",
    "rewardPoints": 30
  }
}
```

### 3. Claim Points
```http
POST /api/referral/claim-points
Content-Type: application/json

{
  "walletAddress": "0x456..." (referrer wallet)
}

Response:
{
  "success": true,
  "message": "Points claimed successfully",
  "data": {
    "pointsClaimed": 90,
    "newPointsBalance": 150,
    "timestamp": "2024-01-15T10:35:00Z"
  }
}
```

### 4. Get Referral Stats
```http
GET /api/referral/stats?walletAddress=0x456...

Response:
{
  "success": true,
  "data": {
    "confirmedReferrals": 3,
    "pendingReferrals": 1,
    "totalPointsEarned": 90,
    "claimablePoints": 30,
    "pointsBalance": 60,
    "referralCode": "ABC123",
    "referralLink": "https://app.com/?ref=ABC123"
  }
}
```

### 5. Get Referral Code
```http
GET /api/referral/code?walletAddress=0x456...

Response:
{
  "success": true,
  "data": {
    "referralCode": "ABCDEF",
    "referralLink": "https://app.com/?ref=ABCDEF"
  }
}
```

---

## 🪝 Referral Hooks

### useReferral Hook
```typescript
import { useReferral } from '@/hooks/useReferral';

function MyComponent() {
  const {
    stats,              // ReferralStats | null
    loading,           // boolean
    error,             // string | null
    fetchStats,        // (wallet: string) => Promise<void>
    trackReferral,     // (wallet: string, code: string) => Promise<boolean>
    confirmReferral,   // (wallet: string) => Promise<boolean>
    claimPoints,       // (wallet: string) => Promise<boolean>
    getReferralCode,   // (wallet: string) => Promise<string | null>
  } = useReferral();

  useEffect(() => {
    if (walletAddress) {
      fetchStats(walletAddress);
    }
  }, [walletAddress]);

  return (
    <div>
      <p>Confirmed: {stats?.confirmedReferrals}</p>
      <p>Claimable: {stats?.claimablePoints}</p>
    </div>
  );
}
```

---

## 🧩 Components

### ReferralSection
Located in: `src/app/components/ReferralSection.tsx`

Features:
- Display referral code
- Copy link functionality
- Share button
- Show statistics (pending, confirmed, earned, claimable)
- Claim points button

Usage:
```typescript
import { ReferralSection } from '@/components/ReferralSection';

<ReferralSection 
  walletAddress="0x123..."
  username="pioneer_name"
/>
```

### Integration in ProfilePage
The `ReferralSection` is automatically included in the `ProfileSection` component, displayed after the daily check-in section.

---

## 🔐 Security Rules

✅ **Self-Referral Prevention**
- User cannot refer themselves
- Checked before creating referral record

✅ **Duplicate Prevention**
- One referral per referred wallet
- Unique index on `referredWallet`

✅ **One-Time Confirmation**
- Referral can only move from pending → confirmed once
- Status validation in confirm endpoint

✅ **One-Time Claim**
- Points only claimed when status transitions to "claimed"
- Atomic update in database

✅ **Point Validation**
- Fixed reward: 30 points per confirmed referral
- Backend calculates total from confirmed records

---

## 📊 Referral States

```
Pending ─────→ Confirmed ─────→ Claimed
   ↓               ↓               ↓
Created       User completes   Points added
when user       wallet          to balance
signs with      analysis
ref code
```

- **Pending**: User signed up with referral code, awaiting wallet analysis
- **Confirmed**: User completed wallet analysis, points pending collection
- **Claimed**: Points have been claimed by the referrer

---

## 🚀 Implementation Checklist

- [x] Database Schema (Users & Referrals collections)
- [x] API Endpoints (track, confirm, claim, stats, code)
- [x] useReferral Hook
- [x] ReferralSection Component
- [x] Profile Integration
- [x] Referral Service (initialization & tracking)
- [x] Event Listeners (wallet analysis completion)
- [ ] Admin Dashboard (view all referrals)
- [ ] Analytics (referral conversion rates)
- [ ] Email Notifications (new referral, points claimed)

---

## 📱 UI/UX Features

### Profile Referral Dashboard
- **Referral Code Card**: Display unique code with copy button
- **Stats Grid**: 4 cards showing:
  - Confirmed Referrals (Emerald)
  - Pending Referrals (Amber)
  - Total Earned Points (Purple)
  - Claimable Points (Blue)
- **Claim Button**: Visible only when claimable > 0
- **Share Menu**: Native share on supported devices

---

## 🔧 Environment Setup

No special environment variables needed! The system uses the existing API routes and localStorage.

```env
# No additional vars required
```

---

## 🧪 Testing

### Test Scenarios

#### 1. Sign up with referral code
```bash
1. Go to: https://app.com/?ref=ABC123
2. Sign up with wallet
3. Complete wallet analysis
4. Check stats → Should show: Confirmed: 1, Claimable: 30
```

#### 2. Generate referral code
```bash
1. Login with wallet
2. View profile
3. See referral code displayed
4. Copy and share with friends
```

#### 3. Claim points
```bash
1. Have pending referrals confirmed
2. Click "Claim Points"
3. Check pointsBalance increased
4. Verify referrals status → "claimed"
```

---

## 🐛 Troubleshooting

### Issue: Referral code not generated
**Solution**: Check that user ID is saved correctly after login

### Issue: Points not claiming
**Solution**: Ensure referral status is "confirmed" before claiming

### Issue: Duplicate referral error
**Solution**: User already has a referrer, cannot change referrer

---

## 📚 References

- MongoDB Schema: `src/db/mongodb.ts`
- API Endpoints: `api/referral.ts`
- Frontend Service: `src/app/services/referralService.ts`
- React Hook: `src/app/hooks/useReferral.ts`
- UI Component: `src/app/components/ReferralSection.tsx`

---

## 🎓 Future Enhancements

- [ ] Tiered rewards (more points for certain actions)
- [ ] Referral leaderboard
- [ ] Bonus points on specific milestones
- [ ] Referral expiry (after X days)
- [ ] Email invitations with referral code
- [ ] Social media integration for easy sharing
- [ ] Referral codes with custom names
- [ ] Team referrals (affiliate groups)

---

**Version**: 1.0.0  
**Status**: ✅ Production Ready  
**Last Updated**: Jan 2024
