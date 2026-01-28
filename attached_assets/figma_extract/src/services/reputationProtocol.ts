import { WalletData, ReputationScore } from '@/types';

const WEIGHTS = {
  ACCOUNT_AGE: 0.2,
  TRANSACTION_COUNT: 0.15,
  TRANSACTION_VOLUME: 0.15,
  STAKING_BONUS: 0.15,
  MINING_DAYS_BONUS: 0.2,
  ACTIVITY_SCORE: 0.15,
};

const MAX_SCORE = 100;

export function calculateReputationScore(
  walletData: WalletData,
  miningDays: number = 0
): ReputationScore {
  // Account Age Score (0-100)
  const accountAgeInDays = Math.floor(
    (Date.now() - new Date(walletData.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  const accountAgeScore = Math.min(accountAgeInDays / 180 * 100, 100);

  // Transaction Count Score (0-100)
  const transactionCount = walletData.transactions.length;
  const transactionCountScore = Math.min(transactionCount / 50 * 100, 100);

  // Transaction Volume Score (0-100)
  const totalVolume = walletData.transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const volumeScore = Math.min(totalVolume / 1000 * 100, 100);

  // Staking Bonus (0-100)
  const stakingTransactions = walletData.transactions.filter(tx => tx.type === 'stake');
  const stakingAmount = stakingTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const stakingScore = Math.min(stakingAmount / 500 * 100, 100);

  // Mining Days Bonus (0-100)
  const miningDaysScore = Math.min(miningDays / 365 * 100, 100);

  // Activity Score (0-100)
  const lastActiveInDays = Math.floor(
    (Date.now() - new Date(walletData.lastActive).getTime()) / (1000 * 60 * 60 * 24)
  );
  const activityScore = Math.max(100 - lastActiveInDays * 2, 0);

  // Spam Penalty
  const spamCount = walletData.transactions.filter(tx => tx.isSpam).length;
  const spamPenalty = Math.min(spamCount * 10, 50);

  // Calculate weighted total
  const rawScore =
    accountAgeScore * WEIGHTS.ACCOUNT_AGE +
    transactionCountScore * WEIGHTS.TRANSACTION_COUNT +
    volumeScore * WEIGHTS.TRANSACTION_VOLUME +
    stakingScore * WEIGHTS.STAKING_BONUS +
    miningDaysScore * WEIGHTS.MINING_DAYS_BONUS +
    activityScore * WEIGHTS.ACTIVITY_SCORE;

  const totalScore = Math.max(0, Math.min(rawScore - spamPenalty, MAX_SCORE));

  // Trust Level
  let trustLevel: ReputationScore['trustLevel'];
  if (totalScore >= 80) trustLevel = 'Excellent';
  else if (totalScore >= 60) trustLevel = 'High';
  else if (totalScore >= 40) trustLevel = 'Medium';
  else trustLevel = 'Low';

  // Risk Score (inverse of trust)
  const riskScore = 100 - totalScore;

  // Activity Level
  const activityLevel = activityScore;

  // Recommendations
  const recommendations: string[] = [];
  if (transactionCountScore < 50) {
    recommendations.push('recommendations.increase_transactions');
  }
  if (spamPenalty > 10) {
    recommendations.push('recommendations.avoid_spam');
  }
  if (stakingScore < 50) {
    recommendations.push('recommendations.stake_more');
  }
  if (activityScore < 70) {
    recommendations.push('recommendations.maintain_activity');
  }
  if (totalScore >= 80) {
    recommendations.push('recommendations.excellent');
  }

  return {
    total: Math.round(totalScore),
    trustLevel,
    breakdown: {
      accountAge: Math.round(accountAgeScore * WEIGHTS.ACCOUNT_AGE),
      transactionCount: Math.round(transactionCountScore * WEIGHTS.TRANSACTION_COUNT),
      transactionVolume: Math.round(volumeScore * WEIGHTS.TRANSACTION_VOLUME),
      stakingBonus: Math.round(stakingScore * WEIGHTS.STAKING_BONUS),
      miningDaysBonus: Math.round(miningDaysScore * WEIGHTS.MINING_DAYS_BONUS),
      activityScore: Math.round(activityScore * WEIGHTS.ACTIVITY_SCORE),
      spamPenalty: Math.round(spamPenalty),
    },
    riskScore: Math.round(riskScore),
    activityLevel: Math.round(activityLevel),
    recommendations,
  };
}
