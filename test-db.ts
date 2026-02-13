#!/usr/bin/env tsx

/**
 * Database Connectivity Test
 * Comprehensive self-diagnosis for MongoDB Atlas and Upstash KV connectivity
 */

import { connectMongo } from '../db/mongo.js';
import { createRedisClient } from '../api/server.redis.js';

async function testMongoDBConnection() {
  console.log('🔍 Testing MongoDB Atlas Connection...');
  console.log('=' .repeat(50));

  try {
    const connection = await connectMongo();
    console.log('✅ MongoDB Connected Successfully!');

    // Test basic operations
    const db = connection.connection.db;
    console.log(`📊 Database: ${db.databaseName}`);

    // List collections
    const collections = await db.listCollections().toArray();
    console.log(`📁 Collections found: ${collections.length}`);
    collections.slice(0, 5).forEach(col => {
      console.log(`   - ${col.name}`);
    });

    if (collections.length > 5) {
      console.log(`   ... and ${collections.length - 5} more`);
    }

    // Test data retrieval from a few collections
    for (const col of collections.slice(0, 3)) {
      try {
        const collection = db.collection(col.name);
        const count = await collection.countDocuments();
        console.log(`   📊 ${col.name}: ${count} documents`);
      } catch (e) {
        console.log(`   ❌ ${col.name}: Error counting documents`);
      }
    }

    await connection.disconnect();
    console.log('🔌 MongoDB connection closed');

    return { success: true, collections: collections.length };

  } catch (error: any) {
    console.error('❌ MongoDB Connection Failed!');
    console.error('Error details:', error.message);

    if (error.message.includes('authentication failed')) {
      console.error('🔐 SOLUTION: Check your MongoDB username/password in .env');
    } else if (error.message.includes('getaddrinfo ENOTFOUND')) {
      console.error('🌐 SOLUTION: Check your MongoDB URI - DNS resolution failed');
    } else if (error.message.includes('connection timed out')) {
      console.error('⏱️ SOLUTION: Check network connectivity or MongoDB Atlas IP whitelist');
    } else if (error.message.includes('not authorized')) {
      console.error('🚫 SOLUTION: Check MongoDB user permissions and database access');
    }

    return { success: false, error: error.message };
  }
}

async function testUpstashConnection() {
  console.log('\n🔍 Testing Upstash KV Connection...');
  console.log('=' .repeat(50));

  try {
    const redis = createRedisClient();

    // Test basic operations
    console.log('🔗 Connecting to Upstash...');

    const testKey = 'connectivity_test_' + Date.now();
    await redis.set(testKey, 'success', { ex: 60 });
    const result = await redis.get(testKey);

    if (result === 'success') {
      console.log('✅ Upstash Connected Successfully!');

      // Test some basic Redis operations
      const info = await redis.info();
      console.log('📊 Redis Info retrieved');

      // Clean up test key
      await redis.del(testKey);
      console.log('🧹 Test key cleaned up');

    } else {
      throw new Error('Set/Get test failed');
    }

    return { success: true };

  } catch (error: any) {
    console.error('❌ Upstash Connection Failed!');
    console.error('Error details:', error.message);

    if (error.message.includes('credentials are missing')) {
      console.error('🔐 SOLUTION: Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to .env');
    } else if (error.message.includes('network') || error.message.includes('ECONNREFUSED')) {
      console.error('🌐 SOLUTION: Check Upstash URL and network connectivity');
    } else if (error.message.includes('authentication')) {
      console.error('🚫 SOLUTION: Check your Upstash REST token');
    }

    return { success: false, error: error.message };
  }
}

async function testEnvironmentVariables() {
  console.log('\n🔍 Checking Environment Variables...');
  console.log('=' .repeat(50));

  const requiredVars = [
    'MONGODB_URI',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'ADMIN_PASSWORD'
  ];

  const issues = [];

  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (!value) {
      console.log(`❌ ${varName}: MISSING`);
      issues.push(`${varName} is not set`);
    } else {
      // Mask sensitive data in logs
      let displayValue = value;
      if (varName.includes('PASSWORD') || varName.includes('TOKEN')) {
        displayValue = value.substring(0, 8) + '***';
      } else if (varName.includes('URI') || varName.includes('URL')) {
        displayValue = value.replace(/:\/\/.*@/, '://***:***@');
      }

      console.log(`✅ ${varName}: ${displayValue}`);
    }
  }

  if (issues.length > 0) {
    console.log('\n⚠️ Environment Variable Issues:');
    issues.forEach(issue => console.log(`   - ${issue}`));
    console.log('📝 SOLUTION: Add missing variables to your .env file');
  } else {
    console.log('✅ All required environment variables are set!');
  }

  return { issues: issues.length };
}

async function runFullDiagnosis() {
  console.log('🚀 STARTING COMPREHENSIVE DATABASE CONNECTIVITY DIAGNOSIS');
  console.log('=' .repeat(70));

  const results = {
    environment: await testEnvironmentVariables(),
    mongodb: await testMongoDBConnection(),
    upstash: await testUpstashConnection()
  };

  console.log('\n📊 DIAGNOSIS SUMMARY');
  console.log('=' .repeat(50));

  const envOk = results.environment.issues === 0;
  const mongoOk = results.mongodb.success;
  const upstashOk = results.upstash.success;

  console.log(`Environment Variables: ${envOk ? '✅' : '❌'} (${results.environment.issues} issues)`);
  console.log(`MongoDB Connection: ${mongoOk ? '✅' : '❌'}`);
  console.log(`Upstash Connection: ${upstashOk ? '✅' : '❌'}`);

  const overallSuccess = envOk && mongoOk && upstashOk;

  if (overallSuccess) {
    console.log('\n🎉 ALL SYSTEMS OPERATIONAL!');
    console.log('The database connections are working correctly.');
    console.log('If you still see Network Errors, the issue is likely in:');
    console.log('   - API route matching');
    console.log('   - CORS configuration');
    console.log('   - Frontend request configuration');
  } else {
    console.log('\n❌ CONNECTIVITY ISSUES DETECTED!');
    console.log('Fix the issues above before proceeding.');
    console.log('Common solutions:');
    console.log('   1. Check .env file has correct credentials');
    console.log('   2. Verify MongoDB Atlas IP whitelist');
    console.log('   3. Check Upstash REST API settings');
  }

  console.log('\n🔚 DIAGNOSIS COMPLETE');
  console.log('=' .repeat(70));

  return results;
}

// Run the diagnosis
runFullDiagnosis().catch(error => {
  console.error('💥 CRITICAL ERROR during diagnosis:', error);
  process.exit(1);
});
