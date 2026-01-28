import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const PI_API_KEY = process.env.PI_API_KEY;
const PI_API_BASE = 'https://api.minepi.com/v2';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    
    // --- تعديل ذكي: تنظيف البيانات لضمان عدم وجود مسافات خفية تسبب خطأ 404 ---
    const paymentId = body.paymentId?.toString().trim();
    const action = body.action?.toString().trim();
    const txid = body.txid?.toString().trim();
    const uid = body.uid;

    if (!paymentId || !action) {
      console.error("[PI-API] Validation Error: Missing paymentId or action");
      return res.status(400).json({ error: "Missing paymentId or action" });
    }

    // بناء الرابط بدقة
    const url = `${PI_API_BASE}/payments/${paymentId}/${action}`;
    
    // تسجيل ذكي للمعلومات لاكتشاف الخلل في Vercel Logs
    console.log(`[PI-API] Attempting ${action} for Payment ID: [${paymentId}]`);
    console.log(`[PI-API] Full Target URL: ${url}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${PI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: action === 'complete' ? JSON.stringify({ txid }) : undefined,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // إذا استمر خطأ 404، فالسيرفر سيطبع لنا التفاصيل بدقة هنا
      console.error(`[PI-API] ${action} Failed with Status ${response.status}:`, data);
      return res.status(response.status).json({ error: data });
    }

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
