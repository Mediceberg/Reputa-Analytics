import { Redis } from '@upstash/redis'
import type { NextApiRequest, NextApiResponse } from 'next'

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // للتأكد من أن الرابط يعمل برمجياً وليس كصفحة
  if (req.method === 'GET') {
    return res.status(200).json({ status: "API is alive" });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, wallet } = req.body;
    await redis.rpush('registered_pioneers', JSON.stringify({
      username,
      wallet,
      timestamp: new Date().toISOString()
    }));
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Database connection failed' });
  }
}
