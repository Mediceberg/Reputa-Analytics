import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '../../../../../server/db/mongoModels';
import { Db, Collection } from 'mongodb';

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
    const db = await connectMongoDB();

    // Build unified aggregation pipeline
    const pipeline: any[] = [];

    // Stage 1: Union all collections with source tagging
    const unionStage = {
      $unionWith: {
        coll: 'final_users_v3',
        pipeline: [
          {
            $project: {
              username: 1,
              walletAddress: 1,
              pioneerId: 1,
              email: 1,
              createdAt: 1,
              lastActiveAt: 1,
              referralCount: 1,
              paymentDetails: 1,
              protocolVersion: { $literal: 'v3' },
              source: { $literal: 'final_users_v3' }
            }
          }
        ]
      }
    };

    const unionStage2 = {
      $unionWith: {
        coll: 'final_users',
        pipeline: [
          {
            $project: {
              username: 1,
              walletAddress: 1,
              createdAt: 1,
              lastActiveAt: 1,
              referralCount: 1,
              protocolVersion: { $literal: 'legacy' },
              source: { $literal: 'final_users' }
            }
          }
        ]
      }
    };

    const unionStage3 = {
      $unionWith: {
        coll: 'userv3',
        pipeline: [
          {
            $project: {
              username: 1,
              walletAddress: 1,
              createdAt: 1,
              lastActiveAt: 1,
              protocolVersion: { $literal: 'userv3' },
              source: { $literal: 'userv3' }
            }
          }
        ]
      }
    };

    // Stage 2: Group by username to consolidate
    const groupStage = {
      $group: {
        _id: '$username',
        username: { $first: '$username' },
        walletAddresses: { $addToSet: '$walletAddress' },
        pioneerIds: { $addToSet: '$pioneerId' },
        emails: { $addToSet: '$email' },
        sources: { $addToSet: '$source' },
        createdAt: { $min: '$createdAt' },
        lastActiveAt: { $max: '$lastActiveAt' },
        referralCounts: { $addToSet: '$referralCount' },
        paymentDetails: { $first: '$paymentDetails' },
        protocolVersions: { $addToSet: '$protocolVersion' },
        recordCount: { $sum: 1 }
      }
    };

    // Stage 3: Add computed fields
    const projectStage = {
      $project: {
        _id: 0,
        username: 1,
        primaryWallet: { $arrayElemAt: ['$walletAddresses', 0] },
        allWallets: '$walletAddresses',
        primaryPioneerId: { $arrayElemAt: ['$pioneerIds', 0] },
        allPioneerIds: '$pioneerIds',
        primaryEmail: { $arrayElemAt: ['$emails', 0] },
        sources: 1,
        createdAt: 1,
        lastActiveAt: 1,
        maxReferralCount: { $max: '$referralCounts' },
        paymentDetails: 1,
        protocolVersions: 1,
        recordCount: 1,
        isConsolidated: { $gt: ['$recordCount', 1] }
      }
    };

    // Stage 4: Add search filter if provided
    if (searchQuery) {
      pipeline.push({
        $match: {
          $or: [
            { username: { $regex: searchQuery, $options: 'i' } },
            { primaryWallet: { $regex: searchQuery, $options: 'i' } },
            { primaryEmail: { $regex: searchQuery, $options: 'i' } }
          ]
        }
      });
    }

    // Build the full pipeline
    const fullPipeline = [
      // Start with final_users_v3 as base
      {
        $project: {
          username: 1,
          walletAddress: 1,
          pioneerId: 1,
          email: 1,
          createdAt: 1,
          lastActiveAt: 1,
          referralCount: 1,
          paymentDetails: 1,
          protocolVersion: { $literal: 'v3' },
          source: { $literal: 'final_users_v3' }
        }
      },
      unionStage,
      unionStage2,
      unionStage3,
      groupStage,
      projectStage,
      { $sort: { lastActiveAt: -1 } }
    ];

    // Execute aggregation
    const consolidatedUsers = await db.collection('final_users_v3').aggregate(fullPipeline).toArray();

    // Stage 5: Hydration with additional collections
    const usernames = consolidatedUsers.map(u => u.username);
    
    // Get reputation scores
    const reputationScores = await db.collection('ReputationScores')
      .find({ pioneerId: { $in: consolidatedUsers.flatMap(u => u.allPioneerIds).filter(Boolean) } })
      .toArray();

    // Get feedback data
    const feedbackData = await db.collection('all_feedbacks')
      .find({ username: { $in: usernames } })
      .toArray();

    // Get daily check-ins (if exists)
    let checkinData: any[] = [];
    try {
      checkinData = await db.collection('DailyCheckin')
        .find({ username: { $in: usernames } })
        .toArray();
    } catch (error) {
      console.warn('DailyCheckin collection not found:', error);
    }

    // Create lookup maps
    const scoresMap = new Map(
      reputationScores.map((score: any) => [score.pioneerId, score.totalReputationScore || 0])
    );

    const feedbackMap = new Map();
    feedbackData.forEach((feedback: any) => {
      if (!feedbackMap.has(feedback.username)) {
        feedbackMap.set(feedback.username, []);
      }
      feedbackMap.get(feedback.username).push(feedback);
    });

    const checkinMap = new Map();
    checkinData.forEach((checkin: any) => {
      if (!checkinMap.has(checkin.username)) {
        checkinMap.set(checkin.username, []);
      }
      checkinMap.get(checkin.username).push(checkin);
    });

    // Final data transformation
    const transformedUsers = consolidatedUsers.map((user: any) => {
      const userScores = user.allPioneerIds.map((id: any) => scoresMap.get(id) || 0);
      const maxScore = Math.max(...userScores, 0);
      const feedbacks = feedbackMap.get(user.username) || [];
      const checkins = checkinMap.get(user.username) || [];

      return {
        ...user,
        reputaScore: maxScore,
        feedbackCount: feedbacks.length,
        hasFeedback: feedbacks.length > 0,
        checkinCount: checkins.length,
        lastCheckin: checkins.length > 0 ? Math.max(...checkins.map((c: any) => new Date(c.date || c.createdAt).getTime())) : null,
        activityScore: feedbacks.length + checkins.length + (user.maxReferralCount || 0),
        dataCompleteness: {
          hasWallet: !!user.primaryWallet,
          hasPioneerId: !!user.primaryPioneerId,
          hasEmail: !!user.primaryEmail,
          hasPayment: !!user.paymentDetails,
          hasReputation: maxScore > 0
        }
      };
    });

    // Sort by activity score and last active
    transformedUsers.sort((a, b) => {
      const activityCompare = b.activityScore - a.activityScore;
      if (activityCompare !== 0) return activityCompare;
      
      return new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime();
    });

    return NextResponse.json({
      success: true,
      users: transformedUsers,
      count: transformedUsers.length,
      meta: {
        totalRecords: transformedUsers.reduce((sum, u) => sum + u.recordCount, 0),
        consolidatedUsers: transformedUsers.filter(u => u.isConsolidated).length,
        usersWithScores: transformedUsers.filter(u => u.reputaScore > 0).length,
        usersWithFeedback: transformedUsers.filter(u => u.hasFeedback).length,
        usersWithCheckins: transformedUsers.filter(u => u.checkinCount > 0).length,
        searchQuery: searchQuery || null
      }
    });

  } catch (error) {
    console.error('Admin portal consolidated API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch consolidated users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
