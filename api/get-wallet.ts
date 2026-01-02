import type { VercelRequest, VercelResponse } from '@vercel/node';

interface WalletRequest {
  userId?: string;
  walletAddress?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, walletAddress } = (req.method === 'GET' ? req.query : req.body) as WalletRequest;

    if (!userId && !walletAddress) {
      return res.status(400).json({ 
        error: 'userId or walletAddress is required' 
      });
    }

    // Mock wallet data - Replace with actual Pi Network API calls
    const mockWalletData = {
      walletAddress: walletAddress || `G${Math.random().toString(36).substring(2, 56).toUpperCase()}`,
      balance: parseFloat((Math.random() * 1000).toFixed(2)),
      network: process.env.PI_NETWORK || 'testnet', // testnet or mainnet
      userId: userId || 'mock_user',
      lastUpdated: new Date().toISOString(),
      transactions: {
        total: Math.floor(Math.random() * 100) + 10,
        sent: Math.floor(Math.random() * 50),
        received: Math.floor(Math.random() * 50)
      }
    };

    // Here you would:
    // 1. Query Pi Network API for wallet data
    // 2. Get transaction history
    // 3. Calculate balances
    // 4. Verify wallet ownership

    console.log('[GET-WALLET]', mockWalletData);

    return res.status(200).json({
      success: true,
      wallet: mockWalletData
    });

  } catch (error) {
    console.error('[GET-WALLET ERROR]', error);
    return res.status(500).json({ 
      error: 'Failed to fetch wallet data' 
    });
  }
}
