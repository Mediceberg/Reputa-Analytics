import { Redis } from '@upstash/redis'

export default async function handler(req, res) {
  // 1. تحقق من وجود المفاتيح قبل البدء
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    return res.status(500).json({ error: "Missing Environment Variables" });
  }

  const redis = new Redis({ url, token });

  if (req.method === 'GET') {
    return res.status(200).json({ status: "API Ready" });
  }

  try {
    const { username, wallet } = req.body || {};
    
    if (!username) {
       return res.status(400).json({ error: "Username is required" });
    }

    await redis.rpush('registered_pioneers', JSON.stringify({
      username,
      wallet,
      timestamp: new Date().toISOString()
    }));

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Redis Error:", error);
    return res.status(500).json({ error: "Database Connection Failed", message: error.message });
  }
}
