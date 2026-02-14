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
    console.log('[NEW API] /api/admin-portal/stats request received');
    
    if (!verifyAdminPassword(req)) {
      console.log('[NEW API] Authentication failed');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const db = await getMongoDb();
      
      // List available collections for debugging
      const collections = await db.listCollections().toArray();
      console.log('[API] Available collections:', collections.map((c: any) => c.name));
      
      // Get real stats from userv3 collection
      const totalUsers = await db.collection('userv3').countDocuments();
      const vipUsers = await db.collection('userv3').countDocuments({ vip: true });
      const recentActivity = await db.collection('userv3').countDocuments({
        lastUpdated: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      });

      console.log(`[API] Stats - Total: ${totalUsers}, VIP: ${vipUsers}, Recent: ${recentActivity}`);

      const stats = {
        totalUniqueUsers: totalUsers,
        totalVisits: totalUsers, // Each user counts as a visit for now
        totalVipUsers: vipUsers,
        recentActivity: recentActivity,
        lastUpdated: new Date().toISOString()
      };

      console.log(`[API] Stats returned: ${JSON.stringify(stats)}`);
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
    console.log('[NEW API] /api/admin-portal/users request received');
    
    if (!verifyAdminPassword(req)) {
      console.log('[NEW API] Authentication failed');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const db = await getMongoDb();
      const searchQuery = req.query.search as string || '';
      console.log('[API] Search query:', searchQuery);

      // List available collections for debugging
      const collections = await db.listCollections().toArray();
      console.log('[API] Available collections:', collections.map((c: any) => c.name));
      
      // Check userv3 collection count
      const userv3Count = await db.collection('userv3').countDocuments();
      console.log(`[API] userv3 collection has ${userv3Count} documents`);

      // Build query
      const query: any = {};
      if (searchQuery) {
        query.$or = [
          { username: { $regex: searchQuery, $options: 'i' } },
          { 'metadata.raw.walletAddress': { $regex: searchQuery, $options: 'i' } },
          { email: { $regex: searchQuery, $options: 'i' } }
        ];
      }

      // Get users from userv3 collection
      const users = await db.collection('userv3')
        .find(query)
        .sort({ lastUpdated: -1 })
        .limit(100)
        .toArray();

      console.log(`[API] Found ${users.length} users`);

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
    console.log('[API] /api/admin-portal/paid-users request received');
    
    if (!verifyAdminPassword(req)) {
      console.log('[API] Authentication failed');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const db = await getMongoDb();
      
      // Get VIP users from userv3 collection
      const paidUsers = await db.collection('userv3')
        .find({ vip: true })
        .sort({ lastUpdated: -1 })
        .limit(100)
        .toArray();

      console.log(`[API] Found ${paidUsers.length} paid users`);

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
  // Stats API with different path
  app.get('/api/admin-portal/stats-new', async (req: Request, res: Response) => {
    console.log('[NEW API] /api/admin-portal/stats-new request received');
    
    if (!verifyAdminPassword(req)) {
      console.log('[NEW API] Authentication failed');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const db = await getMongoDb();
      
      // List available collections for debugging
      const collections = await db.listCollections().toArray();
      console.log('[NEW API] Available collections:', collections.map((c: any) => c.name));
      
      // Get real stats from userv3 collection
      const totalUsers = await db.collection('userv3').countDocuments();
      const vipUsers = await db.collection('userv3').countDocuments({ vip: true });
      const recentActivity = await db.collection('userv3').countDocuments({
        lastUpdated: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      });

      console.log(`[NEW API] Stats - Total: ${totalUsers}, VIP: ${vipUsers}, Recent: ${recentActivity}`);

      const stats = {
        totalUniqueUsers: totalUsers,
        totalVisits: totalUsers, // Each user counts as a visit for now
        totalVipUsers: vipUsers,
        recentActivity: recentActivity,
        lastUpdated: new Date().toISOString()
      };

      console.log(`[NEW API] Stats returned: ${JSON.stringify(stats)}`);
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

  // Users API with different path
  app.get('/api/admin-portal/users-new', async (req: Request, res: Response) => {
    console.log('[NEW API] /api/admin-portal/users-new request received');
    
    if (!verifyAdminPassword(req)) {
      console.log('[NEW API] Authentication failed');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const db = await getMongoDb();
      const searchQuery = req.query.search as string || '';
      console.log('[NEW API] Search query:', searchQuery);

      // List available collections for debugging
      const collections = await db.listCollections().toArray();
      console.log('[NEW API] Available collections:', collections.map((c: any) => c.name));
      
      // Check userv3 collection count
      const userv3Count = await db.collection('userv3').countDocuments();
      console.log(`[NEW API] userv3 collection has ${userv3Count} documents`);

      // Build query
      const query: any = {};
      if (searchQuery) {
        query.$or = [
          { username: { $regex: searchQuery, $options: 'i' } },
          { 'metadata.raw.walletAddress': { $regex: searchQuery, $options: 'i' } },
          { email: { $regex: searchQuery, $options: 'i' } }
        ];
      }

      // Get users from userv3 collection
      const users = await db.collection('userv3')
        .find(query)
        .sort({ lastUpdated: -1 })
        .limit(100)
        .toArray();

      console.log(`[NEW API] Found ${users.length} users`);

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

  console.log('[NEW API] Admin Portal APIs initialized with new paths');
}
