import { WalletData, Transaction, TokenBalance } from '@/types';

export const DEMO_WALLET_ADDRESS = '0xDEMO1234567890ABCDEF';
export const DEMO_USERNAME = 'demo_user';

function generateTransactions(count: number): Transaction[] {
  const transactions: Transaction[] = [];
  const now = Date.now();
  const types: Transaction['type'][] = ['send', 'receive', 'stake', 'unstake'];
  
  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 90);
    const timestamp = new Date(now - daysAgo * 24 * 60 * 60 * 1000).toISOString();
    const type = types[Math.floor(Math.random() * types.length)];
    const amount = Math.random() * 100 + 1;
    
    transactions.push({
      id: `demo_tx_${i}`,
      from: type === 'receive' ? `0xRANDOM${i}` : DEMO_WALLET_ADDRESS,
      to: type === 'send' ? `0xRANDOM${i}` : DEMO_WALLET_ADDRESS,
      amount: parseFloat(amount.toFixed(2)),
      timestamp,
      type,
      status: 'completed',
      hash: `0x${Math.random().toString(16).substring(2, 66)}`,
      isSpam: Math.random() < 0.05, // 5% spam rate
    });
  }
  
  return transactions.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

function generateTokenBalances(): TokenBalance[] {
  return [
    {
      symbol: 'PI',
      name: 'Pi Network',
      balance: 1543.67,
      value: 1543.67,
      logo: '🥧',
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      balance: 250.00,
      value: 250.00,
      logo: '💵',
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      balance: 0.5,
      value: 850.00,
      logo: '💎',
    },
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      balance: 0.02,
      value: 680.00,
      logo: '₿',
    },
  ];
}

export function getDemoWalletData(): WalletData {
  const createdAt = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(); // 180 days ago
  const lastActive = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(); // 2 days ago
  
  return {
    address: DEMO_WALLET_ADDRESS,
    balance: 1543.67,
    transactions: generateTransactions(45),
    createdAt,
    lastActive,
    tokenBalances: generateTokenBalances(),
  };
}

export function getMockMiningDays(): number {
  // Simulate 120 mining days
  return 120;
}
