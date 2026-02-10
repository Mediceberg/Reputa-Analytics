/**
 * Reputa Protocol v3.0 - Centralized Configuration
 * Single source of truth for all reputation calculation rules
 * 
 * This file contains:
 * - Protocol version management
 * - Level thresholds (20 levels, 0-100000 points)
 * - Scoring rules (check-in, ad bonus, wallet scan, erosion)
 * - Calculation formulas
 * - All parameters for future updates
 */

// ====================
// PROTOCOL METADATA
// ====================

export const PROTOCOL_VERSION = '3.0';
export const PROTOCOL_MAX_LEVEL = 20;
export const PROTOCOL_MAX_POINTS = 100000;

// ====================
// LEVEL THRESHOLDS
// ====================
// 20 levels: 1→20, Points: 0→100000
// Each level spans 5000 points
export const LEVEL_THRESHOLDS: number[] = [
  0,      // Level 1: 0-5000
  5000,   // Level 2
  10000,  // Level 3
  15000,  // Level 4
  20000,  // Level 5
  25000,  // Level 6
  30000,  // Level 7
  35000,  // Level 8
  40000,  // Level 9
  45000,  // Level 10
  50000,  // Level 11
  55000,  // Level 12
  60000,  // Level 13
  65000,  // Level 14
  70000,  // Level 15
  75000,  // Level 16
  80000,  // Level 17
  85000,  // Level 18
  90000,  // Level 19
  95000,  // Level 20
  100000  // Max cap
];

// Level names for display
export const LEVEL_NAMES: Record<number, string> = {
  1: 'Newcomer',
  2: 'Active',
  3: 'Trusted',
  4: 'Engaged',
  5: 'Reliable',
  6: 'Notable',
  7: 'Established',
  8: 'Loyal',
  9: 'Contributor',
  10: 'Pioneer',
  11: 'Expert',
  12: 'Master',
  13: 'Legend',
  14: 'Luminary',
  15: 'Titan',
  16: 'Elite',
  17: 'Sage',
  18: 'Oracle',
  19: 'Visionary',
  20: 'Supreme'
};

// ====================
// SCORING RULES
// ====================

export const SCORING_RULES = {
  // Daily Check-in Rules
  DAILY_CHECKIN: {
    basePoints: 10,
    streakBonus3: 5,        // Additional 5 points for 3+ day streak
    streakBonus7: 10,       // Additional 10 points for 7+ day streak
    streakBonus14: 15,      // Additional 15 points for 14+ day streak
    streakBonus30: 25,      // Additional 25 points for 30+ day streak
    cooldownHours: 24,      // Must wait 24 hours for next check-in
  },

  // Ad Bonus Rules
  AD_BONUS: {
    basePoints: 5,
    maxPerDay: 3,           // Max 3 ad bonuses per day
    dailyCap: 15,          // Max 15 points per day from ads
  },

  // Wallet Scan Rules (60% mainnet + 20% testnet component)
  WALLET_SCAN: {
    interval: 15,           // Minutes between scans
    mainnetWeight: 0.6,     // 60% weight
    testnetWeight: 0.2,     // 20% weight
    newTransaction: 50,     // Points per new transaction
    balanceIncrease: 0.01,  // Points per 1 Pi increase
    stakingBonus: 5,        // Points per 100 Pi staked
    accountAgeBonus: 1,     // Points per 30 days of age
  },

  // App Engagement (20% of total score, combined with wallet 80%)
  // These are component scores that combine with wallet data
  APP_ENGAGEMENT: {
    checkInComponent: 0.10,  // Check-in contribution
    adBonusComponent: 0.05,  // Ad bonus contribution
    taskComponent: 0.05,     // Task completion contribution
  },

  // Inactivity Erosion
  EROSION: {
    weeklyPenalty: 10,       // 10 points per week of inactivity
    activeDaysThreshold: 3,  // More than 3 days = not inactive
    maxErosionPerWeek: 50,   // Cap erosion at 50 points/week
  },

  // Age Bonus (account tenure)
  AGE_BONUS: {
    perMonth: 50,            // 50 points per month of account age
    maxBonus: 5000,          // Cap at 5000 points
    monthsToMaxBonus: 100,   // Reach max at 100 months (8.3 years)
  },

  // Referral System
  REFERRAL: {
    pointsPerValidReferral: 500,  // Points awarded per successful referral
    bonusAt5Referrals: 250,       // Bonus when reaching 5 referrals
    bonusAt10Referrals: 500,      // Bonus when reaching 10 referrals
  }
};

// ====================
// FUTURE TASKS (MISSIONS)
// ====================

export { FUTURE_TASKS_CONFIG } from '../../src/app/protocol/futureTasks';

// ====================
// CALCULATION UTILITIES
// ====================

/**
 * Calculate reputation level from total points
 */
export function calculateLevelFromPoints(totalPoints: number): number {
  let level = 20;  // Start from max level
  for (let i = level; i >= 1; i--) {
    if (totalPoints >= LEVEL_THRESHOLDS[i - 1]) {
      return i;
    }
  }
  return 1;
}

/**
 * Get minimum points needed for a specific level
 */
export function getMinPointsForLevel(level: number): number {
  if (level < 1 || level > PROTOCOL_MAX_LEVEL) return 0;
  return LEVEL_THRESHOLDS[level - 1];
}

/**
 * Get maximum points possible for a specific level
 */
export function getMaxPointsForLevel(level: number): number {
  if (level < 1 || level > PROTOCOL_MAX_LEVEL) return PROTOCOL_MAX_POINTS;
  return LEVEL_THRESHOLDS[level];
}

/**
 * Get points progress for a level (0-100%)
 */
export function getLevelProgress(totalPoints: number): {
  currentLevel: number;
  nextLevel: number;
  currentLevelMin: number;
  currentLevelMax: number;
  pointsInLevel: number;
  pointsNeededForNext: number;
  percentProgress: number;
} {
  const currentLevel = calculateLevelFromPoints(totalPoints);
  const nextLevel = currentLevel === PROTOCOL_MAX_LEVEL ? PROTOCOL_MAX_LEVEL : currentLevel + 1;
  
  const currentLevelMin = LEVEL_THRESHOLDS[currentLevel - 1];
  const currentLevelMax = LEVEL_THRESHOLDS[currentLevel];
  
  const pointsInLevel = totalPoints - currentLevelMin;
  const pointsNeededForNext = currentLevelMax - totalPoints;
  const percentProgress = ((totalPoints - currentLevelMin) / (currentLevelMax - currentLevelMin)) * 100;

  return {
    currentLevel,
    nextLevel,
    currentLevelMin,
    currentLevelMax,
    pointsInLevel,
    pointsNeededForNext,
    percentProgress: Math.min(100, Math.max(0, percentProgress))
  };
}

/**
 * Calculate wallet reputation score (60% mainnet + 20% testnet)
 * Note: This is a component of the total score, not the total itself
 */
export function calculateWalletComponent(mainnetPoints: number, testnetPoints: number): number {
  return Math.round(
    mainnetPoints * SCORING_RULES.WALLET_SCAN.mainnetWeight +
    testnetPoints * SCORING_RULES.WALLET_SCAN.testnetWeight
  );
}

/**
 * Calculate total reputation score
 * Formula: (Wallet Component * 0.8) + (App Points * 0.2)
 * But both are capped at PROTOCOL_MAX_POINTS
 */
export function calculateTotalScore(
  walletMainnetPoints: number,
  walletTestnetPoints: number,
  appPoints: number
): number {
  const walletComponent = calculateWalletComponent(walletMainnetPoints, walletTestnetPoints);
  const totalScore = Math.round(
    walletComponent * 0.8 + appPoints * 0.2
  );
  return Math.min(PROTOCOL_MAX_POINTS, Math.max(0, totalScore));
}

/**
 * Apply inactivity erosion to points
 */
export function applyInactivityErosion(
  points: number,
  lastActivityDate: Date | null,
  currentDate: Date = new Date()
): { erodedPoints: number; erosionAmount: number } {
  if (!lastActivityDate) {
    return { erodedPoints: points, erosionAmount: 0 };
  }

  const daysSinceActivity = Math.floor(
    (currentDate.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  const weeksSinceActivity = Math.floor(daysSinceActivity / 7);
  
  if (weeksSinceActivity <= 0) {
    return { erodedPoints: points, erosionAmount: 0 };
  }

  const erosionAmount = Math.min(
    weeksSinceActivity * SCORING_RULES.EROSION.weeklyPenalty,
    SCORING_RULES.EROSION.maxErosionPerWeek
  );

  const erodedPoints = Math.max(0, points - erosionAmount);
  return { erodedPoints, erosionAmount };
}

/**
 * Apply check-in streak bonus
 */
export function getCheckInBonus(streak: number, basePoints: number = SCORING_RULES.DAILY_CHECKIN.basePoints): number {
  let bonus = basePoints;
  
  if (streak >= 30) {
    bonus += SCORING_RULES.DAILY_CHECKIN.streakBonus30;
  } else if (streak >= 14) {
    bonus += SCORING_RULES.DAILY_CHECKIN.streakBonus14;
  } else if (streak >= 7) {
    bonus += SCORING_RULES.DAILY_CHECKIN.streakBonus7;
  } else if (streak >= 3) {
    bonus += SCORING_RULES.DAILY_CHECKIN.streakBonus3;
  }
  
  return bonus;
}

/**
 * Validate that a value respects protocol limits
 */
export function validatePointsWithinProtocol(points: number): number {
  return Math.min(PROTOCOL_MAX_POINTS, Math.max(0, points));
}

/**
 * Get a summary of protocol configuration
 */
export function getProtocolSummary() {
  return {
    version: PROTOCOL_VERSION,
    maxLevel: PROTOCOL_MAX_LEVEL,
    maxPoints: PROTOCOL_MAX_POINTS,
    levelThresholds: LEVEL_THRESHOLDS,
    levelNames: LEVEL_NAMES,
    scoringRules: SCORING_RULES,
    description: `Reputa Protocol v${PROTOCOL_VERSION}: ${PROTOCOL_MAX_LEVEL} levels (0-${PROTOCOL_MAX_POINTS} points), 80% wallet + 20% app engagement`
  };
}

export default {
  PROTOCOL_VERSION,
  PROTOCOL_MAX_LEVEL,
  PROTOCOL_MAX_POINTS,
  LEVEL_THRESHOLDS,
  LEVEL_NAMES,
  SCORING_RULES,
  calculateLevelFromPoints,
  getMinPointsForLevel,
  getMaxPointsForLevel,
  getLevelProgress,
  calculateWalletComponent,
  calculateTotalScore,
  applyInactivityErosion,
  getCheckInBonus,
  validatePointsWithinProtocol,
  getProtocolSummary,
};
