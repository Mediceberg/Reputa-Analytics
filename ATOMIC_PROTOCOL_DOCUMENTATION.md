# 🔗 ATOMIC PROTOCOL - UNIFIED REPUTATION SYSTEM
## Reputa Score Whitepaper | Version 1.0

---

## 📋 Overview

The **ATOMIC PROTOCOL** is the unified reputation scoring system for Reputa Score that:
- ✅ Provides consistent reputation scores up to **1,000,000 points**
- ✅ Uses a **3-component weighted system** (Mainnet 50%, App 30%, Testnet 20%)
- ✅ Features **10 trust levels** from Novice to Atomic Legend
- ✅ Binds all data to unique user identity (username + uid + walletAddress)
- ✅ Serves as single source of truth for all reputation calculations

---

## 🎯 Scoring System

### **Score Formula**
```
Total Score = Mainnet (50%) + App Engagement (30%) + Testnet (20%)
```

**Maximum Score:** 1,000,000 points

### **Component Breakdown**

| Component | Weight | Max Points | Description |
|-----------|--------|------------|-------------|
| **Mainnet Activity** | 50% | 500,000 | Real blockchain transactions, staking, DEX trades |
| **App Engagement** | 30% | 300,000 | Daily check-ins, ad bonuses, tool usage, streaks |
| **Testnet Activity** | 20% | 200,000 | Testnet transactions, SDK payments, weekly activity |

---

## 🏆 Trust Level System (10 Levels)

| Level | Name | Points Range | Color |
|-------|------|--------------|-------|
| 1 | **Novice** | 0 – 10,000 | Gray |
| 2 | **Explorer** | 10,001 – 50,000 | Orange |
| 3 | **Contributor** | 50,001 – 150,000 | Yellow |
| 4 | **Verified** | 150,001 – 300,000 | Green |
| 5 | **Trusted** | 300,001 – 450,000 | Blue |
| 6 | **Ambassador** | 450,001 – 600,000 | Purple |
| 7 | **Elite** | 600,001 – 750,000 | Pink |
| 8 | **Sentinel** | 750,001 – 850,000 | Violet |
| 9 | **Oracle** | 850,001 – 950,000 | Amber |
| 10 | **Atomic Legend** | 950,001 – 1,000,000 | Cyan |

---

## 📊 Mainnet Activity (50% Weight)

Points earned from real Pi Network blockchain activity:

| Action | Points |
|--------|--------|
| Wallet Age Bonus | Up to 50,000 pts |
| Lifetime Activity Bonus | Up to 100,000 pts |
| Transaction | +50 pts per tx |
| DEX Trade | +100 pts per trade |
| Staking (365+ days) | +50,000 pts |
| Staking (90+ days) | +20,000 pts |
| Staking (1+ days) | +5,000 pts |
| Token Discovery | +500 pts per token |

---

## 📱 App Engagement (30% Weight)

Points earned from in-app activity:

| Action | Points |
|--------|--------|
| Daily Check-in | +100 pts |
| Check-in with Ad | +150 pts |
| Streak Bonus | +10 pts per day |
| Report Views | +25 pts each |
| Tool Usage | +20 pts each |

---

## 🧪 Testnet Activity (20% Weight)

Points earned from testnet experimentation:

| Action | Points |
|--------|--------|
| Testnet Transaction | +50 pts per tx |
| SDK Payments | +100 pts each |
| Weekly Activity Bonus | +500 pts per week |
| Testnet Link Bonus | +1,000 pts |

---

## 👥 Referral System

| Action | Points |
|--------|--------|
| Valid Referral | +500 pts |
| 5 Referrals Bonus | +250 pts |
| 10 Referrals Bonus | +500 pts |

---

## ⚠️ Penalties

Negative behaviors result in point deductions:

| Behavior | Penalty |
|----------|---------|
| Small External Transfers | -2 pts each |
| Frequent External Transfers | -5 pts each |
| Sudden Exits | -10 pts each |
| Spam Activity | -3 pts each |
| Farming Behavior | -5 pts each |

---

## 🔐 User Identity Binding

Each user has a unique identity binding:

```typescript
interface AtomicUserIdentity {
  username: string;      // Pi Network username
  uid: string;           // Pi Network user ID
  walletAddress: string; // On-chain wallet address
  createdAt: Date;
}
```

**Database Key Format:**
```
atomic:reputation:{username}:{uid}:{walletAddress}
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `src/app/protocol/atomicScoring.ts` | Main scoring calculation |
| `src/app/protocol/atomicProtocol.ts` | Protocol configuration |
| `src/app/protocol/scoringRules.ts` | Point values and caps |
| `src/app/pages/UnifiedDashboard.tsx` | How It Works UI |

---

## 📝 Summary

- **Max Score:** 1,000,000 points
- **Levels:** 10 (Novice → Atomic Legend)
- **Weights:** Mainnet 50% / App 30% / Testnet 20%
- **Identity:** Bound to username + uid + walletAddress
- **Single Source of Truth:** All components use the same scoring engine

---

**Last Updated:** February 15, 2026  
**Version:** 1.0  
**Status:** ✅ Active
