# 🚀 QUICK START - MongoDB Migration v3.0

## ⚡ 30-Second Setup

```bash
# 1. Start MongoDB (Docker)
docker run -d -p 27017:27017 mongo

# 2. Set environment
export MONGODB_URI="mongodb://localhost:27017"
export MONGODB_DB_NAME="reputa-v3"

# 3. Run migration
bash run-migration.sh
```

That's it! ✨

---

## 📊 What Just Happened

### ✅ Fixed Issues
- **Syntax Error**: Missing closing braces for batch loops
- **Module Error**: Missing `.js` extensions in ESM imports
- **Connection**: Environment variables now configurable

### ✅ Created Files
```
db/mongo.ts              ← MongoDB connection manager
db/mongoModels.ts        ← Mongoose schemas (4 models)
scripts/migrateToV3.ts   ← Migration logic (fixed & ready)
run-migration.sh         ← Automated runner script
.env.example             ← Configuration template
```

### ✅ Updated Files
```
tsconfig.json            ← Added db/** and scripts/**
```

---

## 🎯 How to Run

### Option 1: Automated (Recommended)
```bash
bash run-migration.sh
```
- ✅ Auto-checks MongoDB connection
- ✅ Verifies results after migration
- ✅ Proper error handling
- ✅ Color-coded output

### Option 2: Manual
```bash
export MONGODB_URI="mongodb://localhost:27017"
export MONGODB_DB_NAME="reputa-v3"
npx tsx scripts/migrateToV3.ts
```

### Option 3: Cloud (MongoDB Atlas)
```bash
export MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority"
export MONGODB_DB_NAME="reputa-v3"
npx tsx scripts/migrateToV3.ts
```

---

## 📋 What the Migration Does

For each user in MongoDB:
1. ✅ Read current reputation data
2. ✅ Check protocol version (skip if v3.0)
3. ✅ Recalculate score: `(wallet × 0.8) + (app × 0.2)`
4. ✅ Calculate level: 1-20 based on 0-100,000 points
5. ✅ Update MongoDB with `protocolVersion: "3.0"`
6. ✅ Log progress every batch

---

## ✨ Expected Output

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
✅ Migrated: user123 | Score: 0→25000 | Level: 1→5
✅ Migrated: user456 | Score: 0→30000 | Level: 1→6
... (more users)

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

## 🔍 Verify Results

After migration:
```bash
# Connect to MongoDB
mongosh "mongodb://localhost:27017/reputa-v3"

# Count v3.0 users
> db.reputationscores.find({ protocolVersion: "3.0" }).count()
# Should return: 450 (or your total)

# View sample user
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

## 📚 Full Documentation

For comprehensive guides, see:
- **MIGRATION_SETUP.md** - Complete step-by-step guide
- **MONGODB_INTEGRATION_COMPLETE.md** - Technical details & checklist
- **MONGO_FIX_GUIDE.md** - What was fixed and why

---

## ⚠️ Troubleshooting

### MongoDB not running?
```bash
# Docker
docker run -d -p 27017:27017 mongo

# Or local
mongod --dbpath /data/db
```

### MONGODB_URI error?
```bash
# Set the variable
export MONGODB_URI="mongodb://localhost:27017"
export MONGODB_DB_NAME="reputa-v3"
```

### Module not found error?
```bash
# Use tsx, not ts-node
npx tsx scripts/migrateToV3.ts  # ✅ Correct
npx ts-node scripts/migrateToV3.ts  # ❌ Wrong
```

---

## 🎯 Success Checklist

✅ MongoDB running  
✅ Environment variables set  
✅ Migration script executed  
✅ "Migration Complete" message displayed  
✅ MongoDB shows v3.0 users  
✅ No errors in output  

**You're done!** 🎉

---

## 🚀 Next: Start the API Server

```bash
npm run api
```

Then test the endpoints:
```bash
curl 'http://localhost:3000/api/v3/reputation?pioneerId=user123&username=john&email=john@example.com'
```

---

**Status**: ✅ **COMPLETE & READY**  
**Last Updated**: February 8, 2026  
