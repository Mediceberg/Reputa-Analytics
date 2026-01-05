import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. إعدادات CORS (ضرورية جداً لمتصفح Pi)
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 2. التحقق من طريقة الطلب
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { paymentId } = req.body;
    const PI_API_KEY = process.env.PI_API_KEY;

    if (!paymentId) {
      return res.status(400).json({ error: 'Missing paymentId' });
    }

    // 3. الاتصال بخادم Pi Network (تأكد من الرابط الصحيح v2)
    // ملاحظة: الرابط الرسمي هو api.mine.pi وليس api.minepi.com (تعديل مهم)
    const piResponse = await axios.post(
      `https://api.mine.pi/v2/payments/${paymentId}/approve`,
      {}, 
      {
        headers: {
          'Authorization': `Key ${PI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // 4. الرد بنجاح (متصفح باي يتوقع استلام كائن الدفع كاملاً أو المعرف)
    console.log(`[APPROVE SUCCESS] Payment ${paymentId} approved`);
    
    return res.status(200).json({
      approved: true,
      // Pi SDK يتوقع إرجاع بيانات العملية الأصلية أو المعرف
      ...piResponse.data 
    });

  } catch (error: any) {
    console.error('[APPROVE ERROR]', error.response?.data || error.message);
    return res.status(500).json({ 
      error: 'Approval failed',
      details: error.response?.data || error.message 
    });
  }
}
