import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

// الاتصال التلقائي باستخدام المتغيرات التي أضافها Vercel الآن
const redis = Redis.fromEnv();

export async function POST(req: Request) {
  try {
    const { username, wallet } = await req.json();

    // حفظ بيانات الرائد في قائمة 'registered_pioneers'
    // هذا سيساعدك في إثبات شرط الـ 5 رواد لحجز الدومين reputa.pi
    await redis.lpush('registered_pioneers', JSON.stringify({
      username,
      wallet,
      timestamp: new Date().toISOString()
    }));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Database Connection Failed' }, { status: 500 });
  }
}
