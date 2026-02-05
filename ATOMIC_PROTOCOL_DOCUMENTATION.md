# 🔗 ATOMIC PROTOCOL - UNIFIED REPUTATION SYSTEM
## Version 1.0 | Unified Implementation Guide

---

## 📋 Overview

The **ATOMIC PROTOCOL** is a unified reputation scoring system that:
- ✅ Provides consistent reputation scores across all components
- ✅ Binds all data to unique user identity (username + id + walletAddress)
- ✅ Serves as single source of truth for reputation calculations
- ✅ Eliminates score inconsistencies and conflicts
- ✅ Ensures data integrity through strict database key conventions

---

## 🎯 Key Features

### 1. **User Identity Binding**
```typescript
interface AtomicUserIdentity {
  username: string;      // Unique account identifier
  uid: string;          // Pi Network user ID
  walletAddress: string; // On-chain wallet address
  createdAt: Date;
}
```

**Database Key Format:**
```
atomic:reputation:{username}:{uid}:{walletAddress}
atomic:history:{username}:{uid}:{walletAddress}
atomic:composite:{username}:{uid}:{walletAddress}
```

### 2. **Unified Reputation Data Structure**
```typescript
interface AtomicReputationData {
  userIdentity: AtomicUserIdentity;
  
  // Main Score (0-10000)
  score: number;
  trustLevel: AtomicTrustLevel;
  rawScore: number;
  adjustedScore: number;
  
  // Component Scores
  walletAgeScore: number;        // 15% weight
  interactionScore: number;      // 20% weight
  piNetworkScore: number;        // 25% weight
  piDexScore: number;            // 15% weight
  stakingScore: number;          // 25% weight
  
  // Penalties
  externalTxPenalty: number;
  suspiciousPenalty: number;
  
  // Metadata
  lastUpdated: Date;
  updateReason?: string;
  previousScore?: number;
}
```

### 3. **Score Components & Weights**

| Component | Weight | Purpose |
|-----------|--------|---------|
| **Wallet Age** | 15% | Account maturity and consistency |
| **Interaction** | 20% | Daily activity and engagement |
| **Pi Network** | 25% | Internal network transactions |
| **Pi DEX** | 15% | Decentralized exchange activity |
| **Staking** | 25% | Long-term token commitment |

**Total Score Range:** 0 - 10,000 points

### 4. **Trust Level Hierarchy**

| Level | Range | Color | Icon |
|-------|-------|-------|------|
| **Elite** | 8500-10000 | 🟡 Gold | Crown |
| **Pioneer+** | 7500-8500 | 🟣 Purple | Star |
| **Trusted** | 6000-7500 | 🟢 Emerald | CheckCircle |
| **Active** | 4000-6000 | 🔵 Blue | Activity |
| **Medium** | 2000-4000 | 🟡 Yellow | HelpCircle |
| **Low Trust** | 1000-2000 | 🟠 Orange | AlertTriangle |
| **Very Low Trust** | 0-1000 | 🔴 Red | AlertCircle |

---

## 📦 Implementation

### Usage in Components

#### **1. Share Reputation Card**
```tsx
import { ATOMIC_PROTOCOL_CONFIG, ATOMIC_TRUST_LEVEL_COLORS } from '../protocol/atomicProtocol';

function ShareReputaCard() {
  const atomicData = getAtomicReputationData(username, uid, walletAddress);
  
  return (
    <div>
      <p>Score: {atomicData.score}</p>
      <p>Trust: {atomicData.trustLevel}</p>
      <p>Protocol: ATOMIC PROTOCOL v1.0</p>
    </div>
  );
}
```

#### **2. VIP Modal**
```tsx
function VIPModal() {
  const atomicData = getAtomicReputationData(username, uid, walletAddress);
  
  // Display only Atomic Protocol data
  if (atomicData.score < ATOMIC_PROTOCOL_CONFIG.TRUST_THRESHOLDS['Trusted'].min) {
    return <UpgradePrompt />;
  }
}
```

#### **3. Audit Report**
```tsx
function AuditReport() {
  const atomicData = getAtomicReputationData(username, uid, walletAddress);
  
  // Show breakdown of all 5 components
  return (
    <div>
      <ComponentScore label="Wallet Age" score={atomicData.walletAgeScore} />
      <ComponentScore label="Interaction" score={atomicData.interactionScore} />
      <ComponentScore label="Pi Network" score={atomicData.piNetworkScore} />
      <ComponentScore label="Pi DEX" score={atomicData.piDexScore} />
      <ComponentScore label="Staking" score={atomicData.stakingScore} />
    </div>
  );
}
```

### Database Operations

#### **Store Reputation Data**
```typescript
const key = ATOMIC_DB_KEYS.getReputationKey(username, uid, walletAddress);
await database.set(key, atomicData);
```

#### **Retrieve Reputation Data**
```typescript
const key = ATOMIC_DB_KEYS.getReputationKey(username, uid, walletAddress);
const atomicData = await database.get(key);
```

#### **Retrieve Score History**
```typescript
const key = ATOMIC_DB_KEYS.getHistoryKey(username, uid, walletAddress);
const history = await database.get(key);
```

---

## 🔄 Data Flow

```
User Submit Wallet/Activity
         ↓
Atomic Protocol Calculation
  ├─ Collect wallet data
  ├─ Calculate 5 components
  ├─ Apply penalties
  └─ Generate final score
         ↓
Bind to User Identity
  ├─ username
  ├─ uid
  └─ walletAddress
         ↓
Store in Database
  ├─ Main reputation entry
  ├─ History log
  └─ Composite cache
         ↓
Display in Components
  ├─ Share Card
  ├─ VIP Modal
  └─ Audit Report
```

---

## 🛡️ Data Integrity

### Unique Binding
- Each user has exactly ONE reputation record
- Identified by: `{username}:{uid}:{walletAddress}`
- Prevents data duplication and conflicts

### Validation
```typescript
function validateUserIdentity(identity: AtomicUserIdentity): boolean {
  return !!(
    identity.username?.length > 0 &&
    identity.uid?.length > 0 &&
    identity.walletAddress?.length > 0
  );
}
```

### Score Normalization
- All scores normalized to 0-10,000 range
- Consistent calculation across all components
- Penalties applied uniformly
- No component exceeds its weight percentage

---

## 📊 Pages & Components

### **Atomic Protocol Page** (`AtomicProtocolPage.tsx`)
Main documentation page showing:
- ✅ Unified scoring components
- ✅ Trust level hierarchy
- ✅ Penalty system
- ✅ Data security & identity binding

### **Share Reputation Card** (`ShareReputaCard.tsx`)
Displays:
- ✅ User's Atomic score
- ✅ Trust level badge
- ✅ Protocol version
- ✅ Share/download options

### **VIP Modal** (`VIPModal.tsx`)
Shows:
- ✅ Atomic Protocol benefits
- ✅ Upgrade requirements
- ✅ Feature unlock conditions

### **Audit Report** (`AuditReport.tsx`)
Contains:
- ✅ Detailed 5-component breakdown
- ✅ Risk analysis (from Atomic data)
- ✅ Behavioral patterns (from Atomic data)
- ✅ Professional recommendations

---

## ⚙️ Configuration

### Default Configuration
```typescript
const ATOMIC_PROTOCOL_CONFIG = {
  NAME: 'ATOMIC PROTOCOL',
  VERSION: '1.0',
  SCORE_MIN: 0,
  SCORE_MAX: 10000,
  
  WEIGHTS: {
    WALLET_AGE: 0.15,
    INTERACTION: 0.20,
    PI_NETWORK: 0.25,
    PI_DEX: 0.15,
    STAKING: 0.25,
  },
};
```

### Customization
To modify scoring:
1. Edit `src/app/protocol/atomicProtocol.ts`
2. Update `ATOMIC_PROTOCOL_CONFIG`
3. Recalculate all user scores
4. Update documentation

---

## 🚀 Migration Guide

### From Old System to Atomic Protocol

1. **Identify Old Score Sources**
   - `reputaScore` (old app system)
   - `trustScore` (old blockchain system)
   - Individual component calculations

2. **Consolidate to Atomic**
   ```typescript
   // OLD (NOT USED)
   const oldScore = walletData.reputaScore;
   
   // NEW (ATOMIC PROTOCOL)
   const atomicData = getAtomicReputationData(username, uid, walletAddress);
   const newScore = atomicData.score;
   ```

3. **Update All Components**
   - ✅ ShareReputaCard
   - ✅ VIPModal
   - ✅ AuditReport
   - ✅ MainCard
   - ✅ TrustGauge
   - ✅ Dashboard

4. **Verify Consistency**
   - All components show same score
   - No discrepancies in display
   - Historical data maintained

---

## 🔍 Debugging

### Check User Binding
```typescript
const userIdentity: AtomicUserIdentity = {
  username: 'testuser',
  uid: 'user123',
  walletAddress: '0x...',
  createdAt: new Date()
};

if (!validateUserIdentity(userIdentity)) {
  console.error('Invalid user identity');
}
```

### Verify Score Calculation
```typescript
const atomicResult = calculateAtomicReputation(walletData);
console.log('Raw Score:', atomicResult.rawScore);
console.log('Adjusted Score:', atomicResult.adjustedScore);
console.log('Trust Level:', atomicResult.trustLevel);
```

### Check Database Keys
```typescript
const key = ATOMIC_DB_KEYS.getReputationKey(
  username,
  uid,
  walletAddress
);
console.log('DB Key:', key);
```

---

## 📝 Notes

- **Single Source of Truth:** All reputation data comes from Atomic Protocol
- **No Conflicts:** No duplicate calculations or conflicting scores
- **User-Centric:** Data always bound to verified user identity
- **Scalable:** Configuration-driven, easy to update weights
- **Transparent:** All scoring rules documented and visible

---

## 📞 Support

For issues or questions about Atomic Protocol:
1. Check `AtomicProtocolPage.tsx` for display rules
2. Review `atomicProtocol.ts` for configuration
3. Verify user identity binding in database operations
4. Check component implementation for consistency

---

**Last Updated:** February 5, 2026\
**Version:** 1.0\
**Status:** ✅ Active & Unified
