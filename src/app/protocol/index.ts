/** 
 * Reputa Protocol - Unified Entry Point
 * * الموزع الرئيسي لبروتوكول السمعة.
 * يتم استدعاء كافة الميزات الحقيقية (Testnet/SDK) من هنا.
 */

// Core Functions - يتم تصدير الدوال التي تم ربطها بالبلوكشين والـ SDK
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
