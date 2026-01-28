import type { VercelRequest, VercelResponse } from '@vercel/node';

// This serverless function fetches wallet data from Pi Network
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { address } = req.query;

    if (!address || typeof address !== 'string') {
      return res.status(400).json({ error: 'Wallet address required' });
    }

    // In testnet, this would fetch real wallet data from Pi Network API
    // For now, return mock data structure
    const mockWalletData = {
      address,
      balance: Math.random() * 1000,
      transactions: [],
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      lastActive: new Date().toISOString(),
      tokenBalances: [],
    };

    return res.status(200).json({
      success: true,
      wallet: mockWalletData,
    });
  } catch (error: any) {
    console.error('Wallet fetch error:', error);
    return res.status(500).json({
      error: 'Failed to fetch wallet data',
      message: error.message,
    });
  }
}
