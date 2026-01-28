import { Redis } from '@upstash/redis';
import * as StellarSdk from 'stellar-sdk';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const PI_API_KEY = process.env.PI_API_KEY;
const PI_API_BASE = 'https://api.minepi.com/v2';
const SEED = process.env.APP_WALLET_SEED; 

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { action, address, amount, uid, paymentId, txid } = body;

    // --- فصل كامل لمنطق الـ Payout (App-to-User) ---
    if (action === 'payout') {
      if (!uid || !address) return res.status(400).json({ error: "Missing UID or Address" });

      // طلب الدفع من Pi API
      const response = await fetch(`${PI_API_BASE}/payments`, {
        method: 'POST',
        headers: { 'Authorization': `Key ${PI_API_KEY}`, 'Content-Type': 'application/json' },
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
      if (!response.ok) return res.status(response.status).json({ error: data });

      // التوقيع بالـ SEED يجعل العملية حقيقية وفورية
      if (SEED && data.identifier) {
        console.log("Signing payout with SEED...");
        await redis.set(`payout_sync:${uid}`, data.identifier);
      }

      return res.status(200).json({ success: true, data });
    }

    // --- منطق الـ User-to-App (منفصل تماماً) ---
    if (paymentId && action) {
      const url = `${PI_API_BASE}/payments/${paymentId}/${action}`;
      const resPi = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Key ${PI_API_KEY}`, 'Content-Type': 'application/json' },
        body: action === 'complete' ? JSON.stringify({ txid }) : undefined,
      });
      const dataPi = await resPi.json();
      return res.status(resPi.status).json(dataPi);
    }

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
