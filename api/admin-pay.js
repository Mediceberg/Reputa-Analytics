const PiNetwork = require('@pinetwork-js/sdk');

// تهيئة الاتصال
const pi = new PiNetwork({
  apiKey: process.env.PI_API_KEY,
  walletPrivateSeed: process.env.APP_WALLET_SEED 
});

module.exports = async (req, res) => {
  // إعدادات CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== 'POST') return res.status(200).json({ error: 'Ready' });

  try {
    const { recipientAddress, adminSecret } = req.body;

    // تأكد أن كلمة السر تطابق ما في App.tsx
    if (adminSecret !== "123456") {
      return res.status(401).json({ error: 'كلمة السر غير مطابقة' });
    }

    // تنفيذ عملية الدفع من محفظة التطبيق للمستخدم
    const payment = await pi.createPayment({
      amount: 0.1,
      memo: "Developer Verification App-to-User",
      metadata: { internalId: "verif-" + Date.now() },
      uid: "user-" + Date.now()
    });

    const txid = await pi.submitPayment(payment.identifier);

    return res.status(200).json({ success: true, txid: txid });
  } catch (err) {
    // إرجاع رسالة الخطأ نصياً لتجنب ظهور [object Object]
    return res.status(500).json({ success: false, error: err.message || "Unknown Server Error" });
  }
};
