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
  mainnetTxCount?: number;
  testnetTxCount?: number;
}

export type TrustLevel = 'Elite' | 'High' | 'Medium' | 'Low';

export type AtomicTrustLevel = 
  | 'Novice'
  | 'Explorer'
  | 'Contributor'
  | 'Verified'
  | 'Trusted'
  | 'Ambassador'
  | 'Elite'
  | 'Sentinel'
  | 'Oracle'
  | 'Atomic Legend';

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
    maxScore: number;
    earnedScore: number;
    explanation: string;
  };
  transactions: {
    total: number;
    internal: number;
    external: number;
    suspicious: number;
    maxScore: number;
    earnedScore: number;
    details: TransactionScore[];
    explanation: string;
  };
  staking: {
    active: boolean;
    amount: number;
    duration: number;
    maxScore: number;
    earnedScore: number;
    explanation: string;
  };
  mining: {
    available: boolean;
    totalDays: number;
    maxScore: number;
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

export interface PiUser {
  uid: string;
  username?: string;
  accessToken?: string;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
  type?: string;
}

export interface TimeFilter {
  period: 'day' | 'week' | 'month';
  label: string;
}

export interface TokenBalance {
  symbol: string;
  name: string;
  balance: number;
  value: number;
  logo?: string;
}

export interface ChartReputationScore {
  total: number;
  trustLevel: 'Low' | 'Medium' | 'High' | 'Excellent';
  breakdown: {
    accountAge: number;
    transactionCount: number;
    transactionVolume: number;
    stakingBonus: number;
    miningDaysBonus: number;
    activityScore: number;
    spamPenalty: number;
  };
  riskScore: number;
  activityLevel: number;
  recommendations: string[];
}

export type NetworkMode = 'mainnet' | 'testnet' | 'demo';

export interface AppMode {
  mode: NetworkMode;
  connected: boolean;
  walletAddress?: string;
}

export interface ModeImpact {
  mode: NetworkMode;
  label: string;
  labelAr: string;
  description: string;
  descriptionAr: string;
  reputationImpact: 'full' | 'partial' | 'none';
  impactPercentage: number;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const MODE_IMPACTS: Record<NetworkMode, ModeImpact> = {
  mainnet: {
    mode: 'mainnet',
    label: 'Mainnet',
    labelAr: 'الشبكة الرئيسية',
    description: 'Full reputation impact from real blockchain data',
    descriptionAr: 'تأثير كامل على السمعة من بيانات البلوكشين الحقيقية',
    reputationImpact: 'full',
    impactPercentage: 100,
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)'
  },
  testnet: {
    mode: 'testnet',
    label: 'Testnet',
    labelAr: 'شبكة الاختبار',
    description: 'Partial reputation impact (supplementary data)',
    descriptionAr: 'تأثير جزئي على السمعة (بيانات مكملة)',
    reputationImpact: 'partial',
    impactPercentage: 25,
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)'
  },
  demo: {
    mode: 'demo',
    label: 'Demo',
    labelAr: 'وضع التجربة',
    description: 'No reputation impact (simulation only)',
    descriptionAr: 'بدون تأثير على السمعة (محاكاة فقط)',
    reputationImpact: 'none',
    impactPercentage: 0,
    color: '#6B7280',
    bgColor: 'rgba(107, 114, 128, 0.15)',
    borderColor: 'rgba(107, 114, 128, 0.4)'
  }
};

export type Language = 'ar' | 'fr' | 'zh' | 'en';
