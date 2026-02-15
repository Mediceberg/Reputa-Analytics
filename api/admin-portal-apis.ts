import express, { Request, Response } from 'express';
import { getMongoDb } from '../server/db/mongoModels';

// Admin authentication
function verifyAdminPassword(req: Request): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const headerPw = req.headers['x-admin-password'] as string;
  const queryPw = req.query.password as string;
  const bodyPw = req.body?.password;

  return headerPw === adminPassword || queryPw === adminPassword || bodyPw === adminPassword;
}

// Stats API
export function setupAdminPortalStats(app: express.Application) {
  app.get('/api/admin-portal/stats', async (req: Request, res: Response) => {
    if (!verifyAdminPassword(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const db = await getMongoDb();
      
      const totalUsers = await db.collection('userv3').countDocuments();
      const vipUsers = await db.collection('userv3').countDocuments({ vip: true });
      const recentActivity = await db.collection('userv3').countDocuments({
        lastUpdated: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

      const stats = {
        totalUniqueUsers: totalUsers,
        totalVisits: totalUsers,
        totalVipUsers: vipUsers,
        recentActivity: recentActivity,
        lastUpdated: new Date().toISOString()
      };

      return res.json({
        success: true,
        stats
      });

    } catch (e: any) {
      console.error('[API] Stats API error:', e);
      return res.status(500).json({ 
        success: false,
        error: e.message,
        stats: {
          totalUniqueUsers: 0,
          totalVisits: 0,
          totalVipUsers: 0,
          recentActivity: 0,
          lastUpdated: new Date().toISOString()
        }
      });
    }
  });
}

// Users API
export function setupAdminPortalUsers(app: express.Application) {
  app.get('/api/admin-portal/users', async (req: Request, res: Response) => {
    if (!verifyAdminPassword(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const db = await getMongoDb();
      const searchQuery = req.query.search as string || '';

      const query: any = {};
      if (searchQuery) {
        query.$or = [
          { username: { $regex: searchQuery, $options: 'i' } },
          { 'metadata.raw.walletAddress': { $regex: searchQuery, $options: 'i' } },
          { email: { $regex: searchQuery, $options: 'i' } }
        ];
      }

      const users = await db.collection('userv3')
        .find(query)
        .sort({ lastUpdated: -1 })
        .limit(100)
        .toArray();

      // Transform to expected format
      const transformedUsers = users.map((user: any) => {
        return {
          _id: user.uid || user._id?.toString(),
          username: user.username || user.displayName || `user_${user.uid?.substring(0, 8)}`,
          wallets: user.walletAddress ? [user.walletAddress] : [],
          visitCount: 1,
          isVip: user.vip === true,
          paymentDetails: null,
          reputaScore: user.metadata?.raw?.totalReputationScore || 0,
          firstSeen: user.metadata?.raw?.createdAt || user.createdAt || new Date(),
          lastSeen: user.lastUpdated || new Date(),
          email: user.email || user.metadata?.raw?.email,
          referralCount: 0,
          protocolVersion: '3.0'
        };
      });

      return res.json({
        success: true,
        users: transformedUsers
      });

    } catch (e: any) {
      console.error('[API] Users API error:', e);
      return res.status(500).json({ 
        success: false,
        error: e.message,
        users: []
      });
    }
  });
}

// Paid Users API
export function setupAdminPortalPaidUsers(app: express.Application) {
  app.get('/api/admin-portal/paid-users', async (req: Request, res: Response) => {
    if (!verifyAdminPassword(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const db = await getMongoDb();
      
      const paidUsers = await db.collection('userv3')
        .find({ vip: true })
        .sort({ lastUpdated: -1 })
        .limit(100)
        .toArray();

      // Transform to expected format
      const transformedPaidUsers = paidUsers.map((user: any) => {
        return {
          _id: user.uid || user._id?.toString(),
          username: user.username || user.displayName || `user_${user.uid?.substring(0, 8)}`,
          wallets: user.walletAddress ? [user.walletAddress] : [],
          visitCount: 1,
          isVip: true,
          paymentDetails: null,
          reputaScore: user.metadata?.raw?.totalReputationScore || 0,
          firstSeen: user.metadata?.raw?.createdAt || user.createdAt || new Date(),
          lastSeen: user.lastUpdated || new Date(),
          email: user.email || user.metadata?.raw?.email,
          referralCount: 0,
          protocolVersion: '3.0'
        };
      });

      return res.json({
        success: true,
        paidUsers: transformedPaidUsers
      });

    } catch (e: any) {
      console.error('[API] Paid users API error:', e);
      return res.status(500).json({ 
        success: false,
        error: e.message,
        paidUsers: []
      });
    }
  });
}

// Setup all admin portal APIs
export function setupAdminPortalAPIs(app: express.Application) {
  app.get('/api/admin-portal/stats-new', async (req: Request, res: Response) => {
    if (!verifyAdminPassword(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const db = await getMongoDb();
      
      const totalUsers = await db.collection('userv3').countDocuments();
      const vipUsers = await db.collection('userv3').countDocuments({ vip: true });
      const recentActivity = await db.collection('userv3').countDocuments({
        lastUpdated: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

      const stats = {
        totalUniqueUsers: totalUsers,
        totalVisits: totalUsers,
        totalVipUsers: vipUsers,
        recentActivity: recentActivity,
        lastUpdated: new Date().toISOString()
      };

      return res.json({
        success: true,
        stats
      });

    } catch (e: any) {
      console.error('[NEW API] Stats API error:', e);
      return res.status(500).json({ 
        success: false,
        error: e.message,
        stats: {
          totalUniqueUsers: 0,
          totalVisits: 0,
          totalVipUsers: 0,
          recentActivity: 0,
          lastUpdated: new Date().toISOString()
        }
      });
    }
  });

  app.get('/api/admin-portal/users-new', async (req: Request, res: Response) => {
    if (!verifyAdminPassword(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const db = await getMongoDb();
      const searchQuery = req.query.search as string || '';

      const query: any = {};
      if (searchQuery) {
        query.$or = [
          { username: { $regex: searchQuery, $options: 'i' } },
          { 'metadata.raw.walletAddress': { $regex: searchQuery, $options: 'i' } },
          { email: { $regex: searchQuery, $options: 'i' } }
        ];
      }

      const users = await db.collection('userv3')
        .find(query)
        .sort({ lastUpdated: -1 })
        .limit(100)
        .toArray();

      // Transform to expected format
      const transformedUsers = users.map((user: any) => {
        return {
          _id: user.uid || user._id?.toString(),
          username: user.username || user.displayName || `user_${user.uid?.substring(0, 8)}`,
          wallets: user.walletAddress ? [user.walletAddress] : [],
          visitCount: 1,
          isVip: user.vip === true,
          paymentDetails: null,
          reputaScore: user.metadata?.raw?.totalReputationScore || 0,
          firstSeen: user.metadata?.raw?.createdAt || user.createdAt || new Date(),
          lastSeen: user.lastUpdated || new Date(),
          email: user.email || user.metadata?.raw?.email,
          referralCount: 0,
          protocolVersion: '3.0'
        };
      });

      return res.json({
        success: true,
        users: transformedUsers
      });

    } catch (e: any) {
      console.error('[NEW API] Users API error:', e);
      return res.status(500).json({ 
        success: false,
        error: e.message,
        users: []
      });
    }
  });

}
