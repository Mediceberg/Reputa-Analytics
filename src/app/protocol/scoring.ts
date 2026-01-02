/**
 * Scoring Module - Calculate comprehensive reputation score
 * تم تحسينه ليتناسب مع أوزان البلوكشين الحقيقية لعام 2026
 */

import type { ReputationScores, ScoreBreakdown, WalletData, StakingData, MiningData } from './types';
import { analyzeAllTransactions } from './transactions';

export function calculateReputationScore(
  walletData: WalletData,
  stakingData?: StakingData,
  miningData?: MiningData
): ReputationScores {
  
  // 1. حساب عمر المحفظة (الحد الأقصى 20 نقطة)
  const walletAgeScore = calculateWalletAgeScore(walletData.accountAge);
  
  // 2. تحليل المعاملات (الحد الأقصى 40 نقطة)
  // هنا يتم استدعاء analyzeAllTransactions التي تعالج مصفوفة Transactions الحقيقية
  const txAnalysis = analyzeAllTransactions(walletData.transactions);
  const transactionScore = txAnalysis.totalScore;
  
  // 3. نقاط الـ Staking (الحد الأقصى 30 نقطة)
  const stakingScore = stakingData?.score || 0;
  
  // 4. مكافأة التعدين (الحد الأقصى 10 نقاط)
  const miningScore = miningData?.score || 0;
  
  // 5. حساب الجزاءات (Penalties)
  const penalties = calculatePenalties(txAnalysis);
  
  // 6. المجموع الكلي مع التحجيم (Scale 0-1000)
  const rawTotal = walletAgeScore + transactionScore + stakingScore + miningScore - penalties;
  // نستخدم Math.max لضمان عدم وجود سكور سالب
  const totalScore = Math.max(0, Math.min(1000, Math.round(rawTotal * 10)));
  
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
 * تحسين حساب عمر المحفظة ليعطي نتائج أدق بناءً على تاريخ أول معاملة
 */
function calculateWalletAgeScore(days: number): number {
  if (days >= 365) return 20; // سنة كاملة
  if (days >= 180) return 15; // 6 أشهر
  if (days >= 30) return 10;  // شهر
  return 5;
}

function calculatePenalties(txAnalysis: any): number {
  let penalties = 0;
  // خصم على المعاملات الخارجية (التي قد تشير لبيع غير قانوني خارج النظام)
  penalties += Math.min((txAnalysis.externalCount || 0) * 2, 20);
  // خصم على النشاط المشبوه
  penalties += Math.min((txAnalysis.suspiciousCount || 0) * 5, 30);
  return penalties;
}

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
      explanation: stakingData?.explanation || 'No active staking found on-chain.'
    },
    mining: {
      available: !!miningData,
      totalDays: miningData?.totalDays || 0,
      maxScore: 10,
      earnedScore: miningData?.score || 0,
      explanation: miningData?.explanation || 'Upload Pi mining history for extra points.'
    },
    penalties: {
      externalTransactions: (txAnalysis.externalCount || 0) * 2,
      suspiciousActivity: (txAnalysis.suspiciousCount || 0) * 5,
      totalPenalty: penalties,
      explanation: getPenaltyExplanation(txAnalysis, penalties)
    }
  };
}

// دوال المساعدة للتقارير النصية
function getAgeExplanation(days: number, score: number): string {
  if (days >= 365) return `Legacy Wallet (${days} days)`;
  if (days >= 30) return `Active Member (${days} days)`;
  return `New Participant (${days} days)`;
}

function getTxExplanation(analysis: any): string {
  return `Analyzing ${analysis.internalCount} verified Pi transactions.`;
}

function getPenaltyExplanation(analysis: any, total: number): string {
  return total === 0 ? 'Pure on-chain history.' : `Reduced by ${total} points due to external activity.`;
}

export function determineTrustLevel(totalScore: number): 'Low' | 'Medium' | 'High' | 'Elite' {
  if (totalScore >= 900) return 'Elite';
  if (totalScore >= 700) return 'High';
  if (totalScore >= 500) return 'Medium';
  return 'Low';
}
