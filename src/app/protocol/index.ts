/** 
 * Reputa Protocol - Unified Entry Point
 * * الموزع الرئيسي لبروتوكول السمعة.
 * يتم استدعاء كافة الميزات الحقيقية (Testnet/SDK) من هنا.
 */

// Core Functions - يتم تصدير الدوال التي تم ربطها بالبلوكشين والـ SDK
export { calculateReputationAtomic, calculateFullReputation, getReputationAtomicScoreCap, type ReputationAtomicInput, type ReputationAtomicResult, type FullReputationInput, type FullReputationResult } from './ReputationAtomic';

// Scoring Rules Constants
export {
  TOTAL_SCORE_CAP,
  CATEGORY_CAPS,
  GENESIS_SCAN_BONUS,
  GENESIS_WALLET_AGE_BONUS,
  GENESIS_LIFETIME_ACTIVITY_BONUS,
  GENESIS_VOLUME_BONUS,
  GENESIS_ECOSYSTEM_BONUS,
  WEEKLY_BLOCKCHAIN_REWARDS,
  MONTHLY_WALLET_REWARDS,
  APP_INTERACTION_REWARDS,
  RECURRING_RULES,
  APP_RULES,
  calculateGenesisScore,
  resolveHighestTier,
  type GenesisInput,
  type GenesisResult,
} from './scoringRules';

// Reward Engine — Snapshot diff, pending rewards, claim
export {
  calculateScanRewards,
  claimPendingRewards,
  createDailyCheckInReward,
  createStreakReward,
  createReferralReward,
  createTaskReward,
  createWeeklyClaimBonus,
  createReferralMilestoneReward,
  createDefaultRewardState,
  type PendingReward,
  type ScanSnapshot,
  type RewardState,
  type ClaimResult,
} from './rewardEngine';

export { fetchWalletData } from './wallet';
export { analyzeTransaction, analyzeAllTransactions, getTransactionExplanation, flagSuspiciousTransactions } from './transactions'; 
export { analyzeStaking, estimateStaking } from './staking';
export { processYearWithPiImage, calculateMiningConsistency } from './mining';
export { verifyImage, createImageAlert } from './imageVerification';
export { generateReport, formatVIPReport, formatRegularReport, exportReportJSON } from './report';
// Payment functions are now in src/app/services/piPayments.ts and piSdk.ts
// Legacy exports maintained for backward compatibility
export { isPiAvailable, checkVIPStatus } from './piPayment';
// createVIPPayment should be imported from '../services/piPayments' instead

// Unified Atomic Scoring Protocol (Single source of truth for reputation)
export { 
  calculateAtomicReputation, 
  getLevelProgress, 
  getBackendScoreCap,
  mapAtomicToTrustLevel,
  generateDemoActivityData,
  LEVEL_NAMES,
  type AtomicTrustLevel,
  type AtomicReputationResult,
  type WalletActivityData
} from './atomicScoring';

// Types - تصدير الأنواع لضمان توافق TypeScript في المشروع
export type {
  Transaction,
  TransactionScore,
  WalletData,
  StakingData,
  MiningData,
  ReputationScores,
  ScoreBreakdown,
  ReputationReport,
  Alert,
  YearWithPiImage,
  PaymentData
} from './types';

// Complete workflow 
import { fetchWalletData } from './wallet';
import { estimateStaking } from './staking';
import { generateReport } from './report';
import type { ReputationReport, MiningData } from './types';

/**
 * Generate complete reputation report
 * تم تحويلها لدالة Async لضمان انتظار البيانات الحقيقية من Testnet
 */
export async function generateCompleteReport(
  walletAddress: string,
  userId?: string,
  miningData?: MiningData,
  isVIP: boolean = false
): Promise<ReputationReport> {
  
  // 1. جلب بيانات المحفظة الحقيقية (رصيد، معاملات، تسلسل) من البلوكشين
  const walletData = await fetchWalletData(walletAddress);
  
  // 2. تقدير بيانات الـ Staking بناءً على الرصيد الحقيقي المجلوب
  const stakingData = estimateStaking(walletData.balance, walletData.accountAge);
  
  // 3. بناء التقرير النهائي بدمج البيانات الحقيقية مع منطق السمعة (Scoring)
  return generateReport(
    userId || walletData.username || 'anonymous',
    walletData,
    stakingData,
    miningData,
    isVIP
  );
}
