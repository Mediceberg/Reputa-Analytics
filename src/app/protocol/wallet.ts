import type { WalletData, Transaction } from './types';

export async function fetchWalletData(walletAddress: string): Promise<WalletData> {
  try {
    const accountRes = await fetch(`https://api.mainnet.minepi.com/accounts/${walletAddress}`);
    if (!accountRes.ok) throw new Error('Account not found');
    const accountData = await accountRes.json();

    // جلب 20 معاملة لضمان وجود بيانات كافية للحسابات الإحصائية (تجنب NaN)
    const paymentsRes = await fetch(`https://api.testnet.minepi.com/accounts/${walletAddress}/payments?limit=50&order=desc`);
    const paymentsData = await paymentsRes.json();
    const records = paymentsData._embedded?.records || [];

    const firstTxRes = await fetch(`https://api.testnet.minepi.com/accounts/${walletAddress}/transactions?limit=1&order=asc`);
    const firstTxData = await firstTxRes.json();
    const firstTxDate = firstTxData._embedded?.records[0] ? new Date(firstTxData._embedded?.records[0].created_at) : new Date();

    const accountAgeDays = Math.floor((new Date().getTime() - firstTxDate.getTime()) / (1000 * 3600 * 24));

    // تحويل المعاملات
    const allTransactions: Transaction[] = records.map((record: any) => ({
      id: record.id,
      timestamp: new Date(record.created_at),
      amount: parseFloat(record.amount || 0),
      from: record.from,
      to: record.to,
      type: record.from === walletAddress ? 'external' : 'internal',
      memo: record.transaction_hash ? record.transaction_hash.slice(0, 8) : ''
    }));

    const nativeBalance = accountData.balances.find((b: any) => b.asset_type === 'native');
    const balanceValue = nativeBalance ? parseFloat(nativeBalance.balance) : 0;

    // حساب السكور
    const scoreFromBalance = Math.min((balanceValue / 1000) * 400, 400); 
    const scoreFromActivity = Math.min((records.length / 20) * 300, 300);
    const scoreFromAge = Math.min((accountAgeDays / 365) * 300, 300);
    const finalScore = Math.max(100, Math.floor(scoreFromBalance + scoreFromActivity + scoreFromAge));

    return {
      address: walletAddress,
      username: `Pioneer_${walletAddress.slice(0, 5)}`,
      balance: balanceValue,
      accountAge: accountAgeDays || 1,
      reputaScore: finalScore,
      createdAt: firstTxDate,
      transactions: allTransactions,
      // ✅ نرسل رقماً حقيقياً (عدد العمليات الفرعية) بدلاً من كلمة Active أو الرقم المليوني
      totalTransactions: accountData.subentry_count + records.length 
    };
  } catch (error) {
    console.error("Fetch Error:", error);
    throw error;
  }
}
