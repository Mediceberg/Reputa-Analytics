/**
 * Referral System API
 * Handles referral tracking, confirmation, and points claiming
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Simple in-memory store for demo purposes (replace with actual DB calls)
interface Referral {
  referrerWallet: string;
  referredWallet: string;
  status: 'pending' | 'confirmed' | 'claimed';
  rewardPoints: number;
  createdAt: Date;
  confirmedAt?: Date;
  claimedAt?: Date;
}

interface User {
  pioneerId: string;
  primaryWallet: string;
  referralCode: string;
  pointsBalance: number;
  claimablePoints: number;
}

// In-memory stores (would be replaced by MongoDB)
const referralsStore = new Map<string, Referral>();
const usersStore = new Map<string, User>();

function setCorsHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
}

function generateReferralCode(walletAddress: string): string {
  // Generate referral code: first 6 characters of wallet in uppercase
  const code = walletAddress.substring(0, 6).toUpperCase();
  return code.padEnd(6, 'X'); // Ensure it's 6 chars
}

/**
 * POST /api/referral/track
 * Track a new referral when user signs up with a ref code
 * Body: { walletAddress: string, referralCode: string }
 */
async function handleTrackReferral(req: VercelRequest, res: VercelResponse) {
  const { walletAddress, referralCode } = req.body;

  if (!walletAddress || !referralCode) {
    return res.status(400).json({
      success: false,
      error: 'walletAddress and referralCode are required',
    });
  }

  // Normalize inputs
  const normalizedWallet = walletAddress.toLowerCase();
  const normalizedCode = referralCode.toUpperCase();

  try {
    // Prevent self-referral
    const referrerCodeBase = normalizedWallet.substring(0, 6).toUpperCase();
    if (normalizedCode === referrerCodeBase || normalizedCode === referralCode) {
      return res.status(400).json({
        success: false,
        error: 'Cannot refer yourself',
      });
    }

    // Check if this wallet already has a referral
    let existingReferral = Array.from(referralsStore.values()).find(
      (r) => r.referredWallet === normalizedWallet
    );

    if (existingReferral) {
      return res.status(400).json({
        success: false,
        error: 'This wallet already has a referrer',
      });
    }

    // Find the referrer by code
    let referrerWallet: string | null = null;
    for (const [, user] of usersStore) {
      if (user.referralCode === normalizedCode) {
        referrerWallet = user.primaryWallet.toLowerCase();
        break;
      }
    }

    if (!referrerWallet) {
      return res.status(404).json({
        success: false,
        error: 'Invalid referral code',
      });
    }

    // Create referral record
    const referralKey = `${referrerWallet}-${normalizedWallet}`;
    const referral: Referral = {
      referrerWallet: referrerWallet,
      referredWallet: normalizedWallet,
      status: 'pending',
      rewardPoints: 30,
      createdAt: new Date(),
    };

    referralsStore.set(referralKey, referral);

    return res.status(201).json({
      success: true,
      message: 'Referral tracked successfully',
      referral: {
        referrerWallet,
        referredWallet: normalizedWallet,
        status: 'pending',
        rewardPoints: 30,
      },
    });
  } catch (error: any) {
    console.error('[REFERRAL] Error tracking referral:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to track referral',
    });
  }
}

/**
 * POST /api/referral/confirm
 * Confirm a referral after user completes first wallet analysis
 * Body: { walletAddress: string }
 */
async function handleConfirmReferral(req: VercelRequest, res: VercelResponse) {
  const { walletAddress } = req.body;

  if (!walletAddress) {
    return res.status(400).json({
      success: false,
      error: 'walletAddress is required',
    });
  }

  const normalizedWallet = walletAddress.toLowerCase();

  try {
    // Find the referral record
    let referral: Referral | null = null;
    let referralKey: string | null = null;

    for (const [key, ref] of referralsStore) {
      if (ref.referredWallet === normalizedWallet && ref.status === 'pending') {
        referral = ref;
        referralKey = key;
        break;
      }
    }

    if (!referral || !referralKey) {
      return res.status(404).json({
        success: false,
        error: 'No pending referral found for this wallet',
      });
    }

    // Update to confirmed
    referral.status = 'confirmed';
    referral.confirmedAt = new Date();
    referralsStore.set(referralKey, referral);

    // Add claimable points to referrer
    const referrerUser = usersStore.get(referral.referrerWallet);
    if (referrerUser) {
      referrerUser.claimablePoints += referral.rewardPoints;
      usersStore.set(referral.referrerWallet, referrerUser);
    }

    return res.status(200).json({
      success: true,
      message: 'Referral confirmed successfully',
      referral: {
        referrerWallet: referral.referrerWallet,
        referredWallet: referral.referredWallet,
        status: 'confirmed',
        rewardPoints: referral.rewardPoints,
        confirmedAt: referral.confirmedAt,
      },
    });
  } catch (error: any) {
    console.error('[REFERRAL] Error confirming referral:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to confirm referral',
    });
  }
}

/**
 * POST /api/referral/claim-points
 * Claim all confirmed referral points
 * Body: { walletAddress: string }
 */
async function handleClaimPoints(req: VercelRequest, res: VercelResponse) {
  const { walletAddress } = req.body;

  if (!walletAddress) {
    return res.status(400).json({
      success: false,
      error: 'walletAddress is required',
    });
  }

  const normalizedWallet = walletAddress.toLowerCase();

  try {
    const user = usersStore.get(normalizedWallet);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const pointsToClaim = user.claimablePoints;

    if (pointsToClaim === 0) {
      return res.status(400).json({
        success: false,
        error: 'No points to claim',
      });
    }

    // Update user's points balance
    user.pointsBalance += pointsToClaim;
    user.claimablePoints = 0;
    usersStore.set(normalizedWallet, user);

    // Mark referrals as claimed
    for (const [key, referral] of referralsStore) {
      if (
        referral.referrerWallet === normalizedWallet &&
        referral.status === 'confirmed'
      ) {
        referral.status = 'claimed';
        referral.claimedAt = new Date();
        referralsStore.set(key, referral);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Points claimed successfully',
      data: {
        pointsClaimed: pointsToClaim,
        newPointsBalance: user.pointsBalance,
        timestamp: new Date(),
      },
    });
  } catch (error: any) {
    console.error('[REFERRAL] Error claiming points:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to claim points',
    });
  }
}

/**
 * GET /api/referral/stats
 * Get referral statistics for a user
 * Query: { walletAddress: string }
 */
async function handleGetStats(req: VercelRequest, res: VercelResponse) {
  const { walletAddress } = req.query;

  if (!walletAddress || typeof walletAddress !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'walletAddress query parameter is required',
    });
  }

  const normalizedWallet = walletAddress.toLowerCase();

  try {
    const user = usersStore.get(normalizedWallet);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Calculate stats
    let confirmedReferrals = 0;
    let pendingReferrals = 0;
    let totalPointsEarned = 0;

    for (const referral of referralsStore.values()) {
      if (referral.referrerWallet === normalizedWallet) {
        if (referral.status === 'confirmed' || referral.status === 'claimed') {
          confirmedReferrals++;
          totalPointsEarned += referral.rewardPoints;
        } else if (referral.status === 'pending') {
          pendingReferrals++;
        }
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        confirmedReferrals,
        pendingReferrals,
        totalPointsEarned,
        claimablePoints: user.claimablePoints,
        pointsBalance: user.pointsBalance,
        referralCode: user.referralCode,
        referralLink: `https://reputa-score.vercel.app/?ref=${user.referralCode}`,
      },
    });
  } catch (error: any) {
    console.error('[REFERRAL] Error getting stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get referral stats',
    });
  }
}

/**
 * GET /api/referral/code
 * Get or generate referral code for a user
 * Query: { walletAddress: string }
 */
async function handleGetReferralCode(req: VercelRequest, res: VercelResponse) {
  const { walletAddress } = req.query;

  if (!walletAddress || typeof walletAddress !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'walletAddress query parameter is required',
    });
  }

  const normalizedWallet = walletAddress.toLowerCase();

  try {
    let user = usersStore.get(normalizedWallet);

    if (!user) {
      // Create new user with referral code
      const referralCode = generateReferralCode(normalizedWallet);
      user = {
        pioneerId: `user_${Date.now()}`,
        primaryWallet: normalizedWallet,
        referralCode,
        pointsBalance: 0,
        claimablePoints: 0,
      };
      usersStore.set(normalizedWallet, user);
    }

    return res.status(200).json({
      success: true,
      data: {
        referralCode: user.referralCode,
        referralLink: `https://reputa-score.vercel.app/?ref=${user.referralCode}`,
      },
    });
  } catch (error: any) {
    console.error('[REFERRAL] Error getting referral code:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get referral code',
    });
  }
}

// Main handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const pathname = new URL(req.url || '', 'http://localhost').pathname;

  try {
    if (pathname.endsWith('/api/referral/track') && req.method === 'POST') {
      return await handleTrackReferral(req, res);
    } else if (pathname.endsWith('/api/referral/confirm') && req.method === 'POST') {
      return await handleConfirmReferral(req, res);
    } else if (pathname.endsWith('/api/referral/claim-points') && req.method === 'POST') {
      return await handleClaimPoints(req, res);
    } else if (pathname.endsWith('/api/referral/stats') && req.method === 'GET') {
      return await handleGetStats(req, res);
    } else if (pathname.endsWith('/api/referral/code') && req.method === 'GET') {
      return await handleGetReferralCode(req, res);
    } else {
      return res.status(404).json({
        success: false,
        error: 'Endpoint not found',
      });
    }
  } catch (error: any) {
    console.error('[REFERRAL] Unhandled error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
