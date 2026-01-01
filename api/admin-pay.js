// api/admin-pay.js
import { PiClient } from '@pinetwork-js/sdk';

// إعداد مفاتيح البيئة في Vercel Dashboard
const pi = new PiClient({
  apiKey: process.env.PI_API_KEY,
  walletPrivateSeed: process.env.APP_WALLET_SEED // المفتاح السري لمحفظة التطبيق S...
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  
  const { recipientAddress, amount, adminPassword } = req.body;

  // حماية بسيطة للتأكد أنك أنت من يرسل الطلب
  if (adminPassword !== "123456") { // استبدل هذا برقم سري خاص بك
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const payment = await pi.createPayment({
      amount: amount || 0.1,
      memo: "Testnet App-to-User Payment",
      metadata: { recipient: recipientAddress },
      uid: "admin-task-" + Date.now() 
    });

    const txid = await pi.submitPayment(payment.identifier);
    res.status(200).json({ success: true, txid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
