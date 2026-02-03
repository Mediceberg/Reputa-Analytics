/**
 * Admin Console Server Component
 * Provides comprehensive dashboard for monitoring and managing Reputa Protocol
 */

import express, { Router, Request, Response } from 'express';
import { getMongoDb } from '../src/db/mongodb';
// import { AutoSyncService } from './autoSyncService';

const router = Router();
const autoSyncService: any = null; // Initialized when available

// Helper: unified count/aggregate helpers for both real MongoDB and in-memory stub
const safeCount = async (collection: any, filter: any = {}) => {
  if (!collection) return 0;
  if (typeof collection.countDocuments === 'function') return collection.countDocuments(filter);
  const arr = await collection.find(filter).toArray();
  return Array.isArray(arr) ? arr.length : 0;
};

const safeAggregateFirst = async (collection: any, pipeline: any[]) => {
  try {
    if (typeof collection.aggregate === 'function') {
      const res = await collection.aggregate(pipeline).toArray();
      return res[0] || null;
    }
    // Fallback: naive implementation for small datasets
    const all = await collection.find().toArray();
    if (!Array.isArray(all) || all.length === 0) return null;
    // only handle simple $group sum/avg by field
    if (pipeline && pipeline[0] && pipeline[0].$group) {
      const group = pipeline[0].$group;
      const field = Object.keys(group)[0];
      const expr = group[field];
      // return null for complex pipelines
      return null;
    }
    return null;
  } catch (e) {
    return null;
  }
};

/**
 * Admin Dashboard - Statistics Overview
 */
router.get('/api/admin/dashboard', async (req: Request, res: Response) => {
  try {
    const db = getMongoDb();

    // Get statistics (use safe helpers for in-memory fallback)
    const totalUsers = await safeCount(db.users, {});
    const totalPointsAgg = await safeAggregateFirst(db.users, [
      { $group: { _id: null, total: { $sum: '$totalPoints' } } },
    ]);
    const totalPoints = totalPointsAgg?.total || 0;

    const avgRepAgg = await safeAggregateFirst(db.users, [
      { $group: { _id: null, avg: { $avg: '$reputationScore' } } },
    ]);
    const avgReputation = avgRepAgg?.avg || 0;

    const levelDistribution = await db.users.aggregate ? (await db.users.aggregate([
      { $group: { _id: '$level', count: { $sum: 1 } } },
    ]).toArray()) : [];

    const totalTransactions = await safeCount(db.transactions, {});
    const totalMainnetTx = await safeCount(db.transactions, { network: 'mainnet' });
    const totalTestnetTx = await safeCount(db.transactions, { network: 'testnet' });

    const totalDailyLogins = await db.dailyCheckin.countDocuments({});
    const totalReferrals = await db.referrals.countDocuments({
      status: 'confirmed',
    });

    const activeSessions = await db.demoMode.countDocuments({ isActive: true });

    res.json({
      success: true,
      dashboard: {
        users: {
          total: totalUsers,
          byLevel: levelDistribution,
        },
        reputation: {
          totalPoints: totalPoints[0]?.total || 0,
          averageScore: Math.round(avgReputation[0]?.avg || 0),
        },
        blockchain: {
          totalTransactions,
          mainnet: totalMainnetTx,
          testnet: totalTestnetTx,
        },
        activity: {
          dailyLogins: totalDailyLogins,
          confirmedReferrals: totalReferrals,
        },
        demoMode: {
          activeSessions,
        },
      },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * User Management - Search and Filter
 */
router.get('/api/admin/users/search', async (req: Request, res: Response) => {
  try {
    const db = getMongoDb();
    const { query, level, sortBy = 'reputationScore', order = -1 } = req.query;

    let filter: any = {};

    if (query) {
      filter.$or = [
        { pioneerId: { $regex: query, $options: 'i' } },
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
      ];
    }

    if (level) {
      filter.level = level;
    }

    const users = await db.users
      .find(filter)
      .sort({ [sortBy as string]: parseInt(order as string) })
      .limit(100)
      .toArray();

    res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * User Details - Complete Profile with History
 */
router.get('/api/admin/user/:pioneerId/details', async (req: Request, res: Response) => {
  try {
    const db = getMongoDb();
    const { pioneerId } = req.params;

    const user = await db.users.findOne({ pioneerId });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Get wallets
    const wallets = await db.wallets.find({ pioneerId }).toArray();

    // Get recent transactions
    const recentTx = await db.transactions
      .find({ pioneerId })
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();

    // Get points history
    const pointsHistory = await db.pointsLog
      .find({ pioneerId })
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();

    // Get referral stats
    const referralsGiven = await db.referrals
      .find({ referrerId: pioneerId })
      .toArray();
    const referralsReceived = await db.referrals
      .find({ referredPioneerId: pioneerId })
      .toArray();

    // Get daily login streak
    const dailyLogins = await db.dailyCheckin
      .find({ pioneerId })
      .sort({ date: -1 })
      .limit(30)
      .toArray();

    res.json({
      success: true,
      user,
      wallets,
      recentTransactions: recentTx,
      pointsHistory,
      referrals: {
        given: referralsGiven,
        received: referralsReceived,
      },
      dailyLogins,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Blockchain Monitoring
 */
router.get('/api/admin/blockchain/status', async (req: Request, res: Response) => {
  try {
    const db = getMongoDb();

    // Sync status
    const syncStatus = await db.blockchainSync.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]).toArray();

    // Recent transactions
    const recentTx = await db.transactions
      .find({})
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();

    // Network statistics
    const mainnetStats = await db.wallets.aggregate([
      { $match: { network: 'mainnet' } },
      {
        $group: {
          _id: null,
          totalBalance: { $sum: '$currentBalance' },
          avgBalance: { $avg: '$currentBalance' },
          totalTransactions: { $sum: '$totalTransactions' },
        },
      },
    ]).toArray();

    const testnetStats = await db.wallets.aggregate([
      { $match: { network: 'testnet' } },
      {
        $group: {
          _id: null,
          totalBalance: { $sum: '$currentBalance' },
          avgBalance: { $avg: '$currentBalance' },
          totalTransactions: { $sum: '$totalTransactions' },
        },
      },
    ]).toArray();

    res.json({
      success: true,
      syncStatus,
      recentTransactions: recentTx,
      networks: {
        mainnet: mainnetStats[0] || {},
        testnet: testnetStats[0] || {},
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Points Distribution Analysis
 */
router.get('/api/admin/analytics/points', async (req: Request, res: Response) => {
  try {
    const db = getMongoDb();

    // Points by action
    const pointsByAction = await db.pointsLog.aggregate([
      {
        $group: {
          _id: '$action',
          totalPoints: { $sum: '$pointsChange' },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalPoints: -1 } },
    ]).toArray();

    // Daily points trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyTrend = await db.pointsLog.aggregate([
      {
        $match: {
          timestamp: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' },
          },
          totalPoints: { $sum: '$pointsChange' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]).toArray();

    // Top point earners
    const topEarners = await db.pointsLog.aggregate([
      {
        $match: { pointsChange: { $gt: 0 } },
      },
      {
        $group: {
          _id: '$pioneerId',
          totalEarned: { $sum: '$pointsChange' },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalEarned: -1 } },
      { $limit: 100 },
    ]).toArray();

    res.json({
      success: true,
      pointsByAction,
      dailyTrend,
      topEarners,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Referral Network Analysis
 */
router.get('/api/admin/analytics/referrals', async (req: Request, res: Response) => {
  try {
    const db = getMongoDb();

    // Referral stats
    const totalReferrals = await db.referrals.countDocuments({});
    const confirmedReferrals = await db.referrals.countDocuments({
      status: 'confirmed',
    });
    const pendingReferrals = await db.referrals.countDocuments({
      status: 'pending',
    });

    // Top referrers
    const topReferrers = await db.referrals.aggregate([
      { $match: { status: 'confirmed' } },
      {
        $group: {
          _id: '$referrerId',
          count: { $sum: 1 },
          totalPoints: { $sum: '$pointsAwarded' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 50 },
    ]).toArray();

    res.json({
      success: true,
      stats: {
        total: totalReferrals,
        confirmed: confirmedReferrals,
        pending: pendingReferrals,
        conversionRate: confirmedReferrals / (totalReferrals || 1),
      },
      topReferrers,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Export User Data (CSV)
 */
router.get('/api/admin/export/users', async (req: Request, res: Response) => {
  try {
    const db = getMongoDb();

    const users = await db.users.find({}).toArray();

    // Convert to CSV
    const headers = [
      'pioneerId',
      'username',
      'email',
      'primaryWallet',
      'totalPoints',
      'reputationScore',
      'level',
      'createdAt',
    ];

    const rows = users.map((u: any) => [
      u.pioneerId,
      u.username,
      u.email,
      u.primaryWallet,
      u.totalPoints,
      u.reputationScore,
      u.level,
      u.createdAt,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Manual Sync Trigger
 */
router.post('/api/admin/sync/trigger/:pioneerId', async (req: Request, res: Response) => {
  try {
    const { pioneerId } = req.params;

    const result = await autoSyncService.syncUserData(pioneerId);

    res.json({
      success: true,
      message: 'Sync triggered',
      result,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * System Logs and Activity
 */
router.get('/api/admin/logs', async (req: Request, res: Response) => {
  try {
    const db = getMongoDb();
    const { limit = 500 } = req.query;

    const logs = await db.adminLogs
      .find({})
      .sort({ timestamp: -1 })
      .limit(parseInt(limit as string))
      .toArray();

    res.json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

export default router;
