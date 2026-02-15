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
  scan: (cursor: number, options?: { match?: string; count?: number }) => Promise<[string, string[]]>;
  smembers: (key: string) => Promise<string[]>;
  keys: (pattern: string) => Promise<string[]>;
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
    scan: async () => ['0', []],
    smembers: async () => [],
    keys: async () => [],
  };
}

export async function createRedisClient() {
  // Check both KV_REST_API_URL and UPSTASH_REDIS_REST_URL for compatibility
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn('⚠️ Redis credentials missing. Set KV_REST_API_URL + KV_REST_API_TOKEN or UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN');
    return createNoopRedisClient();
  }

  try {
    console.log('🔗 Connecting to Upstash Redis...');
    const client = new Redis({
      url,
      token,
      retry: {
        retries: 3,
        backoff: (attemptIndex: number) => Math.min(attemptIndex * 1000, 5000),
      },
    });

    // Verify connection with a ping
    await client.ping();
    console.log('✅ Upstash Redis connected and verified');
    return client as unknown as RedisLike;
  } catch (error) {
    console.error('❌ Failed to connect to Upstash Redis:', error);
    console.warn('⚠️ Falling back to noop cache client');
    return createNoopRedisClient();
  }
}
