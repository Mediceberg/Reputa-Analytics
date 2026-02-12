import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB, getUsersCollection, getReputationScoresCollection } from '../../../../../server/db/mongoModels';
import { createRedisClient } from '../../../../../api/server.redis';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
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

    // Get search query
    const searchQuery = request.nextUrl.searchParams.get('search') || '';

    // Connect to database
    await connectMongoDB();
    const usersCollection = await getUsersCollection();
    const scoresCollection = await getReputationScoresCollection();

    // Build query
    let query: any = {};
    if (searchQuery) {
      query = {
        $or: [
          { username: { $regex: searchQuery, $options: 'i' } },
          { walletAddress: { $regex: searchQuery, $options: 'i' } },
          { email: { $regex: searchQuery, $options: 'i' } }
        ]
      };
    }

    // Fetch ALL users without limit - complete data integrity
    const users = await usersCollection
      .find(query)
      .sort({ lastActiveAt: -1 })
      .toArray(); // REMOVED LIMIT for complete data fetch

    // Get reputation scores for all users
    const userIds = users.map(user => user.pioneerId).filter(Boolean);
    const scores = await scoresCollection
      .find({ pioneerId: { $in: userIds } })
      .toArray();

    // Create scores map for quick lookup
    const scoresMap = new Map(
      scores.map(score => [score.pioneerId, score.totalReputationScore || 0])
    );

    // Get visit data from Redis/Upstash
    let visitData = new Map<string, { visitCount: number; lastVisit: string }>();
    try {
      const redis = createRedisClient();
      // For now, we'll use a simple approach - individual gets for known usernames
      // In a real implementation, you might want to maintain a list of active users
      const usernames = users.map(u => u.username).filter(Boolean);
      
      const visitPromises = usernames.map(async (username: string) => {
        try {
          const data = await redis.get(`visit:${username}`);
          if (data) {
            const visitInfo = JSON.parse(data);
            return {
              username,
              visitCount: visitInfo.count || 1,
              lastVisit: visitInfo.lastVisit
            };
          }
          return null;
        } catch {
          return null;
        }
      });
      
      const visitResults = await Promise.all(visitPromises);
      visitResults.forEach(result => {
        if (result) {
          visitData.set(result.username, {
            visitCount: result.visitCount,
            lastVisit: result.lastVisit
          });
        }
      });
    } catch (error) {
      console.warn('Redis visit data fetch failed:', error);
    }

    // Transform data for frontend with complete hydration
    const transformedUsers = users.map(user => {
      const visitInfo = visitData.get(user.username) || { visitCount: 1, lastVisit: user.lastActiveAt };
      const reputaScore = scoresMap.get(user.pioneerId) || 0;
      
      return {
        _id: user._id?.toString(),
        username: user.username,
        wallets: user.walletAddress ? [user.walletAddress] : [],
        visitCount: visitInfo.visitCount,
        isVip: !!(user.paymentDetails && user.paymentDetails.paidAt), // Real VIP detection
        paymentDetails: user.paymentDetails || null,
        reputaScore: reputaScore,
        firstSeen: user.createdAt ? user.createdAt.toISOString() : new Date().toISOString(),
        lastSeen: visitInfo.lastVisit || (user.lastActiveAt ? user.lastActiveAt.toISOString() : new Date().toISOString()),
        email: user.email || '',
        referralCount: user.referralCount || 0,
        protocolVersion: user.protocolVersion || '1.0'
      };
    });

    // Sort by lastSeen descending (most recent first)
    transformedUsers.sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());

    return NextResponse.json({
      success: true,
      users: transformedUsers,
      count: transformedUsers.length,
      meta: {
        totalFetched: users.length,
        withScores: scoresMap.size,
        withVisitData: visitData.size,
        vipUsers: transformedUsers.filter(u => u.isVip).length
      }
    });

  } catch (error) {
    console.error('Admin portal users API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
