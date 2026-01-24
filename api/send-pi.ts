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

    // 1. تنظيف العنوان لضمان الربط الصحيح في الداتا بيز
    const cleanAddress = toAddress ? toAddress.trim().replace(/[^a-zA-Z0-9]/g, "") : "";

    console.log("Attempting payout to:", cleanAddress, "UID:", recipientUid);

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
          recipient_address: cleanAddress
        }
      })
    });

    const rawResponse = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(rawResponse);
    } catch (e) {
      responseData = { message: rawResponse };
    }

    if (response.ok) {
      // --- التحسين المطلوب لبيانات المعاملات الحقيقية ---
      
      const txTimestamp = new Date().toISOString();
      const txType = "App Payout";

      // أ. إنشاء كائن المعاملة التفصيلي
      const transactionDetail = JSON.stringify({
        id: responseData.identifier || Math.random().toString(36).substring(7),
        type: txType,
        amount: amount,
        status: "Success",
        date: new Date().toLocaleString(), // التاريخ والوقت الذي طلبته
        timestamp: txTimestamp,
        to: cleanAddress
      });

      // ب. حفظ المعاملة في قائمة الـ History الخاصة بالمحفظة (ليقرأها ملف get-wallet)
      await redis.lpush(`history:${cleanAddress}`, transactionDetail);
      // الاحتفاظ بآخر 10 معاملات فقط لتوفير المساحة
      await redis.ltrim(`history:${cleanAddress}`, 0, 9);

      // ج. زيادة عداد المعاملات الحقيقي (حل مشكلة الإحصائيات الثابتة)
      await redis.incr(`tx_count:${cleanAddress}`);
      await redis.incr(`tx_count:${recipientUid}`);
      
      // د. زيادة العداد الإجمالي للتطبيق
      await redis.incr('total_app_transactions');
      
      return res.status(200).json({ success: true, data: responseData });
    } else {
      return res.status(400).json({ 
        error: "Pi Network Error", 
        details: responseData 
      });
    }

  } catch (error: any) {
    return res.status(500).json({ error: "Server Crash", message: error.message });
  }
}
