import 'dotenv/config';
import { MongoClient } from 'mongodb';
import { Redis } from '@upstash/redis';

async function debugFetch() {
  const startTime = Date.now();
  console.log('🚀 Starting Direct Data Extraction Test...\n');

  // Connect to MongoDB
  console.log('📡 Connecting to MongoDB...');
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGODB_URI not set');
    return;
  }
  const mongoClient = new MongoClient(mongoUri);
  await mongoClient.connect();
  const db = mongoClient.db('reputa-v3');

  // Connect to Upstash
  console.log('🔗 Connecting to Upstash KV...');
  const redis = new Redis({
    url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  try {
    // 1. Extract from MongoDB Collections
    console.log('\n📊 MONGODB EXTRACTION:');
    console.log('=' .repeat(50));

    const usersCollection = db.collection('final_users_v3');
    const userv3Collection = db.collection('userv3');
    const rawdatasCollection = db.collection('rawdatas');
    const reputationCollection = db.collection('ReputationScores');

    console.log('📋 First 5 records from final_users_v3:');
    const users = await usersCollection.find({}).limit(5).toArray();
    users.forEach((user, i) => {
      console.log(`${i + 1}. PioneerID: ${user.pioneerId}, Username: ${user.username}, Email: ${user.email}, Wallet: ${user.walletAddress}`);
    });

    console.log('\n📋 First 5 records from userv3:');
    const userv3 = await userv3Collection.find({}).limit(5).toArray();
    userv3.forEach((user, i) => {
      console.log(`${i + 1}. PioneerID: ${user.pioneerId}, Username: ${user.username}, Wallet: ${user.walletAddress}`);
    });

    console.log('\n📋 First 5 records from rawdatas (reputation_v2):');
    const rawdatas = await rawdatasCollection.find({ key: { $regex: /^reputation_v2:/ } }).limit(5).toArray();
    rawdatas.forEach((raw, i) => {
      let val = raw.value;
      if (typeof val === 'string') {
        try {
          val = JSON.parse(val);
        } catch (e) {
          // keep as is
        }
      }
      const username = val?.username || (Array.isArray(val) ? val[1] : null) || 'N/A';
      const score = Array.isArray(val) ? val[0] : (val?.score || val?.reputationScore || 0);
      const wallet = val?.wallet || val?.address || (Array.isArray(val) ? val[2] : null) || 'N/A';
      console.log(`${i + 1}. Key: ${raw.key}, Username: ${username}, Score: ${score}, Wallet: ${wallet}, Raw Value Type: ${typeof raw.value}`);
    });

    console.log('\n🏆 First 5 records from ReputationScores:');
    const reputations = await reputationCollection.find({}).limit(5).toArray();
    reputations.forEach((rep, i) => {
      console.log(`${i + 1}. PioneerID: ${rep.pioneerId}, Score: ${rep.totalReputationScore}, Level: ${rep.reputationLevel}`);
    });

    // 2. Extract from Upstash KV
    console.log('\n⚡ UPSTASH KV EXTRACTION:');
    console.log('=' .repeat(50));

    let upstashKeys: string[] = [];
    try {
      // Get all keys (this might be limited, get first 5 reputation keys)
      upstashKeys = await redis.keys('reputation:*');
      console.log(`📋 First 5 reputation keys from Upstash:`);
      const firstRepKeys = upstashKeys.slice(0, 5);
      for (const key of firstRepKeys) {
        const data = await redis.get(key);
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        console.log(`Key: ${key}, Username: ${parsed?.username}, Score: ${parsed?.reputationScore}`);
      }
    } catch (error) {
      console.error('❌ Upstash connection failed:', error instanceof Error ? error.message : String(error));
      console.log('Continuing with MongoDB data only...');
    }

    // 3. Filtering and Merging Test
    console.log('\n🔍 FILTERING & MERGING TEST:');
    console.log('=' .repeat(50));

    // Find a common username (use first user from MongoDB)
    const testUser = users[0];
    if (testUser) {
      console.log(`Testing merge for username: ${testUser.username} (PioneerID: ${testUser.pioneerId})`);

      // Get from MongoDB
      const mongoUser = await usersCollection.findOne({ pioneerId: testUser.pioneerId });
      const mongoRep = await reputationCollection.findOne({ pioneerId: testUser.pioneerId });

      // Get from Upstash
      let upstashRep = null;
      let vipStatus = null;
      try {
        upstashRep = await redis.get(`reputation:${testUser.pioneerId}`);
        vipStatus = await redis.get(`vip_status:${testUser.pioneerId}`);
      } catch (error) {
        console.log('Upstash not available for merging test');
      }

      // Merge
      const merged = {
        pioneerId: testUser.pioneerId,
        username: mongoUser?.username || 'N/A',
        email: mongoUser?.email || 'N/A',
        walletAddress: mongoUser?.walletAddress || mongoRep?.legacy?.walletAddress || 'N/A',
        reputationScore: mongoRep?.totalReputationScore || 0,
        appScore: mongoRep?.appEngagementScore || 0,
        vipStatus: vipStatus === 'active',
        source: {
          mongodb: !!mongoUser,
          upstash: !!upstashRep
        }
      };

      console.log('📋 MERGED OBJECT:');
      console.log(JSON.stringify(merged, null, 2));
    }

    // 4. Report
    console.log('\n📈 FINAL REPORT:');
    console.log('=' .repeat(50));

    const mongoUsersCount = await usersCollection.countDocuments();
    const mongoUserv3Count = await userv3Collection.countDocuments();
    const mongoRawdatasCount = await rawdatasCollection.countDocuments();
    const mongoRepCount = await reputationCollection.countDocuments();
    let totalUpstashKeys = 0;
    try {
      totalUpstashKeys = (await redis.keys('*')).length;
    } catch (error) {
      // ignore
    }
    const consolidationTime = Date.now() - startTime;

    console.log(`MongoDB final_users_v3: ${mongoUsersCount} records`);
    console.log(`MongoDB userv3: ${mongoUserv3Count} records`);
    console.log(`MongoDB rawdatas: ${mongoRawdatasCount} records`);
    console.log(`MongoDB ReputationScores: ${mongoRepCount} records`);
    console.log(`Upstash KV total keys: ${totalUpstashKeys}`);
    console.log(`Consolidation time: ${consolidationTime}ms`);

    if (mongoUsersCount > 0) {
      console.log('✅ MongoDB connection successful');
    }
    if (totalUpstashKeys > 0) {
      console.log('✅ Upstash KV connection successful');
    }

  } catch (error) {
    console.error('❌ Error during extraction:', error);
  } finally {
    await mongoClient.close();
  }
}

debugFetch().catch(console.error);
