import { Redis } from '@upstash/redis';

type RedisLike = {
  get: (key: string) => Promise<any>;
  set: (key: string, value: any, options?: any) => Promise<any>;
  del: (key: string) => Promise<any>;
  zrange: (key: string, start: number, stop: number, options?: any) => Promise<any[]>;
  zadd: (key: string, value: any) => Promise<any>;
  zrem: (key: string, member: string) => Promise<any>;
  zcard: (key: string) => Promise<number>;
  lrange: (key: string, start: number, stop: number) => Promise<any[]>;
  lpush: (key: string, value: any) => Promise<any>;
  rpush: (key: string, value: any) => Promise<any>;
  incr: (key: string) => Promise<number>;
};

function createNoopRedisClient(): RedisLike {
  return {
    get: async () => null,
    set: async () => 'OK',
    del: async () => 0,
    zrange: async () => [],
    zadd: async () => 0,
    zrem: async () => 0,
    zcard: async () => 0,
    lrange: async () => [],
    lpush: async () => 0,
    rpush: async () => 0,
    incr: async () => 1,
  };
}

export function createRedisClient() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {

    console.warn('⚠️ Redis credentials are missing. Falling back to in-memory noop cache client.');
    console.warn('📝 To enable Redis caching, add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to your .env file');

    console.warn('⚠️ Redis credentials are missing. Using fallback mode.');
    console.warn('⚠️ To enable Redis caching, set these environment variables:');
    console.warn('   - KV_REST_API_URL=https://<your-vercel-kv-url>.upstash.io');
    console.warn('   - KV_REST_API_TOKEN=<your-vercel-kv-token>');
    console.warn('   OR alternatively:');
    console.warn('   - UPSTASH_REDIS_REST_URL=https://<your-upstash-redis-url>.upstash.io');
    console.warn('   - UPSTASH_REDIS_REST_TOKEN=<your-upstash-redis-token>');

    return createNoopRedisClient();
  }

  try {

    console.log('🔗 Connecting to Upstash Redis...');
    const client = new Redis({
      url,
      token,
      // Add timeout and retry settings
      retry: {
        retries: 3,
        backoff: (attemptIndex: number) => Math.min(attemptIndex * 1000, 5000),
      },
    });

    console.log('✅ Upstash Redis connected successfully');
    return client;
  } catch (error) {
    console.error('❌ Failed to connect to Upstash Redis:', error);

    try {
      const redis = new Redis({ 
        url, 
        token,
      });

      // Test the connection
      await redis.ping();
      console.log('✅ Vercel KV/Redis client initialized and connected');
      return redis;
    } catch (error) {
      console.error('❌ Failed to initialize Redis client:', error);
      console.warn('⚠️ Falling back to in-memory noop cache client');
      return createNoopRedisClient();
    }
}
