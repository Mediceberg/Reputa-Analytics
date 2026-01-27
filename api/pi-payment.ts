import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const PI_API_KEY = process.env.PI_API_KEY;
// التأكد من الرابط الصحيح للتست نت بدون تكرار https
const PI_API_BASE = 'https://api.testnet.minepi.com/v2';

export default async function handler(req: any, res: any) {
  // إعدادات CORS
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

    // بناء رابط الطلب
    const url = `${PI_API_BASE}/payments/${paymentId}/${action}`;
    console.log(`[PI-API] Calling: ${action} for payment: ${paymentId}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${PI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      // في خطوة complete يجب إرسال txid في جسم الطلب (body)
      body: action === 'complete' ? JSON.stringify({ txid }) : undefined,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error(`[PI-API] ${action} Failed:`, data);
      return res.status(response.status).json({ error: data });
    }

    // إذا اكتملت الدفعة، سجلها في Redis لزيادة العداد
    if (action === 'complete') {
      console.log(`[PI-API] Payment ${paymentId} completed successfully!`);
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
