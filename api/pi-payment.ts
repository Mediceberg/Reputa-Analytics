import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const PI_API_KEY = process.env.PI_API_KEY;
const PI_API_BASE = 'https://api.testnet.minepi.com/v2';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { paymentId, txid, action, uid } = body || {};

    if (!paymentId || !action) {
      return res.status(400).json({ error: "Missing paymentId or action" });
    }

    // بناء الرابط بناءً على الإجراء المطلوب (approve أو complete)
    const url = `${PI_API_BASE}/payments/${paymentId}/${action}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${PI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      // إرسال txid فقط في حالة الـ complete
      body: action === 'complete' ? JSON.stringify({ txid }) : undefined,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error(`[PI-API] ${action} Failed:`, data);
      return res.status(response.status).json({ error: data });
    }

    // إذا اكتملت الدفعة بنجاح
    if (action === 'complete') {
      if (uid) {
        await redis.set(`vip_status:${uid}`, 'active');
        await redis.incr('total_successful_payments');
      }
    }

    return res.status(200).json({ success: true, data });

  } catch (error: any) {
    console.error('[SERVER ERROR]:', error);
    return res.status(500).json({ error: error.message });
  }
}
