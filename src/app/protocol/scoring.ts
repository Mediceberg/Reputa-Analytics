/**
 * Legacy wrapper kept for compatibility.
 * Single Source of Truth is ReputationAtomic.
 */

import type { ReputationScores, WalletData, StakingData, MiningData } from './types';
import { calculateReputationAtomic } from './ReputationAtomic';

export function calculateReputationScore(
  walletData: WalletData,
  _stakingData?: StakingData,
  _miningData?: MiningData
): 
  ReputationScores {
  const atomic = calculateReputationAtomic({
    Mainnet_Points: walletData.totalTransactions || 0,
    Testnet_Points: Math.max(0, Math.floor((walletData.balance || 0) / 10)),
    App_Engagement_Points: 0,
  });

  return {
    walletAgeScore: 0,
    transactionScore: atomic.Mainnet_Points,
    stakingScore: 0,
    miningScore: 0,
    penalties: 0,
    totalScore: atomic.totalScore,
    breakdown: {
      walletAge: { days: walletData.accountAge, maxScore: 0, earnedScore: 0, explanation: 'Deprecated' },
      transactions: {
        total: walletData.totalTransactions,
        internal: walletData.totalTransactions,
        external: 0,
        suspicious: 0,
        maxScore: atomic.Mainnet_Points,
        earnedScore: atomic.Mainnet_Points,
        details: [],
        explanation: 'Mainnet_Points only',
      },
      staking: { active: false, amount: 0, duration: 0, maxScore: 0, earnedScore: 0, explanation: 'Deprecated' },
      mining: { available: false, totalDays: 0, maxScore: 0, earnedScore: 0, explanation: 'Deprecated' },
      penalties: { externalTransactions: 0, suspiciousActivity: 0, totalPenalty: 0, explanation: 'Deprecated' },
    },
  };
}

export function determineTrustLevel(totalScore: number): 'Low' | 'Medium' | 'High' | 'Elite' {
  if (totalScore >= 85000) return 'Elite';
  if (totalScore >= 65000) return 'High';
  if (totalScore >= 25000) return 'Medium';
  return 'Low';
}
