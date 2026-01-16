import type { WalletData, Transaction } from './types'; 

export async function fetchWalletData(walletAddress: string): Promise<WalletData> {
  try {
    // 1. جلب بيانات الحساب الأساسية
    const response = await fetch(`https://api.testnet.minepi.com/accounts/${walletAddress}`);
    if (!response.ok) throw new Error('Account not found');
    const data = await response.json();

    const nativeBalance = data.balances.find((b: any) => b.asset_type === 'native');
    const balanceValue = nativeBalance ? parseFloat(nativeBalance.balance) : 0;

    // 2. جلب أكبر عدد ممكن من المعاملات (زيادة الـ limit لـ 100)
    const paymentsRes = await fetch(`https://api.testnet.minepi.com/accounts/${walletAddress}/payments?limit=100&order=desc`);
    const paymentsData = await paymentsRes.json();
    const records = paymentsData._embedded.records;

    // 3. جلب تاريخ أول معاملة (لعمر الحساب الحقيقي)
    const firstTxRes = await fetch(`https://api.testnet.minepi.com/accounts/${walletAddress}/transactions?limit=1&order=asc`);
    const firstTxData = await firstTxRes.json();
    const firstTxDate = firstTxData._embedded.records[0] 
      ? new Date(firstTxData._embedded.records[0].created_at) 
      : new Date();

    const accountAgeDays = Math.floor((new Date().getTime() - firstTxDate.getTime()) / (1000 * 3600 * 24));

    const realTransactions: Transaction[] = records.map((record: any) => ({
      id: record.id,
      timestamp: new Date(record.created_at),
      amount: parseFloat(record.amount),
      from: record.from,
      to: record.to,
      type: record.from === walletAddress ? 'external' : 'internal',
      memo: `Hash: ${record.transaction_hash.slice(0, 8)}`
    }));

    // --- حساب النقاط الحقيقي بناءً على حجم البيانات ---
    const scoreFromBalance = Math.min((balanceValue / 500) * 400, 400); // 400 نقطة للرصيد
    const scoreFromActivity = Math.min((records.length / 50) * 300, 300); // 300 نقطة للنشاط (حتى 50 معاملة)
    const scoreFromAge = Math.min((accountAgeDays / 365) * 300, 300); // 300 نقطة للعمر
    
    const finalScore = Math.floor(scoreFromBalance + scoreFromActivity + scoreFromAge);

    return {
      address: walletAddress,
      username: `User_${walletAddress.slice(0, 5)}`,
      balance: balanceValue,
      accountAge: accountAgeDays || 1,
      reputaScore: finalScore > 100 ? finalScore : 100, // الحد الأدنى 100
      createdAt: firstTxDate,
      transactions: realTransactions,
      totalTransactions: records.length // سيعرض العدد الحقيقي المجلوب (حتى 100)
    };

  } catch (error) {
    console.error("Testnet Fetch Error:", error);
    throw error; // نمرر الخطأ ليتم معالجته في الواجهة
  }
}
