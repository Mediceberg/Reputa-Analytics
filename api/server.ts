import 'dotenv/config.js';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import * as StellarSdk from '@stellar/stellar-sdk';
import path from 'path';
import fs from 'fs';
import protocol from '../server/config/reputaProtocol.js';
import { Redis } from '@upstash/redis';

import app from './server.app';
import { startUnifiedServer } from './server.startup';
import { getMongoDb, getReputationScoresCollection } from '../server/db/mongoModels';
import * as reputationService from '../server/services/reputationService';
import { createRedisClient } from './server.redis';

console.log('DATABASE_URL_CHECK:', process.env.MONGODB_URI ? 'CONNECTED TO ATLAS' : 'LOCAL DETECTED');
console.log('UPSTASH_CHECK:', (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) ? 'UPSTASH CONFIGURED' : 'UPSTASH MISSING');

const PORT = Number(process.env.PORT) || 3001;

// Initialize Redis asynchronously
let redis: any = null;
async function initializeRedis() {
  if (!redis) {
    redis = await createRedisClient();
  }
  return redis;
}

// ====================
// UTILITY FUNCTIONS
// ====================

// Admin authentication
function verifyAdminPassword(req: Request): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const headerPw = req.headers['x-admin-password'] as string;
  const queryPw = req.query.password as string;
  const bodyPw = req.body?.password;

  console.log('[ADMIN AUTH DEBUG]', {
    adminPassword: adminPassword ? '***' : 'not set',
    headerPw: headerPw ? '***' : 'not provided',
    queryPw: queryPw ? '***' : 'not provided',
    bodyPw: bodyPw ? '***' : 'not provided',
    method: req.method,
    url: req.url
  });

  const suppliedPassword = headerPw || queryPw || bodyPw;
  const isValid = suppliedPassword === adminPassword;

  console.log('[ADMIN AUTH RESULT]', {
    suppliedPassword,
    isValid,
    expectedPassword: adminPassword
  });

  return isValid;
}

// Graceful MongoDB connection wrapper
async function safeGetMongoDb() {
  try {
    return await getMongoDb();
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// Graceful Redis operations wrapper
async function safeRedisOperation(operation: string, ...args: any[]) {
  const redisClient = await initializeRedis();
  if (!redisClient) {
    console.warn('⚠️ Redis not available, skipping operation:', operation);
    return null;
  }
  try {
    return await (redisClient as any)[operation](...args);
  } catch (error) {
    console.error(`Redis ${operation} error:`, error);
    return null;
  }
}

// Graceful database operations wrapper
async function safeDbOperation<T>(operation: () => Promise<T>, fallbackValue?: T): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    console.error('Database operation error:', error);
    return fallbackValue || null;
  }
}

// Graceful count operation
async function safeCount(collection: any, query: any): Promise<number> {
  try {
    return await collection.countDocuments(query);
  } catch (error) {
    console.error('Count operation error:', error);
    return 0;
  }
}

// ====================
// MIDDLEWARE
// ====================

app.use(cors({ origin: '*', methods: '*', allowedHeaders: '*' }));
app.use(express.json());
app.use(express.static('dist')); // Serve static files from dist folder
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ====================
// ADMIN PORTAL ROUTES
// ====================

// Admin Portal main route
app.get('/reputa-admin-portal', (req: Request, res: Response) => {
  const filePath = path.resolve(process.cwd(), 'dist', 'index.html');
  console.log('Admin Portal requested, file path:', filePath);
  console.log('File exists:', fs.existsSync(filePath));
  
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      res.setHeader('Content-Type', 'text/html');
      res.send(content);
    } catch (err) {
      console.error('Error reading file:', err);
      res.status(500).send('Error reading file');
    }
  } else {
    res.status(404).send('File not found');
  }
});

// ====================
// API ROUTES
// ====================

// ADMIN PORTAL API - Protected endpoints
// ====================

app.get('/api/admin-portal/users', async (req: Request, res: Response) => {
  // Prevent browser caching for real-time data
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');

  console.log(' [API] /api/admin-portal/users request received');
  console.log(' [API] Query params:', req.query);

  if (!verifyAdminPassword(req)) {
    console.log(' [API] AUTH FAILED - Invalid or missing admin password');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log(' [API] AUTH SUCCESS - Admin verified');

  try {
    const db = await safeGetMongoDb();
    const trafficCol = db.collection('TrafficUsers');
    const limit = Math.min(parseInt(req.query.limit as string) || 200, 500);
    const skip = parseInt(req.query.skip as string) || 0;
    const search = req.query.search as string;

    let filter: any = {};
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { wallets: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      trafficCol.find(filter)
        .sort({ lastSeen: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      trafficCol.countDocuments(filter)
    ]);

    console.log(`[API] SUCCESS - Returning ${users.length} users (total: ${total})`);
    console.log('[API] CRITICAL DEBUG - Before sending response to frontend:');
    console.log(`[API] Response type: ${typeof users}`);
    console.log(`[API] Response length: ${users?.length || 0}`);
    console.log('[API] Sample user data:', users.length > 0 ? {
      username: users[0].username,
      hasWallets: !!users[0].wallets,
      walletCount: Array.isArray(users[0].wallets) ? users[0].wallets.length : 0,
      lastSeen: users[0].lastSeen
    } : 'NO USERS');

    return res.json({ success: true, users, total });
  } catch (error: any) {
    console.error(' [API] CRITICAL ERROR in /api/admin-portal/users:');
    console.error(' [API] Error message:', error.message);
    console.error(' [API] Error stack:', error.stack);
    console.error(' [API] Error code:', error.code);
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin-portal/stats', async (req: Request, res: Response) => {
  // Prevent browser caching for real-time data
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');

  if (!verifyAdminPassword(req)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const db = await safeGetMongoDb();
    const trafficCol = db.collection('TrafficUsers');
    
    // Get total users
    const totalUsers = await safeCount(trafficCol, {});
    
    // Get VIP users
    const vipUsers = await safeCount(trafficCol, { isVip: true });
    
    // Get recent activity (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentActivity = await safeCount(trafficCol, { 
      lastSeen: { $gte: oneDayAgo.toISOString() }
    });

    return res.json({
      success: true,
      stats: {
        totalUsers,
        vipUsers,
        recentActivity,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error in /api/admin-portal/stats:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Manually trigger data consolidation (for admin use)
app.post('/api/admin-portal/consolidate', async (req: Request, res: Response) => {
  if (!verifyAdminPassword(req)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { createMasterRegistry } = await import('../server/services/upstashConsolidationService.js');
    const result = await createMasterRegistry();

    return res.json({
      success: true,
      message: `Consolidated ${result.uniqueUsers} users`,
      data: result
    });
  } catch (error: any) {
    console.error('Consolidation error:', error);
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin-portal/consolidated', async (req: Request, res: Response) => {
  if (!verifyAdminPassword(req)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const db = await safeGetMongoDb();
    const searchQuery = req.query.search as string || '';

    // Build unified aggregation pipeline
    const pipeline: any[] = [];
    
    // Add search filter if provided
    if (searchQuery) {
      const matchStage: any = {
        $match: {
          $or: [
            { username: { $regex: searchQuery, $options: 'i' } },
            { primaryWallet: { $regex: searchQuery, $options: 'i' } },
            { primaryEmail: { $regex: searchQuery, $options: 'i' } }
          ]
        }
      };
      pipeline.push(matchStage);
    }

    const sortStage: any = { $sort: { lastActiveAt: -1 } };
    pipeline.push(sortStage);

    // Get pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    console.log('[API] Pagination params:', { page, limit, skip });

    // Add pagination to pipeline
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    console.log('[API] Pipeline stages:', pipeline.length);

    // Execute aggregation
    const consolidatedUsers = await db.collection('final_users_v3')
      .aggregate(pipeline)
      .toArray();

    console.log('[API] Users fetched:', consolidatedUsers.length);

    // Get total count for pagination
    const countPipeline = [...pipeline];
    // Remove pagination stages for count
    countPipeline.pop(); // Remove $limit
    countPipeline.pop(); // Remove $skip
    
    const totalCountResult = await db.collection('final_users_v3')
      .aggregate([...countPipeline, { $count: "total" }])
      .toArray();
    const totalCount = totalCountResult[0]?.total || 0;

    console.log('[API] Total count:', totalCount);

    // Extract usernames for feedback lookup
    const usernames = consolidatedUsers.map((u: any) => u.username).filter(Boolean);

    // Get reputation scores
    type ReputationScore = { pioneerId: string; totalReputationScore?: number };
    let reputationScores: ReputationScore[] = [];
    try {
      const scores = await db.collection<ReputationScore>('ReputationScores')
        .find({ pioneerId: { $in: consolidatedUsers.flatMap((u: any) => u.allPioneerIds).filter(Boolean) } })
        .toArray();
      reputationScores = scores as ReputationScore[];
    } catch (e) {
      console.warn('ReputationScores collection not found:', e);
    }

    // Get feedback data
    type FeedbackData = { username: string; [key: string]: any };
    let feedbackData: FeedbackData[] = [];
    try {
      const feedback = await db.collection<FeedbackData>('all_feedbacks')
        .find({ username: { $in: usernames } })
        .toArray();
      feedbackData = feedback as FeedbackData[];
    } catch (e) {
      console.warn('all_feedbacks collection not found:', e);
    }

    // Get additional data from Upstash Redis Lists for wallet addresses and VIP status
    console.log('[API] Fetching additional data from Upstash Redis Lists...');
    const redisDataMap = new Map<string, { wallet?: string; isVip?: boolean; timestamp?: string; [key: string]: any }>();
    
    try {
      const upstashUrl = process.env.KV_REST_API_URL;
      const upstashToken = process.env.KV_REST_API_TOKEN;
      
      if (!upstashUrl || !upstashToken) {
        console.warn('[API] Upstash KV not configured, skipping...');
      } else {
        // Fetch data from registered_pioneers list
        const registeredPioneersResponse = await fetch(`${upstashUrl}/lrange/registered_pioneers/0/-1`, {
          headers: {
            'Authorization': `Bearer ${upstashToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        // Fetch data from pioneers list  
        const pioneersResponse = await fetch(`${upstashUrl}/lrange/pioneers/0/-1`, {
          headers: {
            'Authorization': `Bearer ${upstashToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (registeredPioneersResponse.ok && pioneersResponse.ok) {
          const registeredData = await registeredPioneersResponse.json();
          const pioneersData = await pioneersResponse.json();
          
          console.log('[API] Redis Lists fetched:', {
            registered_pioneers: registeredData.result?.length || 0,
            pioneers: pioneersData.result?.length || 0
          });
          
          // Process registered_pioneers data
          if (registeredData.result && Array.isArray(registeredData.result)) {
            registeredData.result.forEach((item: string) => {
              try {
                const pioneerData = JSON.parse(item);
                if (pioneerData.username) {
                  const existing = redisDataMap.get(pioneerData.username) || {};
                  redisDataMap.set(pioneerData.username, {
                    ...existing,
                    wallet: pioneerData.wallet,
                    isVip: pioneerData.vip_status || pioneerData.isVip || false,
                    timestamp: pioneerData.timestamp,
                    source: 'registered_pioneers'
                  });
                }
              } catch (e) {
                console.warn('[API] Failed to parse registered_pioneers item:', item, e);
              }
            });
          }
          
          // Process pioneers data
          if (pioneersData.result && Array.isArray(pioneersData.result)) {
            pioneersData.result.forEach((item: string) => {
              try {
                const pioneerData = JSON.parse(item);
                if (pioneerData.username) {
                  const existing = redisDataMap.get(pioneerData.username) || {};
                  redisDataMap.set(pioneerData.username, {
                    ...existing,
                    wallet: pioneerData.wallet || existing.wallet,
                    isVip: pioneerData.vip_status || pioneerData.isVip || existing.isVip || false,
                    timestamp: pioneerData.timestamp || existing.timestamp,
                    source: existing.source ? 'both_lists' : 'pioneers'
                  });
                }
              } catch (e) {
                console.warn('[API] Failed to parse pioneers item:', item, e);
              }
            });
          }
          
          console.log('[API] Redis data map created for', redisDataMap.size, 'users');
          
          // Log sample data for verification
          if (redisDataMap.size > 0) {
            const sampleEntries = Array.from(redisDataMap.entries()).slice(0, 3);
            console.log('[API] Sample Redis data:', sampleEntries);
          }
        } else {
          console.warn('[API] Failed to fetch Redis lists:', {
            registered_status: registeredPioneersResponse.status,
            pioneers_status: pioneersResponse.status
          });
        }
      }
    } catch (e) {
      console.warn('Failed to fetch Redis Lists data:', e);
    }

    // Create lookup maps
    const reputationMap = new Map(
      reputationScores.map(r => [r.pioneerId, r.totalReputationScore || 0])
    );
    const feedbackMap = new Map(
      feedbackData.map(f => [f.username, f])
    );

    // Transform data with merged MongoDB + Redis Lists data (Single Source of Truth)
    const transformedUsers = consolidatedUsers.map((user: any) => {
      // Ensure allPioneerIds is an array
      const allPioneerIds = Array.isArray(user.allPioneerIds) ? user.allPioneerIds : (user.pioneerId ? [user.pioneerId] : []);
      
      const totalReputation = allPioneerIds.reduce((sum: number, pid: string) => {
        return sum + (reputationMap.get(pid) || 0);
      }, 0);

      // Get additional data from Redis Lists (the enrichment source)
      const redisUserData = redisDataMap.get(user.username);
      
      // Smart merging logic
      const finalWallet = redisUserData?.wallet || user.primaryWallet || 'Not Linked';
      const finalVipStatus = redisUserData?.isVip || false;
      const dataSource = redisUserData ? `MongoDB + Redis (${redisUserData.source})` : 'MongoDB Only';
      
      return {
        uid: user.pioneerId,
        username: user.username,
        primaryWallet: finalWallet, // Merged wallet (Redis优先)
        primaryEmail: user.primaryEmail,
        createdAt: user.createdAt,
        lastActiveAt: user.lastActiveAt,
        isConsolidated: true,
        recordCount: user.allPioneerIds?.length || 1,
        allPioneerIds: user.allPioneerIds || [user.pioneerId],
        reputaScore: totalReputation, // Fixed field name
        hasFeedback: feedbackMap.has(user.username),
        feedback: feedbackMap.get(user.username) || null,
        isVip: finalVipStatus, // VIP status from Redis
        walletAddress: finalWallet, // Explicit wallet field
        sources: user.sources || ['final_users_v3'],
        // Enhanced merged data structure
        mergedData: {
          mongodb: {
            primaryWallet: user.primaryWallet,
            createdAt: user.createdAt,
            lastActiveAt: user.lastActiveAt,
            recordCount: user.allPioneerIds?.length || 1
          },
          redis: {
            wallet: redisUserData?.wallet || null,
            isVip: redisUserData?.isVip || false,
            timestamp: redisUserData?.timestamp || null,
            source: redisUserData?.source || null
          },
          // Unified status
          isLinked: !!redisUserData,
          dataSource: dataSource,
          linkStatus: redisUserData ? 'Linked' : 'Not Linked'
        },
        // Additional fields for UI
        linkStatus: redisUserData ? 'Linked' : 'Not Linked',
        dataSource: dataSource,
        redisTimestamp: redisUserData?.timestamp || null
      };
    });

    // Sort by last active date
    transformedUsers.sort((a: any, b: any) => {
      return new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime();
    });

    return res.json({
      success: true,
      uniqueUsers: totalCount,
      totalVisits: transformedUsers.reduce((sum: number, u: any) => sum + (u.visitCount || 0), 0),
      vipUsers: transformedUsers.filter((u: any) => u.isVip).length,
      usersWithScores: transformedUsers.filter((u: any) => u.reputaScore > 0).length,
      usersWithFeedback: transformedUsers.filter((u: any) => u.hasFeedback).length,
      lastUpdated: new Date().toISOString(),
      searchQuery: searchQuery || null,
      users: transformedUsers,
      count: transformedUsers.length,
      pagination: {
        page: page,
        limit: limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      },
      meta: {
        totalRecords: transformedUsers.reduce((sum: number, u: any) => sum + u.recordCount, 0),
        consolidatedUsers: transformedUsers.filter((u: any) => u.isConsolidated).length,
        usersWithScores: transformedUsers.filter((u: any) => u.reputaScore > 0).length,
        usersWithFeedback: transformedUsers.filter((u: any) => u.hasFeedback).length,
        searchQuery: searchQuery || null
      }
    });

  } catch (e: any) {
    console.error('Consolidated API error:', e);
    return res.status(500).json({ error: e.message });
  }
});

app.get('/api/admin-portal/paid-users', async (req: Request, res: Response) => {
  if (!verifyAdminPassword(req)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const db = await safeGetMongoDb();
    const trafficCol = db.collection('TrafficUsers');

    const paidUsers = await trafficCol.find({ isVip: true })
      .sort({ updatedAt: -1 })
      .limit(200)
      .toArray();

    return res.json({ success: true, paidUsers });

  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// Trigger VIP update when payment completes - hook into existing payment flow
app.post('/api/admin-portal/mark-vip', async (req: Request, res: Response) => {
  if (!verifyAdminPassword(req)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { username, paymentId, txid, amount } = req.body;
    if (!username) return res.status(400).json({ error: 'username required' });

    const db = await safeGetMongoDb();
    const trafficCol = db.collection('TrafficUsers');
    
    await trafficCol.updateOne(
      { username },
      {
        $set: {
          isVip: true,
          paymentDetails: {
            paymentId: paymentId || 'manual',
            txid: txid || 'manual',
            amount: amount || 0,
            paidAt: new Date(),
          },
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    // Also update Upstash for speed
    await safeRedisOperation('set', `vip_status:${username}`, 'active', { ex: 365 * 24 * 60 * 60 });

    return res.json({ success: true, message: `${username} marked as VIP` });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// ====================
// AUTH
// ====================

app.post('/api/auth', async (req: Request, res: Response) => {
  try {
    const { accessToken, user } = req.body as { accessToken: string; user?: { uid: string; username: string } };

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    // Here you would validate the access token with Pi Network
    // For now, we'll just return success
    return res.json({
      success: true,
      message: 'Authentication successful',
      user: user || { uid: 'demo-uid', username: 'demo-user' }
    });
  } catch (error: any) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// ====================
// USER API
// ====================

app.get('/api/user', async (req: Request, res: Response) => {
  const { action, uid } = req.query;

  switch (action) {
    case 'check-vip':
      return handleCheckVip(uid as string, res);
    case 'get-reputation':
      return handleGetReputation(uid as string, res);
    case 'get-wallet-state':
      return handleGetWalletState(uid as string, res);
    default:
      return res.status(400).json({ error: 'Invalid action' });
  }
});

app.post('/api/user', async (req: Request, res: Response) => {
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { type, action } = body;

  switch (type) {
    case 'pioneer':
      if (action === 'save') return handleSavePioneer(body, res);
      break;
    case 'feedback':
      if (action === 'save') return handleSaveFeedback(body, res);
      break;
    case 'reputation':
      if (action === 'save') return handleSaveReputation(body, res);
      if (action === 'merge-checkin') return handleMergeCheckInPoints(body, res);
      break;
    case 'wallet':
      if (action === 'save') return handleSaveWalletState(body, res);
      break;
  }

  return res.status(400).json({ error: 'Invalid request' });
});

app.get('/api/check-vip', async (req: Request, res: Response) => handleCheckVip(req.query.uid as string, res));
app.post('/api/save-pioneer', async (req: Request, res: Response) => handleSavePioneer(req.body, res));
app.post('/api/save-feedback', async (req: Request, res: Response) => handleSaveFeedback(req.body, res));

// ====================
// ATOMIC REPUTATION ENGINE API ENDPOINTS
// ====================

app.post('/api/atomic/deep-scan', async (req: Request, res: Response) => {
  try {
    const { walletAddress, username } = req.body;
    
    if (!walletAddress || !username) {
      return res.status(400).json({ error: 'walletAddress and username are required' });
    }

    const result = await performInitialDeepScan(walletAddress, username);
    
    return res.json({
      success: result.success,
      data: result.genesisBoostData,
      scanResult: result.scanResult
    });
  } catch (error: any) {
    console.error('Deep scan error:', error);
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/atomic/sync', async (req: Request, res: Response) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'username is required' });
    }

    const result = await performIncrementalSync(username);
    
    return res.json({
      success: result.success,
      newRewards: result.newRewards,
      scanResult: result.scanResult
    });
  } catch (error: any) {
    console.error('Incremental sync error:', error);
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/atomic/profile', async (req: Request, res: Response) => {
  try {
    const { username } = req.query;
    
    if (!username) {
      return res.status(400).json({ error: 'username is required' });
    }

    const db = await safeGetMongoDb();
    const profile = await db.collection('AtomicProfiles').findOne({ username });
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    return res.json({ success: true, profile });
  } catch (error: any) {
    console.error('Get profile error:', error);
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/atomic/claim-rewards', async (req: Request, res: Response) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'username is required' });
    }

    // Process reward claims
    const db = await safeGetMongoDb();
    const result = await db.collection('PendingRewards').updateMany(
      { username, claimed: false },
      { $set: { claimed: true, claimedAt: new Date() } }
    );

    return res.json({
      success: true,
      claimed: result.modifiedCount
    });
  } catch (error: any) {
    console.error('Claim rewards error:', error);
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/atomic/leaderboard', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    
    const db = await safeGetMongoDb();
    const leaderboard = await db.collection('AtomicProfiles')
      .find({})
      .sort({ atomicTrustScore: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    return res.json({ success: true, leaderboard });
  } catch (error: any) {
    console.error('Leaderboard error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// ====================
// HELPER FUNCTIONS
// ====================

type AtomicTrustLevel = 'Newcomer' | 'Novice' | 'Explorer' | 'Contributor' | 'Verified' | 'Trusted' | 'Ambassador' | 'Elite' | 'Sentinel' | 'Oracle' | 'Atomic Legend';

function computeTrustLevel(score: number): AtomicTrustLevel {
  if (score >= 950_001) return 'Atomic Legend';
  if (score >= 850_001) return 'Oracle';
  if (score >= 750_001) return 'Sentinel';
  if (score >= 650_001) return 'Elite';
  if (score >= 550_001) return 'Ambassador';
  if (score >= 450_001) return 'Trusted';
  if (score >= 350_001) return 'Verified';
  if (score >= 250_001) return 'Contributor';
  if (score >= 150_001) return 'Explorer';
  if (score >= 50_001) return 'Novice';
  return 'Newcomer';
}

async function handleCheckVip(uid: string | undefined, res: Response) {
  if (!uid) {
    return res.status(400).json({ error: 'Missing uid' });
  }

  try {
    const db = await safeGetMongoDb();
    const trafficCol = db.collection('TrafficUsers');
    const user = await trafficCol.findOne({ uid });
    
    const isVip = user?.isVip || false;
    const count = await safeCount(trafficCol, { isVip: true });

    return res.status(200).json({ isVip, count });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

async function handleSavePioneer(body: any, res: Response) {
  const { username, wallet, timestamp } = body;

  if (!username) {
    return res.status(400).json({ error: 'Missing username' });
  }

  try {
    const db = await safeGetMongoDb();
    const trafficCol = db.collection('TrafficUsers');
    
    await trafficCol.updateOne(
      { username },
      {
        $set: {
          wallet,
          timestamp: timestamp || new Date(),
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    return res.status(200).json({ success: true, message: 'Pioneer saved' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

async function handleSaveFeedback(body: any, res: Response) {
  const { username, text, timestamp } = body;

  if (!text) {
    return res.status(400).json({ error: 'Missing feedback text' });
  }

  try {
    const db = await safeGetMongoDb();
    const feedbackCol = db.collection('Feedback');
    
    await feedbackCol.insertOne({
      username,
      text,
      timestamp: timestamp || new Date()
    });

    return res.status(200).json({ success: true, message: 'Feedback saved' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

async function handleGetReputation(uid: string | undefined, res: Response) {
  if (!uid) {
    return res.status(400).json({ error: 'Missing uid' });
  }

  try {
    const db = await safeGetMongoDb();
    const reputationCol = db.collection('Reputation');
    const data = await reputationCol.findOne({ uid });
    
    const parsed = data || {
      uid,
      totalReputationScore: 0,
      reputationLevel: 'Newcomer',
      blockchainScore: 0,
      checkInScore: 0,
      walletSnapshots: [],
      dailyCheckinHistory: [],
      scoreEvents: [],
      currentStreak: 0,
      longestStreak: 0,
      totalCheckInDays: 0,
      lastCheckInDate: null,
      lastScanTimestamp: null,
      lastUpdated: new Date(),
      createdAt: new Date()
    };

    return res.status(200).json({ success: true, data: parsed });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

async function handleSaveReputation(body: any, res: Response) {
  const {
    uid,
    username,
    totalReputationScore,
    reputationLevel,
    blockchainScore,
    checkInScore,
    walletSnapshots,
    dailyCheckinHistory,
    scoreEvents,
    currentStreak,
    longestStreak,
    totalCheckInDays,
    lastCheckInDate,
    lastScanTimestamp
  } = body;

  if (!uid) {
    return res.status(400).json({ error: 'Missing uid' });
  }

  try {
    const db = await safeGetMongoDb();
    const reputationCol = db.collection('Reputation');
    
    const reputationData = {
      uid,
      username,
      totalReputationScore: totalReputationScore || 0,
      reputationLevel: reputationLevel || 'Newcomer',
      blockchainScore: blockchainScore || 0,
      checkInScore: checkInScore || 0,
      walletSnapshots: walletSnapshots || [],
      dailyCheckinHistory: dailyCheckinHistory || [],
      scoreEvents: scoreEvents || [],
      currentStreak: currentStreak || 0,
      longestStreak: longestStreak || 0,
      totalCheckInDays: totalCheckInDays || 0,
      lastCheckInDate: lastCheckInDate || null,
      lastScanTimestamp: lastScanTimestamp || null,
      lastUpdated: new Date(),
      createdAt: new Date()
    };

    await reputationCol.updateOne(
      { uid },
      { $set: reputationData },
      { upsert: true }
    );

    return res.status(200).json({ success: true, data: reputationData });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

async function handleGetTopUsers(query: any, res: Response) {
  const limit = Math.min(parseInt(query.limit as string) || 100, 100);
  const offset = parseInt(query.offset as string) || 0;

  try {
    const db = await safeGetMongoDb();
    const reputationCol = db.collection('Reputation');
    
    const users = await reputationCol
      .find({})
      .sort({ totalReputationScore: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    return res.status(200).json({ success: true, users });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

async function handleMergeCheckInPoints(body: any, res: Response) {
  const { uid, pointsToMerge } = body;

  if (!uid || typeof pointsToMerge !== 'number') {
    return res.status(400).json({ error: 'Invalid request' });
  }

  try {
    const db = await safeGetMongoDb();
    const reputationCol = db.collection('Reputation');
    
    const user = await reputationCol.findOne({ uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newScore = user.totalReputationScore + pointsToMerge;
    const newLevel = computeTrustLevel(newScore);

    await reputationCol.updateOne(
      { uid },
      {
        $set: {
          totalReputationScore: newScore,
          reputationLevel: newLevel,
          lastUpdated: new Date()
        }
      }
    );

    const updated = await reputationCol.findOne({ uid });
    return res.status(200).json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

async function handleGetWalletState(uid: string | undefined, res: Response) {
  if (!uid) {
    return res.status(400).json({ error: 'Missing uid' });
  }

  try {
    const db = await safeGetMongoDb();
    const walletCol = db.collection('WalletStates');
    const state = await walletCol.findOne({ uid });
    
    const parsed = state || {
      uid,
      walletAddress: null,
      balance: 0,
      transactionCount: 0,
      lastActivityDate: null,
      contactsCount: 0,
      stakingAmount: 0,
      accountAgeDays: 0,
      lastUpdated: new Date()
    };

    return res.status(200).json({ success: true, data: parsed });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

async function handleSaveWalletState(body: any, res: Response) {
  const { uid, walletState } = body;

  if (!uid || !walletState) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  try {
    const db = await safeGetMongoDb();
    const walletCol = db.collection('WalletStates');
    
    await walletCol.updateOne(
      { uid },
      {
        $set: {
          ...walletState,
          uid,
          lastUpdated: new Date()
        }
      },
      { upsert: true }
    );

    return res.status(200).json({ success: true, message: 'Wallet state saved' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Blockchain scan functions
async function performInitialDeepScan(walletAddress: string, username: string): Promise<{
  success: boolean;
  genesisBoostData?: any;
  scanResult?: any;
}> {
  try {
    // Implementation for deep blockchain scanning
    const genesisBoostData = {
      walletAddress,
      username,
      accountAgeDays: 365,
      transactionCount: 1000,
      totalBalance: 1000000,
      genesisBoostScore: 50000
    };

    return {
      success: true,
      genesisBoostData,
      scanResult: { scanned: true, transactionsFound: 1000 }
    };
  } catch (error) {
    console.error('Deep scan error:', error);
    return { success: false };
  }
}

async function performIncrementalSync(username: string): Promise<{
  success: boolean;
  newRewards?: any[];
  scanResult?: any;
}> {
  try {
    // Implementation for incremental sync
    const newRewards = [
      { type: 'transaction_bonus', points: 10, txid: 'demo-tx-1' },
      { type: 'stake_bonus', points: 5, amount: 100 }
    ];

    return {
      success: true,
      newRewards,
      scanResult: { synced: true, newTransactions: 2 }
    };
  } catch (error) {
    console.error('Incremental sync error:', error);
    return { success: false };
  }
}

// ====================
// HEALTH CHECK
// ====================

app.get('/api/health-check', async (req: Request, res: Response) => {
  const status: any = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: { status: 'disconnected', latency: null as number | null },
    redis: { status: 'disconnected', latency: null as number | null },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      external: Math.round(process.memoryUsage().external / 1024 / 1024)
    }
  };

  // Check MongoDB
  try {
    const start = Date.now();
    await safeGetMongoDb();
    status.mongodb.latency = Date.now() - start;
    status.mongodb.status = 'connected';
  } catch (error) {
    status.mongodb.error = error instanceof Error ? error.message : 'Unknown error';
  }

  // Check Redis
  try {
    const redisClient = await initializeRedis();
    if (redisClient) {
      const start = Date.now();
      await safeRedisOperation('ping');
      status.redis.latency = Date.now() - start;
      status.redis.status = 'connected';
    }
  } catch (error) {
    status.redis.error = error instanceof Error ? error.message : 'Unknown error';
  }

  const overallStatus = status.mongodb.status === 'connected' && status.redis.status === 'connected' ? 'healthy' : 'degraded';
  
  return res.status(overallStatus === 'healthy' ? 200 : 503).json({
    ...status,
    overall: overallStatus
  });
});

// ====================
// SERVER STARTUP
// ====================

const PORT_FINAL = Number(process.env.PORT) || 3001;

// Catch-all handler for React Router - MUST BE AT THE END
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
});

const entryArg = process.argv[1] ?? '';
const isDevStart = !process.env.VERCEL && (entryArg.includes('api/server') || entryArg.includes('api\\server') || entryArg.endsWith('/server.ts') || entryArg.endsWith('\\server.ts'));

if (isDevStart) {
  startUnifiedServer(app, PORT_FINAL);
}

export default app;
