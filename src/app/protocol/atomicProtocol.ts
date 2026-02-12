/**
 * Atomic Protocol - Unified Reputation System
 * Single Source of Truth for all Reputation Calculations
 * Binds to user identity: username + id + walletAddress
 * 
 * Version: 1.0
 * Name: ATOMIC PROTOCOL
 */

import { AtomicReputationResult, AtomicTrustLevel } from './atomicScoring';

/**
 * User Identity - Unique binding for reputation data
 */
export interface AtomicUserIdentity {
  username: string;
  uid: string;  // pi user id
  walletAddress: string;
  createdAt: Date;
}

/**
 * Unified Reputation Data - Stored in database
 */
export interface AtomicReputationData {
  userIdentity: AtomicUserIdentity;
  score: number;
  trustLevel: AtomicTrustLevel;
  rawScore: number;
  adjustedScore: number;
  
  // Component Scores
  walletAgeScore: number;
  interactionScore: number;
  piNetworkScore: number;
  piDexScore: number;
  stakingScore: number;
  
  // Penalties
  externalTxPenalty: number;
  suspiciousPenalty: number;
  
  // Metadata
  lastUpdated: Date;
  updateReason?: string;
  previousScore?: number;
}

/**
 * Atomic Protocol Configuration
 */
export const ATOMIC_PROTOCOL_CONFIG = {
  NAME: 'ATOMIC PROTOCOL',
  VERSION: '1.0',
  
  // Score Ranges  
  SCORE_MIN: 0,
  SCORE_MAX: 10000,
  
  // Component Weights (sum = 100%)
  WEIGHTS: {
    WALLET_AGE: 0.15,      // 15%
    INTERACTION: 0.20,      // 20%
    PI_NETWORK: 0.25,       // 25%
    PI_DEX: 0.15,           // 15%
    STAKING: 0.25,          // 25%
  },
  
  // Penalty Multipliers
  PENALTIES: {
    EXTERNAL_TX_MIN: 50,
    EXTERNAL_TX_MAX: 500,
    SUSPICIOUS_MIN: 100,
    SUSPICIOUS_MAX: 1000,
  },
  
  // Trust Level Thresholds
  TRUST_THRESHOLDS: {
    'Novice': { min: 0, max: 10_000 },
    'Explorer': { min: 10_001, max: 50_000 },
    'Contributor': { min: 50_001, max: 150_000 },
    'Verified': { min: 150_001, max: 300_000 },
    'Trusted': { min: 300_001, max: 450_000 },
    'Ambassador': { min: 450_001, max: 600_000 },
    'Elite': { min: 600_001, max: 750_000 },
    'Sentinel': { min: 750_001, max: 850_000 },
    'Oracle': { min: 850_001, max: 950_000 },
    'Atomic Legend': { min: 950_001, max: 1_000_000 },
  },
};

/**
 * Database Keys for Atomic Protocol Data
 */
export const ATOMIC_DB_KEYS = {
  // User identity binding
  getIdentityKey: (username: string, uid: string, walletAddress: string) => 
    `atomic:identity:${username}:${uid}:${walletAddress}`,
  
  // Reputation data
  getReputationKey: (username: string, uid: string, walletAddress: string) =>
    `atomic:reputation:${username}:${uid}:${walletAddress}`,
  
  // Score history
  getHistoryKey: (username: string, uid: string, walletAddress: string) =>
    `atomic:history:${username}:${uid}:${walletAddress}`,
  
  // User index (for lookups)
  getUserIndexKey: (username: string) =>
    `atomic:users:${username}`,
  
  // Composite score
  getCompositeScoreKey: (username: string, uid: string, walletAddress: string) =>
    `atomic:composite:${username}:${uid}:${walletAddress}`,
};

/**
 * Convert AtomicReputationResult to Unified Reputation Data
 */
export function convertToUnifiedReputationData(
  result: AtomicReputationResult,
  userIdentity: AtomicUserIdentity
): AtomicReputationData {
  return {
    userIdentity,
    score: result.adjustedScore,
    trustLevel: result.trustLevel,
    rawScore: result.rawScore,
    adjustedScore: result.adjustedScore,
    
    walletAgeScore: result.walletAge.totalPoints,
    interactionScore: result.interaction.totalPoints,
    piNetworkScore: result.piNetwork.totalPoints,
    piDexScore: result.piDex.totalPoints,
    stakingScore: result.staking.totalPoints,
    
    externalTxPenalty: result.externalPenalty.totalPenalty,
    suspiciousPenalty: result.suspiciousPenalty.totalPenalty,
    
    lastUpdated: new Date(),
    updateReason: 'Atomic Protocol calculation',
  };
}

/**
 * Validate user identity
 */
export function validateUserIdentity(identity: AtomicUserIdentity): boolean {
  return !!(
    identity.username &&
    identity.uid &&
    identity.walletAddress &&
    identity.username.length > 0 &&
    identity.uid.length > 0 &&
    identity.walletAddress.length > 0
  );
}

/**
 * Format Atomic Protocol score for display
 */
export function formatAtomicScore(score: number): string {
  return score.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/**
 * Get trust level color
 */
export const ATOMIC_TRUST_LEVEL_COLORS: Record<AtomicTrustLevel, string> = {
  'Novice': '#9CA3AF',           // gray-400
  'Explorer': '#F97316',         // orange-500
  'Contributor': '#EAB308',      // yellow-500
  'Verified': '#22C55E',         // green-500
  'Trusted': '#3B82F6',          // blue-500
  'Ambassador': '#8B5CF6',       // purple-500
  'Elite': '#EC4899',            // pink-500
  'Sentinel': '#A855F7',         // purple-500
  'Oracle': '#FBBF24',           // amber-400
  'Atomic Legend': '#00D9FF',    // cyan
};

/**
 * Get trust level icon name
 */
export function getTrustLevelIcon(trustLevel: AtomicTrustLevel): string {
  const iconMap: Record<AtomicTrustLevel, string> = {
    'Novice': 'Shield',
    'Explorer': 'Compass',
    'Contributor': 'Users',
    'Verified': 'CheckCircle',
    'Trusted': 'ShieldCheck',
    'Ambassador': 'Star',
    'Elite': 'Zap',
    'Sentinel': 'Shield',
    'Oracle': 'Eye',
    'Atomic Legend': 'Crown',
  };
  return iconMap[trustLevel] || 'Shield';
}
