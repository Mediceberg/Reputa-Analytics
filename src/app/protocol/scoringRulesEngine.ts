/**
 * Central Scoring Rules Engine
 * Single source of truth for all scoring calculations
 * All scoring logic flows through this module
 */

export interface ScoringRule {
  id: string;
  category: 'activity' | 'continuity' | 'trust' | 'network' | 'penalty';
  name: string;
  description: string;
  basePoints: number;
  maxPoints?: number;
  cooldown?: number;
  multiplier?: number;
}

export interface ScoreEvent {
  ruleId: string;
  points: number;
  timestamp: string;
  walletAddress?: string;
  userId: string;
  metadata?: Record<string, unknown>;
}

export interface CumulativeScore {
  totalScore: number;
  activityScore: number;
  continuityScore: number;
  trustScore: number;
  networkScore: number;
  penalties: number;
  level: number;
  trustRank: string;
  progressPercent: number;
  pointsToNext: number;
  lastCalculated: string;
}

export const SCORING_RULES: Record<string, ScoringRule> = {
  DAILY_CHECKIN: {
    id: 'DAILY_CHECKIN',
    category: 'activity',
    name: 'Daily Check-in',
    description: 'Daily login and check-in reward',
    basePoints: 3,
    cooldown: 24 * 60 * 60 * 1000,
  },
  AD_BONUS: {
    id: 'AD_BONUS',
    category: 'activity',
    name: 'Ad Bonus',
    description: 'Bonus for watching promotional content',
    basePoints: 5,
    cooldown: 24 * 60 * 60 * 1000,
  },
  STREAK_7_DAY: {
    id: 'STREAK_7_DAY',
    category: 'continuity',
    name: '7-Day Streak Bonus',
    description: 'Bonus for 7 consecutive days of check-ins',
    basePoints: 10,
  },
  STREAK_30_DAY: {
    id: 'STREAK_30_DAY',
    category: 'continuity',
    name: '30-Day Streak Bonus',
    description: 'Bonus for 30 consecutive days of check-ins',
    basePoints: 50,
  },
  WALLET_AGE_MONTH: {
    id: 'WALLET_AGE_MONTH',
    category: 'trust',
    name: 'Wallet Age (Monthly)',
    description: 'Points for each month of wallet activity',
    basePoints: 2,
    maxPoints: 24,
  },
  WALLET_AGE_6_MONTHS: {
    id: 'WALLET_AGE_6_MONTHS',
    category: 'trust',
    name: 'Wallet Age (6 Months)',
    description: 'Bonus for 6 months without dormancy',
    basePoints: 5,
  },
  INTERNAL_TX: {
    id: 'INTERNAL_TX',
    category: 'network',
    name: 'Internal Transaction',
    description: 'Points for Pi internal transactions',
    basePoints: 1,
    maxPoints: 100,
  },
  APP_INTERACTION: {
    id: 'APP_INTERACTION',
    category: 'network',
    name: 'App Interaction',
    description: 'Points for interacting with Pi apps',
    basePoints: 3,
    maxPoints: 150,
  },
  SDK_PAYMENT: {
    id: 'SDK_PAYMENT',
    category: 'network',
    name: 'SDK Payment',
    description: 'Points for SDK payment transactions',
    basePoints: 5,
    maxPoints: 250,
  },
  UNIQUE_CONTACTS: {
    id: 'UNIQUE_CONTACTS',
    category: 'trust',
    name: 'Unique Contacts',
    description: 'Points for unique wallet interactions',
    basePoints: 1,
    maxPoints: 50,
  },
  REPORT_VIEW: {
    id: 'REPORT_VIEW',
    category: 'activity',
    name: 'Report View',
    description: 'Points for viewing reputation reports',
    basePoints: 1,
    maxPoints: 30,
  },
  TOOL_USAGE: {
    id: 'TOOL_USAGE',
    category: 'activity',
    name: 'Tool Usage',
    description: 'Points for using analysis tools',
    basePoints: 2,
    maxPoints: 50,
  },
  INACTIVITY_PENALTY: {
    id: 'INACTIVITY_PENALTY',
    category: 'penalty',
    name: 'Inactivity Penalty',
    description: 'Penalty for 90+ days of inactivity',
    basePoints: -5,
  },
  MAINNET_MULTIPLIER: {
    id: 'MAINNET_MULTIPLIER',
    category: 'network',
    name: 'Mainnet Multiplier',
    description: 'Mainnet transactions count 100%',
    basePoints: 0,
    multiplier: 1.0,
  },
  TESTNET_MULTIPLIER: {
    id: 'TESTNET_MULTIPLIER',
    category: 'network',
    name: 'Testnet Multiplier',
    description: 'Testnet transactions count 25%',
    basePoints: 0,
    multiplier: 0.25,
  },
};

export const LEVEL_THRESHOLDS = [
  { level: 1, minScore: 0, maxScore: 100, rank: 'Very Low Trust' },
  { level: 2, minScore: 100, maxScore: 500, rank: 'Low Trust' },
  { level: 3, minScore: 500, maxScore: 1500, rank: 'Medium' },
  { level: 4, minScore: 1500, maxScore: 3500, rank: 'Active' },
  { level: 5, minScore: 3500, maxScore: 6000, rank: 'Trusted' },
  { level: 6, minScore: 6000, maxScore: 8500, rank: 'Pioneer+' },
  { level: 7, minScore: 8500, maxScore: 10000, rank: 'Elite' },
];

export const BACKEND_SCORE_CAP = 10000;

export function calculatePointsForRule(
  ruleId: string,
  count: number = 1,
  networkMode: 'mainnet' | 'testnet' = 'mainnet'
): number {
  const rule = SCORING_RULES[ruleId];
  if (!rule) return 0;

  let points = rule.basePoints * count;
  
  if (rule.maxPoints && points > rule.maxPoints) {
    points = rule.maxPoints;
  }

  if (rule.category === 'network' && networkMode === 'testnet') {
    points = Math.floor(points * (SCORING_RULES.TESTNET_MULTIPLIER.multiplier || 0.25));
  }

  return points;
}

export function calculateLevelFromScore(totalScore: number): {
  level: number;
  rank: string;
  progressPercent: number;
  pointsToNext: number;
  currentThreshold: typeof LEVEL_THRESHOLDS[0];
} {
  const cappedScore = Math.min(totalScore, BACKEND_SCORE_CAP);
  
  let currentThreshold = LEVEL_THRESHOLDS[0];
  for (const threshold of LEVEL_THRESHOLDS) {
    if (cappedScore >= threshold.minScore && cappedScore < threshold.maxScore) {
      currentThreshold = threshold;
      break;
    }
    if (cappedScore >= threshold.maxScore) {
      currentThreshold = threshold;
    }
  }

  const levelRange = currentThreshold.maxScore - currentThreshold.minScore;
  const pointsInLevel = cappedScore - currentThreshold.minScore;
  const progressPercent = Math.min(100, Math.round((pointsInLevel / levelRange) * 100));

  const nextLevel = LEVEL_THRESHOLDS.find(t => t.level === currentThreshold.level + 1);
  const pointsToNext = nextLevel ? Math.max(0, nextLevel.minScore - cappedScore) : 0;

  return {
    level: currentThreshold.level,
    rank: currentThreshold.rank,
    progressPercent,
    pointsToNext,
    currentThreshold,
  };
}

export function calculateCumulativeScore(events: ScoreEvent[]): CumulativeScore {
  let activityScore = 0;
  let continuityScore = 0;
  let trustScore = 0;
  let networkScore = 0;
  let penalties = 0;

  for (const event of events) {
    const rule = SCORING_RULES[event.ruleId];
    if (!rule) continue;

    const points = event.points;

    switch (rule.category) {
      case 'activity':
        activityScore += points;
        break;
      case 'continuity':
        continuityScore += points;
        break;
      case 'trust':
        trustScore += points;
        break;
      case 'network':
        networkScore += points;
        break;
      case 'penalty':
        penalties += Math.abs(points);
        break;
    }
  }

  const totalScore = Math.max(0, activityScore + continuityScore + trustScore + networkScore - penalties);
  const levelInfo = calculateLevelFromScore(totalScore);

  return {
    totalScore,
    activityScore,
    continuityScore,
    trustScore,
    networkScore,
    penalties,
    level: levelInfo.level,
    trustRank: levelInfo.rank,
    progressPercent: levelInfo.progressPercent,
    pointsToNext: levelInfo.pointsToNext,
    lastCalculated: new Date().toISOString(),
  };
}

export function createScoreEvent(
  userId: string,
  ruleId: string,
  walletAddress?: string,
  metadata?: Record<string, unknown>,
  networkMode: 'mainnet' | 'testnet' = 'mainnet'
): ScoreEvent {
  const points = calculatePointsForRule(ruleId, 1, networkMode);
  
  return {
    ruleId,
    points,
    timestamp: new Date().toISOString(),
    walletAddress,
    userId,
    metadata,
  };
}

export function canApplyRule(
  ruleId: string,
  lastApplied: string | null
): { canApply: boolean; remainingMs: number; countdown: string } {
  const rule = SCORING_RULES[ruleId];
  if (!rule || !rule.cooldown) {
    return { canApply: true, remainingMs: 0, countdown: '' };
  }

  if (!lastApplied) {
    return { canApply: true, remainingMs: 0, countdown: '' };
  }

  const lastTime = new Date(lastApplied).getTime();
  const now = Date.now();
  const elapsed = now - lastTime;

  if (elapsed >= rule.cooldown) {
    return { canApply: true, remainingMs: 0, countdown: '' };
  }

  const remainingMs = rule.cooldown - elapsed;
  const hours = Math.floor(remainingMs / (1000 * 60 * 60));
  const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

  return {
    canApply: false,
    remainingMs,
    countdown: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
  };
}

export function calculateStreakBonus(currentStreak: number): number {
  let bonus = 0;
  
  if (currentStreak >= 7 && currentStreak % 7 === 0) {
    bonus += SCORING_RULES.STREAK_7_DAY.basePoints;
  }
  
  if (currentStreak >= 30 && currentStreak % 30 === 0) {
    bonus += SCORING_RULES.STREAK_30_DAY.basePoints;
  }
  
  return bonus;
}

export function validateStreak(lastCheckIn: string | null): { isValid: boolean; resetStreak: boolean } {
  if (!lastCheckIn) {
    return { isValid: true, resetStreak: false };
  }

  const lastTime = new Date(lastCheckIn).getTime();
  const now = Date.now();
  const hoursSince = (now - lastTime) / (1000 * 60 * 60);

  if (hoursSince >= 48) {
    return { isValid: true, resetStreak: true };
  }

  return { isValid: true, resetStreak: false };
}
