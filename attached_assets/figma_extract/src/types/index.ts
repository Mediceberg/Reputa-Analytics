// Core Types
export interface User {
  uid: string;
  username: string;
  accessToken: string;
  walletAddress?: string;
}

export interface WalletData {
  address: string;
  balance: number;
  transactions: Transaction[];
  createdAt: string;
  lastActive: string;
  tokenBalances?: TokenBalance[];
}

export interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  timestamp: string;
  type: 'send' | 'receive' | 'stake' | 'unstake';
  status: 'completed' | 'pending' | 'failed';
  hash?: string;
  isSpam?: boolean;
}

export interface TokenBalance {
  symbol: string;
  name: string;
  balance: number;
  value: number;
  logo?: string;
}

export interface ReputationScore {
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

export interface AppMode {
  mode: 'demo' | 'testnet';
  connected: boolean;
}

export interface Payment {
  amount: number;
  memo: string;
  metadata: {
    userId: string;
    type: 'subscription' | 'tip' | 'payment';
  };
}

export interface PaymentTransaction {
  identifier: string;
  userUid: string;
  amount: number;
  status: 'pending' | 'approved' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  completedAt?: string;
  txid?: string;
}

export type Language = 'ar' | 'fr' | 'zh' | 'en';

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
