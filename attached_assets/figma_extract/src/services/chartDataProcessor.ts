import { Transaction, ReputationScore, TokenBalance, ChartDataPoint } from '@/types';

export function processTransactionTimeline(
  transactions: Transaction[],
  period: 'day' | 'week' | 'month'
): { internal: ChartDataPoint[]; external: ChartDataPoint[] } {
  const now = Date.now();
  const periodInMs = period === 'day' ? 24 * 60 * 60 * 1000 : 
                     period === 'week' ? 7 * 24 * 60 * 60 * 1000 : 
                     30 * 24 * 60 * 60 * 1000;
  
  const daysToShow = period === 'day' ? 7 : period === 'week' ? 12 : 6;
  const dataPoints: Map<string, { internal: number; external: number }> = new Map();

  // Initialize data points
  for (let i = 0; i < daysToShow; i++) {
    const date = new Date(now - i * periodInMs);
    const key = formatDateKey(date, period);
    dataPoints.set(key, { internal: 0, external: 0 });
  }

  // Process transactions
  transactions.forEach(tx => {
    const txDate = new Date(tx.timestamp);
    const key = formatDateKey(txDate, period);
    
    if (dataPoints.has(key)) {
      const point = dataPoints.get(key)!;
      if (tx.type === 'receive' || tx.type === 'stake') {
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

export function processScoreBreakdown(score: ReputationScore): ChartDataPoint[] {
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
  transactions: Transaction[],
  score: ReputationScore
): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  const grouped = groupTransactionsByWeek(transactions);

  grouped.forEach((txs, week) => {
    const activity = txs.length;
    const spamCount = txs.filter(tx => tx.isSpam).length;
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

function groupTransactionsByWeek(transactions: Transaction[]): Map<string, Transaction[]> {
  const groups = new Map<string, Transaction[]>();
  
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
