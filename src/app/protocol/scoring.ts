/**
 * Scoring Module - Calculate comprehensive reputation score
 */

import type { ReputationScores, ScoreBreakdown, WalletData, StakingData, MiningData } from './types';
import { analyzeAllTransactions } from './transactions';

/**
 * Calculate comprehensive reputation score (0-1000 scale)
 */
export function calculateReputationScore(
  walletData: WalletData,
  stakingData?: StakingData,
  miningData?: MiningData
): ReputationScores {
  // 1. Wallet Age Score (max 20 points)
  const walletAgeScore = calculateWalletAgeScore(walletData.accountAge);
  
  // 2. Transaction Score (max 40 points)
  const txAnalysis = analyzeAllTransactions(walletData.transactions);
  const transactionScore = txAnalysis.totalScore;
  
  // 3. Staking Score (max 30 points)
  const stakingScore = stakingData?.score || 0;
  
  // 4. Mining Bonus (max 10 points - optional)
  const miningScore = miningData?.score || 0;
  
  // 5. Calculate Penalties
  const penalties = calculatePenalties(txAnalysis);
  
  // 6. Total Score
  const rawTotal = walletAgeScore + transactionScore + stakingScore + miningScore - penalties;
  const totalScore = Math.max(0, Math.round(rawTotal * 10)); // Scale to 0-1000
  
  // 7. Create breakdown
  const breakdown = createBreakdown(
    walletData,
    walletAgeScore,
    txAnalysis,
    stakingData,
    miningData,
    penalties
  );
  
  return {
    walletAgeScore,
    transactionScore,
    stakingScore,
    miningScore,
    penalties,
    totalScore,
    breakdown
  };
}

/**
 * Calculate wallet age score (max 20 points)
 */
function calculateWalletAgeScore(days: number): number {
  if (days >= 180) return 20;
  if (days >= 91) return 15;
  if (days >= 31) return 10;
  return 5;
}

/**
 * Calculate penalties from suspicious/external transactions
 */
function calculatePenalties(txAnalysis: any): number {
  let penalties = 0;
  
  // External transaction penalty (2 points each, max 20)
  penalties += Math.min(txAnalysis.externalCount * 2, 20);
  
  // Suspicious activity penalty (5 points each, max 30)
  penalties += Math.min(txAnalysis.suspiciousCount * 5, 30);
  
  return penalties;
}

/**
 * Create detailed score breakdown
 */
function createBreakdown(
  walletData: WalletData,
  walletAgeScore: number,
  txAnalysis: any,
  stakingData?: StakingData,
  miningData?: MiningData,
  penalties: number = 0
): ScoreBreakdown {
  return {
    walletAge: {
      days: walletData.accountAge,
      maxScore: 20,
      earnedScore: walletAgeScore,
      explanation: getAgeExplanation(walletData.accountAge, walletAgeScore)
    },
    transactions: {
      total: walletData.totalTransactions,
      internal: txAnalysis.internalCount,
      external: txAnalysis.externalCount,
      suspicious: txAnalysis.suspiciousCount,
      maxScore: 40,
      earnedScore: txAnalysis.totalScore,
      details: txAnalysis.scores,
      explanation: getTxExplanation(txAnalysis)
    },
    staking: {
      active: stakingData?.isActive || false,
      amount: stakingData?.amount || 0,
      duration: stakingData?.duration || 0,
      maxScore: 30,
      earnedScore: stakingData?.score || 0,
      explanation: stakingData?.explanation || 'No staking activity'
    },
    mining: {
      available: !!miningData,
      totalDays: miningData?.totalDays || 0,
      maxScore: 10,
      earnedScore: miningData?.score || 0,
      explanation: miningData?.explanation || 'Upload "Year with Pi" to unlock bonus'
    },
    penalties: {
      externalTransactions: txAnalysis.externalCount * 2,
      suspiciousActivity: txAnalysis.suspiciousCount * 5,
      totalPenalty: penalties,
      explanation: getPenaltyExplanation(txAnalysis, penalties)
    }
  };
}

function getAgeExplanation(days: number, score: number): string {
  if (days >= 180) return `Mature wallet (${days} days): Maximum bonus (${score}/20)`;
  if (days >= 91) return `Established wallet (${days} days): Good bonus (${score}/20)`;
  if (days >= 31) return `New wallet (${days} days): Moderate bonus (${score}/20)`;
  return `Very new wallet (${days} days): Minimal bonus (${score}/20)`;
}

function getTxExplanation(analysis: any): string {
  const parts = [`${analysis.internalCount} internal (positive)`];
  if (analysis.externalCount > 0) parts.push(`${analysis.externalCount} external (negative)`);
  if (analysis.suspiciousCount > 0) parts.push(`${analysis.suspiciousCount} suspicious (penalties)`);
  return `${parts.join(', ')}. Score: ${analysis.totalScore}/40`;
}

function getPenaltyExplanation(analysis: any, total: number): string {
  if (total === 0) return 'No penalties - excellent history!';
  const parts = [];
  if (analysis.externalCount > 0) parts.push(`${analysis.externalCount} external tx (-${analysis.externalCount * 2})`);
  if (analysis.suspiciousCount > 0) parts.push(`${analysis.suspiciousCount} suspicious (-${analysis.suspiciousCount * 5})`);
  return `${parts.join(', ')}. Total: -${total}`;
}

/**
 * Determine trust level from total score
 */
export function determineTrustLevel(totalScore: number): 'Low' | 'Medium' | 'High' | 'Elite' {
  if (totalScore >= 900) return 'Elite';
  if (totalScore >= 700) return 'High';
  if (totalScore >= 500) return 'Medium';
  return 'Low';
}
