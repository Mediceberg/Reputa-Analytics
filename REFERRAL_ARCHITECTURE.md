# 🔗 Referral System - Component Relationships & Data Flow

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      User Interface Layer                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐       ┌──────────────────┐                │
│  │  ProfilePage.tsx │ ───── │ ProfileSection   │                │
│  │                  │       │    .tsx          │                │
│  └──────────────────┘       └────────┬─────────┘                │
│                                      │                           │
│                         ┌────────────▼────────────┐              │
│                         │ ReferralSection.tsx     │              │
│                         │  - Display code         │              │
│                         │  - Show stats           │              │
│                         │  - Claim button         │              │
│                         │  - Share button         │              │
│                         └────────────┬────────────┘              │
│                                      │                           │
│                         Uses: useReferral Hook                   │
│                                      │                           │
└──────────────────────────────────────┼──────────────────────────┘
                                       │
┌──────────────────────────────────────┼──────────────────────────┐
│               State Management Layer (Hooks)                      │
├──────────────────────────────────────┼──────────────────────────┤
│                                      │                           │
│                         ┌────────────▼────────────┐              │
│                         │ useReferral Hook        │              │
│                         │  - stats (state)        │              │
│                         │  - loading              │              │
│                         │  - error                │              │
│                         │  - fetchStats()         │              │
│                         │  - claimPoints()        │              │
│                         │  - trackReferral()      │              │
│                         │  - confirmReferral()    │              │
│                         │  - getReferralCode()    │              │
│                         └────────────┬────────────┘              │
│                                      │                           │
│                      Calls API Endpoints                          │
│                                      │                           │
└──────────────────────────────────────┼──────────────────────────┘
                                       │
┌──────────────────────────────────────┼──────────────────────────┐
│          Business Logic Layer (Services)                          │
├──────────────────────────────────────┼──────────────────────────┤
│                                      │                           │
│         ┌──────────────────────────▼─────────────────────┐      │
│         │    referralService.ts                          │      │
│         │  - initializeReferralOnLogin()                 │      │
│         │  - captureReferralCodeFromUrl()                │      │
│         │  - trackReferral()                             │      │
│         │  - confirmReferralOnAnalysis()                 │      │
│         │  - generateReferralCode()                      │      │
│         │  - setupReferralEventListeners()               │      │
│         │  - dispatchWalletAnalysisCompleteEvent()       │      │
│         │  - getReferralStats()                          │      │
│         └──────────────────────────┬──────────────────────┘      │
│                                    │                             │
│                    Makes HTTP Calls to API                        │
│                                    │                             │
└────────────────────────────────────┼─────────────────────────────┘
                                     │
┌────────────────────────────────────┼─────────────────────────────┐
│              API Layer (Express/Vercel)                           │
├────────────────────────────────────┼─────────────────────────────┤
│                                    │                             │
│    ┌────────────────────────────┬──▼──────────────────────┐     │
│    │  api/referral.ts           │                         │     │
│    │  Five Main Endpoints:      │                         │     │
│    │                            │                         │     │
│    │  POST /track               │  - Validate wallet      │     │
│    │  ├─ Input: wallet + code   │  - Find referrer       │     │
│    │  └─ Output: referral       │  - Create record       │     │
│    │                            │                         │     │
│    │  POST /confirm             │  - Check pending       │     │
│    │  ├─ Input: wallet          │  - Update status       │     │
│    │  └─ Output: confirmed ref  │  - Add points         │     │
│    │                            │                         │     │
│    │  POST /claim-points        │  - Sum confirmed       │     │
│    │  ├─ Input: wallet          │  - Update balance      │     │
│    │  └─ Output: claimed        │  - Mark as claimed    │     │
│    │                            │                         │     │
│    │  GET /stats                │  - Count referrals     │     │
│    │  ├─ Query: wallet          │  - Sum points          │     │
│    │  └─ Output: stats          │  - Get code & link    │     │
│    │                            │                         │     │
│    │  GET /code                 │  - Generate/Get code   │     │
│    │  ├─ Query: wallet          │  - Return code & link │     │
│    │  └─ Output: code           │                         │     │
│    │                            │                         │     │
│    └────────────────────────────┴──┬──────────────────────┘     │
│                                    │                             │
│                    Queries MongoDB Database                       │
│                                    │                             │
└────────────────────────────────────┼─────────────────────────────┘
                                     │
┌────────────────────────────────────┼─────────────────────────────┐
│          Database Layer (MongoDB)                                 │
├────────────────────────────────────┼─────────────────────────────┤
│                                    │                             │
│    ┌─────────────────┐    ┌────────▼────────┐                  │
│    │ Users Collection│    │ Referrals       │                  │
│    │                 │    │ Collection      │                  │
│    │ Fields:         │    │                 │                  │
│    │ - pioneerId     │    │ Fields:         │                  │
│    │ - wallet        │    │ - referrerWalet │                  │
│    │ - email         │    │ - referredWalet │                  │
│    │ - referralCode  │    │ - status        │                  │
│    │ - pointsBalance │    │ - rewardPoints  │                  │
│    │ - claimablePoints   │ - createdAt     │                  │
│    │ - createdAt     │    │ - confirmedAt   │                  │
│    │ - ...other      │    │ - claimedAt     │                  │
│    │                 │    │ - ...           │                  │
│    └─────────────────┘    └─────────────────┘                  │
│                                                                   │
│    Indexes:                                                       │
│    - Users: pioneerId (unique), wallet, referralCode             │
│    - Referrals: referrerWallet, referredWallet (unique), status  │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Sequences

### 1️⃣ User Login with Referral Code

```
User visits: https://app.com/?ref=ABC123
    │
    ├─ App.tsx useEffect:
    │  └─ captureReferralCodeFromUrl()
    │     └─ Store "ABC123" in localStorage & sessionStorage
    │
    ├─ User authenticates
    │  └─ setCurrentUser(user)
    │
    ├─ initializeReferralOnLogin(walletAddress):
    │  │
    │  ├─ Check localStorage for ref_code
    │  │  └─ Found: "ABC123"
    │  │
    │  ├─ Call trackReferral(walletAddress, "ABC123")
    │  │  │
    │  │  ├─ API: POST /api/referral/track
    │  │  │  │
    │  │  │  ├─ Validate: Not self-referral ✓
    │  │  │  ├─ Validate: Not duplicate ✓
    │  │  │  ├─ Find referrer by code
    │  │  │  │  └─ Query Users collection
    │  │  │  │     └─ Find where referralCode = "ABC123"
    │  │  │  │        └─ Get referrerWallet
    │  │  │  │
    │  │  │  └─ Create Referral document:
    │  │  │     {
    │  │  │       referrerWallet: "0x...",
    │  │  │       referredWallet: walletAddress,
    │  │  │       status: "pending",
    │  │  │       rewardPoints: 30,
    │  │  │       createdAt: now()
    │  │  │     }
    │  │  │
    │  │  └─ Return success
    │  │
    │  ├─ Call generateReferralCode(walletAddress)
    │  │  │
    │  │  ├─ API: GET /api/referral/code
    │  │  │  │
    │  │  │  ├─ Check if user exists in Users collection
    │  │  │  ├─ If not: Create new user document
    │  │  │  ├─ Generate code: first6chars(wallet)
    │  │  │  ├─ Update user.referralCode
    │  │  │  │
    │  │  │  └─ Return code
    │  │  │
    │  │  └─ Store in localStorage for future reference
    │  │
    │  └─ Return success
    │
    └─ App ready to use
       New user is tracked as referral (pending)
```

### 2️⃣ Wallet Analysis Completion

```
User navigates to: Wallet Analysis Page
    │
    ├─ User inputs wallet details
    │  └─ System analyzes wallet
    │
    └─ Analysis complete!
       │
       ├─ handleWalletCheck(address):
       │  │
       │  ├─ fetchWalletData(address)
       │  │  └─ Returns wallet stats
       │  │
       │  ├─ setWalletData(data)
       │  │  └─ Update state with wallet info
       │  │
       │  ├─ dispatchWalletAnalysisCompleteEvent()
       │  │  │
       │  │  └─ Dispatch custom event:
       │  │     window.dispatchEvent(
       │  │       new CustomEvent('wallet:analysis:complete')
       │  │     )
       │  │
       │  └─ Return
       │
       └─ Event listener in referralService.ts:
          window.addEventListener('wallet:analysis:complete')
            │
            └─ Call confirmReferral(walletAddress):
               │
               ├─ API: POST /api/referral/confirm
               │  │
               │  ├─ Find Referral where:
               │  │  - referredWallet = walletAddress
               │  │  - status = "pending"
               │  │
               │  ├─ Update Referral document:
               │  │  {
               │  │    status: "confirmed",
               │  │    confirmedAt: now()
               │  │  }
               │  │
               │  ├─ Update User document (referrer):
               │  │  user.claimablePoints += 30
               │  │
               │  └─ Return success
               │
               └─ Confirmation complete!
                  Referrer gets 30 claimable points
```

### 3️⃣ Claim Points

```
Referrer opens Profile Page
    │
    ├─ ReferralSection component mounts
    │  │
    │  ├─ useReferral hook:
    │  │  │
    │  │  ├─ fetchStats(walletAddress)
    │  │  │  │
    │  │  │  ├─ API: GET /api/referral/stats
    │  │  │  │  │
    │  │  │  │  ├─ Find User document
    │  │  │  │  ├─ Count referrals:
    │  │  │  │  │  - Where referrerWallet = wallet
    │  │  │  │  │  - Status = "confirmed" → confirmedReferrals
    │  │  │  │  │  - Status = "pending" → pendingReferrals
    │  │  │  │  ├─ Sum reward points:
       │  │  │  │  │  - Sum rewardPoints where status != "pending"
               │  │  │  │
               │  │  │  └─ Return stats object:
                  {
                    confirmedReferrals: 1,
                    pendingReferrals: 0,
                    totalPointsEarned: 30,
                    claimablePoints: 30,
                    pointsBalance: 0,
                    referralCode: "ABC123",
                    referralLink: "https://app.com/?ref=ABC123"
                  }
               │  │  │
               │  │  └─ setStats(data)
               │  │
               │  └─ Display in UI:
               │     - Confirmed: 1
               │     - Pending: 0
               │     - Total: 30
               │     - Claimable: 30
               │     - [Claim 30 Points] button visible
               │
               └─ User clicks "Claim 30 Points" button
                  │
                  └─ claimPoints(walletAddress):
                     │
                     ├─ API: POST /api/referral/claim-points
                     │  │
                     │  ├─ Get all referrals where:
                     │  │  - referrerWallet = walletAddress
                     │  │  - status = "confirmed"
                     │  │
                     │  ├─ Sum rewardPoints → pointsToClaim
                     │  │
                     │  ├─ Update User document:
                     │  │  {
                     │  │    pointsBalance: user.pointsBalance + pointsToClaim,
                     │  │    claimablePoints: 0
                     │  │  }
                     │  │
                     │  ├─ Update all Referral documents:
                     │  │  For each referral:
                     │  │  {
                     │  │    status: "claimed",
                     │  │    claimedAt: now()
                     │  │  }
                     │  │
                     │  └─ Return success
                     │
                     ├─ Refresh stats
                     │  └─ fetchStats() again
                     │
                     └─ Update UI:
                        - Claimable: 0
                        - Button hidden
                        - Points balance increased
```

---

## Event Flow

### Custom Events System

```
┌─────────────────────────────────────┐
│ wallet:analysis:complete            │
├─────────────────────────────────────┤
│ Dispatched from: App.tsx             │
│ In: handleWalletCheck()              │
│ When: Wallet analysis is done        │
│                                       │
│ Payload:                              │
│ {                                     │
│   detail: {                           │
│     timestamp: "2024-01-15T10:00Z"   │
│   }                                   │
│ }                                     │
│                                       │
│ Listeners:                            │
│ - confirmReferral() handler           │
└─────────────────────────────────────┘

Timing: Usually a few seconds after:
1. User selects wallet
2. System calculates reputation
3. Data displayed on dashboard
4. Event fires automatically
```

---

## State Management

### useReferral Hook State

```
┌─────────────────────────────────────┐
│ Hook State Object                   │
├─────────────────────────────────────┤
│                                       │
│ stats: ReferralStats | null          │
│ {                                     │
│   confirmedReferrals: number          │
│   pendingReferrals: number            │
│   totalPointsEarned: number           │
│   claimablePoints: number             │
│   pointsBalance: number               │
│   referralCode: string                │
│   referralLink: string                │
│ }                                     │
│                                       │
│ loading: boolean                      │
│ - true during API calls               │
│ - false when complete                 │
│                                       │
│ error: string | null                  │
│ - null on success                     │
│ - Error message on failure            │
│                                       │
└─────────────────────────────────────┘

Updates via:
- fetchStats()    → Updates stats
- trackReferral() → Updates stats
- claimPoints()   → Updates stats
- Automatic refresh after mutations
```

---

## Error Handling Flow

```
API Call
    │
    ├─ Success (200-299):
    │  └─ Parse response
    │     └─ Check data.success
    │        ├─ true:
    │        │  └─ setError(null)
    │        │     └─ Return success
    │        │
    │        └─ false:
    │           └─ setError(data.error)
    │              └─ Return error
    │
    └─ Failure (4xx, 5xx, network):
       └─ Catch exception
          └─ setError(err.message)
             └─ Log to console
                └─ Return error

UI Display:
- error && <div className="error">{error}</div>
- Automatic cleanup on retry
```

---

## Component Hierarchy

```
App.tsx (Root)
│
├─ TrustProvider
│  │
│  └─ ReputaAppContent
│     │
│     ├─ WalletChecker (displays when no wallet)
│     │
│     └─ [IF walletData exists] UnifiedDashboard
│        │
│        └─ ProfilePage (route detected)
│           │
│           └─ ProfileSection
│              │
│              ├─ DailyCheckIn
│              │
│              ├─ ReferralSection ✨ OUR COMPONENT
│              │  │
│              │  ├─ useReferral (hook)
│              │  │
│              │  ├─ ReferralCodeCard
│              │  │  ├─ Copy button
│              │  │  └─ Share button
│              │  │
│              │  ├─ StatsGrid
│              │  │  ├─ Confirmed card
│              │  │  ├─ Pending card
│              │  │  ├─ TotalEarned card
│              │  │  └─ Claimable card
│              │  │
│              │  └─ ClaimButton
│              │
│              ├─ ScoreBreakdown
│              │
│              └─ FooterLinks
```

---

## Data Persistence

```
LocalStorage:
├─ ref_code                  → Referral code from URL
├─ referral_code_0x...       → Generated code for wallet
└─ userReputation            → User's reputation data

SessionStorage:
└─ ref_code                  → Backup of referral code

MongoDB:
├─ Users collection
│  └─ Referral-related fields:
│     ├─ referralCode
│     ├─ pointsBalance
│     └─ claimablePoints
│
└─ Referrals collection
   └─ Complete referral records
```

---

**Document Version**: 1.0  
**Last Updated**: January 2024  
**Status**: ✅ Complete
