/**
 * Database Connectivity Test Script
 * Run: npx tsx scripts/test-db-connection.ts
 *
 * Tests MongoDB (primary) and Upstash/Redis (cache) connections.
 * Prints confirmation messages to the terminal.
 */

import 'dotenv/config';
import { MongoClient } from 'mongodb';
import { Redis } from '@upstash/redis';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'reputa-v3';

async function testMongoDB(): Promise<boolean> {
  console.log('\n─── MongoDB Connection Test ───');
  console.log(`URI: ${MONGODB_URI.replace(/\/\/.*@/, '//***@')}`);
  console.log(`DB:  ${MONGODB_DB_NAME}`);

  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(MONGODB_DB_NAME);
    const result = await db.command({ ping: 1 });

    if (result.ok === 1) {
      console.log('[DATABASE] MongoDB Connected Successfully');

      // List collections
      const collections = await db.listCollections().toArray();
      console.log(`  Collections found: ${collections.length}`);
      collections.forEach(c => console.log(`    - ${c.name}`));

      // Count documents in TrafficUsers if it exists
      try {
        const trafficCount = await db.collection('TrafficUsers').countDocuments({});
        console.log(`  TrafficUsers documents: ${trafficCount}`);
      } catch {
        console.log('  TrafficUsers collection: not yet created (will be auto-created on first user visit)');
      }
    }

    await client.close();
    return true;
  } catch (error: any) {
    console.error('[DATABASE] MongoDB Connection FAILED:', error.message);
    return false;
  }
}

async function testUpstash(): Promise<boolean> {
  console.log('\n─── Upstash/Redis Connection Test ───');

  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn('[CACHE] Upstash credentials not configured. Using noop fallback.');
    console.log('[CACHE] Upstash/Redis Ready (noop mode)');
    return true;
  }

  console.log(`URL: ${url.substring(0, 30)}...`);

  try {
    const redis = new Redis({ url, token });
    await redis.set('test_connection', 'ok', { ex: 10 });
    const val = await redis.get('test_connection');

    if (val === 'ok') {
      console.log('[CACHE] Upstash/Redis Ready');
      await redis.del('test_connection');
      return true;
    } else {
      console.warn('[CACHE] Upstash responded but value mismatch');
      return false;
    }
  } catch (error: any) {
    console.error('[CACHE] Upstash/Redis Connection FAILED:', error.message);
    return false;
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   Reputa Score - DB Connectivity Test    ║');
  console.log('╚══════════════════════════════════════════╝');

  const mongoOk = await testMongoDB();
  const redisOk = await testUpstash();

  console.log('\n─── Summary ───');
  console.log(`MongoDB:  ${mongoOk ? '✅ Connected' : '❌ Failed'}`);
  console.log(`Upstash:  ${redisOk ? '✅ Ready' : '❌ Failed'}`);

  if (mongoOk && redisOk) {
    console.log('\n🚀 All systems operational. Ready to launch.\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some connections failed. Check your .env configuration.\n');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
