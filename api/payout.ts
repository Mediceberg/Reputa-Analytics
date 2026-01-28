// api/payout.ts
export default async function handler(req: any, res: any) {
  const { address, amount } = req.body;

  try {
    const response = await fetch(`https://api.testnet.minepi.com/v2/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.PI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        payment: {
          amount: amount,
          memo: "Reward from App",
          metadata: { type: "payout" },
          uid: "user_payout_" + Date.now(),
          recipient_address: address // هنا نضع العنوان الذي أدخلته يدوياً
        }
      })
    });

    const data = await response.json();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ error: "Payout failed" });
  }
}
