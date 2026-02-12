import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB, getUsersCollection, getReputationScoresCollection } from '../../../../../server/db/mongoModels';
import { createRedisClient } from '../../../../../api/server.redis';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Verify admin password
    const password = request.headers.get('x-admin-password') || 
                    request.nextUrl.searchParams.get('password');
    
    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to databases with timeout
    const connectionTimeout = 10000; // 10 seconds
    const connectionPromise = connectMongoDB();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database connection timeout')), connectionTimeout)
    );

    await Promise.race([connectionPromise, timeoutPromise]);

    // Get collections
    const usersCollection = await getUsersCollection();
    const scoresCollection = await getReputationScoresCollection();

    // Test Redis connection
    let redisStatus = 'connected';
    let redisLatency = 0;
    try {
      const redis = createRedisClient();
      const redisStart = Date.now();
      await redis.set('health-check', 'ok', { ex: 60 });
      await redis.get('health-check');
      redisLatency = Date.now() - redisStart;
    } catch (error) {
      redisStatus = 'error';
      redisLatency = -1;
      console.error('Redis health check failed:', error);
    }

    // Get stats with accurate counting
    const [
      totalUsers,
      totalScores,
      uniqueUsernames,
      vipUsers,
      paidUsersCount
    ] = await Promise.all([
      usersCollection.countDocuments(), // Total users in collection
      scoresCollection.countDocuments(), // Total reputation scores
      usersCollection.distinct('username'), // Unique usernames
      usersCollection.countDocuments({ 'paymentDetails': { $exists: true, $ne: null } }), // Paid VIP users
      usersCollection.countDocuments({ referralCount: { $gte: 5 } }) // Referral-based VIP users
    ]);

    const stats = {
      totalUniqueUsers: uniqueUsernames.length,
      totalVisits: totalUsers,
      totalVipUsers: vipUsers + paidUsersCount, // Both paid and referral VIPs
      totalReputationScores: totalScores,
      paidVipUsers: vipUsers,
      referralVipUsers: paidUsersCount
    };

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    return NextResponse.json({
      success: true,
      stats,
      meta: {
        processingTime,
        timestamp: new Date().toISOString(),
        redisStatus,
        redisLatency
      }
    });

  } catch (error) {
    console.error('Admin portal stats API error:', error);
    
    const endTime = Date.now();
    const processingTime = endTime - startTime;

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch statistics',
      details: error instanceof Error ? error.message : 'Unknown error',
      meta: {
        processingTime,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}
