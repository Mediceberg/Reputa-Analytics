import {
  TOTAL_SCORE_CAP,
  CATEGORY_CAPS,
  calculateGenesisScore,
  type GenesisInput,
  type GenesisResult,
} from './scoringRules';

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface ReputationAtomicInput {
  Mainnet_Points: number;
  Testnet_Points: number;
  App_Engagement_Points: number;
}

export interface ReputationAtomicResult {
  Mainnet_Points: number;
  Testnet_Points: number;
  App_Engagement_Points: number;
  totalScore: number;
}

/** Full input including Genesis data and Claim state */
export interface FullReputationInput {
  genesis: GenesisInput;
  recurring: {
    dailyCheckins: number;
    adBonuses: number;
    streakBonuses: number;
    reportViews: number;
    toolUsage: number;
  };
  app: {
    internalTxCount: number;
    appInteractions: number;
    sdkPayments: number;
    uniqueContacts: number;
    walletAgeMonths: number;
  };
  claimed: boolean;
}

export interface FullReputationResult {
  genesis: GenesisResult;
  recurringScore: number;
  cappedRecurring: number;
  appScore: number;
  cappedApp: number;
  rawTotal: number;
  claimedTotal: number;
  totalScore: number;
  claimed: boolean;
  breakdown: {
    genesisPercent: number;
    recurringPercent: number;
    appPercent: number;
  };
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SCORE_CAP = TOTAL_SCORE_CAP; // 1,000,000

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sanitize(points: number): number {
  if (!Number.isFinite(points)) return 0;
  return Math.max(0, Math.round(points));
}

// ─── Legacy function (backward-compatible) ───────────────────────────────────

export function calculateReputationAtomic(input: ReputationAtomicInput): ReputationAtomicResult {
  const Mainnet_Points = sanitize(input.Mainnet_Points);
  const Testnet_Points = sanitize(input.Testnet_Points);
  const App_Engagement_Points = sanitize(input.App_Engagement_Points);

  const totalScore = Math.min(
    SCORE_CAP,
    Mainnet_Points + Testnet_Points + App_Engagement_Points,
  );

  return {
    Mainnet_Points,
    Testnet_Points,
    App_Engagement_Points,
    totalScore,
  };
}

// ─── New: Full Reputation Calculator with 50/20/30 + Claim ───────────────────

/**
 * 🚀 SINGLE SOURCE OF TRUTH - حساب السمعة الذرية الكامل
 * 
 * قاعدة 50/20/30 الرسمية:
 *   Genesis  (50%) — نقاط التأسيس (مرة واحدة) - حد أقصى 500,000
 *   Recurring(20%) — نشاط البلوكشين المتكرر - حد أقصى 200,000  
 *   App      (30%) — تفاعل التطبيق اليومي - حد أقصى 300,000
 * 
 * الحد الأقصى الإجمالي: 1,000,000 نقطة
 * النقاط لا تُضاف للرصيد النهائي إلا بعد عملية Claim.
 */
export function calculateAtomicReputationScore(input: FullReputationInput): FullReputationResult {
  // 1. Genesis (cap 500,000)
  const genesis = calculateGenesisScore(input.genesis);

  // 2. Recurring (cap 200,000)
  const rawRecurring =
    sanitize(input.recurring.dailyCheckins) +
    sanitize(input.recurring.adBonuses) +
    sanitize(input.recurring.streakBonuses) +
    sanitize(input.recurring.reportViews) +
    sanitize(input.recurring.toolUsage);
  const cappedRecurring = Math.min(rawRecurring, CATEGORY_CAPS.RECURRING);

  // 3. App (cap 300,000)
  const rawApp =
    sanitize(input.app.internalTxCount) +
    sanitize(input.app.appInteractions) +
    sanitize(input.app.sdkPayments) +
    sanitize(input.app.uniqueContacts) +
    sanitize(input.app.walletAgeMonths);
  const cappedApp = Math.min(rawApp, CATEGORY_CAPS.APP);

  // Raw total before global cap
  const rawTotal = genesis.cappedGenesis + cappedRecurring + cappedApp;
  const claimedTotal = Math.min(rawTotal, SCORE_CAP);

  // النقاط لا تُضاف إلا بعد Claim
  const totalScore = input.claimed ? claimedTotal : 0;

  // Breakdown percentages (of capped total)
  const safeDiv = claimedTotal > 0 ? claimedTotal : 1;

  return {
    genesis,
    recurringScore: rawRecurring,
    cappedRecurring,
    appScore: rawApp,
    cappedApp,
    rawTotal,
    claimedTotal,
    totalScore,
    claimed: input.claimed,
    breakdown: {
      genesisPercent: Math.round((genesis.cappedGenesis / safeDiv) * 100),
      recurringPercent: Math.round((cappedRecurring / safeDiv) * 100),
      appPercent: Math.round((cappedApp / safeDiv) * 100),
    },
  };
}

export function getReputationAtomicScoreCap(): number {
  return SCORE_CAP;
}

/**
 * 🔥 Live Execution Engine Integration - ربط المعالج الآلي
 * 
 * حساب النقاط الذرية بناءً على البيانات المستخرجة من البلوكشين
 */
export interface LiveAtomicInput {
  // Genesis Data (50% - يحدث مرة واحدة)
  genesisData?: {
    accountAgeDays: number;
    totalHistoricalTransactions: number;
    totalHistoricalVolume: number;
    firstTransactionDate: string;
    uniqueCounterparts: number;
  };
  
  // Recurring Data (20% - النشاط المتكرر)
  recurringData: {
    mainnetTransactions: number;     // معاملات الشبكة الرئيسية
    testnetTransactions: number;     // معاملات الشبكة التجريبية 
    dailyCheckins: number;           // تسجيلات دخول يومية
    streakDays: number;              // أيام متتالية
  };
  
  // App Interaction Data (30% - تفاعل التطبيق)
  appData: {
    reportsGenerated: number;        // تقارير تم إنشاؤها
    toolsUsed: number;               // أدوات تم استخدامها
    referralsConfirmed: number;      // إحالات مؤكدة
    weeklyClaimsCompleted: number;   // مطالبات أسبوعية
    adBonusesWatched: number;       // إعلانات تمت مشاهدتها
  };
  
  // System State
  isGenesisClaimed: boolean;       // هل تم المطالبة بنقاط التأسيس
  hasPendingRewards: boolean;      // هل توجد مكافآت معلقة
}

export interface LiveAtomicResult {
  // Core Score Breakdown
  genesisScore: number;            // نقاط التأسيس (0-500,000)
  recurringScore: number;          // نقاط النشاط المتكرر (0-200,000)
  appScore: number;                // نقاط التطبيق (0-300,000)
  
  // Calculated Totals
  rawTotalScore: number;           // المجموع قبل تطبيق الحد الأقصى
  cappedTotalScore: number;        // المجموع بعد تطبيق حد 1M
  claimableTotalScore: number;     // النقاط القابلة للمطالبة
  
  // Distribution Percentages (of capped total)
  distribution: {
    genesisPercent: number;
    recurringPercent: number;
    appPercent: number;
  };
  
  // Trust Level & Ranking
  trustLevel: string;
  levelProgress: number;           // تقدم المستوى الحالي (0-100)
  rankPosition: number;            // الترتيب التقديري
  
  // System Flags
  requiresGenesisScan: boolean;    // يحتاج فحص تأسيسي
  hasPendingClaims: boolean;       // يوجد مطالبات معلقة
  
  // Metadata
  lastCalculatedAt: string;
  calculationSource: 'live_scan' | 'cached' | 'estimated';
}

/**
 * 🎯 المعالج الرئيسي للسمعة الذرية - Single Source of Truth
 */
export function calculateLiveAtomicReputation(input: LiveAtomicInput): LiveAtomicResult {
  const now = new Date().toISOString();
  
  // 1️⃣ Genesis Score (50% - مرة واحدة)
  let genesisScore = 0;
  if (input.genesisData && input.isGenesisClaimed) {
    const ageScore = Math.min(125000, input.genesisData.accountAgeDays * 100);
    const activityScore = Math.min(175000, input.genesisData.totalHistoricalTransactions * 15);
    const volumeScore = Math.min(200000, Math.log10(Math.max(1, input.genesisData.totalHistoricalVolume)) * 20000);
    
    genesisScore = Math.min(500000, ageScore + activityScore + volumeScore);
  }
  
  // 2️⃣ Recurring Score (20% - نشاط متكرر)
  const mainnetPoints = input.recurringData.mainnetTransactions * 40;  // 40 نقطة لكل معاملة رئيسية
  const testnetPoints = input.recurringData.testnetTransactions * 8;   // 8 نقاط لكل معاملة تجريبية
  const checkinPoints = input.recurringData.dailyCheckins * 15;        // 15 نقطة لكل تسجيل دخول
  const streakBonus = Math.min(20000, input.recurringData.streakDays * 100); // مكافأة الاستمرارية
  
  const rawRecurringScore = mainnetPoints + testnetPoints + checkinPoints + streakBonus;
  const recurringScore = Math.min(200000, rawRecurringScore);
  
  // 3️⃣ App Score (30% - تفاعل التطبيق)
  const reportPoints = input.appData.reportsGenerated * 25;           // 25 نقطة لكل تقرير
  const toolPoints = input.appData.toolsUsed * 20;                   // 20 نقطة لكل أداة
  const referralPoints = input.appData.referralsConfirmed * 50;       // 50 نقطة لكل إحالة
  const claimPoints = input.appData.weeklyClaimsCompleted * 30;       // 30 نقطة لكل مطالبة
  const adPoints = input.appData.adBonusesWatched * 10;               // 10 نقاط لكل إعلان
  
  const rawAppScore = reportPoints + toolPoints + referralPoints + claimPoints + adPoints;
  const appScore = Math.min(300000, rawAppScore);
  
  // 4️⃣ إجمالي النقاط وتطبيق الحد الأقصى
  const rawTotalScore = genesisScore + recurringScore + appScore;
  const cappedTotalScore = Math.min(1000000, rawTotalScore);
  const claimableTotalScore = input.hasPendingRewards ? cappedTotalScore : 0;
  
  // 5️⃣ حساب النسب المئوية
  const safeTotal = cappedTotalScore > 0 ? cappedTotalScore : 1;
  const distribution = {
    genesisPercent: Math.round((genesisScore / safeTotal) * 100),
    recurringPercent: Math.round((recurringScore / safeTotal) * 100),
    appPercent: Math.round((appScore / safeTotal) * 100)
  };
  
  // 6️⃣ تحديد مستوى الثقة والتقدم
  const trustLevel = determineTrustLevel(cappedTotalScore);
  const levelProgress = calculateLevelProgress(cappedTotalScore);
  const rankPosition = estimateRankPosition(cappedTotalScore);
  
  return {
    genesisScore,
    recurringScore,
    appScore,
    rawTotalScore,
    cappedTotalScore,
    claimableTotalScore,
    distribution,
    trustLevel,
    levelProgress,
    rankPosition,
    requiresGenesisScan: !input.isGenesisClaimed,
    hasPendingClaims: input.hasPendingRewards,
    lastCalculatedAt: now,
    calculationSource: input.genesisData ? 'live_scan' : 'estimated'
  };
}

/**
 * 🏆 تحديد مستوى الثقة الذري
 */
function determineTrustLevel(score: number): string {
  if (score >= 950_001) return 'Atomic Legend';
  if (score >= 850_001) return 'Oracle';
  if (score >= 750_001) return 'Sentinel';
  if (score >= 600_001) return 'Elite';
  if (score >= 450_001) return 'Ambassador';
  if (score >= 300_001) return 'Trusted';
  if (score >= 150_001) return 'Verified';
  if (score >= 50_001) return 'Contributor';
  if (score >= 10_001) return 'Explorer';
  return 'Novice';
}

/**
 * 📊 حساب تقدم المستوى الحالي
 */
function calculateLevelProgress(score: number): number {
  const thresholds = [0, 10_001, 50_001, 150_001, 300_001, 450_001, 600_001, 750_001, 850_001, 950_001];
  
  for (let i = 0; i < thresholds.length - 1; i++) {
    if (score >= thresholds[i] && score < thresholds[i + 1]) {
      const currentLevelMin = thresholds[i];
      const nextLevelMin = thresholds[i + 1];
      const progress = ((score - currentLevelMin) / (nextLevelMin - currentLevelMin)) * 100;
      return Math.min(100, Math.max(0, progress));
    }
  }
  
  return 100; // المستوى الأقصى
}

/**
 * 🎯 تقدير الترتيب العام
 */
function estimateRankPosition(score: number): number {
  // تقدير بناء على توزيع النقاط المتوقع
  if (score >= 800_000) return Math.floor(Math.random() * 100) + 1;      // Top 100
  if (score >= 600_000) return Math.floor(Math.random() * 500) + 101;    // Top 500
  if (score >= 400_000) return Math.floor(Math.random() * 2000) + 501;   // Top 2K
  if (score >= 200_000) return Math.floor(Math.random() * 5000) + 2001;  // Top 5K
  if (score >= 100_000) return Math.floor(Math.random() * 20000) + 5001; // Top 20K
  return Math.floor(Math.random() * 100000) + 20001; // Below Top 20K
}

// Backward compatibility - keep existing function names
export const calculateFullReputation = calculateAtomicReputationScore;
