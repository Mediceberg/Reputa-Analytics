/**
 * Reputation Service v3.0
 * Core business logic for all reputation calculations
 * Uses MongoDB as primary source, Redis only for caching
 */

import {
  getReputationScoresCollection,
  getPointsLogCollection,
  getDailyCheckinCollection,
  getUsersCollection,
  ReputationScoreDocument,
  PointsLogDocument,
  DailyCheckinDocument,
} from '../db/mongoModels';

import protocol from '../config/reputaProtocol';

// ====================
// CACHE WITH REDIS
// ====================

let redisClient: any = null;

async function getRedisClient() {
  if (!redisClient) {
    try {
      const { Redis } = await import('@upstash/redis');
      redisClient = new Redis({
        url: process.env.KV_REST_API_URL || '',
        token: process.env.KV_REST_API_TOKEN || '',
      });
    } catch (e) {
      console.warn('Redis not available - running without cache');
      redisClient = null;
    }
  }
  return redisClient;
}

async function getCachedReputation(pioneerId: string) {
  try {
    const redis = await getRedisClient();
    if (!redis) return null;
    const cached = await redis.get(`reputa:score:${pioneerId}`);
    return cached ? JSON.parse(cached as string) : null;
  } catch (e) {
    console.warn('Redis get error:', e);
    return null;
  }
}

async function setCachedReputation(pioneerId: string, data: any, ttlSeconds = 300) {
  try {
    const redis = await getRedisClient();
    if (!redis) return;
    await redis.set(`reputa:score:${pioneerId}`, JSON.stringify(data), { ex: ttlSeconds });
  } catch (e) {
    console.warn('Redis set error:', e);
  }
}

async function clearReputationCache(pioneerId: string) {
  try {
    const redis = await getRedisClient();
    if (!redis) return;
    await redis.del(`reputa:score:${pioneerId}`);
  } catch (e) {
    console.warn('Redis delete error:', e);
  }
}

// ====================
// USER MANAGEMENT
// ====================

export async function getOrCreateUser(pioneerId: string, username: string, email: string) {
  const usersCollection = await getUsersCollection();
  
  let user = await usersCollection.findOne({ pioneerId });
  
  if (!user) {
    const referralCode = generateReferralCode();
    const now = new Date();
    
    user = {
      pioneerId,
      username,
      email,
      protocolVersion: protocol.PROTOCOL_VERSION,
      createdAt: now,
      updatedAt: now,
      lastActiveAt: now,
      referralCode,
      referralCount: 0,
    };
    
    await usersCollection.insertOne(user as any);
    console.log(`✅ Created new user: ${pioneerId}`);
    
    // Initialize reputation scores for new user
    await initializeReputationScores(pioneerId);
  }
  
  return user;
}

export async function updateUserLastActive(pioneerId: string) {
  const usersCollection = await getUsersCollection();
  await usersCollection.updateOne(
    { pioneerId },
    { $set: { lastActiveAt: new Date() } }
  );
}

// ====================
// REPUTATION SCORES
// ====================

/**
 * Initialize reputation scores for a new user
 */
async function initializeReputationScores(pioneerId: string) {
  const reputationCollection = await getReputationScoresCollection();
  
  const now = new Date();
  const initialData: ReputationScoreDocument = {
    pioneerId,
    protocolVersion: protocol.PROTOCOL_VERSION,
    totalReputationScore: 0,
    reputationLevel: 1,
    walletMainnetScore: 0,
    walletTestnetScore: 0,
    appEngagementScore: 0,
    checkInScore: 0,
    adBonusScore: 0,
    taskCompletionScore: 0,
    referralScore: 0,
    lastActivityDate: now,
    currentStreak: 0,
    longestStreak: 0,
    lastErosionDate: now,
    createdAt: now,
    updatedAt: now,
    updateReason: 'Initial creation',
  };
  
  try {
    await reputationCollection.insertOne(initialData as any);
    console.log(`✅ Initialized reputation for user: ${pioneerId}`);
  } catch (error: any) {
    if (error.code !== 11000) { // 11000 = duplicate key
      throw error;
    }
  }
}

/**
 * Get reputation scores for a user (with cache)
 */
export async function getReputationScores(pioneerId: string): Promise<ReputationScoreDocument | null> {
  // Try cache first
  const cached = await getCachedReputation(pioneerId);
  if (cached) {
    console.log(`📦 Cache HIT for ${pioneerId}`);
    return cached;
  }
  
  // Get from MongoDB
  const reputationCollection = await getReputationScoresCollection();
  const data = await reputationCollection.findOne<ReputationScoreDocument>({ pioneerId });
  
  if (data) {
    // Cache for 5 minutes
    await setCachedReputation(pioneerId, data, 300);
  }
  
  return data;
}

/**
 * Record a daily check-in
 */
export async function recordDailyCheckin(pioneerId: string): Promise<{
  success: boolean;
  points: number;
  level: number;
  streak: number;
  message: string;
}> {
  const today = new Date().toISOString().split('T')[0];
  
  // Get current reputation
  let repData = await getReputationScores(pioneerId);
  if (!repData) {
    return {
      success: false,
      points: 0,
      level: 0,
      streak: 0,
      message: 'User not found'
    };
  }
  
  // Check if already checked in today
  if (repData.lastCheckInDate === today) {
    return {
      success: false,
      points: 0,
      level: repData.reputationLevel,
      streak: repData.currentStreak,
      message: 'Already checked in today'
    };
  }
  
  // Calculate new streak
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  const isConsecutive = repData.lastCheckInDate === yesterdayStr;
  const newStreak = isConsecutive ? repData.currentStreak + 1 : 1;
  
  // Calculate points based on streak
  const pointsEarned = protocol.getCheckInBonus(newStreak);
  
  // Update reputation data
  repData.checkInScore += pointsEarned;
  repData.appEngagementScore += pointsEarned;
  
  // Recalculate total (80% wallet + 20% app engagement)
  const walletScore = protocol.calculateWalletComponent(
    repData.walletMainnetScore,
    repData.walletTestnetScore
  );
  repData.totalReputationScore = protocol.calculateTotalScore(
    repData.walletMainnetScore,
    repData.walletTestnetScore,
    repData.appEngagementScore
  );
  
  repData.reputationLevel = protocol.calculateLevelFromPoints(repData.totalReputationScore);
  repData.currentStreak = newStreak;
  repData.longestStreak = Math.max(repData.longestStreak, newStreak);
  repData.lastCheckInDate = today;
  repData.lastActivityDate = new Date();
  repData.updatedAt = new Date();
  repData.updateReason = `Daily check-in (Day ${newStreak})`;
  
  // Save to MongoDB
  const reputationCollection = await getReputationScoresCollection();
  await reputationCollection.updateOne(
    { pioneerId },
    { $set: repData }
  );
  
  // Log the event
  await logPointsEvent(pioneerId, 'check_in', pointsEarned, `Daily check-in (Day ${newStreak})`);
  
  // Record daily check-in
  const checkinCollection = await getDailyCheckinCollection();
  const checkinRecord: DailyCheckinDocument = {
    pioneerId,
    date: today,
    timestamp: new Date(),
    points: pointsEarned,
    streak: newStreak,
    adBonusCount: 0,
    adBonusPoints: 0,
  };
  
  try {
    await checkinCollection.insertOne(checkinRecord as any);
  } catch (error: any) {
    if (error.code !== 11000) {
      throw error;
    }
  }
  
  // Clear cache
  await clearReputationCache(pioneerId);
  
  // Update user last active
  await updateUserLastActive(pioneerId);
  
  console.log(`✅ Check-in recorded: ${pioneerId}, +${pointsEarned}pts, Level ${repData.reputationLevel}, Streak ${newStreak}`);
  
  return {
    success: true,
    points: pointsEarned,
    level: repData.reputationLevel,
    streak: newStreak,
    message: `Check-in successful! +${pointsEarned} points`
  };
}

/**
 * Add ad bonus points
 */
export async function addAdBonus(pioneerId: string, points: number = protocol.SCORING_RULES.AD_BONUS.basePoints): Promise<{
  success: boolean;
  newTotal: number;
  level: number;
  message: string;
}> {
  let repData = await getReputationScores(pioneerId);
  if (!repData) {
    return {
      success: false,
      newTotal: 0,
      level: 0,
      message: 'User not found'
    };
  }
  
  // Cap points (20% app component can't exceed max derived from total)
  const cappedPoints = Math.min(points, protocol.SCORING_RULES.AD_BONUS.dailyCap);
  
  repData.adBonusScore += cappedPoints;
  repData.appEngagementScore += cappedPoints;
  repData.totalReputationScore = protocol.calculateTotalScore(
    repData.walletMainnetScore,
    repData.walletTestnetScore,
    repData.appEngagementScore
  );
  repData.reputationLevel = protocol.calculateLevelFromPoints(repData.totalReputationScore);
  repData.lastActivityDate = new Date();
  repData.updatedAt = new Date();
  
  const reputationCollection = await getReputationScoresCollection();
  await reputationCollection.updateOne(
    { pioneerId },
    { $set: repData }
  );
  
  await logPointsEvent(pioneerId, 'ad_bonus', cappedPoints, 'Ad bonus');
  await clearReputationCache(pioneerId);
  await updateUserLastActive(pioneerId);
  
  console.log(`✅ Ad bonus added: ${pioneerId}, +${cappedPoints}pts`);
  
  return {
    success: true,
    newTotal: repData.totalReputationScore,
    level: repData.reputationLevel,
    message: `+${cappedPoints} points from ad`
  };
}

/**
 * Recalculate reputation for all users (for protocol updates)
 * This is called when protocol rules change
 */
export async function recalculateAllReputations(reason: string = 'Protocol update') {
  const reputationCollection = await getReputationScoresCollection();
  const allUsers = await reputationCollection.find<ReputationScoreDocument>({}).toArray();
  
  console.log(`🔄 Recalculating reputation for ${allUsers.length} users...`);
  
  let updated = 0;
  for (const user of allUsers) {
    const userData = user as unknown as ReputationScoreDocument;
    
    // Recalculate using current protocol
    const newTotal = protocol.calculateTotalScore(
      userData.walletMainnetScore,
      userData.walletTestnetScore,
      userData.appEngagementScore
    );
    
    const newLevel = protocol.calculateLevelFromPoints(newTotal);
    
    // Update if changed
    if (newTotal !== userData.totalReputationScore || newLevel !== userData.reputationLevel) {
      await reputationCollection.updateOne(
        { pioneerId: userData.pioneerId },
        {
          $set: {
            totalReputationScore: newTotal,
            reputationLevel: newLevel,
            protocolVersion: protocol.PROTOCOL_VERSION,
            updatedAt: new Date(),
            updateReason: reason
          }
        }
      );
      
      await logPointsEvent(
        userData.pioneerId,
        'manual_adjustment',
        newTotal - userData.totalReputationScore,
        reason
      );
      
      updated++;
    }
    
    // Clear cache
    await clearReputationCache(userData.pioneerId);
  }
  
  console.log(`✅ Recalculated ${updated}/${allUsers.length} users`);
  return { total: allUsers.length, updated };
}

/**
 * Log a points event to the audit trail
 */
export async function logPointsEvent(
  pioneerId: string,
  type: PointsLogDocument['type'],
  points: number,
  description: string,
  details?: Record<string, any>
) {
  const pointsLogCollection = await getPointsLogCollection();
  
  const event: PointsLogDocument = {
    pioneerId,
    type,
    points,
    timestamp: new Date(),
    description,
    details,
    source: 'API'
  };
  
  try {
    await pointsLogCollection.insertOne(event as any);
  } catch (e) {
    console.error('Error logging points event:', e);
  }
}

/**
 * Get points history for a user
 */
export async function getPointsHistory(pioneerId: string, limit: number = 100) {
  const pointsLogCollection = await getPointsLogCollection();
  
  const history = await pointsLogCollection
    .find<PointsLogDocument>({ pioneerId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray();
  
  return history;
}

/**
 * Get check-in history
 */
export async function getCheckinHistory(pioneerId: string, days: number = 30) {
  const checkinCollection = await getDailyCheckinCollection();
  
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - days);
  
  const history = await checkinCollection
    .find<DailyCheckinDocument>({
      pioneerId,
      timestamp: { $gte: daysAgo }
    })
    .sort({ timestamp: -1 })
    .toArray();
  
  return history;
}

// ====================
// UTILITIES
// ====================

function generateReferralCode(): string {
  return 'REF' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 5).toUpperCase();
}

// ====================
// EXPORTS
// ====================

export default {
  getOrCreateUser,
  updateUserLastActive,
  getReputationScores,
  recordDailyCheckin,
  addAdBonus,
  recalculateAllReputations,
  logPointsEvent,
  getPointsHistory,
  getCheckinHistory,
};
