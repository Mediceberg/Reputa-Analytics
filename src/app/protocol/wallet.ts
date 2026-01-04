
/** * Wallet Module - Fetch real Testnet data via Horizon API
 */

import type { WalletData, Transaction } from './types';

export async function fetchWalletData(walletAddress: string): Promise<WalletData> {
  try {
    // 1. طلب بيانات الحساب من Horizon
    const response = await fetch(`https://api.testnet.minepi.com/accounts/${walletAddress}`);
    
    if (!response.ok) {
      throw new Error('Account not found on Pi Testnet');
    }
    
    const data = await response.json();

    // تصحيح: الرصيد في Horizon يكون داخل مصفوفة balances
    const nativeBalance = data.balances.find((b: any) => b.asset_type === 'native');
    const balanceValue = nativeBalance ? parseFloat(nativeBalance.balance) : 0;

    // 2. جلب آخر 10 معاملات (Payments)
    const paymentsRes = await fetch(`https://api.testnet.minepi.com/accounts/${walletAddress}/payments?limit=10&order=desc`);
    const paymentsData = await paymentsRes.json();
    
    const realTransactions: Transaction[] = paymentsData._embedded.records.map((record: any) => ({
      id: record.id,
      timestamp: new Date(record.created_at),
      amount: parseFloat(record.amount),
      from: record.from,
      to: record.to,
      type: record.from === walletAddress ? 'external' : 'internal',
      memo: `Hash: ${record.transaction_hash.slice(0, 8)}...`
    }));

    return {
      address: walletAddress,
      username: await fetchUsername(walletAddress),
      balance: balanceValue,
      accountAge: 30, // قيمة تقديرية
      createdAt: new Date(),
      transactions: realTransactions,
      totalTransactions: parseInt(data.sequence) || realTransactions.length
    };

  } catch (error) {
    console.error("Testnet Fetch Error:", error);
    // Fallback في حالة الفشل أو العمل خارج متصفح باي
    return {
      address: walletAddress,
      username: `Pioneer_${walletAddress.slice(0, 4)}`,
      balance: 0,
      accountAge: 1,
      createdAt: new Date(),
      transactions: [],
      totalTransactions: 0
    };
  }
}

export async function fetchUsername(walletAddress: string): Promise<string> {
  try {
    // محاولة جلب الاسم الحقيقي فقط إذا كان الـ SDK متاحاً
    if (typeof window !== 'undefined' && (window as any).Pi) {
      const auth = await (window as any).Pi.authenticate(['username']);
      return auth.user.username;
    }
  } catch (e) {
    console.warn("Using fallback username");
  }
  return `User_${walletAddress.slice(0, 5)}`;
}

function hashAddress(address: string): number {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = ((hash << 5) - hash) + address.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}
