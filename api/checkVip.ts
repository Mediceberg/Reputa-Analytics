// /api/checkVip.ts
import { VercelRequest, VercelResponse } from '@vercel/node'; 
import { Redis } from '@upstash/redis';

// ---- إعداد Redis ----
const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

// ---- دالة التحقق من حالة VIP ----
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { uid } = req.query;

    // التحقق من وجود uid
    if (!uid || typeof uid !== 'string') {
      return res.status(400).json({ error: 'Missing uid' });
    }

    // قراءة حالة VIP من Redis
    const vipStatus = await redis.get(`vip_status:${uid}`);
    const isVip = vipStatus === 'active';

    // إعادة النتيجة
    return res.status(200).json({ isVip });
  } catch (error) {
    console.error('Check VIP Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
