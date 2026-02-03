/**
 * Unified Reputation API Routes
 * Integrates all reputation calculations with MongoDB
 */

import { Router } from 'express';
// import { MongoClient, Db, Collection } from 'mongodb';

const router = Router();

// MongoDB connection - from environment
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/reputa';
const DB_NAME = process.env.MONGODB_DB_NAME || 'reputa-analytics';

let cachedDb: any = null;

async function getDatabase(): Promise<any> {
  if (cachedDb) return cachedDb;

  try {
    // dynamic import so TypeScript/runtime don't fail when mongodb isn't available
    const { MongoClient: MongoClientRef } = await import('mongodb');
    const client = new (MongoClientRef as any)(MONGODB_URI);
    await client.connect();
    cachedDb = client.db(DB_NAME);
    console.log('✅ Connected to MongoDB for Unified Reputation API');
    return cachedDb;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    throw error;
  }
}

/**
 * Initialize user reputation record
 */
router.post('/reputation/init', async (req, res) => {
  try {
    const { pioneerId, walletAddress, username } = req.body;

    if (!pioneerId || !walletAddress || !username) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const db = await getDatabase();
    const usersCollection = db.collection('Users');

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ pioneerId });
    if (existingUser) {
      return res.status(200).json(existingUser);
    }

    // Create new user record
    const newUser = {
      pioneerId,
      walletAddress,
      username,
      totalPoints: 0,
      reputationScore: 0,
      mainnetScore: 0,
      testnetScore: 0,
      appPoints: 0,
      level: 'Bronze',
      level_numeric: 1,
      trustRank: 'Newcomer',
      lastUpdated: new Date(),
      isVIP: false,
      dailyCheckinStreak: 0,
      referralCount: 0,
      completedTasks: 0,
      pointsBreakdown: {
        walletAgePoints: 0,
        transactionQualityPoints: 0,
        stakingPoints: 0,
        tokenHoldingPoints: 0,
        activityPoints: 0,
        dexActivityPoints: 0,
        offChainPenalty: 0,
        dailyLoginPoints: 0,
        referralPoints: 0,
        taskPoints: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await usersCollection.insertOne(newUser);
    res.status(201).json({ ...newUser, _id: result.insertedId });
  } catch (error: any) {
    console.error('❌ Error initializing user reputation:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get user reputation
 */
router.get('/reputation/:pioneerId', async (req, res) => {
  try {
    const { pioneerId } = req.params;
    const db = await getDatabase();
    const usersCollection = db.collection('Users');

    const user = await usersCollection.findOne({ pioneerId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error: any) {
    console.error('❌ Error fetching user reputation:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Sync user reputation from wallet data
 */
router.post('/reputation/sync', async (req, res) => {
  try {
    const { pioneerId, walletData } = req.body;

    if (!pioneerId || !walletData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const db = await getDatabase();
    const usersCollection = db.collection('Users');
    const pointsLogCollection = db.collection('Points_Log');

    // Calculate reputation score
    const mainnetScore = calculateMainnetScore(walletData);
    const testnetScore = calculateTestnetScore(walletData);
    const appPoints = calculateAppPoints(walletData);

    const totalReputationScore = Math.min(
      100000,
      Math.round((mainnetScore * 0.6) + (testnetScore * 0.2) + (appPoints * 0.2))
    );

    const level = calculateLevel(totalReputationScore);
    const level_numeric = calculateLevelNumeric(totalReputationScore);
    const pointsToNextLevel = calculatePointsToNextLevel(totalReputationScore);

    // Update user record
    const updateData = {
      mainnetScore,
      testnetScore,
      appPoints,
      totalPoints: mainnetScore + testnetScore + appPoints,
      reputationScore: totalReputationScore,
      level,
      level_numeric,
      trustRank: getTrustRank(level),
      lastUpdated: new Date(),
      pointsBreakdown: walletData.pointsBreakdown || {},
      nextLevelThreshold: getNextLevelThreshold(totalReputationScore),
      pointsToNextLevel
    };

    const result = await usersCollection.findOneAndUpdate(
      { pioneerId },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    // Log the sync event
    await pointsLogCollection.insertOne({
      pioneerId,
      action: 'sync',
      timestamp: new Date(),
      points: totalReputationScore,
      details: updateData
    });

    res.json(result.value);
  } catch (error: any) {
    console.error('❌ Error syncing user reputation:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Record daily check-in
 */
router.post('/reputation/daily-checkin', async (req, res) => {
  try {
    const { pioneerId } = req.body;

    if (!pioneerId) {
      return res.status(400).json({ error: 'Missing pioneerId' });
    }

    const db = await getDatabase();
    const usersCollection = db.collection('Users');
    const dailyCheckinCollection = db.collection('Daily_Checkin');

    // Check if user already checked in today
    const today = new Date().toISOString().split('T')[0];
    const existingCheckin = await dailyCheckinCollection.findOne({
      pioneerId,
      date: today
    });

    if (existingCheckin) {
      return res.status(400).json({ error: 'Already checked in today' });
    }

    // Add check-in points
    const points = 30; // Base points
    const user = await usersCollection.findOne({ pioneerId });
    const currentStreak = user?.dailyCheckinStreak || 0;
    const newStreak = currentStreak + 1;

    // Record check-in
    await dailyCheckinCollection.insertOne({
      pioneerId,
      date: today,
      checkedIn: true,
      earnedPoints: points,
      streak: newStreak,
      timestamp: new Date()
    });

    // Update user
    const result = await usersCollection.findOneAndUpdate(
      { pioneerId },
      {
        $inc: { appPoints: points },
        $set: {
          dailyCheckinStreak: newStreak,
          lastUpdated: new Date()
        }
      },
      { returnDocument: 'after' }
    );

    res.json({
      earnedPoints: points,
      newStreak,
      user: result.value
    });
  } catch (error: any) {
    console.error('❌ Error recording check-in:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Add referral
 */
router.post('/reputation/referral', async (req, res) => {
  try {
    const { pioneerId, referredPioneerId } = req.body;

    if (!pioneerId || !referredPioneerId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const db = await getDatabase();
    const usersCollection = db.collection('Users');
    const referralsCollection = db.collection('Referrals');

    // Check if referral already exists
    const existing = await referralsCollection.findOne({
      referrerId: pioneerId,
      referredId: referredPioneerId
    });

    if (existing) {
      return res.status(400).json({ error: 'Referral already recorded' });
    }

    // Add referral
    const points = 100; // Referral points
    await referralsCollection.insertOne({
      referrerId: pioneerId,
      referredId: referredPioneerId,
      confirmed: false,
      earnedPoints: points,
      createdAt: new Date()
    });

    // Update user
    const result = await usersCollection.findOneAndUpdate(
      { pioneerId },
      {
        $inc: { 
          referralCount: 1,
          appPoints: points
        },
        $set: { lastUpdated: new Date() }
      },
      { returnDocument: 'after' }
    );

    res.json(result.value);
  } catch (error: any) {
    console.error('❌ Error adding referral:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Record task completion
 */
router.post('/reputation/task-complete', async (req, res) => {
  try {
    const { pioneerId, taskId, points } = req.body;

    if (!pioneerId || !taskId || !points) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const db = await getDatabase();
    const usersCollection = db.collection('Users');
    const pointsLogCollection = db.collection('Points_Log');

    // Record task completion
    await pointsLogCollection.insertOne({
      pioneerId,
      action: 'task',
      taskId,
      points,
      timestamp: new Date()
    });

    // Update user
    const result = await usersCollection.findOneAndUpdate(
      { pioneerId },
      {
        $inc: { 
          appPoints: points,
          completedTasks: 1
        },
        $set: { lastUpdated: new Date() }
      },
      { returnDocument: 'after' }
    );

    res.json(result.value);
  } catch (error: any) {
    console.error('❌ Error recording task completion:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get leaderboard
 */
router.get('/reputation/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const network = req.query.network as string || 'all';

    const db = await getDatabase();
    const usersCollection = db.collection('Users');

    const query = network === 'all' ? {} : { network };

    const users = await usersCollection
      .find(query)
      .sort({ reputationScore: -1 })
      .limit(limit)
      .toArray();

    res.json(users);
  } catch (error: any) {
    console.error('❌ Error fetching leaderboard:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ Helper Functions ============

function calculateMainnetScore(walletData: any): number {
  const scores = {
    walletAge: Math.min(20000, (walletData.walletAge || 0) * 50),
    transactions: Math.min(40000, (walletData.totalTransactions || 0) * 100),
    staking: Math.min(30000, (walletData.stakeAmount || 0) * 100),
    tokens: Math.min(10000, (walletData.tokenCount || 0) * 1000),
    activity: Math.min(10000, (walletData.activity3Months || 0) * 100),
    dex: Math.min(10000, Math.floor((walletData.dexVolume || 0) / 10) * 1000),
  };

  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  return Math.min(80000, total);
}

function calculateTestnetScore(walletData: any): number {
  // Same calculation but for testnet data
  return Math.min(20000, (walletData.testnetActivity || 0) * 100);
}

function calculateAppPoints(walletData: any): number {
  const points = (walletData.appPoints || 0);
  return Math.min(20000, points);
}

function calculateLevel(score: number): 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' {
  if (score >= 90000) return 'Diamond';
  if (score >= 70000) return 'Platinum';
  if (score >= 50000) return 'Gold';
  if (score >= 30000) return 'Silver';
  return 'Bronze';
}

function calculateLevelNumeric(score: number): number {
  if (score >= 90000) return 6;
  if (score >= 70000) return 5;
  if (score >= 50000) return 4;
  if (score >= 30000) return 3;
  if (score >= 10000) return 2;
  return 1;
}

function calculatePointsToNextLevel(score: number): number {
  const thresholds: Record<number, number> = {
    30000: 30000,
    50000: 50000,
    70000: 70000,
    90000: 90000,
    100000: 100000
  };

  for (const [threshold, points] of Object.entries(thresholds)) {
    if (score < parseInt(threshold)) {
      return parseInt(threshold) - score;
    }
  }

  return 0;
}

function getTrustRank(level: string): string {
  const ranks: Record<string, string> = {
    'Bronze': 'Newcomer',
    'Silver': 'Explorer',
    'Gold': 'Builder',
    'Platinum': 'Advocate',
    'Diamond': 'Pioneer'
  };
  return ranks[level] || 'Unknown';
}

function getNextLevelThreshold(score: number): number {
  if (score < 30000) return 30000;
  if (score < 50000) return 50000;
  if (score < 70000) return 70000;
  if (score < 90000) return 90000;
  return 100000;
}

export default router;
