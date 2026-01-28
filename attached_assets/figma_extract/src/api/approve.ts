import type { VercelRequest, VercelResponse } from '@vercel/node';

// This serverless function approves a Pi payment
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
    const { paymentId } = req.body;

    if (!paymentId) {
      return res.status(400).json({ error: 'Payment ID required' });
    }

    const piApiKey = process.env.PI_API_KEY;
    
    if (!piApiKey) {
      throw new Error('PI_API_KEY not configured');
    }

    // Approve the payment with Pi Network API
    const response = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${piApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Payment approval failed');
    }

    const paymentData = await response.json();

    return res.status(200).json({
      success: true,
      payment: paymentData,
    });
  } catch (error: any) {
    console.error('Payment approval error:', error);
    return res.status(500).json({
      error: 'Payment approval failed',
      message: error.message,
    });
  }
}
