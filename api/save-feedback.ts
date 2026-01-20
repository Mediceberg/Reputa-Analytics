import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();

  const { username, text, timestamp } = req.body;

  try {
    // حفظ التعليق في قائمة (List) تسمى feedbacks
    await redis.lpush('feedbacks', JSON.stringify({ username, text, timestamp }));
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Database error' });
  }
}
