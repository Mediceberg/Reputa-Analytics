import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { paymentId } = req.body;
  const apiKey = process.env.VITE_PI_API_KEY; // سيسحب المفتاح الذي وضعته في إعدادات Vercel

  try {
    // إرسال الموافقة لشبكة Pi
    const response = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to approve payment' });
  }
}
