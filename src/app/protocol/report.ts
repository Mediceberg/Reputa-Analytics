/**
 * Report Module - Generate reputation reports (VIP/Regular) 
 * Updated to use unified Atomic Reputation Protocol
 */

import type { ReputationReport, WalletData, StakingData, MiningData, Alert } from './types';
import { calculateAtomicReputation, getLevelProgress, generateDemoActivityData, type AtomicReputationResult, type WalletActivityData } from './atomicScoring';

/**
 * Convert WalletData to WalletActivityData for atomic scoring
 */
function walletToActivityData(walletData: WalletData, stakingData?: StakingData, miningData?: MiningData): WalletActivityData {
  const txCount = walletData.transactions?.length || walletData.totalTransactions || 0;
  const internalTx = walletData.transactions?.filter(tx => tx.type === 'internal').length || 0;
  const externalTx = walletData.transactions?.filter(tx => tx.type === 'external').length || 0;
  
  return {
    accountAgeDays: walletData.accountAge || 0,
    lastActivityDate: new Date(),
    dailyCheckins: 0,
    adBonuses: 0,
    reportViews: 0,
    toolUsage: 0,
    internalTxCount: internalTx,
    appInteractions: Math.floor(txCount * 0.1),
    sdkPayments: 0,
    normalTrades: Math.floor(txCount * 0.2),
    uniqueTokens: 1,
    regularActivityWeeks: Math.min(8, Math.floor(walletData.accountAge / 30)),
    stakingDays: stakingData?.duration || 0,
    smallExternalTransfers: Math.min(externalTx, 3),
    frequentExternalTransfers: externalTx > 5 ? 1 : 0,
    suddenExits: 0,
    continuousDrain: 0,
    spamCount: 0,
    farmingInstances: 0,
    suspiciousLinks: 0,
  };
}

/**
 * Generate comprehensive reputation report using Atomic Scoring Protocol
 */
export function generateReport(
  userId: string,
  walletData: WalletData,
  stakingData?: StakingData,
  miningData?: MiningData,
  isVIP: boolean = false
): ReputationReport {
  const activityData = walletToActivityData(walletData, stakingData, miningData);
  const atomicResult = calculateAtomicReputation(activityData);
  const levelProgress = getLevelProgress(atomicResult.adjustedScore);
  const trustLevel = levelProgress.currentLevel as 'Low' | 'Medium' | 'High' | 'Elite';
  
  const totalPenalty = Math.abs(atomicResult.externalPenalty.totalPenalty) + Math.abs(atomicResult.suspiciousPenalty.totalPenalty);
  
  const scores = {
    walletAgeScore: atomicResult.walletAge.totalPoints,
    transactionScore: atomicResult.piNetwork.totalPoints,
    stakingScore: atomicResult.staking.totalPoints,
    miningScore: 0,
    penalties: totalPenalty,
    totalScore: atomicResult.adjustedScore,
    breakdown: {
      walletAge: { days: walletData.accountAge, maxScore: 20 as const, earnedScore: Math.min(20, atomicResult.walletAge.totalPoints), explanation: 'Atomic wallet age scoring' },
      transactions: { total: walletData.totalTransactions, internal: walletData.transactions.filter(t => t.type === 'internal').length, external: walletData.transactions.filter(t => t.type === 'external').length, suspicious: 0, maxScore: 40 as const, earnedScore: Math.min(40, atomicResult.piNetwork.totalPoints), details: [], explanation: 'Atomic transaction scoring' },
      staking: { active: !!stakingData, amount: stakingData?.amount || 0, duration: stakingData?.duration || 0, maxScore: 30 as const, earnedScore: Math.min(30, atomicResult.staking.totalPoints), explanation: 'Atomic staking scoring' },
      mining: { available: !!miningData, totalDays: miningData?.totalDays || 0, maxScore: 10 as const, earnedScore: miningData?.score || 0, explanation: 'Mining bonus' },
      penalties: { externalTransactions: Math.abs(atomicResult.externalPenalty.totalPenalty), suspiciousActivity: Math.abs(atomicResult.suspiciousPenalty.totalPenalty), totalPenalty, explanation: 'Atomic penalty system' },
    },
  };
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
 * يظهر جميع المعاملات الحقيقية الـ 10 التي جلبناها من البلوكشين
 */
export function formatVIPReport(report: ReputationReport): any {
  return {
    ...report,
    transactions: {
      full: report.walletData.transactions.map(tx => ({
        ...tx,
        scoreDetails: tx.score,
        // وسم المعاملات المشبوهة بناءً على منطق السمعة الخاص بك
        flagged: tx.score && tx.score.suspiciousPenalty < 0
      })),
      count: report.walletData.transactions.length
    },
    insights: generateInsights(report)
  };
}

/**
 * Format regular report (limited to last 3 transactions)
 * يطبق القيود على المستخدمين العاديين مع الحفاظ على البيانات الحقيقية
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
      // اقتطاع أول 3 معاملات فقط من البيانات الحقيقية
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
 * Generate alerts based on real blockchain analysis
 */
function generateAlerts(
  walletData: WalletData,
  stakingData?: StakingData,
  miningData?: MiningData,
  scores?: any
): Alert[] {
  const alerts: Alert[] = [];
  
  // تنبيهات تعدين Pi الحقيقية
  if (miningData) {
    if (miningData.verificationStatus === 'verified') {
      alerts.push({
        type: 'success',
        message: 'Mining behavior verified',
        timestamp: new Date(),
        details: `Consistency bonus applied: +${miningData.score} points`
      });
    } else if (miningData.verificationStatus === 'suspicious') {
      alerts.push({
        type: 'warning',
        message: 'Mining pattern inconsistency',
        timestamp: new Date(),
        details: miningData.explanation
      });
    }
  }
  
  // تحليل المعاملات الخارجية الحقيقية (External)
  // في Testnet، المعاملات الخارجية غالباً ما تشير إلى سحوبات خارج بيئة التطبيقات
  const external = walletData.transactions.filter(tx => tx.type === 'external');
  if (external.length > 3) {
    alerts.push({
      type: 'info',
      message: 'High external activity',
      timestamp: new Date(),
      details: 'Frequent external transfers reduce ecosystem trust score'
    });
  }
  
  // تنبيه الرصيد المنخفض (إضافة جديدة للمنطق الحقيقي)
  if (walletData.balance < 1) {
    alerts.push({
      type: 'warning',
      message: 'Low wallet balance',
      timestamp: new Date(),
      details: 'Insufficient balance might affect transaction reputation'
    });
  }
  
  return alerts;
}

/**
 * Generate VIP insights
 */
function generateInsights(report: ReputationReport): string[] {
  const insights: string[] = [];
  
  const totalTx = report.walletData.totalTransactions || 1;
  const internalTx = report.walletData.transactions.filter(t => t.type === 'internal').length;
  const internalRatio = internalTx / Math.min(report.walletData.transactions.length, 10);
  
  if (internalRatio > 0.7) {
    insights.push('Strong Ecosystem Integration: Most of your Pi movement is within internal apps.');
  }
  
  if (report.walletData.balance > 100) {
    insights.push('Significant Holder: Your balance indicates long-term commitment to the network.');
  }

  if (report.miningData) {
    insights.push(`Mining Activity: You have ${report.miningData.totalDays} days of recorded history.`);
  }
  
  return insights;
}

export function exportReportJSON(report: ReputationReport, isVIP: boolean): string {
  const formatted = isVIP ? formatVIPReport(report) : formatRegularReport(report);
  return JSON.stringify(formatted, null, 2);
}
