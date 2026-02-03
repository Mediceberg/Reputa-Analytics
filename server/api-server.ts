import express from 'express';   
import cors from 'cors';
import { Redis } from '@upstash/redis';
import protocol from './reputa/protocol';
// Start Reputa cron jobs (fetch & weekly merge placeholders)
import './reputa/cron';

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

async function writePointsLog(userId: string, payload: any) {
  try {
    const id = generateId();
    const key = `points_log:${id}`;
    const entry = { id, userId, ...payload };
    await redis.set(key, JSON.stringify(entry));
    // also push to user-specific list for quick lookup
    try {
      await (redis as any).lpush(`points_logs:${userId}`, id);
    } catch (e) {
      // not critical if lpush missing
    }
    return entry;
  } catch (error) {
    console.error('[POINTS_LOG] write error', error);
    return null;
  }
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
  try {
    return protocol.calculateLevelFromPoints(score);
  } catch (e) {
    return 1;
  }
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

    // persist points log
    await writePointsLog(uid, {
      source_type: 'ad_bonus',
      points: bonusPoints,
      timestamp: scoreEvent.timestamp,
      metadata: { description: scoreEvent.description }
    });

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

    const previousSnapshot = data.walletSnapshots[0] || null;
    const { delta, details } = protocol.walletScanDelta(previousSnapshot, newSnapshot);

    if (delta > 0) {
      const scoreEvent = {
        id: generateId(),
        type: 'wallet_scan',
        points: delta,
        timestamp: new Date(now).toISOString(),
        description: details.join(', ') || 'Wallet scan',
        metadata: { walletAddress, previousTxCount: previousSnapshot?.transactionCount || 0, newTxCount: newSnapshot.transactionCount },
      };

      data.blockchainScore += delta;
      data.totalReputationScore += delta;
      data.reputationLevel = calculateLevel(data.totalReputationScore);
      data.scoreEvents.unshift(scoreEvent);

      // persist points log
      await writePointsLog(uid, {
        source_type: 'wallet_scan',
        walletAddress,
        points: delta,
        timestamp: scoreEvent.timestamp,
        metadata: scoreEvent.metadata,
      });
    }

    data.walletAddress = walletAddress;
    data.lastScanTimestamp = now;
    data.walletSnapshots.unshift(newSnapshot);
    data.walletSnapshots = data.walletSnapshots.slice(0, 50);
    data.scoreEvents = data.scoreEvents.slice(0, 100);

    await saveReputationData(data);
    console.log(`[WALLET SCAN] User ${uid}, Wallet: ${walletAddress}, Delta: ${delta}`);

    return res.json({
      success: true,
      data: {
        deltaPoints: delta,
        deltaDetails: details,
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

// Admin endpoints: weekly merge trigger and manual adjustments
app.post('/api/admin/weekly-merge', async (req, res) => {
  const adminKey = req.headers['x-admin-key'] || req.body.adminKey;
  if (process.env.ADMIN_KEY && adminKey !== process.env.ADMIN_KEY) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const { weeklyMerge } = await import('./reputa/cron');
    await weeklyMerge();
    return res.json({ success: true, message: 'Weekly merge triggered' });
  } catch (err) {
    console.error('[ADMIN] weekly-merge error', err);
    return res.status(500).json({ error: 'Failed to run weekly merge' });
  }
});

app.post('/api/admin/adjust', async (req, res) => {
  const adminKey = req.headers['x-admin-key'] || req.body.adminKey;
  if (process.env.ADMIN_KEY && adminKey !== process.env.ADMIN_KEY) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { uid, points, reason } = req.body;
  if (!uid || typeof points !== 'number') return res.status(400).json({ error: 'Missing uid or points' });

  try {
    const data = await getReputationData(uid);
    data.totalReputationScore += points;
    data.reputationLevel = calculateLevel(data.totalReputationScore);

    const now = new Date().toISOString();
    const scoreEvent = { id: generateId(), type: 'admin_adjust', points, timestamp: now, description: reason || 'Manual adjust' };
    data.scoreEvents.unshift(scoreEvent);

    await saveReputationData(data);
    await writePointsLog(uid, { source_type: 'admin_adjust', points, timestamp: now, metadata: { reason } });

    return res.json({ success: true, totalReputationScore: data.totalReputationScore, reputationLevel: data.reputationLevel });
  } catch (err) {
    console.error('[ADMIN] adjust error', err);
    return res.status(500).json({ error: 'Failed to adjust user' });
  }
});

// Pi Network Payment API - VIP payments and verification
const PI_API_KEY = process.env.PI_API_KEY || '';
const PI_API_URL = 'https://api.minepi.com';

interface PaymentRecord {
  paymentId: string;
  uid: string;
  amount: number;
  status: 'pending' | 'approved' | 'completed' | 'cancelled';
  txid?: string;
  createdAt: string;
  updatedAt: string;
}

async function getPaymentRecord(paymentId: string): Promise<PaymentRecord | null> {
  try {
    const data = await redis.get<PaymentRecord>(`payment:${paymentId}`);
    return data;
  } catch (error) {
    console.error('[PAYMENT] Redis get error:', error);
    return null;
  }
}

async function savePaymentRecord(record: PaymentRecord): Promise<boolean> {
  try {
    record.updatedAt = new Date().toISOString();
    await redis.set(`payment:${record.paymentId}`, JSON.stringify(record), { ex: 86400 * 30 });
    return true;
  } catch (error) {
    console.error('[PAYMENT] Redis set error:', error);
    return false;
  }
}

async function approvePaymentOnPiNetwork(paymentId: string): Promise<boolean> {
  if (!PI_API_KEY) {
    console.warn('[PAYMENT] No PI_API_KEY configured, skipping server approval');
    return true;
  }
  
  try {
    const response = await fetch(`${PI_API_URL}/v2/payments/${paymentId}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${PI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      console.log('[PAYMENT] Approved on Pi Network:', paymentId);
      return true;
    } else {
      const errorData = await response.text();
      console.error('[PAYMENT] Pi Network approval failed:', response.status, errorData);
      return false;
    }
  } catch (error) {
    console.error('[PAYMENT] Pi Network approval error:', error);
    return false;
  }
}

async function completePaymentOnPiNetwork(paymentId: string, txid: string): Promise<boolean> {
  if (!PI_API_KEY) {
    console.warn('[PAYMENT] No PI_API_KEY configured, skipping server completion');
    return true;
  }
  
  try {
    const response = await fetch(`${PI_API_URL}/v2/payments/${paymentId}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${PI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ txid }),
    });
    
    if (response.ok) {
      console.log('[PAYMENT] Completed on Pi Network:', paymentId, 'TxID:', txid);
      return true;
    } else {
      const errorData = await response.text();
      console.error('[PAYMENT] Pi Network completion failed:', response.status, errorData);
      return false;
    }
  } catch (error) {
    console.error('[PAYMENT] Pi Network completion error:', error);
    return false;
  }
}

async function grantVIPAccess(uid: string): Promise<boolean> {
  try {
    const vipData = {
      uid,
      active: true,
      grantedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    await redis.set(`vip:${uid}`, JSON.stringify(vipData), { ex: 86400 * 31 });
    console.log('[VIP] Access granted to:', uid);
    return true;
  } catch (error) {
    console.error('[VIP] Grant error:', error);
    return false;
  }
}

app.post('/api/payments', async (req, res) => {
  const { action, paymentId, uid, txid, amount } = req.body;
  
  console.log('[PAYMENT] Request:', { action, paymentId, uid, txid });

  if (action === 'approve') {
    if (!paymentId || !uid) {
      return res.status(400).json({ error: 'Missing paymentId or uid' });
    }

    const record: PaymentRecord = {
      paymentId,
      uid,
      amount: amount || 1,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await savePaymentRecord(record);
    
    const approved = await approvePaymentOnPiNetwork(paymentId);
    
    if (approved) {
      record.status = 'approved';
      await savePaymentRecord(record);
      console.log('[PAYMENT] Approved:', paymentId, 'for user:', uid);
      return res.json({ success: true, message: 'Payment approved' });
    } else {
      return res.status(500).json({ error: 'Failed to approve payment on Pi Network' });
    }
  }

  if (action === 'complete') {
    if (!paymentId || !txid) {
      return res.status(400).json({ error: 'Missing paymentId or txid' });
    }

    let record = await getPaymentRecord(paymentId);
    
    if (!record) {
      record = {
        paymentId,
        uid: uid || 'unknown',
        amount: 1,
        status: 'approved',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    
    const completed = await completePaymentOnPiNetwork(paymentId, txid);
    
    if (completed) {
      record.status = 'completed';
      record.txid = txid;
      await savePaymentRecord(record);
      
      if (record.uid && record.uid !== 'unknown') {
        await grantVIPAccess(record.uid);
      }
      
      console.log('[PAYMENT] Completed:', paymentId, 'TxID:', txid);
      return res.json({ success: true, message: 'Payment completed', txid });
    } else {
      return res.status(500).json({ error: 'Failed to complete payment on Pi Network' });
    }
  }

  if (action === 'cancel') {
    if (!paymentId) {
      return res.status(400).json({ error: 'Missing paymentId' });
    }
    
    const record = await getPaymentRecord(paymentId);
    if (record) {
      record.status = 'cancelled';
      await savePaymentRecord(record);
    }
    
    console.log('[PAYMENT] Cancelled:', paymentId);
    return res.json({ success: true, message: 'Payment cancelled' });
  }

  return res.status(400).json({ error: 'Invalid action' });
});

app.get('/api/vip-status', async (req, res) => {
  const { uid } = req.query as { uid?: string };
  
  if (!uid) {
    return res.status(400).json({ error: 'Missing uid' });
  }
  
  try {
    const vipData = await redis.get<{ active: boolean; expiresAt: string }>(`vip:${uid}`);
    
    if (vipData && vipData.active) {
      const isValid = new Date(vipData.expiresAt) > new Date();
      return res.json({ 
        success: true, 
        isVIP: isValid, 
        expiresAt: vipData.expiresAt 
      });
    }
    
    return res.json({ success: true, isVIP: false });
  } catch (error) {
    console.error('[VIP] Status check error:', error);
    return res.json({ success: true, isVIP: false });
  }
});

const PORT = 3001;

// App-to-User Payment (Developer Only)
app.post('/api/payments/app-to-user', async (req, res) => {
  const { uid, amount } = req.body;
  const SEED = process.env.APP_WALLET_SEED;
  const API_KEY = process.env.PI_API_KEY;

  if (!SEED || !API_KEY) {
    return res.status(500).json({ error: 'Server configuration missing' });
  }

  try {
    const response = await fetch(`${PI_API_URL}/v2/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payment: {
          amount: amount || 0.1,
          memo: "Developer Payout",
          metadata: { type: "payout" },
          uid: uid
        }
      })
    });

    const data = await response.json();
    if (response.ok) {
      // Note: Real App-to-User requires signing with seed, 
      // but for now we initiate the request.
      res.json({ success: true, txid: data.identifier });
    } else {
      res.status(400).json({ error: data.message || 'Payment failed' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API Server running at http://0.0.0.0:${PORT}`);
});
