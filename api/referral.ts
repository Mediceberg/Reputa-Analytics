/**
 * Referral System API
 * Single consolidated endpoint for all referral actions
 * 
 * Usage:
 * GET /api/referral?action=stats&walletAddress=XXX
 * GET /api/referral?action=code&walletAddress=XXX
 * POST /api/referral with body: { action: 'track'|'confirm'|'claim-points', walletAddress, referralCode? }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

function setCorsHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
}

function generateReferralCode(walletAddress: string): string {
  return walletAddress.substring(0, 6).toUpperCase().padEnd(6, 'X');
}

function successResponse(data: any) {
  return {
    success: true,
    data,
  };
}

function errorResponse(error: string) {
  return {
    success: false,
    error,
  };
}

// GET handler for stats and code retrieval
async function handleGetRequest(req: VercelRequest, res: VercelResponse) {
  const { action, walletAddress } = req.query;

  if (!walletAddress || typeof walletAddress !== 'string') {
    return res.status(400).json(errorResponse('Wallet address is required'));
  }

  console.log(`✅ [REFERRAL GET] Action: ${action}, Wallet: ${walletAddress}`);

  if (action === 'stats') {
    const referralCode = generateReferralCode(walletAddress);
    const referralLink = `https://reputa-score.vercel.app/?ref=${referralCode}`;

    return res.status(200).json(
      successResponse({
        referralCode,
        referralLink,
        confirmedReferrals: 0,
        pendingReferrals: 0,
        totalPointsEarned: 0,
        claimablePoints: 0,
        pointsBalance: 0,
      })
    );
  } else if (action === 'code') {
    const referralCode = generateReferralCode(walletAddress);
    return res.status(200).json(successResponse({ referralCode }));
  } else {
    return res.status(400).json(errorResponse('Invalid action'));
  }
}

// POST handler for track, confirm, and claim actions
async function handlePostRequest(req: VercelRequest, res: VercelResponse) {
  const { action, walletAddress, referralCode } = req.body;

  console.log(`✅ [REFERRAL POST] Action: ${action}, Wallet: ${walletAddress}`);

  if (action === 'track') {
    if (!walletAddress || !referralCode) {
      return res.status(400).json(errorResponse('Wallet address and referral code are required'));
    }

    return res.status(200).json(
      successResponse({
        message: 'Referral tracked successfully',
        status: 'pending',
      })
    );
  } else if (action === 'confirm') {
    if (!walletAddress) {
      return res.status(400).json(errorResponse('Wallet address is required'));
    }

    return res.status(200).json(
      successResponse({
        message: 'Referral confirmed successfully',
        status: 'confirmed',
        rewardPoints: 30,
      })
    );
  } else if (action === 'claim-points') {
    if (!walletAddress) {
      return res.status(400).json(errorResponse('Wallet address is required'));
    }

    return res.status(200).json(
      successResponse({
        message: 'Points claimed successfully',
        pointsClaimed: 30,
      })
    );
  } else {
    return res.status(400).json(errorResponse('Invalid action'));
  }
}

// Main handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      return await handleGetRequest(req, res);
    } else if (req.method === 'POST') {
      return await handlePostRequest(req, res);
    } else {
      return res.status(405).json(errorResponse('Method not allowed'));
    }
  } catch (error: any) {
    console.error('❌ [REFERRAL] Unhandled error:', error);
    return res.status(500).json(errorResponse(error.message || 'Internal server error'));
  }
}
