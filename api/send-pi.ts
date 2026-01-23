import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const PI_API_KEY = process.env.PI_API_KEY;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { toAddress, amount, recipientUid } = req.body;

    // سجل البيانات القادمة للتأكد من وصولها للسيرفر
    console.log("Attempting payout to:", toAddress, "UID:", recipientUid);

    const response = await fetch(`https://api.minepi.com/v2/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${PI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payment: {
          amount: parseFloat(amount),
          memo: "Mainnet Checklist Transaction",
          metadata: { type: "app_payout" },
          uid: recipientUid,
          recipient_address: toAddress
        }
      })
    });

    // قراءة الرد كـ Text أولاً لتجنب انهيار الجسم (Body)
    const rawResponse = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(rawResponse);
    } catch (e) {
      responseData = { message: rawResponse };
    }

    if (response.ok) {
      await redis.incr('total_app_transactions');
      return res.status(200).json({ success: true, data: responseData });
    } else {
      // إرسال تفاصيل الخطأ مباشرة للمتصفح ليظهر في الـ Alert
      return res.status(400).json({ 
        error: "Pi Network Error", 
        details: responseData 
      });
    }

  } catch (error: any) {
    return res.status(500).json({ error: "Server Crash", message: error.message });
  }
}
