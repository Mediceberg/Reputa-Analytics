import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/server/db/mongoModels';
import { createRedisClient } from '@/api/server.redis';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const startTimeSeconds = Math.floor(startTime / 1000);

  try {
    // Test MongoDB connection
    let mongoStatus = 'connected';
    let mongoLatency = 0;
    
    try {
      const mongoStart = Date.now();
      await connectMongoDB();
      mongoLatency = Date.now() - mongoStart;
    } catch (error) {
      mongoStatus = 'error';
      mongoLatency = -1;
      console.error('MongoDB health check failed:', error);
    }

    // Test Redis connection
    let redisStatus = 'connected';
    let redisLatency = 0;
    
    try {
      const redis = createRedisClient();
      const redisStart = Date.now();
      await redis.set('health-check', 'ok', { ex: 60 });
      await redis.get('health-check');
      redisLatency = Date.now() - redisStart;
      
      // Check if it's the noop client
      if (redisLatency === 0) {
        redisStatus = 'noop-fallback';
      }
    } catch (error) {
      redisStatus = 'error';
      redisLatency = -1;
      console.error('Redis health check failed:', error);
    }

    const endTime = Date.now();
    const endTimeSeconds = Math.floor(endTime / 1000);
    const uptime = endTimeSeconds - startTimeSeconds;

    return NextResponse.json({
      success: true,
      mongodb: {
        status: mongoStatus,
        latency: mongoLatency > 0 ? mongoLatency : null
      },
      upstash: {
        status: redisStatus,
        latency: redisLatency > 0 ? redisLatency : null
      },
      uptime: uptime > 0 ? uptime : 0,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });

  } catch (error) {
    console.error('Health check API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Health check failed',
      mongodb: { status: 'error', latency: null },
      upstash: { status: 'error', latency: null },
      uptime: 0,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    }, { status: 500 });
  }
}
