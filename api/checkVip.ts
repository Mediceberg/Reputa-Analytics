// /api/checkVip.ts
import { VercelRequest, VercelResponse } from '@vercel/node'; 
import { Redis } from '@upstash/redis';

// ---- إعداد Redis ----
const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

// ---- دالة التحقق من حالة VIP وعدد المعاملات ----
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { uid } = req.query;

    // التحقق من وجود uid
    if (!uid || typeof uid !== 'string') {
      return res.status(400).json({ error: 'Missing uid' });
    }

    // 1. قراءة حالة VIP من Redis
    const vipStatus = await redis.get(`vip_status:${uid}`);
    const isVip = vipStatus === 'active';

    // 2. قراءة عدد المعاملات الناجحة للمستخدم
    // نستخدم مفتاحاً خاصاً لكل مستخدم يتم زيادته عند كل عملية دفع ناجحة
    const txCount = await redis.get(`tx_count:${uid}`);
    
    // تحويل القيمة إلى رقم، وإذا لم توجد نعتبرها 0
    const count = parseInt(txCount as string) || 0;

    // إعادة النتيجة الشاملة
    return res.status(200).json({ 
      isVip, 
      count 
    });

  } catch (error) {
    console.error('Check VIP Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
