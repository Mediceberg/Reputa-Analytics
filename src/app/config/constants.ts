/**
 * Application Constants
 */

export const APP_CONFIG = {
  name: 'Reputa Score',
  version: '2.5.0',
  description: 'Advanced Pi Network wallet reputation analyzer',
  developer: {
    name: 'Reputa Analytics',
    email: 'support@reputa-analytics.com'
  }
};

export const PI_CONFIG = {
  network: (import.meta.env.VITE_PI_NETWORK || 'testnet') as 'testnet' | 'mainnet',
  apiKey: import.meta.env.VITE_PI_API_KEY || '',
  sdkVersion: '2.0'
};

export const SCORE_CONFIG = {
  maxWalletAgeScore: 20,
  maxTransactionScore: 40,
  maxStakingScore: 30,
  maxMiningBonus: 10,
  scale: 1000 // Total score scale (0-1000)
};

export const VIP_CONFIG = {
  price: 1, // Pi
  duration: 365, // days
  benefits: [
    'All transactions visible',
    'Detailed score breakdown',
    'Advanced analytics',
    'Mining bonus insights',
    'Export reports',
    'Priority support'
  ]
};

export const TRUST_LEVELS = {
  Elite: { min: 900, color: '#10b981', label: 'Elite' },
  High: { min: 700, color: '#3b82f6', label: 'High' },
  Medium: { min: 500, color: '#eab308', label: 'Medium' },
  Low: { min: 0, color: '#ef4444', label: 'Low' }
} as const;

export const API_ENDPOINTS = {
  approve: '/api/approve',
  complete: '/api/complete',
  getWallet: '/api/get-wallet',
  auth: '/api/auth'
};

export const STORAGE_KEYS = {
  currentUser: 'reputa_current_user',
  vipStatus: (userId: string) => `vip_${userId}`,
  payment: (paymentId: string) => `payment_${paymentId}`,
  report: (walletAddress: string) => `report_${walletAddress}`
};
