// Try to require the official mongodb driver. If not available (dev container without
// dependencies), fall back to a lightweight in-memory stub so the app can still run
// without runtime import errors.
// Types from mongodb for compile-time checks
import type { Db, Collection } from 'mongodb';

let MongoClient: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  MongoClient = require('mongodb').MongoClient;
} catch (e) {
  MongoClient = null;
}

type AnyCollection = any;
interface ReputaDatabase {
  db: any;
  users: AnyCollection;
  wallets: AnyCollection;
  pointsLog: AnyCollection;
  dailyCheckin: AnyCollection;
  referrals: AnyCollection;
  transactions: AnyCollection;
  blockchainSync: AnyCollection;
  demoMode: AnyCollection;
  adminLogs: AnyCollection;
}

let mongoDb: ReputaDatabase | null = null;

/**
 * Initialize MongoDB Connection and Collections (or create in-memory stub)
 */
export async function initializeMongoDb(): Promise<ReputaDatabase> {
  if (mongoDb) return mongoDb;

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const dbName = process.env.MONGODB_DB_NAME || 'reputa-analytics';

  if (!MongoClient) {
    // Create simple in-memory collections as fallback (Maps with helper methods)
    const makeCollection = () => {
      const m = new Map<string, any>();
      // attach noop async methods used by code
      (m as any).createIndex = async () => {};
      (m as any).insertOne = async (doc: any) => { m.set(String(doc._id || Date.now()), doc); return { insertedId: doc._id || Date.now() }; };
      (m as any).findOne = async (query: any) => {
        for (const v of m.values()) {
          let match = true;
          for (const k of Object.keys(query || {})) {
            if ((v as any)[k] !== query[k]) { match = false; break; }
          }
          if (match) return v;
        }
        return null;
      };
      (m as any).updateOne = async (q: any, u: any, opts?: any) => { return { modifiedCount: 0 }; };
      (m as any).find = () => ({ toArray: async () => Array.from(m.values()) });
      return m as AnyCollection;
    };

    mongoDb = {
      db: { isInMemory: true, uri: mongoUri, name: dbName },
      users: makeCollection(),
      wallets: makeCollection(),
      pointsLog: makeCollection(),
      dailyCheckin: makeCollection(),
      referrals: makeCollection(),
      transactions: makeCollection(),
      blockchainSync: makeCollection(),
      demoMode: makeCollection(),
      adminLogs: makeCollection(),
    };

    console.warn('⚠️ MongoDB driver not available - running with in-memory stub database');
    return mongoDb;
  }

  try {
    const client = new MongoClient(mongoUri);
    await client.connect();
    const db = client.db(dbName);

    console.log(`✅ Connected to MongoDB: ${dbName}`);

    // Create Collections with validation and indexes
    mongoDb = {
      db,
      users: await createUsersCollection(db),
      wallets: await createWalletsCollection(db),
      pointsLog: await createPointsLogCollection(db),
      dailyCheckin: await createDailyCheckinCollection(db),
      referrals: await createReferralsCollection(db),
      transactions: await createTransactionsCollection(db),
      blockchainSync: await createBlockchainSyncCollection(db),
      demoMode: await createDemoModeCollection(db),
      adminLogs: await createAdminLogsCollection(db),
    };

    console.log('✅ All MongoDB collections created successfully');
    return mongoDb;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    throw error;
  }
}

/**
 * Users Collection - Main user data
 */
async function createUsersCollection(db: Db): Promise<Collection> {
  const collectionName = 'Users';

  try {
    await db.createCollection(collectionName, {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['pioneerId', 'email'],
          properties: {
            _id: { bsonType: 'objectId' },
            pioneerId: { bsonType: 'string', description: 'Unique Pi Network Pioneer ID' },
            username: { bsonType: 'string', description: 'Username on Pi Network' },
            email: { bsonType: 'string', description: 'User email' },
            primaryWallet: { bsonType: 'string', description: 'Primary wallet address' },
            totalPoints: { bsonType: 'int', description: 'Total accumulated points' },
            reputationScore: { bsonType: 'int', description: 'Main reputation score (0-1000)' },
            appPoints: { bsonType: 'int', description: 'App-specific points (daily login, tasks, referrals)' },
            mainnetScore: { bsonType: 'int', description: 'Mainnet reputation (60% weight)' },
            testnetScore: { bsonType: 'int', description: 'Testnet reputation (20% weight)' },
            level: { bsonType: 'string', enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'] },
            isVip: { bsonType: 'bool', description: 'VIP membership status' },
            isDemoMode: { bsonType: 'bool', description: 'Whether user is in demo mode' },
            lastSyncTime: { bsonType: 'date' },
            createdAt: { bsonType: 'date' },
            updatedAt: { bsonType: 'date' },
          },
        },
      },
    });
    console.log(`📊 Created Users collection`);
  } catch (error: any) {
    if (error.code !== 48) throw error; // 48 = Collection already exists
  }

  const collection = db.collection(collectionName);

  // Create indexes
  await collection.createIndex({ pioneerId: 1 }, { unique: true });
  await collection.createIndex({ email: 1 });
  await collection.createIndex({ primaryWallet: 1 });
  await collection.createIndex({ reputationScore: -1 });
  await collection.createIndex({ createdAt: -1 });
  await collection.createIndex({ isDemoMode: 1 });

  return collection;
}

/**
 * Wallets Collection - Wallet data and blockchain state
 */
async function createWalletsCollection(db: Db): Promise<Collection> {
  const collectionName = 'Wallets';

  try {
    await db.createCollection(collectionName, {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['pioneerId', 'walletAddress'],
          properties: {
            _id: { bsonType: 'objectId' },
            pioneerId: { bsonType: 'string' },
            walletAddress: { bsonType: 'string', description: 'Blockchain wallet address' },
            network: { bsonType: 'string', enum: ['mainnet', 'testnet'] },
            currentBalance: { bsonType: 'double', description: 'Current Pi balance' },
            tokenHoldings: { bsonType: 'object', description: 'Token holdings and quantities' },
            stakeAmount: { bsonType: 'double', description: 'Current staked amount' },
            stakeDate: { bsonType: 'date' },
            walletAge: { bsonType: 'int', description: 'Wallet age in days' },
            walletCreationDate: { bsonType: 'date' },
            totalTransactions: { bsonType: 'int' },
            activity3Months: { bsonType: 'int', description: 'Number of transactions in last 3 months' },
            lastTransactionDate: { bsonType: 'date' },
            offChainTransfers: { bsonType: 'int', description: 'Count of off-chain transfers (penalties)' },
            dexTradingVolume: { bsonType: 'double', description: 'Total DEX trading volume' },
            isActive: { bsonType: 'bool' },
            lastBlockchainSync: { bsonType: 'date' },
            blockchainData: { bsonType: 'object', description: 'Full blockchain snapshot' },
            createdAt: { bsonType: 'date' },
            updatedAt: { bsonType: 'date' },
          },
        },
      },
    });
    console.log(`💼 Created Wallets collection`);
  } catch (error: any) {
    if (error.code !== 48) throw error;
  }

  const collection = db.collection(collectionName);

  // Create indexes
  await collection.createIndex({ pioneerId: 1, network: 1 }, { unique: true });
  await collection.createIndex({ walletAddress: 1 });
  await collection.createIndex({ currentBalance: -1 });
  await collection.createIndex({ reputationScore: -1 });
  await collection.createIndex({ lastBlockchainSync: -1 });

  return collection;
}

/**
 * Points_Log Collection - Track all point transactions
 */
async function createPointsLogCollection(db: Db): Promise<Collection> {
  const collectionName = 'Points_Log';

  try {
    await db.createCollection(collectionName, {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['pioneerId', 'action', 'points', 'timestamp'],
          properties: {
            _id: { bsonType: 'objectId' },
            pioneerId: { bsonType: 'string' },
            action: {
              bsonType: 'string',
              enum: [
                'wallet_transfer_sent',
                'wallet_transfer_received',
                'stake_activity',
                'dex_trade',
                'token_holding',
                'wallet_age',
                'activity_3months',
                'off_chain_transfer',
                'daily_login',
                'daily_login_with_ads',
                'referral_confirmed',
                'task_completed',
                'off_network_penalty',
              ],
            },
            pointsChange: { bsonType: 'int', description: 'Points added or subtracted' },
            previousTotal: { bsonType: 'int' },
            newTotal: { bsonType: 'int' },
            metadata: { bsonType: 'object', description: 'Additional context (tx hash, amount, etc)' },
            isDemoMode: { bsonType: 'bool' },
            timestamp: { bsonType: 'date' },
            createdAt: { bsonType: 'date' },
          },
        },
      },
    });
    console.log(`📝 Created Points_Log collection`);
  } catch (error: any) {
    if (error.code !== 48) throw error;
  }

  const collection = db.collection(collectionName);

  // Create indexes
  await collection.createIndex({ pioneerId: 1, timestamp: -1 });
  await collection.createIndex({ action: 1 });
  await collection.createIndex({ isDemoMode: 1 });
  await collection.createIndex({ createdAt: -1 });

  return collection;
}

/**
 * Daily_Checkin Collection - Daily login tracking
 */
async function createDailyCheckinCollection(db: Db): Promise<Collection> {
  const collectionName = 'Daily_Checkin';

  try {
    await db.createCollection(collectionName, {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['pioneerId', 'date'],
          properties: {
            _id: { bsonType: 'objectId' },
            pioneerId: { bsonType: 'string' },
            date: { bsonType: 'date', description: 'Check-in date (normalized to midnight UTC)' },
            pointsEarned: { bsonType: 'int', description: '3 points base, 5 with ads' },
            withAds: { bsonType: 'bool' },
            streak: { bsonType: 'int', description: 'Consecutive days streak' },
            isDemoMode: { bsonType: 'bool' },
            timestamp: { bsonType: 'date' },
            createdAt: { bsonType: 'date' },
          },
        },
      },
    });
    console.log(`✅ Created Daily_Checkin collection`);
  } catch (error: any) {
    if (error.code !== 48) throw error;
  }

  const collection = db.collection(collectionName);

  // Create indexes
  await collection.createIndex({ pioneerId: 1, date: -1 }, { unique: true });
  await collection.createIndex({ streak: -1 });
  await collection.createIndex({ date: -1 });

  return collection;
}

/**
 * Referrals Collection - Referral program tracking
 */
async function createReferralsCollection(db: Db): Promise<Collection> {
  const collectionName = 'Referrals';

  try {
    await db.createCollection(collectionName, {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['referrerId', 'referredPioneerId'],
          properties: {
            _id: { bsonType: 'objectId' },
            referrerId: { bsonType: 'string', description: 'Pioneer ID of referrer' },
            referredPioneerId: { bsonType: 'string', description: 'Pioneer ID of referred user' },
            referredEmail: { bsonType: 'string' },
            status: {
              bsonType: 'string',
              enum: ['pending', 'confirmed', 'completed'],
              description: 'Referral status',
            },
            pointsAwarded: { bsonType: 'int', description: '10 points per confirmed referral' },
            confirmedAt: { bsonType: 'date' },
            isDemoMode: { bsonType: 'bool' },
            createdAt: { bsonType: 'date' },
            updatedAt: { bsonType: 'date' },
          },
        },
      },
    });
    console.log(`👥 Created Referrals collection`);
  } catch (error: any) {
    if (error.code !== 48) throw error;
  }

  const collection = db.collection(collectionName);

  // Create indexes
  await collection.createIndex({ referrerId: 1, status: 1 });
  await collection.createIndex({ referredPioneerId: 1 });
  await collection.createIndex({ status: 1 });
  await collection.createIndex({ confirmedAt: -1 });

  return collection;
}

/**
 * Transactions Collection - All blockchain transactions
 */
async function createTransactionsCollection(db: Db): Promise<Collection> {
  const collectionName = 'Transactions';

  try {
    await db.createCollection(collectionName, {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['pioneerId', 'txHash'],
          properties: {
            _id: { bsonType: 'objectId' },
            pioneerId: { bsonType: 'string' },
            txHash: { bsonType: 'string', description: 'Transaction hash' },
            walletAddress: { bsonType: 'string' },
            network: { bsonType: 'string', enum: ['mainnet', 'testnet'] },
            type: { bsonType: 'string', enum: ['sent', 'received', 'stake', 'dex', 'mint'] },
            amount: { bsonType: 'double' },
            from: { bsonType: 'string' },
            to: { bsonType: 'string' },
            timestamp: { bsonType: 'date' },
            gasUsed: { bsonType: 'double' },
            status: { bsonType: 'string', enum: ['confirmed', 'pending', 'failed'] },
            blockNumber: { bsonType: 'int' },
            details: { bsonType: 'object', description: 'Full transaction details' },
            isOffChain: { bsonType: 'bool', description: 'Off-chain transfer (penalty)' },
            pointsImpact: { bsonType: 'int', description: 'Points added/subtracted from this tx' },
            syncedAt: { bsonType: 'date' },
            createdAt: { bsonType: 'date' },
          },
        },
      },
    });
    console.log(`⛓️  Created Transactions collection`);
  } catch (error: any) {
    if (error.code !== 48) throw error;
  }

  const collection = db.collection(collectionName);

  // Create indexes
  await collection.createIndex({ pioneerId: 1, timestamp: -1 });
  await collection.createIndex({ txHash: 1 }, { unique: true });
  await collection.createIndex({ walletAddress: 1 });
  await collection.createIndex({ network: 1 });
  await collection.createIndex({ timestamp: -1 });
  await collection.createIndex({ isOffChain: 1 });

  return collection;
}

/**
 * Blockchain_Sync Collection - Track blockchain sync status
 */
async function createBlockchainSyncCollection(db: Db): Promise<Collection> {
  const collectionName = 'Blockchain_Sync';

  try {
    await db.createCollection(collectionName, {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['pioneerId', 'walletAddress'],
          properties: {
            _id: { bsonType: 'objectId' },
            pioneerId: { bsonType: 'string' },
            walletAddress: { bsonType: 'string' },
            network: { bsonType: 'string', enum: ['mainnet', 'testnet'] },
            lastSyncTime: { bsonType: 'date' },
            lastBlockScanned: { bsonType: 'int' },
            currentBlockHeight: { bsonType: 'int' },
            transactionsSynced: { bsonType: 'int' },
            status: { bsonType: 'string', enum: ['syncing', 'synced', 'error'] },
            errorMessage: { bsonType: 'string' },
            nextSyncTime: { bsonType: 'date' },
            createdAt: { bsonType: 'date' },
            updatedAt: { bsonType: 'date' },
          },
        },
      },
    });
    console.log(`🔄 Created Blockchain_Sync collection`);
  } catch (error: any) {
    if (error.code !== 48) throw error;
  }

  const collection = db.collection(collectionName);

  // Create indexes
  await collection.createIndex({ pioneerId: 1, network: 1 }, { unique: true });
  await collection.createIndex({ lastSyncTime: -1 });
  await collection.createIndex({ status: 1 });

  return collection;
}

/**
 * Demo_Mode Collection - Demo mode data (separate from real data)
 */
async function createDemoModeCollection(db: Db): Promise<Collection> {
  const collectionName = 'Demo_Mode';

  try {
    await db.createCollection(collectionName, {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['pioneerId'],
          properties: {
            _id: { bsonType: 'objectId' },
            pioneerId: { bsonType: 'string' },
            demoData: { bsonType: 'object', description: 'Sample data for demo mode' },
            demoWallets: { bsonType: 'array', description: 'Demo wallet addresses' },
            demoTransactions: { bsonType: 'array', description: 'Demo transactions' },
            demoPoints: { bsonType: 'int', description: 'Demo accumulated points' },
            demoReputationScore: { bsonType: 'int' },
            activatedAt: { bsonType: 'date' },
            lastAccessedAt: { bsonType: 'date' },
            createdAt: { bsonType: 'date' },
          },
        },
      },
    });
    console.log(`🎮 Created Demo_Mode collection`);
  } catch (error: any) {
    if (error.code !== 48) throw error;
  }

  const collection = db.collection(collectionName);

  // Create indexes
  await collection.createIndex({ pioneerId: 1 }, { unique: true });
  await collection.createIndex({ lastAccessedAt: -1 });

  return collection;
}

/**
 * Admin_Logs Collection - Admin operations tracking
 */
async function createAdminLogsCollection(db: Db): Promise<Collection> {
  const collectionName = 'Admin_Logs';

  try {
    await db.createCollection(collectionName, {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['adminId', 'action'],
          properties: {
            _id: { bsonType: 'objectId' },
            adminId: { bsonType: 'string' },
            action: { bsonType: 'string' },
            targetPioneerId: { bsonType: 'string' },
            description: { bsonType: 'string' },
            changes: { bsonType: 'object' },
            reason: { bsonType: 'string' },
            timestamp: { bsonType: 'date' },
            ipAddress: { bsonType: 'string' },
            userAgent: { bsonType: 'string' },
            createdAt: { bsonType: 'date' },
          },
        },
      },
    });
    console.log(`🔐 Created Admin_Logs collection`);
  } catch (error: any) {
    if (error.code !== 48) throw error;
  }

  const collection = db.collection(collectionName);

  // Create indexes
  await collection.createIndex({ adminId: 1, timestamp: -1 });
  await collection.createIndex({ targetPioneerId: 1 });
  await collection.createIndex({ action: 1 });
  await collection.createIndex({ timestamp: -1 });

  return collection;
}

/**
 * Get MongoDB instance (must call initializeMongoDb first)
 */
export function getMongoDb(): ReputaDatabase {
  if (!mongoDb) {
    throw new Error('MongoDB not initialized. Call initializeMongoDb() first.');
  }
  return mongoDb;
}

/**
 * Close MongoDB connection
 */
export async function closeMongoDb(): Promise<void> {
  if (mongoDb) {
    await mongoDb.db.client?.close();
    mongoDb = null;
  }
}

export default { initializeMongoDb, getMongoDb, closeMongoDb };
