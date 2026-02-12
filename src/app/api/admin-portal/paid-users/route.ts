import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB, getUsersCollection, getReputationScoresCollection } from '../../../../../server/db/mongoModels';
import { createRedisClient } from '../../../../../api/server.redis';

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

    // Connect to database
    await connectMongoDB();
    const usersCollection = await getUsersCollection();
    const scoresCollection = await getReputationScoresCollection();

    // Fetch ALL users with payment details OR high referral count (VIP users) - no limits
    const users = await usersCollection
      .find({
        $or: [
          { 'paymentDetails': { $exists: true, $ne: null } },
          { referralCount: { $gte: 5 } }
        ]
      })
      .sort({ lastActiveAt: -1 })
      .toArray(); // REMOVED LIMIT for complete data fetch

    // Get reputation scores for VIP users
    const userIds = users.map(user => user.pioneerId).filter(Boolean);
    const scores = await scoresCollection
      .find({ pioneerId: { $in: userIds } })
      .toArray();

    // Create scores map for quick lookup
    const scoresMap = new Map(
      scores.map(score => [score.pioneerId, score.totalReputationScore || 0])
    );

    // Get visit data from Redis/Upstash for VIP users
    let visitData = new Map<string, { visitCount: number; lastVisit: string }>();
    try {
      const redis = createRedisClient();
      // For now, we'll use a simple approach - individual gets for known usernames
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

    // Transform data for frontend with real payment information
    const paidUsers = users.map(user => {
      const visitInfo = visitData.get(user.username) || { visitCount: 1, lastVisit: user.lastActiveAt };
      const reputaScore = scoresMap.get(user.pioneerId) || 0;
      
      return {
        _id: user._id?.toString(),
        username: user.username,
        wallets: user.walletAddress ? [user.walletAddress] : [],
        visitCount: visitInfo.visitCount,
        isVip: true, // All users in this endpoint are VIP
        paymentDetails: user.paymentDetails || {
          paymentId: `legacy_${user.referralCount}_referrals`,
          txid: null, // No blockchain transaction for referral-based VIP
          amount: 0, // Free VIP based on referrals
          paidAt: user.createdAt.toISOString(),
          method: 'referral_program'
        },
        reputaScore: reputaScore,
        firstSeen: user.createdAt ? user.createdAt.toISOString() : new Date().toISOString(),
        lastSeen: visitInfo.lastVisit || (user.lastActiveAt ? user.lastActiveAt.toISOString() : new Date().toISOString()),
        email: user.email || '',
        referralCount: user.referralCount || 0,
        vipType: user.paymentDetails ? 'paid' : 'referral_based'
      };
    });

    // Sort by lastSeen descending (most recent first), then by payment amount
    paidUsers.sort((a, b) => {
      const dateCompare = new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
      if (dateCompare !== 0) return dateCompare;
      
      // If same date, sort by payment amount (paid users first)
      const aAmount = a.paymentDetails?.amount || 0;
      const bAmount = b.paymentDetails?.amount || 0;
      return bAmount - aAmount;
    });

    return NextResponse.json({
      success: true,
      paidUsers,
      count: paidUsers.length,
      meta: {
        totalFetched: users.length,
        withScores: scoresMap.size,
        withVisitData: visitData.size,
        paidVips: paidUsers.filter(u => u.paymentDetails?.amount && u.paymentDetails.amount > 0).length,
        referralVips: paidUsers.filter(u => u.vipType === 'referral_based').length
      }
    });

  } catch (error) {
    console.error('Admin portal paid users API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch paid users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
