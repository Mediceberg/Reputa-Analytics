/**
 * Reputa Protocol - Type Definitions
 * Core interfaces for the reputation system
 */

export interface Transaction { 
  id: string;
  timestamp: Date;
  amount: number;
  from: string;
  to: string;
  type: 'internal' | 'external' | 'sent' | 'received';
  memo?: string;
  score?: TransactionScore;
}

export interface TransactionScore {
  basePoints: number;
  typeBonus: number;
  sizeBonus: number;
  suspiciousPenalty: number;
  totalPoints: number;
  explanation: string;
}

export interface WalletData {
  address: string;
  username?: string;
  balance: number;
  accountAge: number;
  createdAt: Date;
  transactions: Transaction[];
  totalTransactions: number;
  reputaScore?: number;
  trustScore?: number;
  trustLevel?: TrustLevel;
  consistencyScore?: number;
  networkTrust?: number;
}

export type TrustLevel = 'Elite' | 'High' | 'Medium' | 'Low';

export interface StakingData {
  amount: number;
  duration: number;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  score: number;
  explanation: string;
}

export interface MiningData {
  totalDays: number;
  sessionsPerDay: number;
  piEarned: number;
  absenceDays: number;
  verificationStatus: 'verified' | 'suspicious' | 'failed';
  score: number;
  explanation: string;
}

export interface ReputationScores {
  walletAgeScore: number;
  transactionScore: number;
  stakingScore: number;
  miningScore: number;
  penalties: number;
  totalScore: number;
  breakdown: ScoreBreakdown;
}

export interface ScoreBreakdown {
  walletAge: {
    days: number;
    maxScore: 20;
    earnedScore: number;
    explanation: string;
  };
  transactions: {
    total: number;
    internal: number;
    external: number;
    suspicious: number;
    maxScore: 40;
    earnedScore: number;
    details: TransactionScore[];
    explanation: string;
  };
  staking: {
    active: boolean;
    amount: number;
    duration: number;
    maxScore: 30;
    earnedScore: number;
    explanation: string;
  };
  mining: {
    available: boolean;
    totalDays: number;
    maxScore: 10;
    earnedScore: number;
    explanation: string;
  };
  penalties: {
    externalTransactions: number;
    suspiciousActivity: number;
    totalPenalty: number;
    explanation: string;
  };
}

export interface ReputationReport {
  userId: string;
  username?: string;
  walletAddress: string;
  reportDate: Date;
  scores: ReputationScores;
  walletData: WalletData;
  stakingData?: StakingData;
  miningData?: MiningData;
  trustLevel: 'Low' | 'Medium' | 'High' | 'Elite';
  isVIP: boolean;
  alerts: Alert[];
}

export interface Alert {
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  timestamp: Date;
  details?: string;
}

export interface YearWithPiImage {
  imageData: string;
  uploadedAt: Date;
  verified: boolean;
  extractedData?: MiningData;
}

export interface PaymentData {
  paymentId: string;
  amount: number;
  memo: string;
  status: 'pending' | 'approved' | 'completed' | 'failed';
  txid?: string;
  createdAt: Date;
  completedAt?: Date;
}
