/**
 * MongoDB Models and Database Connection
 * Using MongoDB as primary source for all reputation data
 * Redis used only for caching with short TTL (5 minutes)
 */

import { MongoClient, Db, Collection } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'reputa-v3';

let mongoClient: MongoClient | null = null;
let db: Db | null = null;

// ====================
// INITIALIZE MONGODB
// ====================

export async function connectMongoDB(): Promise<Db> {
  if (db) return db;

  try {
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    db = mongoClient.db(MONGODB_DB_NAME);
    
    console.log(`✅ Connected to MongoDB: ${MONGODB_DB_NAME}`);
    
    // Initialize collections
    await initializeCollections(db);
    
    return db;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    throw error;
  }
}

export async function getMongoDb(): Promise<Db> {
  if (!db) {
    await connectMongoDB();
  }
  return db!;
}

// ====================
// INITIALIZE COLLECTIONS
// ====================

async function initializeCollections(database: Db) {
  // Users collection
  await createUsersCollection(database);
  // Reputation scores collection
  await createReputationScoresCollection(database);
  // Daily check-in history
  await createDailyCheckinCollection(database);
  // Points log (audit trail)
  await createPointsLogCollection(database);
  // Wallet snapshots
  await createWalletSnapshotsCollection(database);
}

// ====================
// USERS COLLECTION
// ====================

export interface UserDocument {
  _id?: string;
  pioneerId: string;        // Unique Pi Network ID
  username: string;
  email: string;
  walletAddress?: string;   // Primary wallet address
  protocolVersion: string;  // Protocol version for migrations
  
  // Basic info
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
  
  // Referral
  referralCode: string;
  referralCount: number;
}

async function createUsersCollection(database: Db) {
  const collectionName = 'final_users_v3';
  
  try {
    await database.createCollection(collectionName, {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['pioneerId', 'username', 'email'],
          properties: {
            _id: { bsonType: 'string' },
            pioneerId: { bsonType: 'string' },
            username: { bsonType: 'string' },
            email: { bsonType: 'string' },
            walletAddress: { bsonType: 'string' },
            protocolVersion: { bsonType: 'string' },
            createdAt: { bsonType: 'date' },
            updatedAt: { bsonType: 'date' },
            lastActiveAt: { bsonType: 'date' },
            referralCode: { bsonType: 'string' },
            referralCount: { bsonType: 'int' }
          }
        }
      }
    });
    console.log(`✅ Created final_users_v3 collection`);
  } catch (error: any) {
    if (error.code !== 48) {
      console.error('Error creating Users collection:', error);
      throw error;
    }
  }

  const collection = database.collection(collectionName);
  
  // Create indexes
  await collection.createIndex({ pioneerId: 1 }, { unique: true });
  await collection.createIndex({ email: 1 }, { unique: true });
  await collection.createIndex({ username: 1 });
  await collection.createIndex({ walletAddress: 1 });
  await collection.createIndex({ createdAt: -1 });
  await collection.createIndex({ lastActiveAt: -1 });
}

// ====================
// REPUTATION SCORES COLLECTION (PRIMARY)
// ====================

export interface ReputationScoreDocument {
  _id?: string;
  pioneerId: string;        // Reference to user
  
  // Protocol version
  protocolVersion: string;
  
  // Main score breakdown
  totalReputationScore: number;      // 0-100000
  reputationLevel: number;           // 1-20
  
  // Component scores (combined into total)
  walletMainnetScore: number;        // Blockchain: mainnet
  walletTestnetScore: number;        // Blockchain: testnet
  appEngagementScore: number;        // App: check-in, ads, tasks
  
  // App engagement breakdown (sub-components)
  checkInScore: number;              // From daily check-ins
  adBonusScore: number;              // From ad viewing
  taskCompletionScore: number;       // From task completion
  referralScore: number;             // From referrals
  
  // Activity tracking
  lastCheckInDate?: string;          // YYYY-MM-DD
  lastActivityDate: Date;            // Any activity
  currentStreak: number;             // Consecutive check-in days
  longestStreak: number;             // All-time check-in streak
  
  // Erosion tracking
  lastErosionDate: Date;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  
  // Audit
  updateReason?: string;
}

async function createReputationScoresCollection(database: Db) {
  const collectionName = 'ReputationScores';
  
  try {
    await database.createCollection(collectionName, {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['pioneerId'],
          properties: {
            _id: { bsonType: 'string' },
            pioneerId: { bsonType: 'string' },
            protocolVersion: { bsonType: 'string' },
            totalReputationScore: { bsonType: 'int' },
            reputationLevel: { bsonType: 'int' },
            walletMainnetScore: { bsonType: 'int' },
            walletTestnetScore: { bsonType: 'int' },
            appEngagementScore: { bsonType: 'int' },
            checkInScore: { bsonType: 'int' },
            adBonusScore: { bsonType: 'int' },
            taskCompletionScore: { bsonType: 'int' },
            referralScore: { bsonType: 'int' },
            lastCheckInDate: { bsonType: 'string' },
            lastActivityDate: { bsonType: 'date' },
            currentStreak: { bsonType: 'int' },
            longestStreak: { bsonType: 'int' },
            lastErosionDate: { bsonType: 'date' },
            createdAt: { bsonType: 'date' },
            updatedAt: { bsonType: 'date' },
            updateReason: { bsonType: 'string' }
          }
        }
      }
    });
    console.log(`✅ Created ReputationScores collection`);
  } catch (error: any) {
    if (error.code !== 48) {
      console.error('Error creating ReputationScores collection:', error);
      throw error;
    }
  }

  const collection = database.collection(collectionName);
  
  // Create indexes
  await collection.createIndex({ pioneerId: 1 }, { unique: true });
  await collection.createIndex({ totalReputationScore: -1 });
  await collection.createIndex({ reputationLevel: -1 });
  await collection.createIndex({ lastActivityDate: -1 });
  await collection.createIndex({ lastCheckInDate: 1 });
  await collection.createIndex({ updatedAt: -1 });
}

// ====================
// DAILY CHECKIN COLLECTION
// ====================

export interface DailyCheckinDocument {
  _id?: string;
  pioneerId: string;
  date: string;              // YYYY-MM-DD
  timestamp: Date;
  points: number;            // Points earned
  streak: number;            // Streak on this date
  adBonusCount: number;      // Number of ads viewed
  adBonusPoints: number;     // Points from ads
}

async function createDailyCheckinCollection(database: Db) {
  const collectionName = 'DailyCheckin';
  
  try {
    await database.createCollection(collectionName);
    console.log(`✅ Created DailyCheckin collection`);
  } catch (error: any) {
    if (error.code !== 48) {
      console.error('Error creating DailyCheckin collection:', error);
      throw error;
    }
  }

  const collection = database.collection(collectionName);
  
  // Create indexes
  await collection.createIndex({ pioneerId: 1, date: 1 }, { unique: true });
  await collection.createIndex({ pioneerId: 1, timestamp: -1 });
  await collection.createIndex({ timestamp: -1 });
}

// ====================
// POINTS LOG COLLECTION (AUDIT TRAIL)
// ====================

export interface PointsLogDocument {
  _id?: string;
  pioneerId: string;
  type: 'check_in' | 'ad_bonus' | 'wallet_scan' | 'referral' | 'task_complete' | 'manual_adjustment' | 'erosion';
  points: number;           // Points added/removed
  timestamp: Date;
  description: string;
  details?: Record<string, any>;
  source?: string;          // API endpoint or system
}

async function createPointsLogCollection(database: Db) {
  const collectionName = 'PointsLog';
  
  try {
    await database.createCollection(collectionName);
    console.log(`✅ Created PointsLog collection`);
  } catch (error: any) {
    if (error.code !== 48) {
      console.error('Error creating PointsLog collection:', error);
      throw error;
    }
  }

  const collection = database.collection(collectionName);
  
  // Create indexes
  await collection.createIndex({ pioneerId: 1, timestamp: -1 });
  await collection.createIndex({ type: 1, timestamp: -1 });
  await collection.createIndex({ timestamp: -1 });
}

// ====================
// WALLET SNAPSHOTS COLLECTION
// ====================

export interface WalletSnapshotDocument {
  _id?: string;
  pioneerId: string;
  walletAddress: string;
  network: 'mainnet' | 'testnet';
  timestamp: Date;
  
  // Blockchain data
  balance: number;
  transactionCount: number;
  lastTransactionDate?: Date;
  stakingAmount: number;
  accountAgeMonths: number;
  
  // Computed
  deltaPoints?: number;
}

async function createWalletSnapshotsCollection(database: Db) {
  const collectionName = 'WalletSnapshots';
  
  try {
    await database.createCollection(collectionName);
    console.log(`✅ Created WalletSnapshots collection`);
  } catch (error: any) {
    if (error.code !== 48) {
      console.error('Error creating WalletSnapshots collection:', error);
      throw error;
    }
  }

  const collection = database.collection(collectionName);
  
  // Create indexes
  await collection.createIndex({ pioneerId: 1, walletAddress: 1, timestamp: -1 });
  await collection.createIndex({ pioneerId: 1, network: 1, timestamp: -1 });
  await collection.createIndex({ timestamp: -1 });
}

// ====================
// COLLECTION GETTERS
// ====================

export async function getUsersCollection(): Promise<Collection> {
  const database = await getMongoDb();
  return database.collection('final_users_v3');
}

export async function getReputationScoresCollection(): Promise<Collection> {
  const database = await getMongoDb();
  return database.collection('ReputationScores');
}

export async function getDailyCheckinCollection(): Promise<Collection> {
  const database = await getMongoDb();
  return database.collection('DailyCheckin');
}

export async function getPointsLogCollection(): Promise<Collection> {
  const database = await getMongoDb();
  return database.collection('PointsLog');
}

export async function getWalletSnapshotsCollection(): Promise<Collection> {
  const database = await getMongoDb();
  return database.collection('WalletSnapshots');
}

// ====================
// CLOSE CONNECTION
// ====================

export async function closeMongoDb() {
  if (mongoClient) {
    await mongoClient.close();
    mongoClient = null;
    db = null;
    console.log('✅ MongoDB connection closed');
  }
}

export default {
  connectMongoDB,
  getMongoDb,
  closeMongoDb,
  getUsersCollection,
  getReputationScoresCollection,
  getDailyCheckinCollection,
  getPointsLogCollection,
  getWalletSnapshotsCollection,
};
