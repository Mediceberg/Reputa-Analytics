import { Transaction, ChartDataPoint, TokenBalance, ChartReputationScore } from '../protocol/types';

interface ChartTransaction { 
  id: string;
  from: string;
  to: string;
  amount: number;
  timestamp: string | Date;
  type: string;
  isSpam?: boolean;
}

export function processTransactionTimeline(
  transactions: (Transaction | ChartTransaction)[],
  period: 'day' | 'week' | 'month'
): { internal: ChartDataPoint[]; external: ChartDataPoint[] } {
  const now = Date.now();
  const periodInMs = period === 'day' ? 24 * 60 * 60 * 1000 : 
                     period === 'week' ? 7 * 24 * 60 * 60 * 1000 : 
                     30 * 24 * 60 * 60 * 1000;
  
  const daysToShow = period === 'day' ? 7 : period === 'week' ? 12 : 6;
  const dataPoints: Map<string, { internal: number; external: number }> = new Map();

  for (let i = 0; i < daysToShow; i++) {
    const date = new Date(now - i * periodInMs);
    const key = formatDateKey(date, period);
    dataPoints.set(key, { internal: 0, external: 0 });
  }

  transactions.forEach(tx => {
    const txDate = new Date(tx.timestamp);
    const key = formatDateKey(txDate, period);
    
    if (dataPoints.has(key)) {
      const point = dataPoints.get(key)!;
      if (tx.type === 'received' || tx.type === 'internal') {
        point.internal += tx.amount;
      } else {
        point.external += tx.amount;
      }
    }
  });

  const internal: ChartDataPoint[] = [];
  const external: ChartDataPoint[] = [];

  Array.from(dataPoints.entries()).reverse().forEach(([date, values]) => {
    internal.push({ date, value: Math.round(values.internal * 100) / 100 });
    external.push({ date, value: Math.round(values.external * 100) / 100 });
  });

  return { internal, external };
}

export function processScoreBreakdown(score: ChartReputationScore): ChartDataPoint[] {
  return [
    {
      date: 'score.accountAge',
      value: score.breakdown.accountAge,
      label: 'Account Age',
    },
    {
      date: 'score.transactions',
      value: score.breakdown.transactionCount,
      label: 'Transactions',
    },
    {
      date: 'score.volume',
      value: score.breakdown.transactionVolume,
      label: 'Volume',
    },
    {
      date: 'score.staking',
      value: score.breakdown.stakingBonus,
      label: 'Staking',
    },
    {
      date: 'score.mining',
      value: score.breakdown.miningDaysBonus,
      label: 'Mining Days',
    },
    {
      date: 'score.activity',
      value: score.breakdown.activityScore,
      label: 'Activity',
    },
  ];
}

export function processRiskActivity(
  transactions: (Transaction | ChartTransaction)[],
  _score: ChartReputationScore
): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  const grouped = groupTransactionsByWeek(transactions);

  grouped.forEach((txs, week) => {
    const activity = txs.length;
    const spamCount = txs.filter(tx => (tx as ChartTransaction).isSpam).length;
    const risk = Math.min((spamCount / activity) * 100, 100);
    
    data.push({
      date: week,
      value: activity,
      label: `Risk: ${Math.round(risk)}%`,
      type: risk > 30 ? 'high' : risk > 15 ? 'medium' : 'low',
    });
  });

  return data;
}

export function processTokenPortfolio(tokens: TokenBalance[]): ChartDataPoint[] {
  return tokens.map(token => ({
    date: token.symbol,
    value: token.value,
    label: token.name,
  }));
}

function formatDateKey(date: Date, period: 'day' | 'week' | 'month'): string {
  if (period === 'day') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } else if (period === 'week') {
    const weekNum = Math.floor(date.getTime() / (7 * 24 * 60 * 60 * 1000));
    return `W${weekNum % 52}`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  }
}

function groupTransactionsByWeek(transactions: (Transaction | ChartTransaction)[]): Map<string, (Transaction | ChartTransaction)[]> {
  const groups = new Map<string, (Transaction | ChartTransaction)[]>();
  
  transactions.forEach(tx => {
    const date = new Date(tx.timestamp);
    const weekNum = Math.floor(date.getTime() / (7 * 24 * 60 * 60 * 1000));
    const key = `W${weekNum % 52}`;
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(tx);
  });
  
  return groups;
}

export function generateMockChartData(): {
  transactions: ChartTransaction[];
  score: ChartReputationScore;
  tokens: TokenBalance[];
} {
  const now = Date.now();
  const transactions: ChartTransaction[] = [];
  
  for (let i = 0; i < 50; i++) {
    transactions.push({
      id: `tx-${i}`,
      from: i % 2 === 0 ? 'user' : 'other',
      to: i % 2 === 0 ? 'other' : 'user',
      amount: Math.random() * 100 + 10,
      timestamp: new Date(now - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      type: i % 3 === 0 ? 'received' : i % 3 === 1 ? 'sent' : 'internal',
      isSpam: Math.random() < 0.1,
    });
  }

  const score: ChartReputationScore = {
    total: 78,
    trustLevel: 'High',
    breakdown: {
      accountAge: 18,
      transactionCount: 12,
      transactionVolume: 10,
      stakingBonus: 12,
      miningDaysBonus: 16,
      activityScore: 10,
      spamPenalty: 0,
    },
    riskScore: 15,
    activityLevel: 72,
    recommendations: [
      'recommendations.increase_transactions',
      'recommendations.maintain_activity',
    ],
  };

  const tokens: TokenBalance[] = [
    { symbol: 'PI', name: 'Pi Network', balance: 1250.5, value: 1250.5, logo: 'π' },
    { symbol: 'PISWAP', name: 'PiSwap Token', balance: 500, value: 125, logo: '🔄' },
    { symbol: 'PNFT', name: 'Pi NFT', balance: 10, value: 50, logo: '🎨' },
    { symbol: 'PIT', name: 'Pi Transfer', balance: 1500, value: 300, logo: '📤' },
    { symbol: 'PIG', name: 'Pi Game', balance: 250, value: 75, logo: '🎮' },
    { symbol: 'PIM', name: 'Pi Mall', balance: 100, value: 200, logo: '🛍️' },
    { symbol: 'PIB', name: 'Pi Bank', balance: 50, value: 500, logo: '🏦' },
    { symbol: 'PIS', name: 'Pi Stake', balance: 2000, value: 2000, logo: '📈' },
    { symbol: 'PIX', name: 'Pi Exchange', balance: 300, value: 150, logo: '💱' },
    { symbol: 'PIC', name: 'Pi Chat', balance: 10, value: 5, logo: '💬' },
  ];

  return { transactions, score, tokens };
}
