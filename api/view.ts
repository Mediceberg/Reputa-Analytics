import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || '',
  token: process.env.KV_REST_API_TOKEN || '',
});

export default async function handler(req: any, res: any) {
  try {
    // جلب البيانات الخام
    const rawData = await redis.lrange('pioneers', 0, -1);

    // معالجة البيانات بطريقة ذكية جداً
    const formattedData = rawData.map((item: any) => {
      // 1. إذا كان العنصر كائناً جاهزاً، نرجعه كما هو
      if (typeof item === 'object' && item !== null) {
        return item;
      }
      
      // 2. إذا كان نصاً، نحاول تحويله لـ JSON
      if (typeof item === 'string') {
        try {
          return JSON.parse(item);
        } catch (e) {
          // إذا فشل التحويل، نرجعه كنص عادي
          return { text_entry: item };
        }
      }
      
      return item;
    });

    // إرسال النتيجة النهائية
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(formattedData);

  } catch (error: any) {
    return res.status(500).json({ error: "Fetch Error", detail: error.message });
  }
}
