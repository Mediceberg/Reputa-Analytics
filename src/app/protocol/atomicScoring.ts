import { calculateReputationAtomic, getReputationAtomicScoreCap } from './ReputationAtomic';

export type AtomicTrustLevel =
  | 'Very Low Trust'
  | 'Low Trust'
  | 'Medium'
  | 'Active'
  | 'Trusted'
  | 'Pioneer+'
  | 'Elite';

export interface AtomicScoreItem {
  category: string;
  action: string;
  points: number;
  timestamp: Date;
  explanation: string;
}

export interface WalletAgeScore { activeMonths: number; inactivityPenalty: number; totalPoints: number; items: AtomicScoreItem[]; }
export interface InteractionScore { dailyCheckins: number; adBonuses: number; reportViews: number; toolUsage: number; totalPoints: number; items: AtomicScoreItem[]; }
export interface PiNetworkTransactionScore { internalTxCount: number; appInteractions: number; sdkPayments: number; totalPoints: number; items: AtomicScoreItem[]; }
export interface PiDexScore { normalTrades: number; tokenDiversity: number; regularActivity: number; totalPoints: number; items: AtomicScoreItem[]; }
export interface StakingScore { stakingDays: number; tier: 'none' | 'short' | 'medium' | 'long'; totalPoints: number; items: AtomicScoreItem[]; }
export interface ExternalTxPenalty { smallTransfers: number; frequentTransfers: number; suddenExits: number; continuousDrain: number; totalPenalty: number; items: AtomicScoreItem[]; }
export interface SuspiciousBehaviorPenalty { spamActivity: number; farmingBehavior: number; suspiciousLinks: number; totalPenalty: number; items: AtomicScoreItem[]; }

export interface WalletActivityData {
  accountAgeDays: number;
  lastActivityDate: Date;
  dailyCheckins: number;
  adBonuses: number;
  reportViews: number;
  toolUsage: number;
  internalTxCount: number;
  appInteractions: number;
  sdkPayments: number;
  normalTrades: number;
  uniqueTokens: number;
  regularActivityWeeks: number;
  stakingDays: number;
  smallExternalTransfers: number;
  frequentExternalTransfers: number;
  suddenExits: number;
  continuousDrain: number;
  spamCount: number;
  farmingInstances: number;
  suspiciousLinks: number;
  txDates?: Date[];
}

export interface AtomicReputationResult {
  rawScore: number;
  adjustedScore: number;
  trustLevel: AtomicTrustLevel;
  walletAge: WalletAgeScore;
  interaction: InteractionScore;
  piNetwork: PiNetworkTransactionScore;
  piDex: PiDexScore;
  staking: StakingScore;
  externalPenalty: ExternalTxPenalty;
  suspiciousPenalty: SuspiciousBehaviorPenalty;
  allItems: AtomicScoreItem[];
  lastUpdated: Date;
}

const BACKEND_SCORE_CAP = getReputationAtomicScoreCap();

const TRUST_LEVEL_THRESHOLDS: { min: number; max: number; level: AtomicTrustLevel; index: number }[] = [
  { min: -Infinity, max: 0, level: 'Very Low Trust', index: 0 },
  { min: 0, max: BACKEND_SCORE_CAP * 0.1, level: 'Low Trust', index: 1 },
  { min: BACKEND_SCORE_CAP * 0.1, max: BACKEND_SCORE_CAP * 0.25, level: 'Medium', index: 2 },
  { min: BACKEND_SCORE_CAP * 0.25, max: BACKEND_SCORE_CAP * 0.45, level: 'Active', index: 3 },
  { min: BACKEND_SCORE_CAP * 0.45, max: BACKEND_SCORE_CAP * 0.65, level: 'Trusted', index: 4 },
  { min: BACKEND_SCORE_CAP * 0.65, max: BACKEND_SCORE_CAP * 0.85, level: 'Pioneer+', index: 5 },
  { min: BACKEND_SCORE_CAP * 0.85, max: Infinity, level: 'Elite', index: 6 },
];

export function getBackendScoreCap(): number {
  return BACKEND_SCORE_CAP;
}

export function getLevelProgress(rawScore: number) {
  const backendScore = Math.min(rawScore, BACKEND_SCORE_CAP);
  let currentThreshold = TRUST_LEVEL_THRESHOLDS[1];

  for (const threshold of TRUST_LEVEL_THRESHOLDS) {
    if (backendScore >= threshold.min && backendScore < threshold.max) {
      currentThreshold = threshold;
      break;
    }
  }

  const nextThreshold = TRUST_LEVEL_THRESHOLDS[currentThreshold.index + 1] || null;
  const levelRange = currentThreshold.max === Infinity ? BACKEND_SCORE_CAP - currentThreshold.min : currentThreshold.max - currentThreshold.min;
  const pointsInLevel = backendScore - currentThreshold.min;

  return {
    currentLevel: currentThreshold.level,
    levelIndex: currentThreshold.index,
    progressInLevel: Math.min(100, (pointsInLevel / levelRange) * 100),
    pointsToNextLevel: nextThreshold ? Math.max(0, nextThreshold.min - backendScore) : 0,
    nextLevel: nextThreshold?.level || null,
    displayScore: rawScore,
    backendScore,
  };
}

function getTrustLevel(score: number): AtomicTrustLevel {
  return getLevelProgress(score).currentLevel;
}

export function calculateAtomicReputation(data: WalletActivityData, now: Date = new Date()): AtomicReputationResult {
  const protocol = calculateReputationAtomic({
    Mainnet_Points: data.internalTxCount,
    Testnet_Points: data.appInteractions + data.sdkPayments + data.normalTrades,
    App_Engagement_Points: data.dailyCheckins + data.adBonuses + data.reportViews + data.toolUsage,
  });

  const allItems: AtomicScoreItem[] = [
    { category: 'mainnet', action: 'mainnet_points', points: protocol.Mainnet_Points, timestamp: now, explanation: 'Mainnet_Points' },
    { category: 'testnet', action: 'testnet_points', points: protocol.Testnet_Points, timestamp: now, explanation: 'Testnet_Points' },
    { category: 'app_engagement', action: 'app_engagement_points', points: protocol.App_Engagement_Points, timestamp: now, explanation: 'App_Engagement_Points' },
  ];

  const trustLevel = getTrustLevel(protocol.totalScore);

  return {
    rawScore: protocol.totalScore,
    adjustedScore: protocol.totalScore,
    trustLevel,
    walletAge: { activeMonths: 0, inactivityPenalty: 0, totalPoints: 0, items: [] },
    interaction: {
      dailyCheckins: data.dailyCheckins,
      adBonuses: data.adBonuses,
      reportViews: data.reportViews,
      toolUsage: data.toolUsage,
      totalPoints: protocol.App_Engagement_Points,
      items: [allItems[2]],
    },
    piNetwork: {
      internalTxCount: data.internalTxCount,
      appInteractions: data.appInteractions,
      sdkPayments: data.sdkPayments,
      totalPoints: protocol.Mainnet_Points + protocol.Testnet_Points,
      items: [allItems[0], allItems[1]],
    },
    piDex: { normalTrades: data.normalTrades, tokenDiversity: data.uniqueTokens, regularActivity: data.regularActivityWeeks, totalPoints: 0, items: [] },
    staking: { stakingDays: data.stakingDays, tier: 'none', totalPoints: 0, items: [] },
    externalPenalty: { smallTransfers: 0, frequentTransfers: 0, suddenExits: 0, continuousDrain: 0, totalPenalty: 0, items: [] },
    suspiciousPenalty: { spamActivity: 0, farmingBehavior: 0, suspiciousLinks: 0, totalPenalty: 0, items: [] },
    allItems,
    lastUpdated: now,
  };
}

export function generateDemoActivityData(): WalletActivityData {
  return {
    accountAgeDays: 180,
    lastActivityDate: new Date(),
    dailyCheckins: 20,
    adBonuses: 10,
    reportViews: 15,
    toolUsage: 12,
    internalTxCount: 450,
    appInteractions: 90,
    sdkPayments: 40,
    normalTrades: 25,
    uniqueTokens: 3,
    regularActivityWeeks: 10,
    stakingDays: 0,
    smallExternalTransfers: 0,
    frequentExternalTransfers: 0,
    suddenExits: 0,
    continuousDrain: 0,
    spamCount: 0,
    farmingInstances: 0,
    suspiciousLinks: 0,
  };
}

export const LEVEL_NAMES: AtomicTrustLevel[] = ['Very Low Trust', 'Low Trust', 'Medium', 'Active', 'Trusted', 'Pioneer+', 'Elite'];
export type TrustLevel = 'Low' | 'Medium' | 'High' | 'Elite';

export function mapAtomicToTrustLevel(atomicLevel: AtomicTrustLevel): TrustLevel {
  if (atomicLevel === 'Elite') return 'Elite';
  if (atomicLevel === 'Pioneer+' || atomicLevel === 'Trusted') return 'High';
  if (atomicLevel === 'Active' || atomicLevel === 'Medium') return 'Medium';
  return 'Low';
}

export const TRUST_LEVEL_COLORS: Record<AtomicTrustLevel, { bg: string; text: string; border: string }> = {
  'Very Low Trust': { bg: 'rgba(239, 68, 68, 0.2)', text: '#EF4444', border: 'rgba(239, 68, 68, 0.5)' },
  'Low Trust': { bg: 'rgba(249, 115, 22, 0.2)', text: '#F97316', border: 'rgba(249, 115, 22, 0.5)' },
  Medium: { bg: 'rgba(234, 179, 8, 0.2)', text: '#EAB308', border: 'rgba(234, 179, 8, 0.5)' },
  Active: { bg: 'rgba(34, 197, 94, 0.2)', text: '#22C55E', border: 'rgba(34, 197, 94, 0.5)' },
  Trusted: { bg: 'rgba(59, 130, 246, 0.2)', text: '#3B82F6', border: 'rgba(59, 130, 246, 0.5)' },
  'Pioneer+': { bg: 'rgba(139, 92, 246, 0.2)', text: '#8B5CF6', border: 'rgba(139, 92, 246, 0.5)' },
  Elite: { bg: 'rgba(0, 217, 255, 0.2)', text: '#00D9FF', border: 'rgba(0, 217, 255, 0.5)' },
};

export const CATEGORY_LABELS: Record<string, { en: string; ar: string }> = {
  mainnet: { en: 'Mainnet Points', ar: 'نقاط Mainnet' },
  testnet: { en: 'Testnet Points', ar: 'نقاط Testnet' },
  app_engagement: { en: 'App Engagement Points', ar: 'نقاط تفاعل التطبيق' },
};
