import type { VercelRequest, VercelResponse } from '@vercel/node';

interface AuthRequest {
  accessToken: string;
  user?: {
    uid: string;
    username: string;
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { accessToken, user } = req.body as AuthRequest;

    if (!accessToken) {
      return res.status(400).json({ 
        error: 'Access token is required',
        authenticated: false 
      });
    }

    // Verify Pi Network access token
    // In production, verify against Pi Network API
    const API_KEY = process.env.VITE_PI_API_KEY || '';
    
    // Mock verification for development
    // Replace with actual Pi Network API verification
    console.log('[AUTH] Verifying token for user:', user?.username);

    // Simulate token verification
    const verified = true; // In production: verify with Pi Network API

    if (!verified) {
      return res.status(401).json({ 
        error: 'Invalid access token',
        authenticated: false 
      });
    }

    // Create or update user session
    const sessionData = {
      userId: user?.uid || `user_${Date.now()}`,
      username: user?.username || 'Anonymous',
      accessToken, // Store securely in production
      authenticated: true,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };

    console.log('[AUTH SUCCESS]', { 
      userId: sessionData.userId, 
      username: sessionData.username 
    });

    return res.status(200).json({
      authenticated: true,
      session: sessionData
    });

  } catch (error) {
    console.error('[AUTH ERROR]', error);
    return res.status(500).json({ 
      error: 'Authentication failed',
      authenticated: false 
    });
  }
}
