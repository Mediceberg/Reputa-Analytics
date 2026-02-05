# MongoDB Referral System Schema Documentation

## Overview
The referral system uses two MongoDB collections to track referrals and manage user rewards:
- **Referrals** - Tracks individual referral relationships and their status
- **Users** - Contains user account data including referral code and points balance

---

## Collections

### 1. Referrals Collection

The `Referrals` collection maintains one document per referral relationship with atomic state transitions.

#### Schema Definition

```json
{
  "bsonType": "object",
  "required": ["referrerWallet", "referredWallet"],
  "properties": {
    "_id": {
      "bsonType": "objectId",
      "description": "MongoDB document identifier (auto-generated)"
    },
    "referrerWallet": {
      "bsonType": "string",
      "description": "Wallet address of the person making the referral (who gets points)"
    },
    "referredWallet": {
      "bsonType": "string",
      "description": "Wallet address of the person being referred (unique per referrer)"
    },
    "status": {
      "bsonType": "string",
      "enum": ["pending", "confirmed", "claimed"],
      "description": "Referral status tracking\n  • pending: Referral tracked but not yet confirmed\n  • confirmed: User completed wallet analysis, referral verified\n  • claimed: Referrer has claimed their 30 reward points"
    },
    "rewardPoints": {
      "bsonType": "int",
      "description": "Fixed reward value: 30 points per confirmed referral",
      "default": 30
    },
    "createdAt": {
      "bsonType": "date",
      "description": "Timestamp when referral was initially tracked"
    },
    "confirmedAt": {
      "bsonType": "date",
      "description": "Timestamp when referral status changed to 'confirmed' (when user completed wallet analysis)"
    },
    "claimedAt": {
      "bsonType": "date",
      "description": "Timestamp when referrer claimed the 30 points"
    },
    "isDemoMode": {
      "bsonType": "bool",
      "description": "Flag indicating if this is a demo/test referral (development only)"
    },
    "updatedAt": {
      "bsonType": "date",
      "description": "Last modification timestamp"
    }
  }
}
```

#### Referral Status Flow

```
pending
   ↓
   └─→ [User completes wallet analysis] → confirmed
           ↓
           └─→ [Referrer claims points] → claimed
```

**One-Way State Machine**: Status transitions are atomic and one-directional:
- `pending` → `confirmed` (when `wallet:analysis:complete` event fires)
- `confirmed` → `claimed` (when referrer calls claim endpoint)

---

### 2. Users Collection - Referral Fields

The `Users` collection contains account data with referral-related fields:

#### Referral-Related Properties

```json
{
  "referralCode": {
    "bsonType": "string",
    "description": "Unique 6-character referral code for this user\n  Format: First 6 chars of wallet (uppercase) + X-padding\n  Example: User wallet '0xabc123def456' → Code 'ABC123'"
  },
  "pointsBalance": {
    "bsonType": "int",
    "description": "Claimable points accumulated from referrals\n  Updated when: Referrer claims points from a confirmed referral\n  Default: 0",
    "default": 0
  },
  "claimablePoints": {
    "bsonType": "int",
    "description": "Points available to be claimed/transferred to account balance\n  Updated when: Points transition from pending to claimable state\n  Default: 0",
    "default": 0
  }
}
```

---

## Indexes

The Referrals collection has **5 indexes** optimizing for common query patterns:

### Index 1: Compound Index (Referrer + Status)
```
Field: { referrerWallet: 1, status: 1 }
Type: Compound ascending
Purpose: Get all referrals from a specific referrer filtered by status
```

**Example Queries**:
```javascript
// Get all pending referrals for a user
db.Referrals.find({
  referrerWallet: "0xUserWallet",
  status: "pending"
})

// Get breakdown: pending vs confirmed vs claimed
db.Referrals.find({
  referrerWallet: "0xUserWallet",
  status: { $in: ["confirmed", "claimed"] }
})
```

### Index 2: Unique Index (Referred Wallet)
```
Field: { referredWallet: 1 }
Type: Unique (prevents duplicate referrals)
Purpose: Ensure one user can only be referred once
```

**Prevents**: A user from being referred by multiple referrers
```javascript
// This will fail with duplicate key error:
db.Referrals.insertOne({
  referrerWallet: "0xAlice",
  referredWallet: "0xBob"
})

db.Referrals.insertOne({
  referrerWallet: "0xCharlie", // Different referrer
  referredWallet: "0xBob"       // Same referred user → ERROR
})
```

### Index 3: Status Index
```
Field: { status: 1 }
Type: Simple ascending
Purpose: Query all referrals by status for reporting/analytics
```

**Example Queries**:
```javascript
// Total count by status
db.Referrals.countDocuments({ status: "confirmed" })

// Get all confirmed referrals (recent)
db.Referrals.find({ status: "confirmed" })
  .sort({ confirmedAt: -1 })
  .limit(50)
```

### Index 4: Confirmed At (Descending)
```
Field: { confirmedAt: -1 }
Type: Simple descending by date
Purpose: Recent confirmations for leaderboards/analytics
```

**Example Queries**:
```javascript
// Top confirmed referrals (most recent)
db.Referrals.find({ status: "confirmed" })
  .sort({ confirmedAt: -1 })
  .limit(100)

// Referrals confirmed in last 30 days
db.Referrals.find({
  confirmedAt: {
    $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  }
})
```

### Index 5: Created At (Descending)
```
Field: { createdAt: -1 }
Type: Simple descending by date
Purpose: Recent referral tracking for activity feed
```

**Example Queries**:
```javascript
// Latest referrals (all statuses)
db.Referrals.find()
  .sort({ createdAt: -1 })
  .limit(100)

// Recent referrer activity
db.Referrals.find({
  referrerWallet: "0xUserWallet",
  createdAt: {
    $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  }
})
```

---

## Index Summary Table

| Index # | Field(s) | Type | Unique | Purpose |
|---------|----------|------|--------|---------|
| 1 | `referrerWallet: 1, status: 1` | Compound | No | Filter referrer's stats by status |
| 2 | `referredWallet: 1` | Single | **Yes** | Prevent duplicate referrals |
| 3 | `status: 1` | Single | No | Global status queries |
| 4 | `confirmedAt: -1` | Single | No | Recent confirmations |
| 5 | `createdAt: -1` | Single | No | Recent referral tracking |

---

## Common Queries

### 1. Get User's Referral Statistics

```javascript
// Get all stats for a referrer
const referrerWallet = "0xUserWallet";

const stats = {
  confirmed: await db.Referrals.countDocuments({
    referrerWallet,
    status: "confirmed"
  }),
  pending: await db.Referrals.countDocuments({
    referrerWallet,
    status: "pending"
  }),
  claimablePoints: await db.Referrals.countDocuments({
    referrerWallet,
    status: "confirmed"
  }) * 30  // 30 points per confirmed referral
};
```

✅ **Uses Index 1** (`referrerWallet: 1, status: 1`)

### 2. Track a New Referral

```javascript
await db.Referrals.insertOne({
  referrerWallet: "0xAlice",
  referredWallet: "0xBob",
  status: "pending",
  rewardPoints: 30,
  createdAt: new Date(),
  isDemoMode: false
});
```

✅ **Uses Index 2** (enforces uniqueness on `referredWallet`)

### 3. Confirm Referral After Wallet Analysis

```javascript
await db.Referrals.updateOne(
  {
    referrerWallet: "0xAlice",
    referredWallet: "0xBob"
  },
  {
    $set: {
      status: "confirmed",
      confirmedAt: new Date(),
      updatedAt: new Date()
    }
  }
);
```

✅ **Uses Index 1** or **Index 2** (matches both fields)

### 4. List Recent Confirmations (Leaderboard)

```javascript
const recentConfirmations = await db.Referrals.find({
  status: "confirmed"
})
  .sort({ confirmedAt: -1 })
  .limit(50)
  .toArray();
```

✅ **Uses Index 4** (`confirmedAt: -1`)

### 5. Get Referrer's Activity Feed

```javascript
const activity = await db.Referrals.find({
  referrerWallet: "0xAlice"
})
  .sort({ createdAt: -1 })
  .limit(20)
  .toArray();
```

✅ **Uses Index 1** or **Index 5**

### 6. Claim Points (Mark as Claimed)

```javascript
await db.Referrals.updateMany(
  {
    referrerWallet: "0xAlice",
    status: "confirmed",
    claimedAt: { $exists: false }
  },
  {
    $set: {
      status: "claimed",
      claimedAt: new Date(),
      updatedAt: new Date()
    }
  }
);
```

✅ **Uses Index 1** (`referrerWallet: 1, status: 1`)

---

## Validation Rules

### Required Fields
- `referrerWallet` - Must be provided
- `referredWallet` - Must be provided

### Field Constraints
- **Status**: Must be one of: `"pending"`, `"confirmed"`, `"claimed"`
- **rewardPoints**: Integer, defaults to 30
- **referredWallet**: Unique across collection (no duplicates)

### Timestamps
All timestamp fields are auto-managed by application layer:
- `createdAt` - Set when referral is first created
- `confirmedAt` - Set only when status changes to "confirmed"
- `claimedAt` - Set only when status changes to "claimed"
- `updatedAt` - Updated on every modification

---

## Performance Characteristics

### Insert Performance
- **Complexity**: O(1) with Index 2 enforcing uniqueness
- **Constraint**: Unique index on `referredWallet` provides automatic deduplication

### Query Performance
- **Referrer stats**: O(log n) via Index 1
- **Status filtering**: O(log n) via Index 1 or Index 3
- **Recent confirmations**: O(log n) via Index 4
- **Activity feed**: O(log n) via Index 1 or Index 5

### Update Performance  
- **Confirm referral**: O(log n) single document update
- **Claim points**: O(log n) per document, batch via Index 1

### Scalability
- All indexes use ascending/descending order for optimal range scans
- Compound Index 1 allows efficient filtering by multiple criteria
- Unique Index 2 prevents duplicate referrals at database level

---

## MongoDB Operations Example

### Initialize Referrals Collection

```javascript
// Create collection with validation
db.createCollection("Referrals", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["referrerWallet", "referredWallet"],
      properties: {
        referrerWallet: { bsonType: "string" },
        referredWallet: { bsonType: "string" },
        status: { 
          bsonType: "string", 
          enum: ["pending", "confirmed", "claimed"] 
        },
        rewardPoints: { bsonType: "int", default: 30 },
        createdAt: { bsonType: "date" },
        confirmedAt: { bsonType: "date" },
        claimedAt: { bsonType: "date" },
        isDemoMode: { bsonType: "bool" },
        updatedAt: { bsonType: "date" }
      }
    }
  }
});

// Create all 5 indexes
db.Referrals.createIndex({ referrerWallet: 1, status: 1 });
db.Referrals.createIndex({ referredWallet: 1 }, { unique: true });
db.Referrals.createIndex({ status: 1 });
db.Referrals.createIndex({ confirmedAt: -1 });
db.Referrals.createIndex({ createdAt: -1 });
```

### Verify Indexes

```javascript
// List all indexes
db.Referrals.getIndexes()

// Expected output:
[
  { v: 2, key: { _id: 1 } },                              // Default _id index
  { v: 2, key: { referrerWallet: 1, status: 1 } },        // Index 1
  { v: 2, key: { referredWallet: 1 }, unique: true },     // Index 2
  { v: 2, key: { status: 1 } },                           // Index 3
  { v: 2, key: { confirmedAt: -1 } },                     // Index 4
  { v: 2, key: { createdAt: -1 } }                        // Index 5
]
```

---

## Related Collections

### Users Collection (Referral Fields)
Contains user account data with referral tracking:
- `referralCode` - User's 6-character referral code
- `pointsBalance` - Accumulated claimable points from referrals
- `claimablePoints` - Points ready to transfer to main balance

### Integration
1. When referral is **confirmed**, nothing changes in Users yet
2. When referral is **claimed**, `Users.pointsBalance` increases by 30
3. When points are **transferred**, `Users.claimablePoints` increases

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     REFERRAL LIFECYCLE                           │
└─────────────────────────────────────────────────────────────────┘

1. TRACK (Create pending referral)
   └─→ POST /api/referral { action: 'track', referrerWallet, referralCode }
   └─→ Insert to Referrals { status: 'pending', createdAt: now }
   └─→ User sees count in ReferralSection

2. CONFIRM (Referrer completed wallet analysis)
   └─→ Event: wallet:analysis:complete fires
   └─→ POST /api/referral { action: 'confirm', referralCode, walletAddress }
   └─→ Update Referrals { status: 'confirmed', confirmedAt: now }
   └─→ Count updates: pending-1, confirmed+1

3. CLAIM (Referrer claims their 30 points)
   └─→ POST /api/referral { action: 'claim-points', walletAddress }
   └─→ Update Referrals { status: 'claimed', claimedAt: now }
   └─→ Update Users.pointsBalance += 30
   └─→ Points appear in claimable balance

4. TRANSFER (Convert to main account points)
   └─→ User clicks "Transfer to Account"
   └─→ Update Users.claimablePoints += pointsBalance
   └─→ Points reflected in main reputation score
```

---

## Notes

- **Horizontal Scalability**: Indexes support efficient sharding by `referrerWallet`
- **Data Consistency**: Unique constraint on `referredWallet` enforced at DB level
- **Audit Trail**: `createdAt`, `confirmedAt`, `claimedAt` provide complete timeline
- **Atomic Operations**: Status transitions are single-document updates (ACID guaranteed)
- **Demo Mode**: `isDemoMode` flag allows development testing without affecting production

---

**Last Updated**: Generated from [src/db/mongodb.ts](src/db/mongodb.ts#L321-L360)  
**Schema Version**: 1.0 (Production Ready)  
**Created**: December 2024
