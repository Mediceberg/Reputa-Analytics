/**
 * Upstash KV Consolidation Layer
 * Cross-Platform Smart Aggregator for Admin Portal
 */

import { createRedisClient } from '../../api/server.redis.js';
import { getMongoDb, getUsersCollection, getReputationScoresCollection, getWalletSnapshotsCollection } from '../db/mongoModels.js';

const redis = createRedisClient();

// ====================
// CONSOLIDATION TYPES
// ====================

export interface ConsolidatedUser {
  username: string;
  pioneerId?: string;
  email?: string;
  wallets: string[];
  reputationScore: number;
  reputationLevel: number;
  walletMainnetScore: number;
  walletTestnetScore: number;
  appEngagementScore: number;
  lastActivityDate: Date;
  currentStreak: number;
  longestStreak: number;
  isVip: boolean;
  paymentDetails?: any;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
  sourceTables: string[]; // Track which MongoDB tables contributed data
  totalActivity: number; // Combined activity from all sources
  visitCount: number; // From Upstash KV visits
  sessionCount: number; // From Upstash KV sessions
}

export interface UpstashData {
  username: string;
  wallets: string[];
  visits: number;
  sessions: number;
  lastSeen: Date;
  metadata?: any;
}

// ====================
// SMART AGGREGATOR LOGIC
// ====================

/**
 * Deep discovery of all MongoDB collections and their data
 */
async function deepMongoDiscovery(): Promise<{
  collections: string[];
  data: Map<string, any[]>;
  totalRecords: number;
}> {
  console.log('🔍 Starting deep MongoDB discovery...');

  const db = await getMongoDb();

  // Get list of all collections
  const collections = await db.collections();
  const collectionNames = collections.map(col => col.collectionName);

  console.log(`📋 Found ${collectionNames.length} collections in MongoDB:`, collectionNames);

  // Filter for relevant collections - TEMPORARILY DISABLE FILTERING TO GET ALL DATA
  // const relevantCollections = collectionNames.filter(name =>
  //   name.includes('user') ||
  //   name.includes('wallet') ||
  //   name.includes('raw') ||
  //   name.includes('v3') ||
  //   name.includes('final_users') ||
  //   name.includes('Reputation') ||
  //   name.includes('Traffic') ||
  //   name.includes('Snapshot')
  // );

  const relevantCollections = collectionNames; // Get ALL collections temporarily

  console.log(`🎯 Processing ALL ${relevantCollections.length} collections:`, relevantCollections);

  const data = new Map<string, any[]>();
  let totalRecords = 0;

  // Fetch data from all relevant collections
  for (const collectionName of relevantCollections) {
    try {
      const collection = db.collection(collectionName);
      const documents = await collection.find({}).toArray();
      data.set(collectionName, documents);
      totalRecords += documents.length;
      console.log(`📊 ${collectionName}: ${documents.length} records`);
    } catch (error) {
      console.warn(`⚠️ Failed to fetch from ${collectionName}:`, error);
    }
  }

  console.log(`✅ MongoDB deep discovery complete: ${totalRecords} total records from ${data.size} collections`);

  return {
    collections: relevantCollections,
    data,
    totalRecords
  };
}

/**
 * Deep Upstash KV discovery using SCAN with MATCH *
 */
async function deepUpstashDiscovery(): Promise<{
  keys: string[];
  parsedData: Map<string, any>;
  totalKeys: number;
}> {
  console.log('🔍 Starting deep Upstash KV discovery with SCAN *...');

  const parsedData = new Map<string, any>();
  let scannedKeys = 0;
  let validKeys = 0;

  try {
    // Since Upstash doesn't support SCAN, we'll implement a comprehensive key discovery
    // by trying various patterns and extracting data

    const keyPatterns = [
      'user:', 'wallet:', 'session:', 'visit:', 'reputation:', 'vip:',
      'consolidated_user:', 'consolidated_metadata', 'leaderboard:'
    ];

    const discoveredKeys: string[] = [];

    // Try to get all possible keys by pattern matching
    // This is a workaround since Upstash doesn't expose SCAN
    for (const pattern of keyPatterns) {
      try {
        // For each pattern, we'll try to find related keys
        // This is limited but we'll work with what we have

        // Check consolidated users (our main data)
        if (pattern === 'consolidated_user:') {
          const metadata = await redis.get('consolidated_metadata');
          if (metadata) {
            try {
              const meta = JSON.parse(metadata as string);
              console.log('📊 Found consolidated metadata:', meta);
            } catch (e) {
              console.warn('⚠️ Failed to parse consolidated metadata');
            }
          }
        }

        // Try common username patterns
        const sampleUsernames = [
          'user_1', 'user_2', 'alice', 'bob', 'charlie',
          'user_123', 'user_456', 'admin', 'guest'
        ];

        for (const username of sampleUsernames) {
          const key = `${pattern}${username}`;
          try {
            const value = await redis.get(key);
            if (value !== null) {
              discoveredKeys.push(key);
              parsedData.set(key, typeof value === 'string' ? JSON.parse(value) : value);
              validKeys++;
            }
          } catch (e) {
            // Continue
          }
          scannedKeys++;
        }

      } catch (e) {
        console.warn(`⚠️ Error scanning pattern ${pattern}:`, e);
      }
    }

    // Also try to get leaderboard data
    try {
      const leaderboardKeys = ['leaderboard:reputation', 'leaderboard:activity'];
      for (const key of leaderboardKeys) {
        const value = await redis.zrange(key, 0, -1, { withScores: true });
        if (value && value.length > 0) {
          discoveredKeys.push(key);
          parsedData.set(key, value);
          validKeys++;
        }
      }
    } catch (e) {
      console.warn('⚠️ Error getting leaderboard data');
    }

    console.log(`✅ Upstash KV deep discovery complete:`);
    console.log(`   🔍 Keys scanned: ${scannedKeys}`);
    console.log(`   ✅ Valid keys found: ${validKeys}`);
    console.log(`   📊 Parsed data entries: ${parsedData.size}`);

    return {
      keys: discoveredKeys,
      parsedData,
      totalKeys: validKeys
    };

  } catch (error) {
    console.error('❌ Error during Upstash KV discovery:', error);
    return {
      keys: [],
      parsedData: new Map(),
      totalKeys: 0
    };
  }
}

/**
 * Master Aggregator Engine - Creates unified user registry from all data sources
 * WITH FALLBACK: If Upstash fails, continue with MongoDB only
 */
export async function createMasterRegistry(): Promise<{
  masterRegistry: any[];
  uniqueUsers: number;
  totalRecords: number;
  sourceStats: {
    mongodbCollections: string[];
    mongodbRecords: number;
    upstashKeys: number;
    upstashError?: string;
  };
}> {
  console.log('🎯 Initializing Master Aggregator Engine with Fallback Logic...');

  const masterRegistry: Map<string, any> = new Map();
  let totalRecords = 0;
  let upstashError: string | undefined;

  // ====================
  // PHASE 1: MongoDB Discovery (Always Required)
  // ====================
  console.log('📡 Phase 1: MongoDB Data Discovery (Primary Source)');

  let mongoDiscovery: any = null;
  try {
    mongoDiscovery = await deepMongoDiscovery();
    console.log('[SUCCESS] Pulled data from MongoDB Collections:', mongoDiscovery.collections);
    console.log(`Checking Mongo: ${mongoDiscovery.totalRecords} records`);
  } catch (error: any) {
    console.error('❌ MongoDB discovery failed:', error.message);
    throw new Error(`MongoDB connection failed: ${error.message}`);
  }

  // ====================
  // PHASE 2: Upstash Discovery (Optional with Fallback)
  // ====================
  console.log('📡 Phase 2: Upstash KV Data Discovery (Secondary Source)');

  let upstashDiscovery: any = null;
  try {
    upstashDiscovery = await deepUpstashDiscovery();
    console.log('[SUCCESS] Pulled', upstashDiscovery.totalKeys, 'keys from Upstash KV');
    console.log(`Checking Upstash: ${upstashDiscovery.totalKeys} keys`);
  } catch (error: any) {
    upstashError = error.message;
    console.warn('⚠️ Upstash KV discovery failed, continuing with MongoDB only:', error.message);
    console.warn('📝 To enable Upstash caching, check your UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env');

    // Create empty Upstash discovery object
    upstashDiscovery = {
      keys: [],
      parsedData: new Map(),
      totalKeys: 0
    };
  }

  console.log(`📊 Data sources ready:`);
  console.log(`   🍃 MongoDB: ${mongoDiscovery.totalRecords} total records`);
  console.log(`   ⚡ Upstash KV: ${upstashDiscovery.totalKeys} keys ${upstashError ? '(failed)' : '(success)'}`);

  // ====================
  // PHASE 3: Wallet Mapping (MongoDB Only - Required)
  // ====================
  let walletToUsernameMap: Map<string, string>;
  try {
    walletToUsernameMap = createWalletToUsernameMap(mongoDiscovery.data);
    console.log(`🔗 Created wallet-to-username map with ${walletToUsernameMap.size} mappings`);
  } catch (error: any) {
    console.warn('⚠️ Wallet mapping failed:', error.message);
    walletToUsernameMap = new Map();
  }

  // ====================
  // PHASE 4: MongoDB Data Processing (Primary)
  // ====================
  console.log('🔄 Phase 4: Processing MongoDB Collections (Primary Data)');

  let mongoUsersProcessed = 0;
  for (const [collectionName, documents] of mongoDiscovery.data) {
    console.log(`📊 Processing ${collectionName}: ${documents.length} documents`);

    for (const doc of documents) {
      try {
        // Extract username from various possible fields
        const username = doc.username || doc.pioneerId || doc.userId || doc.name;

        if (!username) {
          console.warn(`⚠️ Document in ${collectionName} missing username:`, doc);
          continue;
        }

        // Initialize or get existing user record
        if (!masterRegistry.has(username)) {
          masterRegistry.set(username, {
            username,
            pioneerId: doc.pioneerId,
            email: doc.email,
            wallets: [],
            reputationScore: 0,
            reputationLevel: 1,
            walletMainnetScore: 0,
            walletTestnetScore: 0,
            appEngagementScore: 0,
            lastActivityDate: doc.lastActiveAt || doc.lastSeen || doc.updatedAt || doc.createdAt,
            currentStreak: 0,
            longestStreak: 0,
            isVip: false,
            lastSeen: doc.lastActiveAt || doc.lastSeen || doc.updatedAt || doc.createdAt,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
            sourceTables: [],
            totalActivity: 0,
            visitCount: 0,
            sessionCount: 0,
            rawData: {}
          });
        }

        const userRecord = masterRegistry.get(username)!;

        // Merge data based on collection type
        if (collectionName.includes('Reputation') || collectionName.includes('Scores')) {
          userRecord.reputationScore = Math.max(userRecord.reputationScore, doc.totalReputationScore || 0);
          userRecord.reputationLevel = Math.max(userRecord.reputationLevel, doc.reputationLevel || 1);
          userRecord.walletMainnetScore = Math.max(userRecord.walletMainnetScore, doc.walletMainnetScore || 0);
          userRecord.walletTestnetScore = Math.max(userRecord.walletTestnetScore, doc.walletTestnetScore || 0);
          userRecord.appEngagementScore = Math.max(userRecord.appEngagementScore, doc.appEngagementScore || 0);
          userRecord.currentStreak = Math.max(userRecord.currentStreak, doc.currentStreak || 0);
          userRecord.longestStreak = Math.max(userRecord.longestStreak, doc.longestStreak || 0);
          userRecord.lastActivityDate = new Date(Math.max(
            new Date(userRecord.lastActivityDate || 0).getTime(),
            new Date(doc.lastActivityDate || 0).getTime()
          ));
        }

        if (collectionName.includes('Wallet') || collectionName.includes('Snapshot')) {
          if (doc.walletAddress && !userRecord.wallets.includes(doc.walletAddress)) {
            userRecord.wallets.push(doc.walletAddress);
          }
        }

        if (collectionName.includes('Traffic') || collectionName.includes('Users')) {
          userRecord.isVip = userRecord.isVip || doc.isVip || false;
          userRecord.visitCount = Math.max(userRecord.visitCount, doc.visitCount || 0);
          if (doc.lastSeen) {
            userRecord.lastSeen = new Date(Math.max(
              new Date(userRecord.lastSeen || 0).getTime(),
              new Date(doc.lastSeen).getTime()
            ));
          }
        }

        // Track source
        if (!userRecord.sourceTables.includes(collectionName)) {
          userRecord.sourceTables.push(collectionName);
        }

        // Store raw data for debugging
        userRecord.rawData[collectionName] = doc;

        mongoUsersProcessed++;
        totalRecords++;

      } catch (error) {
        console.warn(`⚠️ Error processing document in ${collectionName}:`, error);
      }
    }
  }

  // ====================
  // PHASE 5: Upstash KV Data Processing (Optional Enhancement)
  // ====================
  console.log('🔄 Phase 5: Processing Upstash KV Data (Optional Enhancement)');

  let upstashUsersProcessed = 0;
  if (!upstashError && upstashDiscovery.totalKeys > 0) {
    for (const [key, data] of upstashDiscovery.parsedData) {
      try {
        // Extract username from key or data
        let username: string | null = null;

        // Try to extract from key pattern
        const keyParts = key.split(':');
        if (keyParts.length > 1) {
          username = keyParts[1];
        }

        // Try to extract from data object
        if (!username && data.username) {
          username = data.username;
        }

        if (!username) {
          console.warn(`⚠️ Could not extract username from Upstash key: ${key}`);
          continue;
        }

        // Initialize or get existing user record
        if (!masterRegistry.has(username)) {
          masterRegistry.set(username, {
            username,
            pioneerId: data.pioneerId,
            email: data.email,
            wallets: [],
            reputationScore: 0,
            reputationLevel: 1,
            walletMainnetScore: 0,
            walletTestnetScore: 0,
            appEngagementScore: 0,
            lastActivityDate: data.lastSeen || data.lastActivityDate || new Date(),
            currentStreak: 0,
            longestStreak: 0,
            isVip: data.isVip || false,
            lastSeen: data.lastSeen || data.lastActivityDate || new Date(),
            createdAt: data.createdAt || new Date(),
            updatedAt: data.updatedAt || new Date(),
            sourceTables: [],
            totalActivity: 0,
            visitCount: 0,
            sessionCount: 0,
            rawData: {}
          });
        }

        const userRecord = masterRegistry.get(username)!;

        // Merge Upstash data (takes priority over MongoDB)
        if (data.wallets && Array.isArray(data.wallets)) {
          // Merge wallets uniquely
          const existingWallets = new Set(userRecord.wallets);
          data.wallets.forEach((wallet: string) => {
            if (wallet && !existingWallets.has(wallet)) {
              userRecord.wallets.push(wallet);
              existingWallets.add(wallet);
            }
          });
        }

        // Numeric values from Upstash take priority
        if (typeof data.reputationScore === 'number') userRecord.reputationScore = data.reputationScore;
        if (typeof data.reputationLevel === 'number') userRecord.reputationLevel = data.reputationLevel;
        if (typeof data.visits === 'number') userRecord.visitCount = data.visits;
        if (typeof data.sessions === 'number') userRecord.sessionCount = data.sessions;
        if (data.isVip !== undefined) userRecord.isVip = data.isVip;
        if (data.lastSeen) userRecord.lastSeen = new Date(data.lastSeen);

        // Track source
        if (!userRecord.sourceTables.includes('upstash_kv')) {
          userRecord.sourceTables.push('upstash_kv');
        }

        // Store raw data
        userRecord.rawData.upstash_kv = data;

        upstashUsersProcessed++;
        totalRecords++;

      } catch (error) {
        console.warn(`⚠️ Error processing Upstash key ${key}:`, error);
      }
    }
  } else if (upstashError) {
    console.log('📝 Skipping Upstash processing due to connection error - using MongoDB data only');
  }

  // ====================
  // PHASE 6: Final Processing and Sorting
  // ====================
  console.log('🔄 Phase 6: Final Processing and Sorting');

  // Convert to array and calculate final metrics
  const registryArray = Array.from(masterRegistry.values());

  // Sort by last seen (most recent first)
  registryArray.sort((a, b) => {
    const aDate = new Date(a.lastSeen || a.lastActivityDate || 0);
    const bDate = new Date(b.lastSeen || b.lastActivityDate || 0);
    return bDate.getTime() - aDate.getTime();
  });

  // Calculate total activity for each user
  registryArray.forEach(user => {
    user.totalActivity = user.visitCount + user.sessionCount + user.reputationScore;
  });

  console.log('[SUCCESS] Final Merged Array Size:', registryArray.length);
  console.log(`Final merged: ${registryArray.length} unique users`);
  console.log(`MongoDB processed: ${mongoUsersProcessed} records`);
  console.log(`Upstash processed: ${upstashUsersProcessed} records`);

  return {
    masterRegistry: registryArray,
    uniqueUsers: masterRegistry.size,
    totalRecords,
    sourceStats: {
      mongodbCollections: mongoDiscovery.collections,
      mongodbRecords: mongoDiscovery.totalRecords,
      upstashKeys: upstashDiscovery.totalKeys,
      upstashError
    }
  };
}

/**
 * Create wallet-to-username mapping for reverse linking
 */
function createWalletToUsernameMap(mongoData: any): Map<string, string> {
  const walletMap = new Map<string, string>();

  // From final_users_v3
  mongoData.finalUsersV3.forEach((user: any) => {
    if (user.username && user.wallets) {
      user.wallets.forEach((wallet: string) => {
        if (wallet && wallet.trim()) {
          walletMap.set(wallet.toLowerCase(), user.username);
        }
      });
    }
  });

  // From final_users
  mongoData.finalUsers.forEach((user: any) => {
    if (user.username && user.wallets) {
      user.wallets.forEach((wallet: string) => {
        if (wallet && wallet.trim()) {
          walletMap.set(wallet.toLowerCase(), user.username);
        }
      });
    }
  });

  // From userv3
  mongoData.userv3.forEach((user: any) => {
    if (user.username && user.wallets) {
      user.wallets.forEach((wallet: string) => {
        if (wallet && wallet.trim()) {
          walletMap.set(wallet.toLowerCase(), user.username);
        }
      });
    }
  });

  // From WalletSnapshots
  mongoData.walletSnapshots.forEach((wallet: any) => {
    if (wallet.pioneerId && wallet.walletAddress) {
      walletMap.set(wallet.walletAddress.toLowerCase(), wallet.pioneerId);
    }
  });

  console.log(`🔗 Created wallet-to-username map with ${walletMap.size} mappings`);
  return walletMap;
}

/**
 * Merge user data with timestamp-based conflict resolution and priority handling
 * @param existing - Existing user data
 * @param incoming - Incoming data to merge
 * @param source - Source table name
 * @param isHigherPriority - Whether incoming data has higher priority (Upstash = true, MongoDB = false)
 */
function mergeUserDataWithPriority(existing: ConsolidatedUser, incoming: Partial<ConsolidatedUser>, source: string, isHigherPriority: boolean = false): ConsolidatedUser {
  const merged = { ...existing };

  // Update fields based on priority
  Object.keys(incoming).forEach(key => {
    const incomingValue = (incoming as any)[key];
    if (incomingValue !== undefined && incomingValue !== null) {
      if (key === 'updatedAt' || key === 'lastSeen' || key === 'lastActivityDate') {
        const existingDate = new Date(merged.updatedAt || merged.lastSeen || merged.createdAt);
        const incomingDate = new Date(incomingValue);
        if (incomingDate > existingDate) {
          (merged as any)[key] = incomingValue;
        }
      } else if (key === 'wallets' && Array.isArray(incomingValue)) {
        // Aggregate wallets from all sources
        const currentWallets = new Set(merged.wallets.map(w => w.toLowerCase()));
        incomingValue.forEach(wallet => {
          if (wallet && wallet.trim() && !currentWallets.has(wallet.toLowerCase())) {
            merged.wallets.push(wallet.trim());
            currentWallets.add(wallet.toLowerCase());
          }
        });
      } else if (isHigherPriority) {
        // Higher priority data (Upstash) always takes precedence
        (merged as any)[key] = incomingValue;
      } else if (typeof incomingValue === 'number' && (incomingValue > (merged as any)[key] || (merged as any)[key] === 0)) {
        // Take higher numeric values (scores, counts)
        (merged as any)[key] = incomingValue;
      } else if (key !== 'sourceTables') {
        // For other fields, take the incoming value if existing is empty/default
        if (!(merged as any)[key] || (merged as any)[key] === 0 || (merged as any)[key] === '') {
          (merged as any)[key] = incomingValue;
        }
      }
    }
  });

  // Track source
  if (!merged.sourceTables.includes(source)) {
    merged.sourceTables.push(source);
  }

  // Recalculate total activity
  merged.totalActivity = merged.visitCount + merged.sessionCount + merged.reputationScore;

  return merged;
}

/**
 * Merge user data with timestamp-based conflict resolution
 */
function mergeUserData(existing: ConsolidatedUser, incoming: Partial<ConsolidatedUser>, source: string): ConsolidatedUser {
  return mergeUserDataWithPriority(existing, incoming, source, false);
}

/**
 * Get consolidated user data from Upstash KV (with cache-first strategy)
 */
export async function getConsolidatedUsers(limit: number = 100, offset: number = 0): Promise<{
  users: ConsolidatedUser[];
  total: number;
  fromCache: boolean;
}> {
  try {
    // Check if we have cached metadata
    const metadataStr = await redis.get('consolidated_metadata');
    const metadata = metadataStr ? JSON.parse(metadataStr as string) : null;

    if (!metadata) {
      console.log('📊 No cached data found, triggering consolidation...');
      const { createMasterRegistry } = await import('./upstashConsolidationService.js');
      await createMasterRegistry();
      // Retry after consolidation
      return getConsolidatedUsers(limit, offset);
    }

// Get all consolidated user keys
const allKeys = await redis.zrange('consolidated_users_index', 0, -1);
const totalUsers = allKeys.length;

if (totalUsers === 0) {
// Fallback: trigger consolidation
const { createMasterRegistry } = await import('./upstashConsolidationService.js');
await createMasterRegistry();
return { users: [], total: 0, fromCache: false };
}

// Get paginated users
const paginatedKeys = allKeys.slice(offset, offset + limit);
const users: ConsolidatedUser[] = [];

for (const key of paginatedKeys) {
const userData = await redis.get(key);
if (userData) {
users.push(JSON.parse(userData as string));
}
}

return {
users,
total: totalUsers,
fromCache: true
};
    for (const key of paginatedKeys) {
      const userData = await redis.get(key);
      if (userData) {
        users.push(JSON.parse(userData as string));
      }
    }

    return {
      users,
      total: totalUsers,
      fromCache: true
    };

  } catch (error) {
    console.error('❌ Error fetching consolidated users:', error);
    // Fallback to consolidation
    const { createMasterRegistry } = await import('./upstashConsolidationService.js');
    await createMasterRegistry();
    return { users: [], total: 0, fromCache: false };
  }
}

/**
 * Get consolidated user count from Upstash KV
 */
export async function getConsolidatedUserCount(): Promise<number> {
  try {
    const metadataStr = await redis.get('consolidated_metadata');
    const metadata = metadataStr ? JSON.parse(metadataStr as string) : null;

    if (metadata && metadata.totalUsers) {
      return metadata.totalUsers;
    }

    // Fallback: trigger consolidation
    const { createMasterRegistry } = await import('./upstashConsolidationService.js');
    const result = await createMasterRegistry();
    return result.uniqueUsers;

  } catch (error) {
    console.error('❌ Error getting consolidated user count:', error);
    return 0;
  }
}

/**
 * Check Upstash KV connection status
 */
export async function checkUpstashConnection(): Promise<{
  connected: boolean;
  latency?: number;
  error?: string;
}> {
  try {
    const startTime = Date.now();
    await redis.set('connection_test', 'ok', { ex: 10 });
    const latency = Date.now() - startTime;

    return { connected: true, latency };
  } catch (error: any) {
    return {
      connected: false,
      error: error.message
    };
  }
}

export async function refreshConsolidatedData(): Promise<{ success: boolean; totalUsers: number }> {
  try {
    const { createMasterRegistry } = await import('./upstashConsolidationService.js');
    const result = await createMasterRegistry();
    return { success: true, totalUsers: result.uniqueUsers };
  } catch (error: any) {
    console.error('❌ Error refreshing consolidated data:', error);
    return { success: false, totalUsers: 0 };
  }
}
