import type { VercelRequest, VercelResponse } from '@vercel/node';

interface CompleteRequest {
  paymentId: string;
  txid: string;
  userId: string;
  amount: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { paymentId, txid, userId, amount } = req.body as CompleteRequest;

    if (!paymentId || !txid || !userId) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        completed: false 
      });
    }

    // Verify transaction on blockchain (implement actual verification)
    // For testnet, we can simulate verification
    console.log(`[COMPLETE] Payment ${paymentId}, TXID: ${txid}, User: ${userId}`);

    // Here you would:
    // 1. Verify transaction on Pi blockchain
    // 2. Update user's VIP status in database
    // 3. Update reputation score
    // 4. Send confirmation notification

    // Simulate database update
    const subscriptionData = {
      userId,
      paymentId,
      txid,
      amount,
      type: 'vip_subscription',
      status: 'completed',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
      reputationBonus: 50 // VIP users get bonus reputation points
    };

    console.log('[SUBSCRIPTION UPDATED]', subscriptionData);

    return res.status(200).json({
      completed: true,
      subscription: subscriptionData,
      message: 'VIP subscription activated successfully'
    });

  } catch (error) {
    console.error('[COMPLETE ERROR]', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      completed: false 
    });
  }
}
