import type { VercelRequest, VercelResponse } from '@vercel/node'; 
import axios from 'axios'; // سنحتاج axios أو fetch لإرسال الطلب لـ Pi 

interface ApproveRequest {
  paymentId: string;
  userId: string;
  amount: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // إعدادات CORS كما هي في ملفك الأصلي
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { paymentId, userId, amount } = req.body as ApproveRequest;
    const PI_API_KEY = process.env.PI_API_KEY; // التأكد من قراءة المفتاح السري

    if (!paymentId || !userId || !amount) {
      return res.status(400).json({ error: 'Missing required fields', approved: false });
    }

    /**
     * الخطوة الحيوية المفقودة:
     * يجب إرسال طلب POST إلى سيرفر Pi لإبلاغهم بأن السيرفر الخاص بك موافق على هذه المعاملة.
     * بدون هذه الخطوة، سيبقى الـ SDK في المتصفح ينتظر للأبد.
     */
    const piResponse = await axios.post(
      `https://api.minepi.com/v2/payments/${paymentId}/approve`,
      {}, // جسم الطلب فارغ حسب توثيق Pi
      {
        headers: {
          'Authorization': `Key ${PI_API_KEY}`, // استخدام مفتاحك السري
          'Content-Type': 'application/json'
        }
      }
    );

    if (piResponse.status === 200) {
      console.log(`[APPROVE SUCCESS] Payment ${paymentId} approved on Pi Servers`);
      return res.status(200).json({
        approved: true,
        paymentId,
        userId,
        amount,
        timestamp: new Date().toISOString()
      });
    } else {
      throw new Error('Pi API rejected the approval');
    }

  } catch (error: any) {
    console.error('[APPROVE ERROR]', error.response?.data || error.message);
    return res.status(500).json({ 
      error: 'Failed to approve payment with Pi Network',
      approved: false 
    });
  }
}
