import type { VercelRequest, VercelResponse } from '@vercel/node';

interface ApproveRequest {
  paymentId: string;
  userId: string;
  amount: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { paymentId, userId, amount } = req.body as ApproveRequest;

    // Validate required fields
    if (!paymentId || !userId || !amount) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        approved: false 
      });
    }

    // Validate payment amount (VIP subscription = 1 Pi)
    const validAmounts = [1]; // Add more valid amounts as needed
    if (!validAmounts.includes(amount)) {
      return res.status(400).json({ 
        error: 'Invalid payment amount',
        approved: false 
      });
    }

    // Here you would typically:
    // 1. Check if user exists in database
    // 2. Verify payment hasn't been processed before
    // 3. Check business logic (subscription status, etc.)
    
    // For now, we approve all valid requests
    console.log(`[APPROVE] Payment ${paymentId} for user ${userId}, amount: ${amount} Pi`);

    return res.status(200).json({
      approved: true,
      paymentId,
      userId,
      amount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[APPROVE ERROR]', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      approved: false 
    });
  }
}
