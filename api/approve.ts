import type { VercelRequest, VercelResponse } from '@vercel/node';

interface ApproveRequest {
  paymentId: string;
  userId: string;
  amount: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // إضافة رؤوس CORS للسماح لتطبيقك بإرسال طلبات الموافقة (Approve)
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // التعامل مع طلب OPTIONS (Preflight) لمنع أخطاء الشبكة في المتصفح
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // الحفاظ على الهيكل الأصلي: السماح فقط بطلبات POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { paymentId, userId, amount } = req.body as ApproveRequest;

    // الحفاظ على التحقق من الحقول المطلوبة (Validation) كما هو
    if (!paymentId || !userId || !amount) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        approved: false 
      });
    }

    // الحفاظ على منطق التحقق من المبلغ (1 Pi للـ VIP)
    const validAmounts = [1];
    if (!validAmounts.includes(amount)) {
      return res.status(400).json({ 
        error: 'Invalid payment amount',
        approved: false 
      });
    }

    // الحفاظ على الهيكل الأصلي لتسجيل البيانات في الـ Console والرد بالنجاح
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
