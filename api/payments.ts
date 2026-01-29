/**
 * Consolidated Payments API
 * Handles all payment-related operations: approve, complete, payout, send-pi
 * Single endpoint with action routing
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || '',
  token: process.env.KV_REST_API_TOKEN || '',
});

const PI_API_KEY = process.env.PI_API_KEY;
const PI_API_BASE = 'https://api.minepi.com/v2';

function setCorsHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
}

async function handleApprove(paymentId: string, res: VercelResponse) {
  if (!paymentId) {
    return res.status(400).json({ error: 'Missing paymentId' });
  }

  try {
    const piResponse = await fetch(`https://api.mine.pi/v2/payments/${paymentId}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${PI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await piResponse.json();
    console.log(`[APPROVE SUCCESS] Payment ${paymentId} approved`);
    
    return res.status(200).json({
      approved: true,
      ...data
    });
  } catch (error: any) {
    console.error('[APPROVE ERROR]', error.message);
    return res.status(500).json({ 
      error: 'Approval failed',
      details: error.message 
    });
  }
}

async function handleComplete(body: any, res: VercelResponse) {
  const { paymentId, txid, userId, amount } = body;

  if (!paymentId || !txid || !userId) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      completed: false 
    });
  }

  console.log(`[COMPLETE] Payment ${paymentId}, TXID: ${txid}, User: ${userId}`);

  const subscriptionData = {
    userId,
    paymentId,
    txid,
    amount,
    type: 'vip_subscription',
    status: 'completed',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    reputationBonus: 50
  };

  console.log('[SUBSCRIPTION UPDATED]', subscriptionData);

  return res.status(200).json({
    completed: true,
    subscription: subscriptionData,
    message: 'VIP subscription activated successfully'
  });
}

async function handlePayout(body: any, res: VercelResponse) {
  const { address, amount, uid } = body;

  if (!uid || !address) {
    return res.status(400).json({ error: "Missing UID or Address" });
  }

  try {
    const response = await fetch(`${PI_API_BASE}/payments`, {
      method: 'POST',
      headers: { 
        'Authorization': `Key ${PI_API_KEY}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        payment: {
          amount: amount || 0.01,
          memo: "Reward Payout",
          metadata: { type: "payout" },
          uid: uid,
          recipient_address: address
        }
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data });
    }

    if (data.identifier) {
      await redis.set(`payout_sync:${uid}`, data.identifier);
    }

    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

async function handleSendPi(body: any, res: VercelResponse) {
  const { amount, cleanAddress, recipientUid, responseData, responseOk } = body;

  if (!responseOk) {
    return res.status(400).json({ success: false, message: "Response not okay" });
  }

  try {
    const now = new Date();
    const txTimestamp = now.toISOString();
    
    const isDexSwap = parseFloat(amount) === 3.14; 
    const txType = isDexSwap ? "Pi DEX Swap" : "Sent";
    const subType = isDexSwap ? "Ecosystem Exchange" : "Wallet Transfer";

    const transactionDetail = JSON.stringify({
      id: responseData?.identifier ? (responseData.identifier as string).substring(0, 8) : Math.random().toString(36).substring(2, 10),
      type: txType,
      subType: subType,
      amount: parseFloat(amount).toFixed(2),
      status: "Success",
      exactTime: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      dateLabel: "Today", 
      timestamp: txTimestamp,
      to: cleanAddress
    });

    await redis.lpush(`history:${cleanAddress}`, transactionDetail);
    await redis.ltrim(`history:${cleanAddress}`, 0, 9);
    await redis.incr(`tx_count:${cleanAddress}`);
    if (recipientUid) {
      await redis.incr(`tx_count:${recipientUid}`);
    }
    await redis.incr('total_app_transactions');
    
    return res.status(200).json({ success: true, data: responseData });
  } catch (error) {
    console.error("Error processing transaction:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

async function handlePiAction(paymentId: string, action: string, txid?: string, res?: VercelResponse) {
  const url = `${PI_API_BASE}/payments/${paymentId}/${action}`;
  const resPi = await fetch(url, {
    method: 'POST',
    headers: { 
      'Authorization': `Key ${PI_API_KEY}`, 
      'Content-Type': 'application/json' 
    },
    body: action === 'complete' ? JSON.stringify({ txid }) : undefined,
  });
  const dataPi = await resPi.json();
  return res?.status(resPi.status).json(dataPi);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { action, paymentId, txid } = body;

    switch (action) {
      case 'approve':
        return handleApprove(paymentId, res);
      
      case 'complete':
        return handleComplete(body, res);
      
      case 'payout':
        return handlePayout(body, res);
      
      case 'send':
        return handleSendPi(body, res);
      
      default:
        if (paymentId && action) {
          return handlePiAction(paymentId, action, txid, res);
        }
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error: any) {
    console.error('[PAYMENTS ERROR]', error);
    return res.status(500).json({ error: error.message });
  }
}
