import type { VercelRequest, VercelResponse } from '@vercel/node'; 
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || '',
  token: process.env.KV_REST_API_TOKEN || '',
});

function setCorsHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { password, action } = req.query;
  const ADMIN_PASSWORD = "admin123";
  
  if (password !== ADMIN_PASSWORD && req.method !== 'POST') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (action === 'getAllUsers') {
      const topUserIds = await redis.zrange('leaderboard:reputation', 0, -1, { rev: true });
      const users: any[] = [];
      
      for (const uid of topUserIds) {
        const [reputationData, entryData] = await Promise.all([
          redis.get(`reputation:${uid as string}`),
          redis.get(`leaderboard_entry:${uid as string}`)
        ]);
        
        const rep = reputationData ? (typeof reputationData === 'string' ? JSON.parse(reputationData) : reputationData) : null;
        const entry = entryData ? (typeof entryData === 'string' ? JSON.parse(entryData) : entryData) : null;
        
        if (rep || entry) {
          users.push({
            uid,
            username: entry?.username || rep?.username || 'Unknown',
            wallet: entry?.walletAddress || rep?.walletAddress || 'N/A',
            reputationScore: entry?.reputationScore || rep?.reputationScore || 0,
            trustLevel: entry?.trustLevel || rep?.trustLevel || 'Low Trust',
            lastActiveAt: entry?.lastUpdated || rep?.lastUpdated || 'N/A'
          });
        }
      }
      
      return res.status(200).json({ success: true, users });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
