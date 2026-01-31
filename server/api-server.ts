import express from 'express';   
import cors from 'cors';
import { Redis } from '@upstash/redis';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const redis = new Redis({
  url: process.env.KV_REST_API_URL || '',
  token: process.env.KV_REST_API_TOKEN || '',
});

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

interface ReputationData {
  uid: string;
  totalReputationScore: number;
  reputationLevel: number;
  blockchainScore: number;
  checkInScore: number;
  adBonusScore: number;
  walletAddress: string | null;
  walletSnapshots: any[];
  dailyCheckinHistory: any[];
  scoreEvents: any[];
  lastCheckInDate: string | null;
  lastScanTimestamp: number | null;
  currentStreak: number;
  longestStreak: number;
  createdAt: string;
  updatedAt: string;
}

function createDefaultReputationData(uid: string): ReputationData {
  const now = new Date().toISOString();
  return {
    uid,
    totalReputationScore: 0,
    reputationLevel: 1,
    blockchainScore: 0,
    checkInScore: 0,
    adBonusScore: 0,
    walletAddress: null,
    walletSnapshots: [],
    dailyCheckinHistory: [],
    scoreEvents: [],
    lastCheckInDate: null,
    lastScanTimestamp: null,
    currentStreak: 0,
    longestStreak: 0,
    createdAt: now,
    updatedAt: now,
  };
}

function getReputationKey(uid: string): string {
  return `reputation:${uid}`;
}

async function getReputationData(uid: string): Promise<ReputationData> {
  try {
    const data = await redis.get<ReputationData>(getReputationKey(uid));
    if (data) return data;
  } catch (error) {
    console.error('[REDIS GET ERROR]', error);
  }
  return createDefaultReputationData(uid);
}

async function saveReputationData(data: ReputationData): Promise<boolean> {
  try {
    data.updatedAt = new Date().toISOString();
    await redis.set(getReputationKey(data.uid), JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('[REDIS SET ERROR]', error);
    return false;
  }
}

function calculateLevel(score: number): number {
  if (score >= 10000) return 7;
  if (score >= 5000) return 6;
  if (score >= 2000) return 5;
  if (score >= 1000) return 4;
  if (score >= 500) return 3;
  if (score >= 100) return 2;
  return 1;
}

app.get('/api/reputation', async (req, res) => {
  const { action, uid } = req.query as { action?: string; uid?: string };

  if (action === 'get' || action === 'getReputation') {
    if (!uid) return res.status(400).json({ error: 'Missing uid' });
    const data = await getReputationData(uid);
    return res.json({
      success: true,
      data: {
        uid: data.uid,
        totalReputationScore: data.totalReputationScore,
        reputationLevel: data.reputationLevel,
        blockchainScore: data.blockchainScore,
        checkInScore: data.checkInScore,
        adBonusScore: data.adBonusScore,
        walletAddress: data.walletAddress,
        lastCheckInDate: data.lastCheckInDate,
        currentStreak: data.currentStreak,
        longestStreak: data.longestStreak,
        dailyCheckinHistory: data.dailyCheckinHistory.slice(0, 30),
        scoreEvents: data.scoreEvents.slice(0, 20),
      }
    });
  }

  if (action === 'canCheckIn') {
    if (!uid) return res.status(400).json({ error: 'Missing uid' });
    const data = await getReputationData(uid);
    const today = new Date().toISOString().split('T')[0];
    const canCheckIn = !data.lastCheckInDate || data.lastCheckInDate !== today;
    return res.json({
      success: true,
      data: {
        canCheckIn,
        lastCheckInDate: data.lastCheckInDate,
        currentStreak: data.currentStreak,
      }
    });
  }

  if (action === 'history') {
    if (!uid) return res.status(400).json({ error: 'Missing uid' });
    const data = await getReputationData(uid);
    return res.json({
      success: true,
      data: {
        scoreEvents: data.scoreEvents,
        dailyCheckinHistory: data.dailyCheckinHistory,
        walletSnapshots: data.walletSnapshots.slice(0, 10),
      }
    });
  }

  return res.json({ 
    status: 'Reputation API Ready', 
    version: '2.0',
    endpoints: { GET: ['get', 'canCheckIn', 'history'], POST: ['checkIn', 'claimAdBonus', 'walletScan'] }
  });
});

app.post('/api/reputation', async (req, res) => {
  const { action, uid, walletAddress, walletData } = req.body;

  if (action === 'checkIn') {
    if (!uid) return res.status(400).json({ error: 'Missing uid' });
    
    const data = await getReputationData(uid);
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    if (data.lastCheckInDate === today) {
      return res.status(400).json({ error: 'Already checked in today', lastCheckInDate: data.lastCheckInDate });
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const isConsecutive = data.lastCheckInDate === yesterdayStr;
    const newStreak = isConsecutive ? data.currentStreak + 1 : 1;
    
    let basePoints = 10;
    if (newStreak >= 7) basePoints = 25;
    else if (newStreak >= 3) basePoints = 15;

    const scoreEvent = {
      id: generateId(),
      type: 'daily_checkin',
      points: basePoints,
      timestamp: now.toISOString(),
      description: `Day ${newStreak} check-in`,
      metadata: { streak: newStreak },
    };

    data.checkInScore += basePoints;
    data.totalReputationScore += basePoints;
    data.reputationLevel = calculateLevel(data.totalReputationScore);
    data.currentStreak = newStreak;
    data.longestStreak = Math.max(data.longestStreak, newStreak);
    data.lastCheckInDate = today;
    data.scoreEvents.unshift(scoreEvent);
    data.dailyCheckinHistory.unshift({
      date: today,
      points: basePoints,
      streak: newStreak,
      timestamp: now.toISOString(),
    });
    data.scoreEvents = data.scoreEvents.slice(0, 100);
    data.dailyCheckinHistory = data.dailyCheckinHistory.slice(0, 365);

    await saveReputationData(data);
    console.log(`[CHECK-IN] User ${uid}, Points: ${basePoints}, Streak: ${newStreak}`);

    return res.json({
      success: true,
      data: {
        points: basePoints,
        streak: newStreak,
        totalReputationScore: data.totalReputationScore,
        reputationLevel: data.reputationLevel,
        checkInScore: data.checkInScore,
      }
    });
  }

  if (action === 'claimAdBonus') {
    if (!uid) return res.status(400).json({ error: 'Missing uid' });
    
    const data = await getReputationData(uid);
    const bonusPoints = 5;
    
    const scoreEvent = {
      id: generateId(),
      type: 'ad_bonus',
      points: bonusPoints,
      timestamp: new Date().toISOString(),
      description: 'Ad bonus claimed',
    };

    data.adBonusScore += bonusPoints;
    data.totalReputationScore += bonusPoints;
    data.reputationLevel = calculateLevel(data.totalReputationScore);
    data.scoreEvents.unshift(scoreEvent);
    data.scoreEvents = data.scoreEvents.slice(0, 100);

    await saveReputationData(data);
    console.log(`[AD BONUS] User ${uid}, Points: ${bonusPoints}`);

    return res.json({
      success: true,
      data: {
        points: bonusPoints,
        totalReputationScore: data.totalReputationScore,
        adBonusScore: data.adBonusScore,
      }
    });
  }

  if (action === 'walletScan') {
    if (!uid || !walletAddress) {
      return res.status(400).json({ error: 'Missing uid or walletAddress' });
    }

    const data = await getReputationData(uid);
    const now = Date.now();
    
    const newSnapshot = {
      walletAddress,
      timestamp: now,
      transactionCount: walletData?.transactionCount || 0,
      balance: walletData?.balance || 0,
      contactsCount: walletData?.contactsCount || 0,
      walletAge: walletData?.walletAge || 0,
    };

    const previousSnapshot = data.walletSnapshots[0];
    let deltaPoints = 0;
    const deltaDetails: string[] = [];

    if (!previousSnapshot) {
      if (newSnapshot.transactionCount > 0) {
        const txPoints = Math.min(newSnapshot.transactionCount * 5, 100);
        deltaPoints += txPoints;
        deltaDetails.push(`Initial transactions: +${txPoints}`);
      }
      if (newSnapshot.walletAge > 0) {
        const agePoints = Math.min(Math.floor(newSnapshot.walletAge / 30) * 10, 50);
        deltaPoints += agePoints;
        deltaDetails.push(`Wallet age: +${agePoints}`);
      }
    } else {
      const txDiff = newSnapshot.transactionCount - previousSnapshot.transactionCount;
      if (txDiff > 0) {
        const txPoints = Math.min(txDiff * 5, 50);
        deltaPoints += txPoints;
        deltaDetails.push(`New transactions (${txDiff}): +${txPoints}`);
      }
      const contactsDiff = newSnapshot.contactsCount - previousSnapshot.contactsCount;
      if (contactsDiff > 0) {
        const contactsPoints = Math.min(contactsDiff * 2, 20);
        deltaPoints += contactsPoints;
        deltaDetails.push(`New contacts (${contactsDiff}): +${contactsPoints}`);
      }
    }

    if (deltaPoints > 0) {
      const scoreEvent = {
        id: generateId(),
        type: 'wallet_scan',
        points: deltaPoints,
        timestamp: new Date(now).toISOString(),
        description: deltaDetails.join(', ') || 'Wallet scan',
        metadata: { walletAddress, previousTxCount: previousSnapshot?.transactionCount || 0, newTxCount: newSnapshot.transactionCount },
      };

      data.blockchainScore += deltaPoints;
      data.totalReputationScore += deltaPoints;
      data.reputationLevel = calculateLevel(data.totalReputationScore);
      data.scoreEvents.unshift(scoreEvent);
    }

    data.walletAddress = walletAddress;
    data.lastScanTimestamp = now;
    data.walletSnapshots.unshift(newSnapshot);
    data.walletSnapshots = data.walletSnapshots.slice(0, 50);
    data.scoreEvents = data.scoreEvents.slice(0, 100);

    await saveReputationData(data);
    console.log(`[WALLET SCAN] User ${uid}, Wallet: ${walletAddress}, Delta: ${deltaPoints}`);

    return res.json({
      success: true,
      data: {
        deltaPoints,
        deltaDetails,
        totalReputationScore: data.totalReputationScore,
        reputationLevel: data.reputationLevel,
        blockchainScore: data.blockchainScore,
        lastScanTimestamp: now,
        isFirstScan: !previousSnapshot,
      }
    });
  }

  return res.status(400).json({ error: 'Invalid action' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API Server running at http://0.0.0.0:${PORT}`);
});
