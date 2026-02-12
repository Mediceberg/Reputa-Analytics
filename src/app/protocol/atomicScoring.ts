import { calculateReputationAtomic, getReputationAtomicScoreCap } from './ReputationAtomic';
import {
  GENESIS_WALLET_AGE_BONUS,
  GENESIS_LIFETIME_ACTIVITY_BONUS,
  GENESIS_SCAN_BONUS,
  GENESIS_ECOSYSTEM_BONUS,
  WEEKLY_BLOCKCHAIN_REWARDS,
  APP_INTERACTION_REWARDS,
  CATEGORY_CAPS,
  TOTAL_SCORE_CAP,
  resolveHighestTier,
} from './scoringRules';

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

export interface AtomicScoreItem {
  category: string;
  action: string;
  points: number;
  decayFactor?: number;
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
  // Separated network data
  mainnetTxCount?: number;
  mainnetVolume?: number;
  testnetTxCount?: number;
  testnetVolume?: number;
  uniqueContacts?: number;
  totalVolume?: number;
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
  // Separated silo scores for display
  mainnetScore: number;
  testnetScore: number;
  appEngageScore: number;
  // Weighted final score
  weightedTotal: number;
  // Breakdown for UI
  breakdown: {
    mainnetRaw: number;
    mainnetPercent: number;
    testnetRaw: number;
    testnetPercent: number;
    appRaw: number;
    appPercent: number;
  };
}

const BACKEND_SCORE_CAP = getReputationAtomicScoreCap();

/**
 * ═══════════════════════════════════════════════════════════════
 * 🎯 PERCENTAGE-BASED AGGREGATION SYSTEM
 * ═══════════════════════════════════════════════════════════════
 * 
 * Mainnet Weight  = 50% of 1,000,000 = 500,000 max
 * App Engage Weight = 30% of 1,000,000 = 300,000 max
 * Testnet Weight  = 20% of 1,000,000 = 200,000 max
 * 
 * Each silo calculates a performance percentage (0-100%),
 * then multiplied by its weight to produce the final score.
 * ═══════════════════════════════════════════════════════════════
 */

const WEIGHT_MAINNET = 0.50;
const WEIGHT_APP     = 0.30;
const WEIGHT_TESTNET = 0.20;

// Internal caps for performance calculation within each silo
const MAINNET_PERF_CAP  = 500_000;  // max raw points possible in mainnet silo
const TESTNET_PERF_CAP  = 200_000;  // max raw points possible in testnet silo
const APP_PERF_CAP      = 300_000;  // max raw points possible in app silo

/** النظام العشري الذري — 10 مستويات من 0 إلى 1,000,000 */
const TRUST_LEVEL_THRESHOLDS: { min: number; max: number; level: AtomicTrustLevel; index: number }[] = [
  { min: 0,       max: 10_001,  level: 'Novice',        index: 0 },
  { min: 10_001,  max: 50_001,  level: 'Explorer',      index: 1 },
  { min: 50_001,  max: 150_001, level: 'Contributor',   index: 2 },
  { min: 150_001, max: 300_001, level: 'Verified',      index: 3 },
  { min: 300_001, max: 450_001, level: 'Trusted',       index: 4 },
  { min: 450_001, max: 600_001, level: 'Ambassador',    index: 5 },
  { min: 600_001, max: 750_001, level: 'Elite',         index: 6 },
  { min: 750_001, max: 850_001, level: 'Sentinel',      index: 7 },
  { min: 850_001, max: 950_001, level: 'Oracle',        index: 8 },
  { min: 950_001, max: Infinity, level: 'Atomic Legend', index: 9 },
];

export function getBackendScoreCap(): number {
  return BACKEND_SCORE_CAP;
}

export function getLevelProgress(rawScore: number) {
  const backendScore = Math.min(rawScore, BACKEND_SCORE_CAP);
  let currentThreshold = TRUST_LEVEL_THRESHOLDS[0];

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

/**
 * 🎯 MAIN CALCULATION — Percentage-Based Weighted Aggregation
 * 
 * Mainnet (50%): Wallet age + historical tx + balance + staking + DEX
 * Testnet (20%): Testnet transactions + testnet interactions
 * App     (30%): Daily check-ins + ad bonuses + report views + tool usage + streaks
 */
export function calculateAtomicReputation(data: WalletActivityData, now: Date = new Date()): AtomicReputationResult {

  // ═══════════════════════════════════════════════════════════════════
  // 1️⃣ MAINNET SILO (Weight: 50%) — Real blockchain data only
  // ═══════════════════════════════════════════════════════════════════
  
  const ageMonths = Math.floor(data.accountAgeDays / 30);
  const walletAgeBonus = resolveHighestTier(GENESIS_WALLET_AGE_BONUS, ageMonths, 'minMonths');
  
  const mainnetTxCount = data.mainnetTxCount ?? data.internalTxCount;
  const mainnetVolume = data.mainnetVolume ?? data.totalVolume ?? 0;
  const lifetimeActivityBonus = resolveHighestTier(GENESIS_LIFETIME_ACTIVITY_BONUS, mainnetTxCount, 'minTx');
  
  const scanBonus = GENESIS_SCAN_BONUS.WALLET_LINK + GENESIS_SCAN_BONUS.FIRST_ANALYSIS + GENESIS_SCAN_BONUS.MAINNET_LINK;
  
  const mainnetTxPoints = mainnetTxCount * WEEKLY_BLOCKCHAIN_REWARDS.NEW_TRANSACTION;
  const dexPoints = data.normalTrades * WEEKLY_BLOCKCHAIN_REWARDS.DEX_TRADE;
  
  let stakingPoints = 0;
  let stakingTier: 'none' | 'short' | 'medium' | 'long' = 'none';
  if (data.stakingDays > 365) { stakingPoints = 50_000; stakingTier = 'long'; }
  else if (data.stakingDays > 90) { stakingPoints = 20_000; stakingTier = 'medium'; }
  else if (data.stakingDays > 0) { stakingPoints = 5_000; stakingTier = 'short'; }
  
  const ecosystemBonus = (data.uniqueTokens || 0) * GENESIS_ECOSYSTEM_BONUS.PER_TOKEN_DISCOVERED;
  
  const rawMainnetScore = walletAgeBonus + lifetimeActivityBonus + scanBonus + mainnetTxPoints + dexPoints + stakingPoints + ecosystemBonus;
  const cappedMainnetScore = Math.min(MAINNET_PERF_CAP, rawMainnetScore);
  
  // Performance percentage for mainnet
  const mainnetPerformance = Math.min(1, cappedMainnetScore / MAINNET_PERF_CAP);

  // ═══════════════════════════════════════════════════════════════════
  // 2️⃣ TESTNET SILO (Weight: 20%) — Testnet blockchain data only
  // ═══════════════════════════════════════════════════════════════════
  
  const testnetTxCount = data.testnetTxCount ?? data.appInteractions ?? 0;
  const testnetTxPoints = testnetTxCount * WEEKLY_BLOCKCHAIN_REWARDS.NEW_TRANSACTION;
  const testnetSdkPoints = data.sdkPayments * WEEKLY_BLOCKCHAIN_REWARDS.DEX_TRADE;
  const testnetWeeklyActivity = data.regularActivityWeeks * 500;
  const testnetLinkBonus = GENESIS_SCAN_BONUS.TESTNET_LINK;
  
  const rawTestnetScore = testnetTxPoints + testnetSdkPoints + testnetWeeklyActivity + testnetLinkBonus;
  const cappedTestnetScore = Math.min(TESTNET_PERF_CAP, rawTestnetScore);
  
  // Performance percentage for testnet
  const testnetPerformance = Math.min(1, cappedTestnetScore / TESTNET_PERF_CAP);

  // ═══════════════════════════════════════════════════════════════════
  // 3️⃣ APP ENGAGE SILO (Weight: 30%) — App interaction only
  // ═══════════════════════════════════════════════════════════════════
  
  const checkinPoints = data.dailyCheckins * APP_INTERACTION_REWARDS.DAILY_CHECKIN;
  const adPoints = data.adBonuses * (APP_INTERACTION_REWARDS.DAILY_CHECKIN_WITH_AD - APP_INTERACTION_REWARDS.DAILY_CHECKIN);
  const reportPoints = data.reportViews * 25;
  const toolPoints = data.toolUsage * 20;
  const streakBonus = data.regularActivityWeeks * APP_INTERACTION_REWARDS.STREAK_PER_DAY * 7;
  
  const rawAppScore = checkinPoints + adPoints + reportPoints + toolPoints + streakBonus;
  const cappedAppScore = Math.min(APP_PERF_CAP, rawAppScore);
  
  // Performance percentage for app
  const appPerformance = Math.min(1, cappedAppScore / APP_PERF_CAP);

  // ═══════════════════════════════════════════════════════════════════
  // 📊 WEIGHTED TOTAL — Performance × Weight × 1,000,000
  // ═══════════════════════════════════════════════════════════════════
  
  const mainnetWeighted = Math.round(mainnetPerformance * WEIGHT_MAINNET * TOTAL_SCORE_CAP);
  const testnetWeighted = Math.round(testnetPerformance * WEIGHT_TESTNET * TOTAL_SCORE_CAP);
  const appWeighted     = Math.round(appPerformance * WEIGHT_APP * TOTAL_SCORE_CAP);
  
  const weightedTotal = Math.min(TOTAL_SCORE_CAP, mainnetWeighted + testnetWeighted + appWeighted);
  
  // Penalties
  const penaltyTotal = 
    (data.smallExternalTransfers * 2) + 
    (data.frequentExternalTransfers * 5) + 
    (data.suddenExits * 10) +
    (data.spamCount * 3) +
    (data.farmingInstances * 5);
  
  const finalScore = Math.max(0, weightedTotal - penaltyTotal);
  
  const trustLevel = getTrustLevel(finalScore);
  
  // Build detailed items
  const allItems: AtomicScoreItem[] = [
    { category: 'mainnet', action: 'wallet_age', points: walletAgeBonus, timestamp: now, explanation: `Wallet age: ${ageMonths} months` },
    { category: 'mainnet', action: 'lifetime_activity', points: lifetimeActivityBonus, timestamp: now, explanation: `Lifetime transactions: ${mainnetTxCount}` },
    { category: 'mainnet', action: 'scan_bonus', points: scanBonus, timestamp: now, explanation: 'Wallet link + first analysis' },
    { category: 'mainnet', action: 'mainnet_tx', points: mainnetTxPoints, timestamp: now, explanation: `Mainnet transactions: ${mainnetTxCount}` },
    { category: 'mainnet', action: 'dex_trades', points: dexPoints, timestamp: now, explanation: `DEX trades: ${data.normalTrades}` },
    { category: 'mainnet', action: 'staking', points: stakingPoints, timestamp: now, explanation: `Staking: ${data.stakingDays} days` },
    { category: 'testnet', action: 'testnet_tx', points: testnetTxPoints, timestamp: now, explanation: `Testnet transactions: ${testnetTxCount}` },
    { category: 'testnet', action: 'sdk_payments', points: testnetSdkPoints, timestamp: now, explanation: `SDK payments: ${data.sdkPayments}` },
    { category: 'testnet', action: 'weekly_activity', points: testnetWeeklyActivity, timestamp: now, explanation: `Active weeks: ${data.regularActivityWeeks}` },
    { category: 'app_engagement', action: 'daily_checkins', points: checkinPoints, timestamp: now, explanation: `Check-ins: ${data.dailyCheckins}` },
    { category: 'app_engagement', action: 'ad_bonuses', points: adPoints, timestamp: now, explanation: `Ad bonuses: ${data.adBonuses}` },
    { category: 'app_engagement', action: 'reports', points: reportPoints, timestamp: now, explanation: `Reports viewed: ${data.reportViews}` },
    { category: 'app_engagement', action: 'tools', points: toolPoints, timestamp: now, explanation: `Tools used: ${data.toolUsage}` },
  ];

  // Breakdown percentages
  const safeTotal = finalScore > 0 ? finalScore : 1;

  return {
    rawScore: finalScore,
    adjustedScore: finalScore,
    trustLevel,
    mainnetScore: mainnetWeighted,
    testnetScore: testnetWeighted,
    appEngageScore: appWeighted,
    weightedTotal: finalScore,
    breakdown: {
      mainnetRaw: cappedMainnetScore,
      mainnetPercent: Math.round(mainnetPerformance * 100),
      testnetRaw: cappedTestnetScore,
      testnetPercent: Math.round(testnetPerformance * 100),
      appRaw: cappedAppScore,
      appPercent: Math.round(appPerformance * 100),
    },
    walletAge: { 
      activeMonths: ageMonths, 
      inactivityPenalty: 0, 
      totalPoints: walletAgeBonus, 
      items: allItems.filter(i => i.action === 'wallet_age'),
    },
    interaction: {
      dailyCheckins: data.dailyCheckins,
      adBonuses: data.adBonuses,
      reportViews: data.reportViews,
      toolUsage: data.toolUsage,
      totalPoints: cappedAppScore,
      items: allItems.filter(i => i.category === 'app_engagement'),
    },
    piNetwork: {
      internalTxCount: mainnetTxCount,
      appInteractions: testnetTxCount,
      sdkPayments: data.sdkPayments,
      totalPoints: cappedMainnetScore + cappedTestnetScore,
      items: allItems.filter(i => i.category === 'mainnet' || i.category === 'testnet'),
    },
    piDex: { 
      normalTrades: data.normalTrades, 
      tokenDiversity: data.uniqueTokens, 
      regularActivity: data.regularActivityWeeks, 
      totalPoints: dexPoints + ecosystemBonus, 
      items: allItems.filter(i => i.action === 'dex_trades'),
    },
    staking: { 
      stakingDays: data.stakingDays, 
      tier: stakingTier, 
      totalPoints: stakingPoints, 
      items: allItems.filter(i => i.action === 'staking'),
    },
    externalPenalty: { 
      smallTransfers: data.smallExternalTransfers, 
      frequentTransfers: data.frequentExternalTransfers, 
      suddenExits: data.suddenExits, 
      continuousDrain: data.continuousDrain, 
      totalPenalty: penaltyTotal, 
      items: [],
    },
    suspiciousPenalty: { 
      spamActivity: data.spamCount, 
      farmingBehavior: data.farmingInstances, 
      suspiciousLinks: data.suspiciousLinks, 
      totalPenalty: (data.spamCount * 3) + (data.farmingInstances * 5), 
      items: [],
    },
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
    mainnetTxCount: 450,
    mainnetVolume: 5000,
    testnetTxCount: 90,
    testnetVolume: 200,
    uniqueContacts: 30,
    totalVolume: 5200,
  };
}

export const LEVEL_NAMES: AtomicTrustLevel[] = [
  'Novice', 'Explorer', 'Contributor', 'Verified', 'Trusted',
  'Ambassador', 'Elite', 'Sentinel', 'Oracle', 'Atomic Legend',
];
export type TrustLevel = 'Low' | 'Medium' | 'High' | 'Elite';

export function mapAtomicToTrustLevel(atomicLevel: AtomicTrustLevel): TrustLevel {
  if (atomicLevel === 'Atomic Legend' || atomicLevel === 'Oracle' || atomicLevel === 'Sentinel') return 'Elite';
  if (atomicLevel === 'Elite' || atomicLevel === 'Ambassador' || atomicLevel === 'Trusted') return 'High';
  if (atomicLevel === 'Verified' || atomicLevel === 'Contributor') return 'Medium';
  return 'Low';
}

export const TRUST_LEVEL_COLORS: Record<AtomicTrustLevel, { bg: string; text: string; border: string }> = {
  Novice:          { bg: 'rgba(156, 163, 175, 0.15)', text: '#9CA3AF', border: 'rgba(156, 163, 175, 0.4)' },
  Explorer:        { bg: 'rgba(249, 115, 22, 0.15)',  text: '#F97316', border: 'rgba(249, 115, 22, 0.4)' },
  Contributor:     { bg: 'rgba(234, 179, 8, 0.15)',   text: '#EAB308', border: 'rgba(234, 179, 8, 0.4)' },
  Verified:        { bg: 'rgba(34, 197, 94, 0.15)',   text: '#22C55E', border: 'rgba(34, 197, 94, 0.4)' },
  Trusted:         { bg: 'rgba(59, 130, 246, 0.15)',  text: '#3B82F6', border: 'rgba(59, 130, 246, 0.4)' },
  Ambassador:      { bg: 'rgba(139, 92, 246, 0.15)',  text: '#8B5CF6', border: 'rgba(139, 92, 246, 0.4)' },
  Elite:           { bg: 'rgba(236, 72, 153, 0.15)',  text: '#EC4899', border: 'rgba(236, 72, 153, 0.4)' },
  Sentinel:        { bg: 'rgba(168, 85, 247, 0.15)',  text: '#A855F7', border: 'rgba(168, 85, 247, 0.4)' },
  Oracle:          { bg: 'rgba(251, 191, 36, 0.2)',   text: '#FBBF24', border: 'rgba(251, 191, 36, 0.5)' },
  'Atomic Legend':  { bg: 'rgba(0, 217, 255, 0.2)',    text: '#00D9FF', border: 'rgba(0, 217, 255, 0.5)' },
};

export const CATEGORY_LABELS: Record<string, { en: string; ar: string }> = {
  mainnet: { en: 'Mainnet Points', ar: 'نقاط Mainnet' },
  testnet: { en: 'Testnet Points', ar: 'نقاط Testnet' },
  app_engagement: { en: 'App Engagement Points', ar: 'نقاط تفاعل التطبيق' },
};
