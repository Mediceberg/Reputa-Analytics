import type { VercelRequest, VercelResponse } from '@vercel/node';
 
interface AuthRequest {
  accessToken: string;
  user?: {
    uid: string;
    username: string;
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // إضافة رؤوس CORS الضرورية للسماح بعملية تسجيل الدخول من المتصفح
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // التعامل مع طلب OPTIONS (Preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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

    // الحفاظ على الهيكل الأصلي مع ضمان عدم حدوث خطأ بسبب Variable undefined
    const API_KEY = (process.env.VITE_PI_API_KEY as string) || '';
    
    console.log('[AUTH] Verifying token for user:', user?.username);

    // محاكاة التحقق (Mock verification) كما في الكود الأصلي
    const verified = true;

    if (!verified) {
      return res.status(401).json({ 
        error: 'Invalid access token',
        authenticated: false 
      });
    }

    // الحفاظ على بيانات الجلسة (Session Data) كما هي تماماً
    const sessionData = {
      userId: user?.uid || `user_${Date.now()}`,
      username: user?.username || 'Anonymous',
      accessToken,
      authenticated: true,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
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
