import { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

// إعداد Redis باستخدام المتغيرات البيئية تلقائياً
const redis = Redis.fromEnv();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. التحقق من طريقة الطلب (فقط POST مسموح به للحفظ)
  if (req.method === 'GET') {
    return res.status(200).json({ status: "API Ready", endpoints: ["pioneer", "feedback"] });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // جلب البيانات من الجسم (Body) وتحديد "النوع" لمعرفة ماذا سنحفظ
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { type, username, wallet, text, timestamp } = body;

    // --- المسار الأول: حفظ بيانات المستخدم (Pioneer) ---
    if (type === 'pioneer') {
      if (!username) return res.status(400).json({ error: "Username is required" });

      // تنظيف عنوان المحفظة
      const cleanWallet = wallet ? wallet.trim().replace(/[^a-zA-Z0-9_]/g, "") : "";

      const userData = JSON.stringify({
        username: username.trim(),
        wallet: cleanWallet,
        timestamp: timestamp || new Date().toISOString()
      });

      // تنفيذ الحفظ المتعدد في Redis
      await redis.lpush('pioneers', userData);
      await redis.rpush('registered_pioneers', userData);
      await redis.incr('total_pioneers');

      console.log(`[SAVE] Pioneer stored: ${username}`);
      return res.status(200).json({ success: true, message: "Pioneer saved" });
    }

    // --- المسار الثاني: حفظ التعليقات (Feedback) ---
    if (type === 'feedback') {
      if (!text) return res.status(400).json({ error: "Feedback text is required" });

      const feedbackData = JSON.stringify({
        username: username || "Anonymous",
        text: text.trim(),
        timestamp: timestamp || new Date().toISOString()
      });

      await redis.lpush('feedbacks', feedbackData);
      
      console.log(`[SAVE] Feedback stored from: ${username}`);
      return res.status(200).json({ success: true, message: "Feedback saved" });
    }

    // إذا لم يتم تحديد النوع بشكل صحيح
    return res.status(400).json({ error: "Invalid data type. Use 'pioneer' or 'feedback'." });

  } catch (error: any) {
    console.error("Database Error:", error);
    return res.status(500).json({ error: "Database Connection Failed", message: error.message });
  }
}
