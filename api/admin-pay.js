// api/admin-pay.js
const axios = require('axios');
const PiNetwork = require('@pinetwork-js/sdk');

// تأكد من تعريف هذه المتغيرات في إعدادات Vercel
const pi = new PiNetwork({
  apiKey: process.env.PI_API_KEY,
  walletPrivateSeed: process.env.APP_WALLET_SEED 
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { recipientAddress, adminSecret } = req.body;

  // التحقق من كلمة السر (يجب أن تطابق ما كتبته في App.tsx)
  if (adminSecret !== "123456") {
    return res.status(401).json({ error: 'كلمة السر غير صحيحة' });
  }

  try {
    const payment = await pi.createPayment({
      amount: 0.1,
      memo: "Mainnet Verification App-to-User",
      metadata: { target: recipientAddress },
      uid: "verification-" + Date.now()
    });

    const txid = await pi.submitPayment(payment.identifier);
    
    return res.status(200).json({ success: true, txid });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message || 'فشل في السيرفر' });
  }
}
