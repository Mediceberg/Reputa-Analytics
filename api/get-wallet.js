import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { address } = req.query;

  if (!address) return res.status(400).json({ error: "Address is required" });

  try {
    // السيرفر يقوم بالاتصال بالبلوكشين (لا يوجد حجب هنا)
    const response = await fetch(`https://horizon-testnet.pi-blockchain.net/accounts/${address}`);
    
    if (!response.ok) {
      return res.status(404).json({ error: "Wallet not found on Testnet" });
    }

    const data = await response.json();
    // إرجاع البيانات الحقيقية للتطبيق
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: "Blockchain Connection Failed" });
  }
}
