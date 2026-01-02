/**
 * Reputa Protocol - Unified Entry Point
 * 
 * This is the main interface for the Reputation Protocol.
 * Import from here to use protocol features.
 */

// Core Functions
export { fetchWalletData, fetchUsername } from './wallet';
export { analyzeTransaction, analyzeAllTransactions, getTransactionExplanation, flagSuspiciousTransactions } from './transactions';
export { analyzeStaking, estimateStaking } from './staking';
export { processYearWithPiImage, calculateMiningConsistency } from './mining';
export { verifyImage, createImageAlert } from './imageVerification';
export { calculateReputationScore, determineTrustLevel } from './scoring';
export { generateReport, formatVIPReport, formatRegularReport, exportReportJSON } from './report';
export { initializePi, authenticate, createVIPPayment, checkVIPStatus, isPiAvailable } from './piPayment';

// Types
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
 */
export async function generateCompleteReport(
  walletAddress: string,
  userId?: string,
  miningData?: MiningData,
  isVIP: boolean = false
): Promise<ReputationReport> {
  const walletData = await fetchWalletData(walletAddress);
  const stakingData = estimateStaking(walletData.balance, walletData.accountAge);
  
  return generateReport(
    userId || walletData.username || 'anonymous',
    walletData,
    stakingData,
    miningData,
    isVIP
  );
}
