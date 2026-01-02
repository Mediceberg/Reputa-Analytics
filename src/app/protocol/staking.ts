/**
 * Staking Module - Analyze staking activity
 */

import type { StakingData } from './types';

/**
 * Analyze staking data and calculate score (max 30 points)
 */
export function analyzeStaking(
  amount: number,
  duration: number,
  startDate: Date,
  endDate?: Date
): StakingData {
  const isActive = endDate ? new Date() < endDate : true;
  let score = 0;
  let explanation = '';
  
  // Amount-based scoring (up to 15 points)
  if (amount >= 1000) {
    score += 15;
    explanation = 'Large stake (1000+ Pi): +15';
  } else if (amount >= 500) {
    score += 12;
    explanation = 'Medium stake (500-999 Pi): +12';
  } else if (amount >= 100) {
    score += 8;
    explanation = 'Small stake (100-499 Pi): +8';
  } else if (amount >= 10) {
    score += 4;
    explanation = 'Minimal stake (10-99 Pi): +4';
  } else {
    explanation = 'No significant staking';
  }
  
  // Duration-based scoring (up to 15 points)
  if (duration >= 365) {
    score += 15;
    explanation += ', Long-term (1+ year): +15';
  } else if (duration >= 180) {
    score += 10;
    explanation += ', Medium-term (6-12 months): +10';
  } else if (duration >= 90) {
    score += 6;
    explanation += ', Short-term (3-6 months): +6';
  } else if (duration >= 30) {
    score += 3;
    explanation += ', Minimal (1-3 months): +3';
  }
  
  // Active bonus
  if (isActive && score > 0) {
    score += 2;
    explanation += ', Active: +2';
  }
  
  score = Math.min(score, 30);
  
  return {
    amount,
    duration,
    startDate,
    endDate,
    isActive,
    score,
    explanation: explanation || 'No staking detected'
  };
}

/**
 * Estimate staking from wallet data (mock implementation)
 */
export function estimateStaking(balance: number, accountAge: number): StakingData {
  // In production, fetch actual staking data from Pi Network
  const estimatedStake = balance * 0.3; // Assume 30% is staked
  const estimatedDuration = Math.min(accountAge, 365);
  const startDate = new Date(Date.now() - estimatedDuration * 24 * 60 * 60 * 1000);
  
  return analyzeStaking(estimatedStake, estimatedDuration, startDate);
}
