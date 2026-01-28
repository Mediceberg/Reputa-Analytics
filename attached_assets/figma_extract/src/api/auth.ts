import type { VercelRequest, VercelResponse } from '@vercel/node';

// This is a serverless function for Pi Network authentication
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
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
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token required' });
    }

    // Verify the access token with Pi Network API
    const piApiKey = process.env.PI_API_KEY;
    
    if (!piApiKey) {
      throw new Error('PI_API_KEY not configured');
    }

    const response = await fetch('https://api.minepi.com/v2/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to verify access token');
    }

    const userData = await response.json();

    return res.status(200).json({
      success: true,
      user: userData,
    });
  } catch (error: any) {
    console.error('Auth error:', error);
    return res.status(500).json({
      error: 'Authentication failed',
      message: error.message,
    });
  }
}
