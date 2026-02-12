import type { WalletData, Transaction } from './types';

const PI_TESTNET_API = 'https://api.testnet.minepi.com';
const PI_MAINNET_API = 'https://api.mainnet.minepi.com';

function getApiBase(): string {
  const network = typeof window !== 'undefined' ? localStorage.getItem('PI_NETWORK') : null;
  return network === 'mainnet' ? PI_MAINNET_API : PI_TESTNET_API;
}

async function fetchFromNetwork(walletAddress: string, apiBase: string): Promise<{
  balance: number;
  records: any[];
  firstTxDate: Date;
  accountAgeDays: number;
  subentryCount: number;
}> {
  const accountRes = await fetch(`${apiBase}/accounts/${walletAddress}`);
  if (!accountRes.ok) throw new Error('Account not found');
  const accountData = await accountRes.json();

  const paymentsRes = await fetch(`${apiBase}/accounts/${walletAddress}/payments?limit=50&order=desc`);
  const paymentsData = await paymentsRes.json();
  const records = paymentsData._embedded?.records || [];

  const firstTxRes = await fetch(`${apiBase}/accounts/${walletAddress}/transactions?limit=1&order=asc`);
  const firstTxData = await firstTxRes.json();
  const firstTxDate = firstTxData._embedded?.records[0] ? new Date(firstTxData._embedded?.records[0].created_at) : new Date();

  const accountAgeDays = Math.floor((new Date().getTime() - firstTxDate.getTime()) / (1000 * 3600 * 24));
  const nativeBalance = accountData.balances?.find((b: any) => b.asset_type === 'native');
  const balance = nativeBalance ? parseFloat(nativeBalance.balance) : 0;

  return { balance, records, firstTxDate, accountAgeDays, subentryCount: accountData.subentry_count || 0 };
}

export async function fetchWalletData(walletAddress: string): Promise<WalletData> {
  try {
    const apiBase = getApiBase();
    const isMainnet = apiBase === PI_MAINNET_API;
    
    // Fetch from current network
    const primary = await fetchFromNetwork(walletAddress, apiBase);
    
    // Try to also fetch from the other network (silent fail)
    let secondaryTxCount = 0;
    try {
      const otherApi = isMainnet ? PI_TESTNET_API : PI_MAINNET_API;
      const otherRes = await fetch(`${otherApi}/accounts/${walletAddress}/payments?limit=50&order=desc`);
      if (otherRes.ok) {
        const otherData = await otherRes.json();
        secondaryTxCount = otherData._embedded?.records?.length || 0;
      }
    } catch { /* silent */ }

    const allTransactions: Transaction[] = primary.records.map((record: any) => ({
      id: record.id,
      timestamp: new Date(record.created_at),
      amount: parseFloat(record.amount || 0),
      from: record.from,
      to: record.to,
      type: record.from === walletAddress ? 'external' : 'internal',
      memo: record.transaction_hash ? record.transaction_hash.slice(0, 8) : '',
      score: {
        basePoints: record.from === walletAddress ? 1 : 2,
        typeBonus: 0,
        sizeBonus: 0,
        totalPoints: record.from === walletAddress ? 1 : 2,
        suspiciousPenalty: 0,
        explanation: record.from === walletAddress ? 'Sent transaction' : 'Received transaction',
      }
    }));

    return {
      address: walletAddress,
      username: `Pioneer_${walletAddress.slice(0, 5)}`,
      balance: primary.balance,
      accountAge: primary.accountAgeDays || 1,
      reputaScore: 0,
      createdAt: primary.firstTxDate,
      transactions: allTransactions,
      totalTransactions: primary.subentryCount + primary.records.length,
      mainnetTxCount: isMainnet ? primary.records.length : secondaryTxCount,
      testnetTxCount: !isMainnet ? primary.records.length : secondaryTxCount,
    };
  } catch (error) {
    console.error("Fetch Error:", error);
    throw error;
  }
}
