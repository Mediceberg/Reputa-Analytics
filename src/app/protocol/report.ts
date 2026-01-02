/**
 * Report Module - Generate reputation reports (VIP/Regular)
 */

import type { ReputationReport, WalletData, StakingData, MiningData, Alert } from './types';
import { calculateReputationScore, determineTrustLevel } from './scoring';

/**
 * Generate comprehensive reputation report
 */
export function generateReport(
  userId: string,
  walletData: WalletData,
  stakingData?: StakingData,
  miningData?: MiningData,
  isVIP: boolean = false
): ReputationReport {
  const scores = calculateReputationScore(walletData, stakingData, miningData);
  const trustLevel = determineTrustLevel(scores.totalScore);
  const alerts = generateAlerts(walletData, stakingData, miningData, scores);
  
  return {
    userId,
    username: walletData.username,
    walletAddress: walletData.address,
    reportDate: new Date(),
    scores,
    walletData,
    stakingData,
    miningData,
    trustLevel,
    isVIP,
    alerts
  };
}

/**
 * Format VIP report (full details)
 */
export function formatVIPReport(report: ReputationReport): any {
  return {
    ...report,
    transactions: {
      full: report.walletData.transactions.map(tx => ({
        ...tx,
        scoreDetails: tx.score,
        flagged: tx.score && tx.score.suspiciousPenalty < 0
      })),
      count: report.walletData.transactions.length
    },
    insights: generateInsights(report)
  };
}

/**
 * Format regular report (limited to last 3 transactions)
 */
export function formatRegularReport(report: ReputationReport): any {
  return {
    userId: report.userId,
    username: report.username,
    walletAddress: report.walletAddress,
    reportDate: report.reportDate,
    totalScore: report.scores.totalScore,
    trustLevel: report.trustLevel,
    transactions: {
      limited: report.walletData.transactions.slice(0, 3).map(tx => ({
        id: tx.id,
        timestamp: tx.timestamp,
        amount: tx.amount,
        type: tx.type,
        points: tx.score?.totalPoints || 0
      })),
      message: 'Upgrade to VIP for all transactions and detailed analysis'
    },
    basicScores: {
      walletAge: report.scores.walletAgeScore,
      transactions: report.scores.transactionScore,
      staking: report.scores.stakingScore,
      miningBonus: report.scores.miningScore > 0 ? report.scores.miningScore : 'Not available'
    },
    alerts: report.alerts
  };
}

/**
 * Generate alerts based on analysis
 */
function generateAlerts(
  walletData: WalletData,
  stakingData?: StakingData,
  miningData?: MiningData,
  scores?: any
): Alert[] {
  const alerts: Alert[] = [];
  
  // Mining verification alerts
  if (miningData) {
    if (miningData.verificationStatus === 'verified') {
      alerts.push({
        type: 'success',
        message: 'Year with Pi verified successfully',
        timestamp: new Date(),
        details: `Mining bonus unlocked: +${miningData.score} points`
      });
    } else if (miningData.verificationStatus === 'suspicious') {
      alerts.push({
        type: 'warning',
        message: 'Mining data verification failed',
        timestamp: new Date(),
        details: miningData.explanation
      });
    }
  }
  
  // Suspicious transactions
  const suspicious = walletData.transactions.filter(
    tx => tx.score && tx.score.suspiciousPenalty < 0
  );
  if (suspicious.length > 0) {
    alerts.push({
      type: 'warning',
      message: `${suspicious.length} suspicious transaction(s) detected`,
      timestamp: new Date(),
      details: 'Review flagged transactions in detailed report'
    });
  }
  
  // External transactions warning
  const external = walletData.transactions.filter(tx => tx.type === 'external');
  if (external.length > 3) {
    alerts.push({
      type: 'info',
      message: `${external.length} external transactions found`,
      timestamp: new Date(),
      details: 'External transactions negatively impact reputation'
    });
  }
  
  // Staking recommendation
  if (!stakingData || stakingData.amount < 10) {
    alerts.push({
      type: 'info',
      message: 'No active staking detected',
      timestamp: new Date(),
      details: 'Stake Pi to earn up to +30 reputation points'
    });
  }
  
  return alerts;
}

/**
 * Generate VIP insights
 */
function generateInsights(report: ReputationReport): string[] {
  const insights: string[] = [];
  
  const internalRatio = report.scores.breakdown.transactions.internal / 
                       report.scores.breakdown.transactions.total;
  
  if (internalRatio > 0.8) {
    insights.push('Excellent! You primarily use Pi Network internal apps.');
  } else if (internalRatio < 0.5) {
    insights.push('Consider using more Pi Network internal services to improve reputation.');
  }
  
  if (report.stakingData && report.stakingData.amount > 0) {
    insights.push(`You're staking ${report.stakingData.amount} Pi. Great commitment!`);
  } else {
    insights.push('Staking Pi can add up to 30 reputation points.');
  }
  
  if (report.miningData) {
    const consistency = (1 - (report.miningData.absenceDays / report.miningData.totalDays)) * 100;
    insights.push(`Mining consistency: ${consistency.toFixed(1)}%. Keep it up!`);
  }
  
  return insights;
}

/**
 * Export report as JSON
 */
export function exportReportJSON(report: ReputationReport, isVIP: boolean): string {
  const formatted = isVIP ? formatVIPReport(report) : formatRegularReport(report);
  return JSON.stringify(formatted, null, 2);
}
