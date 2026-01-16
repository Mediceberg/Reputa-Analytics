import type { WalletData, Transaction } from './types';

export async function fetchWalletData(walletAddress: string): Promise<WalletData> {
  try {
    // 1. جلب بيانات الحساب الأساسية مع مهلة زمنية (Timeout) لمنع التعليق
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 8000); // مهلة 8 ثوانٍ

    const response = await fetch(`https://api.testnet.minepi.com/accounts/${walletAddress}`, {
      signal: controller.signal
    });
    clearTimeout(id);

    if (!response.ok) throw new Error('Wallet not found');
    const data = await response.json();

    // استخراج الرصيد بأمان
    const nativeBalance = data.balances?.find((b: any) => b.asset_type === 'native');
    const balanceValue = nativeBalance ? parseFloat(nativeBalance.balance) : 0;

    // 2. جلب سجل المعاملات (نطلب 50 معاملة فقط لضمان السرعة والدقة)
    const paymentsRes = await fetch(`https://api.testnet.minepi.com/accounts/${walletAddress}/payments?limit=50&order=desc`);
    const paymentsData = await paymentsRes.json();
    const records = paymentsData._embedded?.records || [];

    // 3. جلب تاريخ أول معاملة لحساب العمر الحقيقي
    const firstTxRes = await fetch(`https://api.testnet.minepi.com/accounts/${walletAddress}/transactions?limit=1&order=asc`);
    const firstTxData = await firstTxRes.json();
    const firstTxDateStr = firstTxData._embedded?.records[0]?.created_at;
    const firstTxDate = firstTxDateStr ? new Date(firstTxDateStr) : new Date();

    const accountAgeDays = Math.floor((new Date().getTime() - firstTxDate.getTime()) / (1000 * 3600 * 24));

    // تحويل المعاملات مع التأكد من القيم
    const realTransactions: Transaction[] = records.map((record: any) => ({
      id: record.id || Math.random().toString(),
      timestamp: new Date(record.created_at),
      amount: parseFloat(record.amount || '0'),
      from: record.from || 'unknown',
      to: record.to || 'unknown',
      type: record.from === walletAddress ? 'external' : 'internal',
      memo: record.transaction_hash ? `Hash: ${record.transaction_hash.slice(0, 8)}` : 'No Hash'
    }));

    // --- حساب السكور بناءً على الأرقام الحقيقية ---
    const scoreFromBalance = Math.min((balanceValue / 1000) * 400, 400); 
    const scoreFromActivity = Math.min((records.length / 50) * 300, 300);
    const scoreFromAge = Math.min((accountAgeDays / 365) * 300, 300);
    
    const finalScore = Math.max(100, Math.min(1000, Math.floor(scoreFromBalance + scoreFromActivity + scoreFromAge)));

    return {
      address: walletAddress,
      username: `User_${walletAddress.slice(0, 5)}`,
      balance: balanceValue,
      accountAge: accountAgeDays || 1,
      reputaScore: finalScore,
      createdAt: firstTxDate,
      transactions: realTransactions,
      // ✅ إصلاح الرقم المليوني: نستخدم طول مصفوفة السجلات الفعلية فقط
      totalTransactions: records.length 
    };

  } catch (error) {
    console.error("Critical Sync Error:", error);
    // إرجاع بيانات آمنة في حالة الفشل لمنع شاشة "Something went wrong"
    return {
      address: walletAddress,
      username: "Guest",
      balance: 0,
      accountAge: 0,
      reputaScore: 100,
      createdAt: new Date(),
      transactions: [],
      totalTransactions: 0
    };
  }
}
