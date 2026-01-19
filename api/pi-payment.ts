import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const PI_API_KEY = process.env.PI_API_KEY; 

export default async function handler(req: any, res: any) {
  // ✅ إضافة رؤوس الاستجابة للسماح بالاتصال (CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

  // ✅ التأكد من استخراج البيانات حتى لو أرسلها المتصفح كـ String
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { paymentId, txid, action, uid } = body;

  try {
    if (action === 'approve') {
      const response = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {
        method: 'POST',
        headers: { 
          'Authorization': `Key ${PI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) return res.status(400).json({ error: "Approval Failed" });
      return res.status(200).json({ success: true });
    }

    if (action === 'complete') {
      const response = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
        method: 'POST',
        headers: { 
          'Authorization': `Key ${PI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ txid })
      });

      if (response.ok) {
        // ✅ ربط الدفع بالمستخدم الفعلي عن طريق الـ UID
        await redis.set(`vip_status:${uid}`, 'active');
        await redis.incr('total_successful_payments');
        return res.status(200).json({ success: true });
      }
    }
    return res.status(400).json({ error: "Invalid action" });
  } catch (error: any) {
    return res.status(500).json({ error: "Internal Error" });
  }
}
