/**
 * User API - Consolidated user data operations
 * Handles: VIP check, save pioneer data, save feedback, user reputation storage
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || '',
  token: process.env.KV_REST_API_TOKEN || '',
});

function setCorsHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
}

async function handleCheckVip(uid: string, res: VercelResponse) {
  if (!uid) {
    return res.status(400).json({ error: 'Missing uid' });
  }

  const vipStatus = await redis.get(`vip_status:${uid}`);
  const isVip = vipStatus === 'active';
  const txCount = await redis.get(`tx_count:${uid}`);
  const count = parseInt(txCount as string) || 0;

  return res.status(200).json({ isVip, count });
}

async function handleSavePioneer(body: any, res: VercelResponse) {
  const { username, wallet, timestamp } = body;

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  const cleanWallet = wallet ? wallet.trim().replace(/[^a-zA-Z0-9_]/g, "") : "";

  const userData = JSON.stringify({
    username: username.trim(),
    wallet: cleanWallet,
    timestamp: timestamp || new Date().toISOString()
  });

  await redis.lpush('pioneers', userData);
  await redis.rpush('registered_pioneers', userData);
  await redis.incr('total_pioneers');

  console.log(`[SAVE] Pioneer stored: ${username}`);
  return res.status(200).json({ success: true, message: "Pioneer saved" });
}

async function handleSaveFeedback(body: any, res: VercelResponse) {
  const { username, text, timestamp } = body;

  if (!text) {
    return res.status(400).json({ error: "Feedback text is required" });
  }

  const feedbackData = JSON.stringify({
    username: username || "Anonymous",
    text: text.trim(),
    timestamp: timestamp || new Date().toISOString()
  });

  await redis.lpush('feedbacks', feedbackData);
  
  console.log(`[SAVE] Feedback stored from: ${username}`);
  return res.status(200).json({ success: true, message: "Feedback saved" });
}

async function handleGetReputation(uid: string, res: VercelResponse) {
  if (!uid) {
    return res.status(400).json({ error: 'Missing uid' });
  }

  const reputationData = await redis.get(`reputation:${uid}`);
  
  if (!reputationData) {
    return res.status(200).json({
      success: true,
      data: {
        uid,
        reputationScore: 0,
        dailyCheckInPoints: 0,
        totalCheckInDays: 0,
        lastCheckIn: null,
        interactionHistory: [],
        lastUpdated: null,
        isNew: true
      }
    });
  }

  const parsed = typeof reputationData === 'string' ? JSON.parse(reputationData) : reputationData;
  return res.status(200).json({ success: true, data: parsed });
}

async function handleSaveReputation(body: any, res: VercelResponse) {
  const { uid, reputationScore, dailyCheckInPoints, totalCheckInDays, lastCheckIn, interactionHistory } = body;

  if (!uid) {
    return res.status(400).json({ error: 'Missing uid' });
  }

  const reputationData = {
    uid,
    reputationScore: reputationScore || 0,
    dailyCheckInPoints: dailyCheckInPoints || 0,
    totalCheckInDays: totalCheckInDays || 0,
    lastCheckIn: lastCheckIn || null,
    interactionHistory: interactionHistory || [],
    lastUpdated: new Date().toISOString()
  };

  await redis.set(`reputation:${uid}`, JSON.stringify(reputationData));
  
  console.log(`[REPUTATION] Saved for user: ${uid}, score: ${reputationScore}`);
  return res.status(200).json({ success: true, data: reputationData });
}

async function handleMergeCheckInPoints(body: any, res: VercelResponse) {
  const { uid, pointsToMerge } = body;

  if (!uid || typeof pointsToMerge !== 'number') {
    return res.status(400).json({ error: 'Missing uid or pointsToMerge' });
  }

  const existing = await redis.get(`reputation:${uid}`);
  const parsed = existing ? (typeof existing === 'string' ? JSON.parse(existing) : existing) : {
    uid,
    reputationScore: 0,
    dailyCheckInPoints: 0,
    totalCheckInDays: 0,
    lastCheckIn: null,
    interactionHistory: []
  };

  if (parsed.dailyCheckInPoints < pointsToMerge) {
    return res.status(400).json({ error: 'Not enough check-in points to merge' });
  }

  parsed.reputationScore += pointsToMerge;
  parsed.dailyCheckInPoints -= pointsToMerge;
  parsed.lastUpdated = new Date().toISOString();
  
  parsed.interactionHistory.push({
    type: 'weekly_merge',
    points: pointsToMerge,
    timestamp: new Date().toISOString(),
    description: `Merged ${pointsToMerge} check-in points to reputation`
  });

  await redis.set(`reputation:${uid}`, JSON.stringify(parsed));

  console.log(`[REPUTATION] Merged ${pointsToMerge} points for user: ${uid}`);
  return res.status(200).json({ success: true, data: parsed });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const { action, uid } = req.query;
      
      switch (action) {
        case 'checkVip':
          return handleCheckVip(uid as string, res);
        case 'getReputation':
          return handleGetReputation(uid as string, res);
        default:
          return res.status(200).json({ status: "API Ready", endpoints: ["checkVip", "getReputation", "pioneer", "feedback", "saveReputation", "mergePoints"] });
      }
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { type, action } = body;

      switch (type || action) {
        case 'pioneer':
          return handleSavePioneer(body, res);
        case 'feedback':
          return handleSaveFeedback(body, res);
        case 'saveReputation':
          return handleSaveReputation(body, res);
        case 'mergePoints':
          return handleMergeCheckInPoints(body, res);
        default:
          return res.status(400).json({ error: "Invalid type. Use 'pioneer', 'feedback', 'saveReputation', or 'mergePoints'." });
      }
    }

    return res.status(405).json({ error: "Method not allowed" });

  } catch (error: any) {
    console.error("[USER API ERROR]", error);
    return res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
}
