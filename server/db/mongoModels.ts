/**
 * MongoDB Models and Database Connection
 * Using MongoDB as primary source for all reputation data
 * Redis used only for caching with short TTL (5 minutes)
 */

import { MongoClient, Db, Collection, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'reputa-v3';

let mongoClient: MongoClient | null = null;
let db: Db | null = null;

// ====================
// INITIALIZE MONGODB
// ====================

export async function connectMongoDB(): Promise<Db> {
  if (db) return db;

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is required. Please configure it in your environment.');
  }

  let retryCount = 0;
  const maxRetries = 3;
  const retryDelay = 1000; // 1 second

  while (retryCount < maxRetries) {
    try {
      mongoClient = new MongoClient(MONGODB_URI, {
        connectTimeoutMS: 10000,
        serverSelectionTimeoutMS: 10000,
        maxPoolSize: 10,
        retryWrites: true,
        retryReads: true,
      });
      
      await mongoClient.connect();
      db = mongoClient.db(MONGODB_DB_NAME);
      
      console.log(`✅ Connected to MongoDB: ${MONGODB_DB_NAME}`);
      
      // Initialize collections with error handling
      try {
        await initializeCollections(db);
      } catch (initError: any) {
        console.warn('⚠️ Collection initialization warning:', initError.message);
        // Don't throw here - allow server to continue even if index creation fails
        console.log('📊 Server will continue with limited functionality');
      }
      
      return db;
    } catch (error) {
      retryCount++;
      console.error(`❌ MongoDB Connection Error (attempt ${retryCount}/${maxRetries}):`, error);
      
      if (retryCount >= maxRetries) {
        throw new Error(`Failed to connect to MongoDB after ${maxRetries} attempts: ${error}`);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay * retryCount));
    }
  }

  throw new Error('Failed to connect to MongoDB');
}

export async function getMongoDb(): Promise<Db> {
  if (!db) {
    await connectMongoDB();
  }
  return db!;
}

// ====================
// CLEANUP PROBLEMATIC INDEXES
// ====================

async function cleanupProblematicIndexes(database: Db) {
  console.log('🧹 Cleaning up problematic indexes...');
  
  try {
    // Clean up final_users_v3 collection
    const usersCollection = database.collection('final_users_v3');
    const userIndexes = await usersCollection.listIndexes().toArray();
    
    for (const index of userIndexes) {
      if ((index.name === 'pioneerId_1' || index.name === 'email_1') && !index.sparse) {
        console.log(`🗑️ Dropping non-sparse ${index.name} index from final_users_v3`);
        await usersCollection.dropIndex(index.name);
      }
    }
    
    // Clean up ReputationScores collection
    const scoresCollection = database.collection('ReputationScores');
    const scoreIndexes = await scoresCollection.listIndexes().toArray();
    
    for (const index of scoreIndexes) {
      if (index.name === 'pioneerId_1' && !index.sparse) {
        console.log('🗑️ Dropping non-sparse pioneerId_1 index from ReputationScores');
        await scoresCollection.dropIndex('pioneerId_1');
      }
    }
    
    // Clean up null pioneerId and email values
    await patchNullPioneerIdValues(database);
    await patchNullEmailValues(database);
    
    console.log('✅ Index cleanup completed');
  } catch (error) {
    console.warn('⚠️ Index cleanup warning:', error);
  }
}

async function patchNullEmailValues(database: Db) {
  console.log('🔧 Patching null email values...');
  
  try {
    const usersCollection = database.collection('final_users_v3');
    
    // Update null email values in users collection
    const nullEmails = await usersCollection.find({ email: null }).toArray();
    if (nullEmails.length > 0) {
      console.log(`📝 Found ${nullEmails.length} users with null email, updating...`);
      
      for (const user of nullEmails) {
        const uniqueEmail = `temp_${new ObjectId().toString()}@placeholder.local`;
        await usersCollection.updateOne(
          { _id: user._id },
          { $set: { email: uniqueEmail, updatedAt: new Date() } }
        );
      }
    }
    
    console.log('✅ Null email values patched');
  } catch (error) {
    console.warn('⚠️ Patch null email warning:', error);
  }
}

async function patchNullPioneerIdValues(database: Db) {
  console.log('🔧 Patching null pioneerId values...');
  
  try {
    const usersCollection = database.collection('final_users_v3');
    const scoresCollection = database.collection('ReputationScores');
    
    // Update null pioneerId values in users collection
    const nullUsers = await usersCollection.find({ pioneerId: null }).toArray();
    if (nullUsers.length > 0) {
      console.log(`📝 Found ${nullUsers.length} users with null pioneerId, updating...`);
      
      for (const user of nullUsers) {
        const uniqueId = `temp_${new ObjectId().toString()}`;
        await usersCollection.updateOne(
          { _id: user._id },
          { $set: { pioneerId: uniqueId, updatedAt: new Date() } }
        );
      }
    }
    
    // Update null pioneerId values in scores collection
    const nullScores = await scoresCollection.find({ pioneerId: null }).toArray();
    if (nullScores.length > 0) {
      console.log(`📝 Found ${nullScores.length} scores with null pioneerId, updating...`);
      
      for (const score of nullScores) {
        const uniqueId = `temp_${new ObjectId().toString()}`;
        await scoresCollection.updateOne(
          { _id: score._id },
          { $set: { pioneerId: uniqueId, updatedAt: new Date() } }
        );
      }
    }
    
    console.log('✅ Null pioneerId values patched');
  } catch (error) {
    console.warn('⚠️ Patch null pioneerId warning:', error);
  }
}

// ====================
// INITIALIZE COLLECTIONS
// ====================

async function initializeCollections(database: Db) {
  // Clean up problematic indexes first
  await cleanupProblematicIndexes(database);
  
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
  _id?: ObjectId;
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
  
  // Payment details (optional)
  paymentDetails?: {
    paymentId: string;
    txid: string;
    amount: number;
    paidAt: string;
    method?: string;
  } | null;
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
  
  // Create indexes with sparse option for pioneerId to handle null values
  try {
    await collection.createIndex({ pioneerId: 1 }, { unique: true, sparse: true });
  } catch (indexError: any) {
    if (indexError.code === 11000) {
      console.warn('⚠️ pioneerId index conflict detected, attempting to clean up...');
      // Drop the problematic index and recreate with sparse option
      try {
        await collection.dropIndex('pioneerId_1');
        console.log('✅ Dropped problematic pioneerId_1 index');
        await collection.createIndex({ pioneerId: 1 }, { unique: true, sparse: true });
        console.log('✅ Recreated pioneerId index with sparse option');
      } catch (dropError) {
        console.warn('⚠️ Could not drop pioneerId index:', dropError);
      }
    } else {
      throw indexError;
    }
  }
  await collection.createIndex({ email: 1 }, { unique: true, sparse: true });
  await collection.createIndex({ username: 1 });
  await collection.createIndex({ walletAddress: 1 });
  await collection.createIndex({ createdAt: -1 });
  await collection.createIndex({ lastActiveAt: -1 });
}

// ====================
// REPUTATION SCORES COLLECTION (PRIMARY)
// ====================

export interface ReputationScoreDocument {
  _id?: ObjectId;
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
  
  // Create indexes with sparse option for pioneerId
  try {
    await collection.createIndex({ pioneerId: 1 }, { unique: true, sparse: true });
  } catch (indexError: any) {
    if (indexError.code === 11000) {
      console.warn('⚠️ ReputationScores pioneerId index conflict detected, attempting to clean up...');
      try {
        await collection.dropIndex('pioneerId_1');
        console.log('✅ Dropped problematic ReputationScores pioneerId_1 index');
        await collection.createIndex({ pioneerId: 1 }, { unique: true, sparse: true });
        console.log('✅ Recreated ReputationScores pioneerId index with sparse option');
      } catch (dropError) {
        console.warn('⚠️ Could not drop ReputationScores pioneerId index:', dropError);
      }
    } else {
      throw indexError;
    }
  }
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
  _id?: ObjectId;
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
  _id?: ObjectId;
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
  _id?: ObjectId;
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

export async function getUsersCollection(): Promise<Collection<UserDocument>> {
  const database = await getMongoDb();
  return database.collection('final_users_v3');
}

export async function getReputationScoresCollection(): Promise<Collection<ReputationScoreDocument>> {
  const database = await getMongoDb();
  return database.collection('ReputationScores');
}

export async function getDailyCheckinCollection(): Promise<Collection<DailyCheckinDocument>> {
  const database = await getMongoDb();
  return database.collection('DailyCheckin');
}

export async function getPointsLogCollection(): Promise<Collection<PointsLogDocument>> {
  const database = await getMongoDb();
  return database.collection('PointsLog');
}

export async function getWalletSnapshotsCollection(): Promise<Collection<WalletSnapshotDocument>> {
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
