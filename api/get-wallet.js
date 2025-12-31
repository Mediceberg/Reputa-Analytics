export default async function handler(req, res) {
  const { address } = req.query;
  
  // 1. التحقق من وجود العنوان وتنسيقه
  if (!address) return res.status(400).json({ error: "Address required" });
  const cleanAddress = address.trim();

  try {
    // 2. إعداد الروابط (رابط الحساب + رابط العمليات)
    const ACCOUNT_URL = `https://api.testnet.minepi.com/accounts/${cleanAddress}`;
    const OPERATIONS_URL = `https://api.testnet.minepi.com/accounts/${cleanAddress}/operations?limit=10&order=desc`;

    // 3. تنفيذ الطلبين في وقت واحد لسرعة الاستجابة
    const [accountRes, operationsRes] = await Promise.all([
      fetch(ACCOUNT_URL, { headers: { 'Accept': 'application/json' } }),
      fetch(OPERATIONS_URL, { headers: { 'Accept': 'application/json' } })
    ]);

    // 4. التحقق من وجود الحساب
    if (accountRes.status === 404) {
      return res.status(404).json({ error: "Wallet not found on Testnet" });
    }

    const accountData = await accountRes.json();
    const operationsData = await operationsRes.json();

    // 5. إرسال البيانات المدمجة (الحساب + العمليات الحقيقية)
    return res.status(200).json({
      account: accountData,
      // نرسل السجلات فقط من بيانات العمليات
      operations: operationsData._embedded?.records || []
    });

  } catch (error) {
    console.error("Connection Error:", error);
    return res.status(500).json({ error: "Blockchain Connection Failed" });
  }
}
