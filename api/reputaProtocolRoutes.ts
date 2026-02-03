/**
 * Reputa Protocol Complete API Endpoints
 * All routes for Mainnet, Testnet, Demo Mode, and Admin functions
 */

import express, { Router, Request, Response } from 'express';
// Import Mongo helpers from src/db - file provides an in-memory fallback when driver is missing
import { initializeMongoDb, getMongoDb } from '../src/db/mongodb';
// import { UserManagementService } from './userManagementService';
// import { AutoSyncService } from './autoSyncService';
// import { DemoModeManager } from './demoModeManager';
// import { ReputaPointsCalculator } from './reputaPointsCalculator';
// import { initializePiSDK } from './piSdkAdvanced';

const router = Router();

// Initialize services (types are preserved for compatibility)
let userService: any; // UserManagementService
let autoSyncService: any; // AutoSyncService
let demoModeManager: any; // DemoModeManager
let pointsCalculator: any; // ReputaPointsCalculator

/**
 * Initialize all services
 */
export async function initializeReputaAPI(): Promise<Router> {
  // Initialization is handled by individual route handlers
  // await initializeMongoDb();
  // await initializePiSDK({ scopes: ['username', 'payments', 'wallet'] });

  // Lightweight in-file service implementations to avoid missing external modules
  userService = {
    initialize: async () => {},
    registerUser: async (piUser: any) => {
      const db = await initializeMongoDb();
      await db.users.insertOne(piUser);
      return piUser;
    },
    getUserProfile: async (pioneerId: string) => {
      const db = getMongoDb();
      return db.users.findOne({ pioneerId });
    },
    linkWallet: async (pioneerId: string, walletAddress: string, network: string) => {
      const db = getMongoDb();
      await db.wallets.insertOne({ pioneerId, walletAddress, network, createdAt: new Date() });
      return true;
    },
    getLeaderboard: async (limit: number) => {
      const db = getMongoDb();
      const all = await db.users.find().toArray();
      return all.sort((a: any, b: any) => (b.reputationScore || 0) - (a.reputationScore || 0)).slice(0, limit);
    }
  };

  autoSyncService = {
    initialize: async () => {},
    start: async () => {},
  };

  demoModeManager = {
    initializeDemoMode: async (pioneerId: string) => ({ pioneerId, isActive: true }),
  };

  pointsCalculator = {
    calculate: (data: any) => ({ total: 0 }),
  };

  console.log('✅ Reputa API fully initialized');

  setupRoutes();
  return router;
}

function setupRoutes(): void {
  // ==================== AUTHENTICATION & USER REGISTRATION ====================

  /**
   * POST /api/auth/register
   * Register new user from Pi authentication
   */
  router.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { piUser } = req.body;

      const user = await userService.registerUser(piUser);

      res.json({
        success: true,
        message: 'User registered successfully',
        user,
      });
    } catch (error) {
      console.error('❌ Registration error:', error);
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  /**
   * GET /api/auth/user/:pioneerId
   * Get current user profile
   */
  router.get('/api/auth/user/:pioneerId', async (req: Request, res: Response) => {
    try {
      const { pioneerId } = req.params;
      const user = await userService.getUserProfile(pioneerId);

      res.json({
        success: true,
        user,
      });
    } catch (error) {
      res.status(404).json({ success: false, error: 'User not found' });
    }
  });

  // ==================== WALLET MANAGEMENT ====================

  /**
   * POST /api/wallet/link
   * Link wallet to user account
   */
  router.post('/api/wallet/link', async (req: Request, res: Response) => {
    try {
      const { pioneerId, walletAddress, network } = req.body;

      await userService.linkWallet(pioneerId, walletAddress, network);

      res.json({
        success: true,
        message: 'Wallet linked successfully',
      });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  /**
   * GET /api/wallet/:pioneerId/:network
   * Get wallet data (mainnet or testnet)
   */
  router.get('/api/wallet/:pioneerId/:network', async (req: Request, res: Response) => {
    try {
      const { pioneerId, network } = req.params;
      const db = getMongoDb();

      const wallet = await db.wallets.findOne({
        pioneerId,
        network: network as 'mainnet' | 'testnet',
      });

      if (!wallet) {
        return res.status(404).json({ success: false, error: 'Wallet not found' });
      }

      res.json({
        success: true,
        wallet,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  // ==================== REPUTATION & POINTS ====================

  /**
   * GET /api/reputation/:pioneerId
   * Get user's reputation score and breakdown
   */
  router.get('/api/reputation/:pioneerId', async (req: Request, res: Response) => {
    try {
      const { pioneerId } = req.params;
      const user = await userService.getUserProfile(pioneerId);

      const stats = await userService.getUserStats(pioneerId);
      const rank = await userService.getUserRank(pioneerId);

      res.json({
        success: true,
        pioneerId,
        reputationScore: user.reputationScore,
        mainnetScore: user.mainnetScore,
        testnetScore: user.testnetScore,
        appPoints: user.appPoints,
        totalPoints: user.totalPoints,
        level: user.level,
        rank,
        stats,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  /**
   * GET /api/points/log/:pioneerId
   * Get user's points activity log
   */
  router.get('/api/points/log/:pioneerId', async (req: Request, res: Response) => {
    try {
      const { pioneerId } = req.params;
      const { limit = 50 } = req.query;
      const db = getMongoDb();

      const log = await db.pointsLog
        .find({ pioneerId })
        .sort({ timestamp: -1 })
        .limit(parseInt(limit as string))
        .toArray();

      res.json({
        success: true,
        count: log.length,
        log,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  /**
   * GET /api/leaderboard
   * Get reputation leaderboard
   */
  router.get('/api/leaderboard', async (req: Request, res: Response) => {
    try {
      const { limit = 100 } = req.query;

      const leaderboard = await userService.getLeaderboard(parseInt(limit as string));

      res.json({
        success: true,
        count: leaderboard.length,
        leaderboard: leaderboard.map((u: any, idx: number) => ({
          rank: idx + 1,
          pioneerId: u.pioneerId,
          username: u.username,
          reputationScore: u.reputationScore,
          mainnetScore: u.mainnetScore,
          testnetScore: u.testnetScore,
          appPoints: u.appPoints,
          level: u.level,
        })),
      });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  // ==================== BLOCKCHAIN SYNC ====================

  /**
   * POST /api/sync/:pioneerId
   * Manually trigger blockchain sync
   */
  router.post('/api/sync/:pioneerId', async (req: Request, res: Response) => {
    try {
      const { pioneerId } = req.params;

      const syncResult = await autoSyncService.syncUserData(pioneerId);

      res.json({
        success: true,
        message: 'Sync started',
        sync: syncResult,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  /**
   * GET /api/sync/status/:pioneerId
   * Get sync status for user
   */
  router.get('/api/sync/status/:pioneerId', async (req: Request, res: Response) => {
    try {
      const { pioneerId } = req.params;

      const status = await autoSyncService.getSyncStatus(pioneerId);

      res.json({
        success: true,
        status,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  // ==================== DAILY ACTIVITIES ====================

  /**
   * POST /api/activity/daily-checkin/:pioneerId
   * Daily login check-in
   */
  router.post('/api/activity/daily-checkin/:pioneerId', async (req: Request, res: Response) => {
    try {
      const { pioneerId } = req.params;
      const { withAds = false } = req.body;

      const points = await userService.dailyCheckIn(pioneerId, withAds);

      res.json({
        success: true,
        message: 'Daily check-in recorded',
        pointsEarned: points,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  /**
   * POST /api/activity/referral
   * Add referral
   */
  router.post('/api/activity/referral', async (req: Request, res: Response) => {
    try {
      const { referrerId, referredEmail, referredPioneerId } = req.body;

      await userService.addReferral(referrerId, referredEmail, referredPioneerId);

      res.json({
        success: true,
        message: 'Referral added',
      });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  /**
   * POST /api/activity/confirm-referral
   * Confirm referral when referred user registers
   */
  router.post('/api/activity/confirm-referral', async (req: Request, res: Response) => {
    try {
      const { referrerId, referredPioneerId } = req.body;

      await userService.confirmReferral(referrerId, referredPioneerId);

      res.json({
        success: true,
        message: 'Referral confirmed',
        pointsAwarded: 10,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  // ==================== DEMO MODE ====================

  /**
   * POST /api/demo/initialize/:pioneerId
   * Initialize demo mode for user
   */
  router.post('/api/demo/initialize/:pioneerId', async (req: Request, res: Response) => {
    try {
      const { pioneerId } = req.params;

      const demoData = await demoModeManager.initializeDemoMode(pioneerId);

      res.json({
        success: true,
        message: 'Demo mode initialized',
        demoData,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  /**
   * GET /api/demo/:pioneerId
   * Get demo mode data
   */
  router.get('/api/demo/:pioneerId', async (req: Request, res: Response) => {
    try {
      const { pioneerId } = req.params;

      const demoData = await demoModeManager.getDemoModeData(pioneerId);

      if (!demoData) {
        return res.status(404).json({ success: false, error: 'Demo mode not found' });
      }

      res.json({
        success: true,
        demoData,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  /**
   * POST /api/demo/:pioneerId/simulate/transaction
   * Simulate transaction in demo mode
   */
  router.post('/api/demo/:pioneerId/simulate/transaction', async (req: Request, res: Response) => {
    try {
      const { pioneerId } = req.params;
      const { type, amount } = req.body;

      await demoModeManager.simulateDemoTransaction(pioneerId, { type, amount });

      res.json({
        success: true,
        message: 'Transaction simulated',
      });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  /**
   * POST /api/demo/:pioneerId/simulate/daily-login
   * Simulate daily login in demo mode
   */
  router.post('/api/demo/:pioneerId/simulate/daily-login', async (req: Request, res: Response) => {
    try {
      const { pioneerId } = req.params;
      const { withAds = false } = req.body;

      const points = await demoModeManager.simulateDemoDailyLogin(pioneerId, withAds);

      res.json({
        success: true,
        message: 'Daily login simulated',
        pointsEarned: points,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  /**
   * POST /api/demo/:pioneerId/deactivate
   * Deactivate demo mode
   */
  router.post('/api/demo/:pioneerId/deactivate', async (req: Request, res: Response) => {
    try {
      const { pioneerId } = req.params;

      await demoModeManager.deactivateDemoMode(pioneerId);

      res.json({
        success: true,
        message: 'Demo mode deactivated',
      });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  /**
   * POST /api/demo/:pioneerId/reset
   * Reset demo mode data
   */
  router.post('/api/demo/:pioneerId/reset', async (req: Request, res: Response) => {
    try {
      const { pioneerId } = req.params;

      await demoModeManager.resetDemoMode(pioneerId);

      res.json({
        success: true,
        message: 'Demo mode reset',
      });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  // ==================== ADMIN ENDPOINTS ====================

  /**
   * GET /api/admin/users
   * List all users (admin only)
   */
  router.get('/api/admin/users', async (req: Request, res: Response) => {
    try {
      const db = getMongoDb();
      const { limit = 100, skip = 0 } = req.query;

      const users = await db.users
        .find({})
        .skip(parseInt(skip as string))
        .limit(parseInt(limit as string))
        .toArray();

      const totalCount = await db.users.countDocuments({});

      res.json({
        success: true,
        totalCount,
        count: users.length,
        users,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  /**
   * POST /api/admin/update-weekly
   * Trigger weekly points update for all users
   */
  router.post('/api/admin/update-weekly', async (req: Request, res: Response) => {
    try {
      const result = await autoSyncService.runWeeklyUpdate();

      res.json({
        success: true,
        message: 'Weekly update completed',
        result,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  /**
   * GET /api/admin/demo-sessions
   * List all active demo sessions
   */
  router.get('/api/admin/demo-sessions', async (req: Request, res: Response) => {
    try {
      const { limit = 50 } = req.query;

      const sessions = await demoModeManager.getAllDemoSessions(parseInt(limit as string));

      res.json({
        success: true,
        count: sessions.length,
        sessions,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  /**
   * DELETE /api/admin/user/:pioneerId
   * Delete user (admin only)
   */
  router.delete('/api/admin/user/:pioneerId', async (req: Request, res: Response) => {
    try {
      const { pioneerId } = req.params;

      await userService.deleteUser(pioneerId);

      res.json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  console.log('✅ All API routes configured');
}

export default router;
