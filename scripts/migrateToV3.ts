#!/usr/bin/env node

/**
 * Migration Script: Recalculate All User Reputation to Protocol v3.0
 * 
 * This script:
 * 1. Reads all existing user data
 * 2. Recalculates reputation based on Protocol v3.0 rules
 * 3. Stores in MongoDB with protocolVersion='3.0'
 * 4. Generates a migration report
 * 
 * Usage: npx ts-node scripts/migrateToV3.ts
 */

import { connectMongo } from '../db/mongo.js';
import { ReputationScoreModel, WalletModel } from '../db/mongoModels.js';
import protocol from '../server/config/reputaProtocol.js';

const BATCH_SIZE = 100;

interface MigrationStats {
  totalUsers: number;
  successfulMigrations: number;
  skippedUsers: number;
  errors: { pioneerId: string; error: string }[];
  startTime: Date;
  endTime?: Date;
}

async function migrateUserReputation(pioneerId: string): Promise<boolean> {
  try {
    // Get user's current reputation data
    const repData = await ReputationScoreModel.findOne({ pioneerId });
    
    if (!repData) {
      console.warn(`⚠️  No reputation data found for user: ${pioneerId}`);
      return false;
    }
    
    // Check if already on v3
    if (repData.protocolVersion === protocol.PROTOCOL_VERSION) {
      console.log(`✓ Already on v${protocol.PROTOCOL_VERSION}: ${pioneerId}`);
      return false; // Skip already migrated users
    }
    
    // Recalculate points using new protocol
    const newTotal = protocol.calculateTotalScore(
      repData.walletScore || 0,
      repData.walletScore || 0,
      repData.appScore || 0
    );
    
    const oldTotal = repData.totalReputationScore || 0;
    const newLevel = protocol.calculateLevelFromPoints(newTotal);
    const oldLevel = repData.reputationLevel || 1;
    
    // Update in MongoDB
    await ReputationScoreModel.updateOne(
      { pioneerId },
      {
        $set: {
          totalReputationScore: newTotal,
          reputationLevel: newLevel,
          protocolVersion: protocol.PROTOCOL_VERSION,
          updatedAt: new Date(),
        }
      }
    );
    
    console.log(`✅ Migrated: ${pioneerId} | Score: ${oldTotal}→${newTotal} (Δ${newTotal - oldTotal || 0}) | Level: ${oldLevel}→${newLevel}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Error migrating ${pioneerId}:`, error);
    throw error;
  }
}

async function runMigration() {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 REPUTA PROTOCOL v3.0 MIGRATION');
  console.log('='.repeat(80) + '\n');
  
  const stats: MigrationStats = {
    totalUsers: 0,
    successfulMigrations: 0,
    skippedUsers: 0,
    errors: [],
    startTime: new Date(),
  };
  
  try {
    // Connect to MongoDB
    console.log('📊 Connecting to MongoDB...');
    await connectMongo();
    console.log('✅ Connected\n');
    
    // Get all users
    const allUsers = await ReputationScoreModel.find({});
    stats.totalUsers = allUsers.length;
    
    console.log(`📋 Found ${allUsers.length} users to migrate\n`);
    console.log('Processing users in batches of ' + BATCH_SIZE + '...\n');
    
    // Process in batches
    for (let i = 0; i < allUsers.length; i += BATCH_SIZE) {
      const batch = allUsers.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(allUsers.length / BATCH_SIZE);
      
      console.log(`\n[Batch ${batchNumber}/${totalBatches}]`);
      console.log('-'.repeat(40));
      
      for (const user of batch) {
        try {
          const isMigrated = await migrateUserReputation(user.pioneerId);
          if (isMigrated) {
            stats.successfulMigrations++;
          } else {
            stats.skippedUsers++;
          }
        } catch (error: any) {
          stats.errors.push({
            pioneerId: user.pioneerId,
            error: error.message || String(error)
          });
        }
      }
    }
    
    // Show migration summary report
    console.log('\n' + '='.repeat(80));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Users:           ${stats.totalUsers}`);
    console.log(`Successful Migrations: ${stats.successfulMigrations}`);
    console.log(`Skipped (Already v3):  ${stats.skippedUsers}`);
    console.log(`Errors:                ${stats.errors.length}`);
    
    if (stats.endTime) {
      const duration = (stats.endTime.getTime() - stats.startTime.getTime()) / 1000;
      const rate = stats.totalUsers > 0 ? (stats.totalUsers / duration).toFixed(0) : 0;
      console.log(`Duration:             ${duration.toFixed(2)}s`);
      console.log(`Rate:                 ${rate} users/sec`);
    }
    
    console.log('='.repeat(80));
    
    if (stats.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      stats.errors.slice(0, 10).forEach(err => {
        console.log(`   - ${err.pioneerId}: ${err.error}`);
      });
      if (stats.errors.length > 10) {
        console.log(`   ... and ${stats.errors.length - 10} more`);
      }
    }
    
    console.log('\n✅ MIGRATION COMPLETE!\n');
    
    process.exit(stats.errors.length > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('\n❌ MIGRATION FAILED:', error);
    process.exit(1);
  }
}

// Run migration
runMigration().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
