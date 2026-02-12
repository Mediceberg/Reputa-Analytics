import { calculateReputationAtomic, getReputationAtomicScoreCap } from './ReputationAtomic';

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
  /**
   * 🎯 بروتوكول حساب السمعة الرسمي - قاعدة 50/20/30
   * 
   * Genesis  (50%) = 500,000 max - نقاط التأسيس (أول فحص)
   * Recurring(20%) = 200,000 max - نشاط البلوكشين المتكرر  
   * App      (30%) = 300,000 max - تفاعل التطبيق اليومي
   * ─────────────────────────────────────────────────────
   * Total          = 1,000,000 max
   */

  // ═══════════════════════════════════════════════════════════════════
  // 1️⃣ GENESIS SCORE (50%) - نقاط التأسيس - تُحسب مرة واحدة
  // ═══════════════════════════════════════════════════════════════════
  
  // عمر المحفظة: حسب الجدول الرسمي
  let walletAgeBonus = 0;
  const ageMonths = Math.floor(data.accountAgeDays / 30);
  if (ageMonths >= 48) walletAgeBonus = 100_000;      // > 4 سنوات
  else if (ageMonths >= 36) walletAgeBonus = 70_000;  // > 3 سنوات
  else if (ageMonths >= 24) walletAgeBonus = 50_000;  // > 2 سنوات
  else if (ageMonths >= 12) walletAgeBonus = 20_000;  // > 1 سنة
  else if (ageMonths >= 6) walletAgeBonus = 10_000;   // > 6 أشهر
  else walletAgeBonus = ageMonths * 500;              // أقل من 6 أشهر
  
  // النشاط التاريخي: حسب عدد المعاملات الإجمالي
  const totalTxCount = data.internalTxCount + data.appInteractions + data.sdkPayments;
  let lifetimeActivityBonus = 0;
  if (totalTxCount >= 1000) lifetimeActivityBonus = 100_000;
  else if (totalTxCount >= 500) lifetimeActivityBonus = 50_000;
  else if (totalTxCount >= 200) lifetimeActivityBonus = 30_000;
  else if (totalTxCount >= 50) lifetimeActivityBonus = 10_000;
  else if (totalTxCount >= 1) lifetimeActivityBonus = 5_000;
  
  // مكافأة ربط المحفظة والتحليل الأول
  const scanBonus = 5_000 + 1_000; // WALLET_LINK + FIRST_ANALYSIS
  
  // مكافأة الشبكة (Mainnet/Testnet)
  const networkBonus = 5_000; // افتراضي للشبكة الحالية
  
  // إجمالي Genesis (حد أقصى 500,000)
  const rawGenesisScore = walletAgeBonus + lifetimeActivityBonus + scanBonus + networkBonus;
  const genesisScore = Math.min(500_000, rawGenesisScore);

  // ═══════════════════════════════════════════════════════════════════
  // 2️⃣ RECURRING SCORE (20%) - نشاط البلوكشين المتكرر
  // ═══════════════════════════════════════════════════════════════════
  
  // معاملات جديدة: 20 نقطة لكل معاملة
  const newTxPoints = (data.internalTxCount * 20) + (data.appInteractions * 20);
  
  // تداول Dex: 50 نقطة لكل تداول
  const dexPoints = data.normalTrades * 50;
  
  // SDK Payments: 100 نقطة لكل دفعة
  const sdkPoints = data.sdkPayments * 100;
  
  // نشاط أسبوعي منتظم: 500 نقطة لكل أسبوع
  const weeklyActivityPoints = data.regularActivityWeeks * 500;
  
  // إجمالي Recurring (حد أقصى 200,000)
  const rawRecurringScore = newTxPoints + dexPoints + sdkPoints + weeklyActivityPoints;
  const recurringScore = Math.min(200_000, rawRecurringScore);

  // ═══════════════════════════════════════════════════════════════════
  // 3️⃣ APP SCORE (30%) - تفاعل التطبيق اليومي
  // ═══════════════════════════════════════════════════════════════════
  
  // تسجيل دخول يومي: 30 نقطة لكل يوم
  const checkinPoints = data.dailyCheckins * 30;
  
  // مشاهدة إعلانات: 20 نقطة لكل إعلان
  const adPoints = data.adBonuses * 20;
  
  // مشاهدة تقارير: 25 نقطة لكل تقرير
  const reportPoints = data.reportViews * 25;
  
  // استخدام أدوات: 20 نقطة لكل استخدام
  const toolPoints = data.toolUsage * 20;
  
  // سلسلة أيام متتالية: 4 نقاط × عدد الأيام
  const streakBonus = data.regularActivityWeeks * 4 * 7; // تقريبي
  
  // إجمالي App (حد أقصى 300,000)
  const rawAppScore = checkinPoints + adPoints + reportPoints + toolPoints + streakBonus;
  const appScore = Math.min(300_000, rawAppScore);

  // ═══════════════════════════════════════════════════════════════════
  // 📊 الإجمالي النهائي
  // ═══════════════════════════════════════════════════════════════════
  
  const protocol = calculateReputationAtomic({
    Mainnet_Points: genesisScore,      // Genesis (50%)
    Testnet_Points: recurringScore,    // Recurring (20%)
    App_Engagement_Points: appScore,   // App (30%)
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
