# 🎯 Reputa Protocol v3.0 - Complete Guide

**Status**: ✅ Production Ready  
**Version**: 3.0  
**Last Updated**: 2026-02-08  
**Database**: MongoDB  
**Cache**: Redis (optional)

---

## 📋 Quick Summary

Reputa Protocol v3.0 is a unified reputation system for Pi Network with:

| Feature | Details |
|---------|---------|
| **Levels** | 1-20 (was 1-10 in v2) |
| **Max Points** | 100,000 (was 10,000 in v2) |
| **Calculation** | 80% wallet + 20% app engagement |
| **Database** | MongoDB (primary) |
| **Cache** | Redis with 5-min TTL |
| **Components** | Check-in, Ads, Wallet, Tasks |

---

## 🚀 Quick Start

### 1. Installation

```bash
# Run setup script
bash install-reputa-v3.sh

# Or manual setup
npm install
npx ts-node scripts/migrateToV3.ts
```

### 2. Start Server

```bash
npm run dev
# Server runs on http://localhost:3000
```

### 3. Test API

```bash
# Get reputation
curl 'http://localhost:3000/api/v3/reputation?pioneerId=user123&username=john&email=john@example.com'

# Daily check-in
curl -X POST 'http://localhost:3000/api/v3/reputation/check-in?pioneerId=user123&username=john&email=john@example.com'

# Health check
curl http://localhost:3000/health
```

---

## 📊 Scoring System

### Component Breakdown

```
Total Score = (Wallet × 0.8) + (App Engagement × 0.2)
            = ((Mainnet × 0.6) + (Testnet × 0.2)) × 0.8 + (App Score × 0.2)
```

### Wallet Component (80% weight)
- **Mainnet**: 60% - Main blockchain activity
- **Testnet**: 20% - Test network activity
- Combined: `(mainnet × 0.6 + testnet × 0.2)`

### App Engagement (20% weight)
- **Check-in**: Daily login bonus
- **Ads**: Ad viewing rewards
- **Tasks**: Task completion rewards
- **Referrals**: Referral bonuses

### Level Thresholds

```
Level 1:   0-5,000 pts    (Newcomer)
Level 5:   20,000-25,000 pts (Reliable)
Level 10:  45,000-50,000 pts (Pioneer)
Level 15:  70,000-75,000 pts (Titan)
Level 20:  95,000-100,000 pts (Supreme)
```

---

## 🎮 API Endpoints

### 1. Get Reputation Status

```
GET /api/v3/reputation
Query: ?pioneerId=xxx&username=xxx&email=xxx

Response:
{
  "success": true,
  "data": {
    "totalReputationScore": 45000,
    "reputationLevel": 10,
    "levelName": "Pioneer",
    "components": {
      "wallet": { "mainnet": ..., "testnet": ..., "weight": "80%" },
      "appEngagement": { "checkIn": ..., "adBonus": ..., "weight": "20%" }
    },
    "progress": {
      "percentProgress": "50%",
      "pointsNeededForNext": 5000
    }
  }
}
```

### 2. Daily Check-in

```
POST /api/v3/reputation/check-in
Query: ?pioneerId=xxx&username=xxx&email=xxx

Response:
{
  "success": true,
  "message": "Check-in successful! +10 points",
  "data": {
    "pointsEarned": 10,
    "newTotal": 45010,
    "newLevel": 10,
    "streak": 5
  }
}
```

**Streak Bonuses:**
- Day 1: +10 points
- Day 3: +15 points (10 + 5 bonus)
- Day 7: +20 points (10 + 10 bonus)
- Day 14: +25 points (10 + 15 bonus)
- Day 30: +35 points (10 + 25 bonus)

### 3. Ad Bonus

```
POST /api/v3/reputation/ad-bonus
Query: ?pioneerId=xxx&username=xxx&email=xxx
Body: { "points": 5 }

Response:
{
  "success": true,
  "message": "+5 points from ad",
  "data": {
    "pointsAdded": 5,
    "newTotal": 45015,
    "newLevel": 10
  }
}
```

### 4. Check-in History

```
GET /api/v3/reputation/check-in-history?pioneerId=xxx&days=30

Response:
{
  "success": true,
  "data": {
    "count": 25,
    "checkIns": [
      { "date": "2026-02-08", "points": 35, "streak": 5, ... },
      ...
    ]
  }
}
```

### 5. Leaderboard

```
GET /api/v3/reputation/leaderboard?limit=100

Response:
{
  "success": true,
  "data": {
    "count": 100,
    "leaderboard": [
      { "rank": 1, "pioneerId": "user001", "score": 95000, "level": 20 },
      { "rank": 2, "pioneerId": "user002", "score": 90000, "level": 20 },
      ...
    ]
  }
}
```

### 6. Protocol Info

```
GET /api/v3/reputation/protocol

Response:
{
  "success": true,
  "data": {
    "version": "3.0",
    "maxLevel": 20,
    "maxPoints": 100000,
    "scoringRules": { ... },
    "description": "20 levels, 80% wallet + 20% app engagement"
  }
}
```

---

## 💾 Database Structure

### Collections

1. **Users** - User account information
   - pioneerId (unique)
   - username, email
   - protocolVersion

2. **ReputationScores** - Primary reputation data
   - pioneerId (unique)
   - totalReputationScore (0-100000)
   - reputationLevel (1-20)
   - Component scores

3. **DailyCheckin** - Daily login records
   - pioneerId, date
   - points earned, streak

4. **PointsLog** - Audit trail
   - All point changes with timestamps
   - Reason for change

5. **WalletSnapshots** - Historical wallet data
   - Blockchain markers
   - Balance history

---

## 🔧 Configuration

### Environment Variables

```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=reputa-v3

# Redis (Optional)
KV_REST_API_URL=https://xxx.upstash.io
KV_REST_API_TOKEN=xxx

# Server
PORT=3000
NODE_ENV=production
```

### Modifying Scoring Rules

Edit `server/config/reputaProtocol.ts`:

```typescript
export const SCORING_RULES = {
  DAILY_CHECKIN: {
    basePoints: 10,        // Change base check-in points
    streakBonus7: 10,      // Change streak bonus
  },
  AD_BONUS: {
    basePoints: 5,         // Change ad bonus points
    dailyCap: 15,
  },
  // ... other rules
};
```

Then recalculate all users:

```bash
curl -X POST http://localhost:3000/api/v3/reputation/admin/recalculate \
  -H "Content-Type: application/json" \
  -d '{"reason": "Updated scoring rules"}'
```

---

## 📈 Migration from v2

### Step 1: Backup Old Data
```bash
# Export Redis data
redis-cli BGSAVE
```

### Step 2: Run Migration
```bash
npx ts-node scripts/migrateToV3.ts

# Output shows:
# ✅ MIGRATION SUMMARY
# Total Users: 1234
# Successful Migrations: 1230
# Errors: 0
```

### Step 3: Verify
```bash
# Check a user's new data
curl 'http://localhost:3000/api/v3/reputation?pioneerId=xxx&username=xxx&email=xxx'

# Check leaderboard
curl 'http://localhost:3000/api/v3/reputation/leaderboard?limit=10'
```

---

## 🔐 Security

### API Authentication (TODO)
```typescript
// Add middleware to /admin/* endpoints
router.post('/admin/*', authenticate, authorize);
```

### Rate Limiting
```typescript
import { simpleRateLimit } from '../middleware/reputationMiddleware';

app.use('/api/v3/reputation/check-in', 
  simpleRateLimit(60000, 5)  // 5 per minute
);
```

### Validation
All inputs are validated:
- pioneerId: required, non-empty string
- username: required, non-empty string
- email: required, valid email format
- points: 0-100000 range

---

## 🐛 Troubleshooting

### "User not found"
```bash
# Create user by calling any endpoint
curl 'http://localhost:3000/api/v3/reputation?pioneerId=newuser&username=john&email=john@example.com'
```

### "Already checked in today"
```
User already got daily bonus
Return: HTTP 400 with message
Wait: Until tomorrow to check in again
```

### "Cache stale data"
```bash
# Manual cache clear (Redis)
redis-cli DEL "reputa:score:user123"

# Auto: Cache refreshes every 5 minutes
```

### Database Connection Failed
```bash
# Check MongoDB
mongosh --version
mongosh "mongodb://localhost:27017"

# Or use MongoDB Atlas
MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/reputa-v3"
```

---

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:3000/health
```

### View User Stats
```bash
# Get specific user
curl 'http://localhost:3000/api/v3/reputation?pioneerId=xxx&username=xxx&email=xxx'

# Get user's history
curl 'http://localhost:3000/api/v3/reputation/history?pioneerId=xxx&limit=100'
```

### Database Stats
```bash
# MongoDB shell
db.ReputationScores.stats()
db.Users.estimatedDocumentCount()
```

---

## 📚 File Structure

```
server/
├── config/
│   └── reputaProtocol.ts         ⭐ Central protocol config
├── db/
│   └── mongoModels.ts             MongoDB schemas
├── services/
│   └── reputationService.ts       Business logic
├── middleware/
│   └── reputationMiddleware.ts    Validation, errors
└── api-server-v3.ts              Main server

api/
└── v3ReputationRoutes.ts          API endpoints

scripts/
└── migrateToV3.ts                 Migration script
```

---

## 🔄 Updating Protocol

### Simple Update (Scoring Rules)
1. Edit `server/config/reputaProtocol.ts`
2. Run `/admin/recalculate` endpoint
3. Done! All users auto-updated

### Complex Update (New Component)
1. Add field to MongoDB schema
2. Update calculation functions
3. Run migration script
4. Verify with leaderboard

---

## 🎓 Examples

### Example 1: User Progression
```
Day 1 Check-in:  +10 pts (total: 10)
Day 2 Check-in:  +10 pts (total: 20)
Day 3 Check-in:  +15 pts (total: 35)   ← Streak bonus
Wallet Scan:     +50 pts (total: 85)
Ad Bonus:        +5 pts (total: 90)
```

### Example 2: Level Up
```
User has 20,000 points → Level 5 (Reliable)
Checks in 10 times → +100 points → 20,100 points → Still Level 5
After events → 25,000 points → Level 6 (Notable) ✅
```

### Example 3: Score Calculation
```
Wallet Mainnet:  30,000
Wallet Testnet:  10,000
App Engagement:  5,000

Wallet Score = (30,000 × 0.6) + (10,000 × 0.2) = 20,000
Total Score = (20,000 × 0.8) + (5,000 × 0.2) = 17,000
Level = 4 (Engaged)
```

---

## 📞 Support

### Common Issues

| Issue | Solution |
|-------|----------|
| 400: Missing parameters | Add `?pioneerId=xxx&username=xxx&email=xxx` |
| 404: Not found | User not in system, endpoint triggers creation |
| 429: Rate limited | Wait 1 minute, then retry |
| 500: Database error | Check MongoDB connection |

### Getting Help

1. Check `PROTOCOL_V3_IMPLEMENTATION.md`
2. Review API responses for error messages
3. Check logs in `./logs` directory
4. Verify MongoDB connection

---

## ✅ Checklist for Deployment

- [ ] MongoDB database created and running
- [ ] .env.local with correct MONGODB_URI
- [ ] All dependencies installed: `npm install`
- [ ] Migration completed: `npx ts-node scripts/migrateToV3.ts`
- [ ] Server starts: `npm run dev`
- [ ] Health check passes: `curl http://localhost:3000/health`
- [ ] API responds: `curl http://localhost:3000/api/v3/reputation?...`
- [ ] Rate limiting configured (if needed)
- [ ] Backups created
- [ ] Monitoring set up

---

## 🎉 You're Ready!

Your Reputa Protocol v3.0 system is now:
- ✅ Running on MongoDB
- ✅ Using unified scoring (80% wallet, 20% app)
- ✅ Supporting 20 levels (1-20)
- ✅ Handling up to 100,000 points
- ✅ Ready for production

**Next Steps:**
1. Monitor the leaderboard
2. Adjust scoring rules as needed
3. Add authentication to admin endpoints
4. Set up alerting and monitoring

---

**Made with ❤️ for Pi Network**  
**Reputa Protocol v3.0**
