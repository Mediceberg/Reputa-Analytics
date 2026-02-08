# 🚀 DEPLOYMENT & INTEGRATION GUIDE - Reputa v3.0

## Overview

This guide explains how to integrate Reputa Protocol v3.0 with your existing Pi Network application.

---

## 🎯 Integration Steps

### Step 1: Add Dependencies

```bash
npm install mongodb @upstash/redis express
npm install -D typescript @types/node @types/express
```

### Step 2: Update Environment Variables

Create or update `.env.local`:

```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=reputa-v3

# Redis (Optional for caching)
KV_REST_API_URL=https://your-upstash-url.upstash.io
KV_REST_API_TOKEN=your-token-here

# Server
PORT=3000
NODE_ENV=production
```

### Step 3: Register API Routes

In your main server file (e.g., `src/main.tsx` or `server.ts`):

```typescript
import express from 'express';
import v3ReputationRoutes from './api/v3ReputationRoutes';

const app = express();

// ... other middleware ...

// Register Reputa v3 API
app.use('/api', v3ReputationRoutes);

// ... rest of server ...
```

### Step 4: Initialize MongoDB on Startup

```typescript
import { connectMongoDB } from './server/db/mongoModels';

// Call on app startup
async function startServer() {
  // Connect to MongoDB
  await connectMongoDB();
  
  // Start Express server
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
}

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
```

### Step 5: Run Migration Script (if migrating from v2)

```bash
npx ts-node scripts/migrateToV3.ts
```

Output:
```
🚀 REPUTA PROTOCOL v3.0 MIGRATION
...
✅ MIGRATION COMPLETE!
Total Users: 1234
Successful Migrations: 1230
Errors: 0
```

---

## 💻 Frontend Integration

### 1. Fetch User Reputation

```typescript
import { useEffect, useState } from 'react';

function UserReputationCard() {
  const [reputation, setReputation] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const pioneerId = 'user123';  // Get from Pi Network auth
  const username = 'john';      // Get from Pi Network auth
  const email = 'john@example.com';  // Get from Pi Network auth
  
  useEffect(() => {
    // Fetch reputation
    fetch(`/api/v3/reputation?pioneerId=${pioneerId}&username=${username}&email=${email}`)
      .then(res => res.json())
      .then(data => setReputation(data.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [pioneerId]);
  
  if (loading) return <div>Loading...</div>;
  if (!reputation) return <div>Error loading reputation</div>;
  
  return (
    <div>
      <h2>Level {reputation.reputationLevel}: {reputation.levelName}</h2>
      <p>Score: {reputation.totalReputationScore.toLocaleString()} / 100,000</p>
      <div style={{
        width: '100%',
        backgroundColor: '#eee',
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${reputation.progress.percentProgress}%`,
          backgroundColor: '#4CAF50',
          height: '20px',
          transition: 'width 0.3s ease'
        }} />
      </div>
      <p>Next level: {reputation.progress.pointsNeededForNext} points</p>
    </div>
  );
}

export default UserReputationCard;
```

### 2. Daily Check-in Button

```typescript
function CheckInButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v3/reputation/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      
      if (data.success) {
        setMessage(`✅ ${data.message}`);
        // Refresh reputation
        location.reload();
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      setMessage('❌ Error during check-in');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <button onClick={handleCheckIn} disabled={loading}>
        {loading ? 'Checking in...' : 'Daily Check-in'}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
}

export default CheckInButton;
```

### 3. Leaderboard Display

```typescript
function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  
  useEffect(() => {
    fetch('/api/v3/reputation/leaderboard?limit=100')
      .then(res => res.json())
      .then(data => setLeaderboard(data.data.leaderboard))
      .catch(err => console.error(err));
  }, []);
  
  return (
    <table>
      <thead>
        <tr>
          <th>Rank</th>
          <th>Pioneer ID</th>
          <th>Score</th>
          <th>Level</th>
        </tr>
      </thead>
      <tbody>
        {leaderboard.map((user, idx) => (
          <tr key={user.pioneerId}>
            <td>{user.rank}</td>
            <td>{user.pioneerId}</td>
            <td>{user.score.toLocaleString()}</td>
            <td>{user.levelName}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default Leaderboard;
```

---

## 🔌 API Integration Checklist

- [ ] Database connection configured
- [ ] API server running on correct port
- [ ] Routes registered in Express app
- [ ] Environment variables set
- [ ] MongoDB collections created
- [ ] Users migrated (if from v2)
- [ ] Health check passing (`/health`)
- [ ] Sample API calls working
- [ ] Frontend updated with new endpoints
- [ ] Rate limiting configured
- [ ] Monitoring set up
- [ ] Backups scheduled

---

## 📋 API Reference Summary

### Authentication

Currently: **No authentication** (query params used for identification)

**Future**: Add middleware:
```typescript
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  // Verify token...
  next();
}
```

### Common Response Format

**Success**:
```json
{
  "success": true,
  "data": { ... }
}
```

**Error**:
```json
{
  "success": false,
  "error": "Error message here"
}
```

### Query Parameter Validation

All endpoints validate:
- `pioneerId`: Non-empty string
- `username`: Non-empty string
- `email`: Valid email format

---

## 🔧 Configuration Options

### Change Scoring Rules

Edit `server/config/reputaProtocol.ts`:

```typescript
export const SCORING_RULES = {
  DAILY_CHECKIN: {
    basePoints: 10,        // Base points per check-in
    streakBonus3: 5,       // Bonus at 3-day streak
    streakBonus7: 10,      // Bonus at 7-day streak
    streakBonus14: 15,     // Bonus at 14-day streak
    streakBonus30: 25,     // Bonus at 30-day streak
  },
  AD_BONUS: {
    basePoints: 5,         // Points per ad
    maxPerDay: 3,          // Max ads per day
    dailyCap: 15,          // Max points from ads per day
  },
  // ... other rules
};
```

Then apply:
```bash
curl -X POST http://localhost:3000/api/v3/reputation/admin/recalculate \
  -H "Content-Type: application/json" \
  -d '{"reason": "Updated scoring rules"}'
```

### Change Level Thresholds

Edit `server/config/reputaProtocol.ts`:

```typescript
export const LEVEL_THRESHOLDS: number[] = [
  0,      // Level 1: 0-5000
  5000,   // Level 2
  10000,  // Level 3
  // ... change these values
];
```

---

## 🚀 Production Deployment

### Pre-deployment Checklist

1. **Database**
   - [ ] MongoDB instance running
   - [ ] Collections created
   - [ ] Backups configured
   - [ ] Connection tested

2. **Cache** (Optional)
   - [ ] Redis/Upstash account created
   - [ ] Credentials in .env
   - [ ] TTL set to 5 minutes

3. **API Server**
   - [ ] All dependencies installed
   - [ ] PORT environment variable set
   - [ ] Health check working
   - [ ] Error handling tested

4. **Data Migration**
   - [ ] Users migrated from v2 (if applicable)
   - [ ] Data integrity verified
   - [ ] Backups of old data created

5. **Frontend**
   - [ ] Updated to use v3 endpoints
   - [ ] Error handling added
   - [ ] Loading states shown
   - [ ] Tested all flows

### Deployment Steps

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Build TypeScript
npm run build

# 3. Migrate data (if needed)
npx ts-node scripts/migrateToV3.ts

# 4. Start server
npm run start
# or with PM2
pm2 start npm --name "reputa-v3" -- start

# 5. Verify
curl http://localhost:3000/health
curl http://localhost:3000/api/v3/reputation/protocol
```

### Monitoring

```bash
# Check server uptime
pm2 list

# View logs
pm2 logs reputa-v3

# Monitor system resources
pm2 monit
```

---

## 🔒 Security Hardening

### 1. Add API Key Authentication

```typescript
// middleware/apiKeyAuth.ts
export function verifyApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
}

// Use in routes
app.use('/api/v3/reputation/admin/*', verifyApiKey);
```

### 2. Enable Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const checkInLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 5,               // 5 requests per minute
  message: 'Too many check-in attempts, please try again later'
});

app.post('/api/v3/reputation/check-in', checkInLimiter, ...);
```

### 3. CORS Configuration

```typescript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
}));
```

### 4. Input Validation

```typescript
// All endpoints perform:
- Parameter existence check
- Format validation (email, UUID)
- Length limits
- Special character filtering
```

---

## 📊 Monitoring & Analytics

### Key Metrics to Track

```
1. Daily active users
2. Check-in success rate
3. Average score progression
4. Level distribution
5. API response times
6. Error rates
7. Database query performance
```

### Example Monitoring Query

```bash
# Count users by level
db.ReputationScores.aggregate([
  {
    $group: {
      _id: "$reputationLevel",
      count: { $sum: 1 }
    }
  },
  { $sort: { _id: 1 } }
])

# Top 10 users
db.ReputationScores.find()
  .sort({ totalReputationScore: -1 })
  .limit(10)
  .toArray()
```

---

## 🐛 Troubleshooting

### Issue: MongoDB Connection Failed

```
Error: MongoServerError: connection refused
```

**Solution**:
```bash
# Check MongoDB is running
mongosh --version

# Start MongoDB
mongod --dbpath /path/to/data

# Or use MongoDB Atlas
MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/reputa-v3"
```

### Issue: API Returns 404

```
Cannot GET /api/v3/reputation
```

**Solution**:
1. Verify routes are imported
2. Check port is correct
3. Ensure server is running

```bash
# Test endpoint
curl http://localhost:3000/health
```

### Issue: User Not Found

```
"error": "User not found"
```

**Solution**:
- Call GET endpoint first to auto-create user
- Verify pioneerId, username, email are correct

```bash
# This auto-creates user
curl 'http://localhost:3000/api/v3/reputation?pioneerId=xxx&username=xxx&email=xxx'
```

### Issue: Cache Stale Data

**Solution**: Cache auto-refreshes every 5 minutes, or manually:
```bash
# Clear Redis cache
redis-cli DEL "reputa:score:user123"
```

---

## 🎓 Learning Resources

1. **Protocol Details**: `PROTOCOL_V3_IMPLEMENTATION.md`
2. **User Guide**: `README_PROTOCOL_V3.md`
3. **Complete Info**: `REPUTA_V3_COMPLETE.md`
4. **Code Examples**: See `api/v3ReputationRoutes.ts`

---

## ✅ Final Checklist

Before going live:

- [ ] All tests passing (`bash test-reputa-v3.sh`)
- [ ] Database backup created
- [ ] Monitoring set up
- [ ] Error logging configured
- [ ] Rate limiting tested
- [ ] CORS configured correctly
- [ ] Environment variables set
- [ ] Documentation updated
- [ ] Team trained on new system
- [ ] Rollback plan documented

---

**🎉 You're ready to deploy Reputa Protocol v3.0!**

---

**Support**: Check documentation files or review code comments
**Version**: 3.0.0
**Last Updated**: 2026-02-08
