import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'

// استخدام الأسماء التي ظهرت في صورتك لضمان الاتصال
const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

export async function POST(req: Request) {
  try {
    const { username, wallet } = await req.json();
    
    // الحفظ في القائمة
    await redis.lpush('registered_pioneers', JSON.stringify({
      username,
      wallet,
      timestamp: new Date().toISOString()
    }));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
