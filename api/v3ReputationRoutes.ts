/**
 * Reputation API Routes v3.0
 * Unified endpoints for all reputation operations
 * Uses MongoDB as primary source (with Redis caching)
 */

import { Router, Request, Response } from 'express';
import * as reputationService from '../services/reputationService';
import protocol from '../config/reputaProtocol';
import { getReputationScoresCollection } from '../db/mongoModels';

const router = Router();

// ====================
// MIDDLEWARE
// ====================

async function ensureUser(req: Request, res: Response, next: Function) {
  const { pioneerId, username, email } = req.query;
  
  if (!pioneerId || !username || !email) {
    return res.status(400).json({
      success: false,
      error: 'Missing required: pioneerId, username, email'
    });
  }
  
  try {
    await reputationService.getOrCreateUser(
      pioneerId as string,
      username as string,
      email as string
    );
    req.pioneerId = pioneerId as string;
    next();
  } catch (error) {
    res.status(500).json({ success: false, error: 'User initialization failed' });
  }
}

declare global {
  namespace Express {
    interface Request {
      pioneerId?: string;
    }
  }
}

// ====================
// GET REPUTATION
// ====================

/**
 * GET /api/v3/reputation
 * Get current reputation score and level
 */
router.get('/v3/reputation', ensureUser, async (req: Request, res: Response) => {
  try {
    const pioneerId = req.pioneerId!;
    const repData = await reputationService.getReputationScores(pioneerId);
    
    if (!repData) {
      return res.status(404).json({ success: false, error: 'Reputation data not found' });
    }
    
    const progress = protocol.getLevelProgress(repData.totalReputationScore);
    
    return res.json({
      success: true,
      data: {
        pioneerId,
        totalReputationScore: repData.totalReputationScore,
        reputationLevel: repData.reputationLevel,
        levelName: protocol.LEVEL_NAMES[repData.reputationLevel],
        progress: {
          currentLevel: progress.currentLevel,
          nextLevel: progress.nextLevel,
          currentLevelMin: progress.currentLevelMin,
          currentLevelMax: progress.currentLevelMax,
          pointsInLevel: progress.pointsInLevel,
          pointsNeededForNext: progress.pointsNeededForNext,
          percentProgress: progress.percentProgress.toFixed(2)
        },
        
        // Component breakdown
        components: {
          wallet: {
            mainnet: repData.walletMainnetScore,
            testnet: repData.walletTestnetScore,
            combined: protocol.calculateWalletComponent(
              repData.walletMainnetScore,
              repData.walletTestnetScore
            ),
            weight: '80%'
          },
          appEngagement: {
            total: repData.appEngagementScore,
            checkIn: repData.checkInScore,
            adBonus: repData.adBonusScore,
            taskCompletion: repData.taskCompletionScore,
            referral: repData.referralScore,
            weight: '20%'
          }
        },
        
        // Activity
        activity: {
          currentStreak: repData.currentStreak,
          longestStreak: repData.longestStreak,
          lastCheckInDate: repData.lastCheckInDate,
          lastActivityDate: repData.lastActivityDate
        },
        
        metadata: {
          protocolVersion: repData.protocolVersion,
          createdAt: repData.createdAt,
          updatedAt: repData.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Error getting reputation:', error);
    res.status(500).json({ success: false, error: 'Failed to get reputation' });
  }
});

// ====================
// DAILY CHECK-IN
// ====================

/**
 * POST /api/v3/reputation/check-in
 * Record a daily check-in
 */
router.post('/v3/reputation/check-in', ensureUser, async (req: Request, res: Response) => {
  try {
    const pioneerId = req.pioneerId!;
    const result = await reputationService.recordDailyCheckin(pioneerId);
    
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.message });
    }
    
    const repData = await reputationService.getReputationScores(pioneerId);
    
    return res.json({
      success: true,
      message: result.message,
      data: {
        pointsEarned: result.points,
        newTotal: repData?.totalReputationScore,
        newLevel: result.level,
        streak: result.streak,
        levelName: protocol.LEVEL_NAMES[result.level]
      }
    });
  } catch (error) {
    console.error('Error recording check-in:', error);
    res.status(500).json({ success: false, error: 'Failed to record check-in' });
  }
});

/**
 * GET /api/v3/reputation/can-check-in
 * Check if user can perform check-in today
 */
router.get('/v3/reputation/can-check-in', ensureUser, async (req: Request, res: Response) => {
  try {
    const pioneerId = req.pioneerId!;
    const repData = await reputationService.getReputationScores(pioneerId);
    
    if (!repData) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    const today = new Date().toISOString().split('T')[0];
    const canCheckIn = !repData.lastCheckInDate || repData.lastCheckInDate !== today;
    
    return res.json({
      success: true,
      data: {
        canCheckIn,
        lastCheckInDate: repData.lastCheckInDate,
        currentStreak: repData.currentStreak,
        message: canCheckIn ? 'You can check in now' : 'Already checked in today'
      }
    });
  } catch (error) {
    console.error('Error checking check-in status:', error);
    res.status(500).json({ success: false, error: 'Failed to check status' });
  }
});

// ====================
// AD BONUS
// ====================

/**
 * POST /api/v3/reputation/ad-bonus
 * Record ad bonus completion
 */
router.post('/v3/reputation/ad-bonus', ensureUser, async (req: Request, res: Response) => {
  try {
    const pioneerId = req.pioneerId!;
    const { points } = req.body;
    
    const adPoints = points || protocol.SCORING_RULES.AD_BONUS.basePoints;
    const result = await reputationService.addAdBonus(pioneerId, adPoints);
    
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.message });
    }
    
    return res.json({
      success: true,
      message: result.message,
      data: {
        pointsAdded: adPoints,
        newTotal: result.newTotal,
        newLevel: result.level,
        levelName: protocol.LEVEL_NAMES[result.level]
      }
    });
  } catch (error) {
    console.error('Error adding ad bonus:', error);
    res.status(500).json({ success: false, error: 'Failed to add ad bonus' });
  }
});

// ====================
// HISTORY
// ====================

/**
 * GET /api/v3/reputation/history
 * Get points history
 */
router.get('/v3/reputation/history', ensureUser, async (req: Request, res: Response) => {
  try {
    const pioneerId = req.pioneerId!;
    const { limit } = req.query;
    
    const history = await reputationService.getPointsHistory(pioneerId, parseInt(limit as string) || 100);
    
    return res.json({
      success: true,
      data: {
        count: history.length,
        events: history
      }
    });
  } catch (error) {
    console.error('Error getting history:', error);
    res.status(500).json({ success: false, error: 'Failed to get history' });
  }
});

/**
 * GET /api/v3/reputation/check-in-history
 * Get check-in history
 */
router.get('/v3/reputation/check-in-history', ensureUser, async (req: Request, res: Response) => {
  try {
    const pioneerId = req.pioneerId!;
    const { days } = req.query;
    
    const history = await reputationService.getCheckinHistory(pioneerId, parseInt(days as string) || 30);
    
    return res.json({
      success: true,
      data: {
        count: history.length,
        checkIns: history
      }
    });
  } catch (error) {
    console.error('Error getting check-in history:', error);
    res.status(500).json({ success: false, error: 'Failed to get check-in history' });
  }
});

// ====================
// LEADERBOARD
// ====================

/**
 * GET /api/v3/reputation/leaderboard
 * Get top users by reputation
 */
router.get('/v3/reputation/leaderboard', async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const pageSize = Math.min(parseInt(limit as string) || 100, 1000);
    
    const reputationCollection = await getReputationScoresCollection();
    const topUsers = await reputationCollection
      .find({})
      .sort({ totalReputationScore: -1 })
      .limit(pageSize)
      .toArray();
    
    return res.json({
      success: true,
      data: {
        count: topUsers.length,
        leaderboard: topUsers.map((user: any, index: number) => ({
          rank: index + 1,
          pioneerId: user.pioneerId,
          score: user.totalReputationScore,
          level: user.reputationLevel,
          levelName: protocol.LEVEL_NAMES[user.reputationLevel]
        }))
      }
    });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({ success: false, error: 'Failed to get leaderboard' });
  }
});

// ====================
// PROTOCOL INFO
// ====================

/**
 * GET /api/v3/reputation/protocol
 * Get protocol configuration
 */
router.get('/v3/reputation/protocol', (req: Request, res: Response) => {
  const summary = protocol.getProtocolSummary();
  
  return res.json({
    success: true,
    data: summary
  });
});

// ====================
// ADMIN: RECALCULATE
// ====================

/**
 * POST /api/v3/reputation/admin/recalculate
 * Recalculate all users (admin only)
 */
router.post('/v3/reputation/admin/recalculate', async (req: Request, res: Response) => {
  // TODO: Add authentication middleware here
  
  try {
    const { reason } = req.body;
    const result = await reputationService.recalculateAllReputations(reason || 'Admin recalculation');
    
    return res.json({
      success: true,
      message: `Recalculated ${result.updated}/${result.total} users`,
      data: result
    });
  } catch (error) {
    console.error('Error recalculating:', error);
    res.status(500).json({ success: false, error: 'Failed to recalculate' });
  }
});

// ====================
// HEALTH CHECK
// ====================

/**
 * GET /api/v3/reputation/health
 * Health check endpoint
 */
router.get('/v3/reputation/health', (req: Request, res: Response) => {
  return res.json({
    success: true,
    status: 'Reputation API v3.0 is operational',
    protocol: {
      version: protocol.PROTOCOL_VERSION,
      maxLevel: protocol.PROTOCOL_MAX_LEVEL,
      maxPoints: protocol.PROTOCOL_MAX_POINTS
    }
  });
});

export default router;
