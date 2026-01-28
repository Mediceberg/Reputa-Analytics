import type { VercelRequest, VercelResponse } from '@vercel/node';

// This serverless function completes a Pi payment
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { paymentId, txid } = req.body;

    if (!paymentId || !txid) {
      return res.status(400).json({ error: 'Payment ID and txid required' });
    }

    const piApiKey = process.env.PI_API_KEY;
    
    if (!piApiKey) {
      throw new Error('PI_API_KEY not configured');
    }

    // Complete the payment with Pi Network API
    const response = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${piApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ txid }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Payment completion failed');
    }

    const paymentData = await response.json();

    return res.status(200).json({
      success: true,
      payment: paymentData,
    });
  } catch (error: any) {
    console.error('Payment completion error:', error);
    return res.status(500).json({
      error: 'Payment completion failed',
      message: error.message,
    });
  }
}
