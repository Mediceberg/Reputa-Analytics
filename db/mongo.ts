import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in your .env file");
}

export async function connectMongo() {
  if (mongoose.connection.readyState >= 1) {
    console.log('📊 MongoDB already connected');
    return;
  }

  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    console.log(`📍 URI: ${MONGODB_URI.replace(/\/\/.*@/, '//***:***@')}`); // Hide credentials in logs

    const connection = await mongoose.connect(MONGODB_URI, {
      dbName: process.env.MONGODB_DB_NAME,
      serverSelectionTimeoutMS: 30000, // 30 second timeout
      socketTimeoutMS: 45000, // 45 second socket timeout
      maxPoolSize: 10,
      family: 4
    });

    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${connection.connections[0]?.db?.databaseName || 'unknown'}`);

    return connection;
  } catch (error: any) {
    console.error('❌ MongoDB connection failed:', error.message);

    if (error.message.includes('authentication failed')) {
      console.error('🔐 Authentication failed - check your MongoDB credentials');
    } else if (error.message.includes('getaddrinfo ENOTFOUND')) {
      console.error('🌐 DNS resolution failed - check your MongoDB URI');
    } else if (error.message.includes('connection timed out')) {
      console.error('⏱️ Connection timed out - check network connectivity');
    }

    throw error;
  }
}
