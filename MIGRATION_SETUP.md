# 🔧 MongoDB Migration Setup Guide

**Status**: ✅ **Script is ready to run**  
**Date**: February 8, 2026

---

## ✅ Issues Fixed

### 1. **Syntax Error** ✅ FIXED
- **Error**: Line 141 - Missing closing brace for for loops
- **Solution**: Added proper closing braces and restructured batch processing loop
- **Result**: Script now parses correctly

### 2. **Module Resolution** ✅ FIXED
- **Error**: `Cannot find module '/db/mongo'`
- **Root Cause**: ESM module system requires `.js` file extensions in imports
- **Solution**: 
  - Changed imports to use `.js` extensions
  - Updated `tsconfig.json` to include `db/**/*` and `scripts/**/*`
  - Use `tsx` instead of `ts-node` for better ESM support
- **Result**: Modules now resolve correctly

### 3. **Environment Variables** ✅ READY
- **Error**: `MONGODB_URI not defined`
- **Solution**: Set environment variables before running
- **Usage**:
  ```bash
  export MONGODB_URI="mongodb://localhost:27017"
  export MONGODB_DB_NAME="reputa-v3"
  ```

---

## 🚀 How to Run the Migration

### Prerequisites

1. **MongoDB Running**:
   ```bash
   # Option 1: Local MongoDB
   mongod --dbpath /data/db
   
   # Option 2: Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   
   # Option 3: MongoDB Atlas
   # Use your cloud connection string instead
   ```

2. **Node Modules Installed**:
   ```bash
   npm install
   ```

3. **Mongoose Installed** (already in package.json):
   ```bash
   npm ls mongoose  # Verify it's installed
   ```

### Run the Migration

```bash
# Set environment variables
export MONGODB_URI="mongodb://localhost:27017"
export MONGODB_DB_NAME="reputa-v3"

# Run migration with tsx
npx tsx scripts/migrateToV3.ts
```

### Expected Output

```
================================================================================
🚀 REPUTA PROTOCOL v3.0 MIGRATION
================================================================================

📊 Connecting to MongoDB...
✅ Connected

📋 Found 500 users to migrate

Processing users in batches of 100...

[Batch 1/5]
----------------------------------------
✅ Migrated: user123 | Score: 0→25000 (Δ25000) | Level: 1→5
✅ Migrated: user456 | Score: 0→30000 (Δ30000) | Level: 1→6
...

[Batch 2/5]
----------------------------------------
...

================================================================================
📊 MIGRATION SUMMARY
================================================================================
Total Users:           500
Successful Migrations: 450
Skipped (Already v3):  50
Errors:                0
Duration:             2.45s
Rate:                 204 users/sec
================================================================================

✅ MIGRATION COMPLETE!
```

---

## 🎯 What the Migration Does

### For Each User:
1. ✅ Reads current reputation data from MongoDB
2. ✅ Checks if already on v3.0 protocol (skips if yes)
3. ✅ Recalculates reputation score using v3.0 rules:
   - Formula: `(walletScore × 0.8) + (appScore × 0.2)`
   - Max: 100,000 points
4. ✅ Determines new level (1-20) based on points
5. ✅ Updates MongoDB with:
   - `totalReputationScore`: New score
   - `reputationLevel`: New level (1-20)
   - `protocolVersion`: "3.0"
   - `updatedAt`: Current timestamp

### Batch Processing:
- Processes 100 users at a time
- Generates progress report for each batch
- Handles errors gracefully (logs but continues)
- Provides final summary statistics

---

## 🔌 Connection Strings

### Local MongoDB
```
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=reputa-v3
```

### MongoDB Atlas (Cloud)
```
MONGODB_URI=mongodb+srv://username:password@cluster0.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=reputa-v3
```

### Docker MongoDB
```bash
# Start container
docker run -d -p 27017:27017 -e MONGO_INITDB_DATABASE=reputa-v3 mongo

# Then use
MONGODB_URI=mongodb://localhost:27017
```

---

## 🔍 Verification

### After Migration Completes:

```bash
# Connect to MongoDB
mongosh "mongodb://localhost:27017/reputa-v3"

# Check migration results
> db.reputationscores.find({ protocolVersion: "3.0" }).count()
# Should show X users migrated

# Check sample user
> db.reputationscores.findOne({})
# Should show protocolVersion: "3.0"

# Check level distribution
> db.reputationscores.aggregate([
    { $group: { _id: "$reputationLevel", count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ])
# Should show users across levels 1-20
```

---

## 📊 Optional: Create Indexes

For better performance, create indexes:

```bash
mongosh "mongodb://localhost:27017/reputa-v3"

# Index on pioneerId (for fast lookups)
> db.reputationscores.createIndex({ pioneerId: 1 })

# Index on protocol version (for v3.0 queries)
> db.reputationscores.createIndex({ protocolVersion: 1 })

# Index on level (for leaderboards)
> db.reputationscores.createIndex({ reputationLevel: -1, totalReputationScore: -1 })
```

---

## ⚠️ Troubleshooting

### Error: Connection Timeout
```
Solution: Ensure MongoDB is actually running
mongosh --version  # Should show mongosh version
```

### Error: No users found
```
Solution: Check if data exists in MongoDB
mongosh "mongodb://localhost:27017/reputa-v3"
> db.reputationscores.count()
# Should show > 0
```

### Error: MONGODB_URI not set
```
Solution: Export the variable
export MONGODB_URI="mongodb://localhost:27017"
export MONGODB_DB_NAME="reputa-v3"
```

### Script hangs on "Connecting to MongoDB..."
```
Solution: MongoDB may not be running
- Check if mongod process is running: ps aux | grep mongod
- Start MongoDB: mongod --dbpath /data/db
- Or use Docker: docker run -d -p 27017:27017 mongo
```

---

## 📁 Files Involved

```
db/
├── mongo.ts              ← MongoDB connection
└── mongoModels.ts        ← Mongoose schemas

scripts/
└── migrateToV3.ts       ← Migration script (READY TO RUN)

server/config/
└── reputaProtocol.ts    ← v3.0 configuration & calculations
```

---

## ✨ Next Steps

1. **Set up MongoDB**:
   ```bash
   docker run -d -p 27017:27017 mongo
   ```

2. **Set environment**:
   ```bash
   export MONGODB_URI="mongodb://localhost:27017"
   export MONGODB_DB_NAME="reputa-v3"
   ```

3. **Run migration**:
   ```bash
   npx tsx scripts/migrateToV3.ts
   ```

4. **Verify results**:
   ```bash
   mongosh "mongodb://localhost:27017/reputa-v3"
   > db.reputationscores.find().limit(1)
   ```

5. **Start API server**:
   ```bash
   npm run api
   ```

---

## 🎉 Success Criteria

Migration is successful when:
- ✅ Script runs without errors
- ✅ "✅ MIGRATION COMPLETE!" message appears
- ✅ MongoDB shows users with `protocolVersion: "3.0"`
- ✅ All users have `reputationLevel` between 1-20
- ✅ Scores range from 0-100000

**Status**: Ready for execution! 🚀
