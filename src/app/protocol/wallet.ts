import type { WalletData, Transaction } from './types';

/**
 * جلب بيانات المحفظة الحقيقية من شبكة Pi Testnet 
 * مع حساب السكور بناءً على البروتوكول المحدث
 */
export async function fetchWalletData(walletAddress: string): Promise<WalletData> {
  try {
    // 1. طلب بيانات الحساب الأساسية من Horizon API
    const response = await fetch(`https://api.testnet.minepi.com/accounts/${walletAddress}`);
    
    if (!response.ok) {
      throw new Error('Wallet not found or inactive on Pi Testnet');
    }
    
    const data = await response.json();

    // استخراج الرصيد الحقيقي (Native Pi)
    const nativeBalance = data.balances.find((b: any) => b.asset_type === 'native');
    const balanceValue = nativeBalance ? parseFloat(nativeBalance.balance) : 0;

    // 2. جلب سجل المعاملات (Payments) - بحد أقصى 100 لتجنب الأرقام الوهمية
    const paymentsRes = await fetch(`https://api.testnet.minepi.com/accounts/${walletAddress}/payments?limit=100&order=desc`);
    const paymentsData = await paymentsRes.json();
    const records = paymentsData._embedded.records || [];

    // 3. تحديد عمر الحساب الحقيقي بجلب أول معاملة (First Transaction)
    const firstTxRes = await fetch(`https://api.testnet.minepi.com/accounts/${walletAddress}/transactions?limit=1&order=asc`);
    const firstTxData = await firstTxRes.json();
    const firstTxDate = firstTxData._embedded.records[0] 
      ? new Date(firstTxData._embedded.records[0].created_at) 
      : new Date();

    // حساب عدد الأيام منذ إنشاء الحساب
    const accountAgeDays = Math.floor((new Date().getTime() - firstTxDate.getTime()) / (1000 * 3600 * 24));

    // تحويل السجلات إلى تنسيق المعاملات الخاص بالبروتوكول
    const realTransactions: Transaction[] = records.map((record: any) => ({
      id: record.id,
      timestamp: new Date(record.created_at),
      amount: parseFloat(record.amount),
      from: record.from,
      to: record.to,
      type: record.from === walletAddress ? 'external' : 'internal',
      memo: `Hash: ${record.transaction_hash.slice(0, 8)}...`
    }));

    // --- بروتوكول حساب نقاط الثقة (Reputa Score Logic) ---
    // الوزن الإجمالي (1000 نقطة): الرصيد (400) + النشاط (300) + عمر الحساب (300)
    
    const scoreFromBalance = Math.min((balanceValue / 1000) * 400, 400); 
    const scoreFromActivity = Math.min((records.length / 50) * 300, 300); // 50 معاملة تمنح الدرجة الكاملة للنشاط
    const scoreFromAge = Math.min((accountAgeDays / 365) * 300, 300); // سنة واحدة تمنح الدرجة الكاملة للعمر
    
    const finalScore = Math.max(100, Math.floor(scoreFromBalance + scoreFromActivity + scoreFromAge));

    return {
      address: walletAddress,
      username: `Pioneer_${walletAddress.slice(0, 5)}`,
      balance: balanceValue,
      accountAge: accountAgeDays || 1, // الحد الأدنى يوم واحد
      reputaScore: finalScore,
      createdAt: firstTxDate,
      transactions: realTransactions,
      // نستخدم عدد السجلات الفعلي (records.length) بدلاً من data.sequence لتجنب الأرقام الضخمة
      totalTransactions: records.length 
    };

  } catch (error) {
    console.error("Testnet Sync Error:", error);
    throw error; // تمرير الخطأ ليتم عرضه في واجهة المستخدم (App.tsx)
  }
}

/**
 * وظيفة اختيارية لجلب اسم المستخدم إذا كان متوفراً عبر Pi SDK
 */
export async function fetchUsername(walletAddress: string): Promise<string> {
  try {
    if (typeof window !== 'undefined' && (window as any).Pi) {
      const auth = await (window as any).Pi.authenticate(['username']);
      return auth.user.username;
    }
  } catch (e) {
    console.warn("Using fallback username due to SDK absence");
  }
  return `User_${walletAddress.slice(0, 5)}`;
}
 
