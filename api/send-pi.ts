import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

// ملاحظة: ستحتاج لإضافة مفتاحك السري (Seed Phrase) في Vercel باسم APP_WALLET_SEED
const PI_API_KEY = process.env.PI_API_KEY;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { toAddress, amount } = req.body;

    if (!toAddress || !amount) {
      return res.status(400).json({ error: "Missing data" });
    }

    // استدعاء API منصة باي لعمل تحويل من محفظة التطبيق إلى محفظة أخرى
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
          uid: "app-internal-id" 
        }
      })
    });

    // ملاحظة: لإرسال مبالغ من التطبيق للمستخدم (Payouts) 
    // يجب أن تكون المحفظة مربوطة بـ SDK وتستخدم الـ Server-side Payments
    
    if (response.ok) {
        await redis.incr('total_app_transactions');
        return res.status(200).json({ success: true });
    } else {
        const errorData = await response.text();
        return res.status(400).json({ error: errorData });
    }

  } catch (error) {
    return res.status(500).json({ error: "Server Error" });
  }
}
