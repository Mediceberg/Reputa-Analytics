import type { VercelRequest, VercelResponse } from '@vercel/node';

// This serverless function fetches Pi DEX data
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

    // Mock Pi DEX data
    // In production, this would fetch from Pi Network DEX API
    const mockDexData = {
      tokens: [
        {
          symbol: 'PI',
          name: 'Pi Network',
          balance: Math.random() * 1000 + 500,
          value: Math.random() * 1000 + 500,
          logo: '🥧',
        },
        {
          symbol: 'USDC',
          name: 'USD Coin',
          balance: Math.random() * 500,
          value: Math.random() * 500,
          logo: '💵',
        },
      ],
      transactions: [],
    };

    return res.status(200).json({
      success: true,
      dex: mockDexData,
    });
  } catch (error: any) {
    console.error('Pi DEX fetch error:', error);
    return res.status(500).json({
      error: 'Failed to fetch Pi DEX data',
      message: error.message,
    });
  }
}
