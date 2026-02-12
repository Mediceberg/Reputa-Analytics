/**
 * Reputa Protocol - Scoring Rules Constants
 * جداول النقاط الرسمية لبروتوكول السمعة
 * 
 * التوزيع:
 *   Genesis  (50%) = 500,000 max
 *   Recurring(20%) = 200,000 max
 *   App      (30%) = 300,000 max
 *   ─────────────────────────────
 *   Total          = 1,000,000 max
 * 
 * النقاط لا تُضاف للرصيد النهائي إلا بعد عملية Claim.
 */

// ─── Global Cap ──────────────────────────────────────────────────────────────

export const TOTAL_SCORE_CAP = 1_000_000;

export const CATEGORY_CAPS = {
  GENESIS: 500_000,   // 50%
  RECURRING: 200_000, // 20%
  APP: 300_000,       // 30%
} as const;

// ─── 1. Genesis Category (One-time bonuses — first scan) ─────────────────────

/** 🎁 Genesis Scan Bonus — يتم احتسابه مرة واحدة فقط عند أول تحليل كامل للمحفظة */
export const GENESIS_SCAN_BONUS = {
  WALLET_LINK:       5_000,   // ربط المحفظة
  FIRST_ANALYSIS:    1_000,   // أول تحليل ناجح
  MAINNET_LINK:      5_000,   // ربط Mainnet
  TESTNET_LINK:      3_000,   // ربط Testnet
} as const;

/** عمر المحفظة — مرة واحدة عند أول فحص */
export const GENESIS_WALLET_AGE_BONUS: { minMonths: number; points: number }[] = [
  { minMonths: 48, points: 100_000 }, // > 4 سنوات
  { minMonths: 36, points: 70_000 },  // > 3 سنوات
  { minMonths: 24, points: 50_000 },  // > 2 سنوات
  { minMonths: 12, points: 20_000 },  // > 1 سنة
  { minMonths: 6,  points: 10_000 },  // > 6 أشهر
];

/** 3️⃣ Lifetime Activity Boost — تحليل جميع المعاملات تاريخياً */
export const GENESIS_LIFETIME_ACTIVITY_BONUS: { minTx: number; points: number }[] = [
  { minTx: 1000, points: 100_000 }, // 1000+ معاملة
  { minTx: 500,  points: 50_000 },  // 500 معاملة
  { minTx: 200,  points: 30_000 },  // 200 معاملة
  { minTx: 50,   points: 10_000 },  // 50 معاملة
  { minTx: 1,    points: 5_000 },   // أول معاملة مكتشفة
];

/** Bonus حجم التداول التاريخي */
export const GENESIS_VOLUME_BONUS: { minVolume: number; points: number }[] = [
  { minVolume: 1_000_000, points: 80_000 }, // 1,000,000 π
  { minVolume: 100_000,   points: 50_000 }, // 100,000 π
  { minVolume: 10_000,    points: 30_000 }, // 10,000 π
  { minVolume: 5_000,     points: 20_000 }, // 5,000 π
  { minVolume: 1_000,     points: 10_000 }, // 1,000 π
  { minVolume: 100,       points: 5_000 },  // 100 π
];

/** Bonus اكتشاف النظام البيئي */
export const GENESIS_ECOSYSTEM_BONUS = {
  PER_TOKEN_DISCOVERED:  300,   // لكل توكن مكتشف
  PER_DAPP_DISCOVERED:   300,   // لكل Dapp مكتشف
  STAKING_DISCOVERED:    3_000, // اكتشاف Stake
} as const;

// ─── 2. Recurring Category (20%) — Blockchain Rewards ────────────────────────
//     يتم تشغيله كل مرة يتم فيها: فتح التطبيق / Refresh / Scan جديد
//     النظام يحتفظ بـ lastScanSnapshot ويحسب الفرق:
//     New Activity = Blockchain Data – Last Snapshot
//     ثم يمنح مكافآت فقط على النشاط الجديد → pendingRewards → Claim

/** ⚡ Weekly Blockchain Rewards — مكافآت على النشاط الجديد فقط (فرق Snapshot) */
export const WEEKLY_BLOCKCHAIN_REWARDS = {
  NEW_TRANSACTION:       20,    // معاملة جديدة (إرسال)
  NEW_RECEIVE:           20,    // استقبال جديد
  DEX_TRADE:             50,    // تداول Dex
  VOLUME_ABOVE_50:       1_000, // حجم تداول > 50π
  FIRST_NEW_TOKEN:       500,   // أول توكن جديد
  ECOSYSTEM_DISCOVERY:   { min: 50, max: 200 }, // اكتشاف توكن / DApp / Stake
} as const;

/** Monthly Wallet Growth Rewards — نمو شهري */
export const MONTHLY_WALLET_REWARDS = {
  BALANCE_INCREASE:      500,   // زيادة الرصيد
  CONTINUOUS_ACTIVITY:   800,   // نشاط شهري مستمر
  NEW_DAPP_USAGE:        500,   // استخدام Dapp جديد
  VOLUME_GROWTH:         500,   // نمو حجم التداول
} as const;

/** Legacy recurring rules — kept for backward compatibility with scoringRulesEngine */
export const RECURRING_RULES = {
  DAILY_CHECKIN:     { points: 3,  cooldownMs: 24 * 60 * 60 * 1000 },
  AD_BONUS:          { points: 5,  cooldownMs: 24 * 60 * 60 * 1000 },
  STREAK_7_DAY:      { points: 10  },
  STREAK_30_DAY:     { points: 50  },
  REPORT_VIEW:       { points: 1,  maxTotal: 30  },
  TOOL_USAGE:        { points: 2,  maxTotal: 50  },
} as const;

// ─── 3. App Interaction Category (30%) — نشاط المستخدم اليومي والاجتماعي ─────

export const APP_INTERACTION_REWARDS = {
  DAILY_CHECKIN:         30,     // تسجيل دخول يومي (Daily Check-in)
  DAILY_CHECKIN_WITH_AD: 50,     // تسجيل دخول يومي مع إعلان
  STREAK_PER_DAY:        4,      // سلسلة أيام متتالية (مضروبة في عدد الأيام)
  REFERRAL_NEW:          100,    // دعوة صديق جديد
  REFERRAL_ACTIVE:       50,     // صديق نشط شهرياً
  TASK_COMPLETE:         500,    // إتمام مهمة داخل التطبيق
  WEEKLY_CLAIM:          100,    // Claim أسبوعي
  REFERRAL_10_MILESTONE: 500,    // 10 إحالات
} as const;

/** Legacy app rules — kept for backward compatibility */
export const APP_RULES = {
  INTERNAL_TX:       { pointsPer: 1,  maxTotal: 100  },
  APP_INTERACTION:   { pointsPer: 3,  maxTotal: 150  },
  SDK_PAYMENT:       { pointsPer: 5,  maxTotal: 250  },
  UNIQUE_CONTACTS:   { pointsPer: 1,  maxTotal: 50   },
  WALLET_AGE_MONTH:  { pointsPer: 2,  maxTotal: 24   },
} as const;

// ─── Helper: resolve highest matching tier ───────────────────────────────────

/**
 * من جدول تنازلي (مرتب من الأعلى للأقل)، يُرجع أعلى نقاط يستحقها المستخدم.
 * الجداول مرتبة تنازلياً حسب الحد الأدنى.
 */
export function resolveHighestTier<T extends { points: number }>(
  tiers: T[],
  value: number,
  key: keyof T,
): number {
  for (const tier of tiers) {
    if (value >= (tier[key] as number)) {
      return tier.points;
    }
  }
  return 0;
}

// ─── Genesis Score Calculator ────────────────────────────────────────────────

export interface GenesisInput {
  walletLinked: boolean;
  firstAnalysisDone: boolean;
  isMainnet: boolean;
  isTestnet: boolean;
  walletAgeMonths: number;
  lifetimeTxCount: number;
  lifetimeVolumePi: number;
  tokensDiscovered: number;
  dappsDiscovered: number;
  stakingDiscovered: boolean;
}

export interface GenesisResult {
  scanBonus: number;
  walletAgeBonus: number;
  lifetimeActivityBonus: number;
  volumeBonus: number;
  ecosystemBonus: number;
  totalGenesis: number;
  cappedGenesis: number;
  items: { label: string; points: number }[];
}

export function calculateGenesisScore(input: GenesisInput): GenesisResult {
  const items: { label: string; points: number }[] = [];

  // Scan Bonus
  let scanBonus = 0;
  if (input.walletLinked) {
    scanBonus += GENESIS_SCAN_BONUS.WALLET_LINK;
    items.push({ label: 'wallet_link', points: GENESIS_SCAN_BONUS.WALLET_LINK });
  }
  if (input.firstAnalysisDone) {
    scanBonus += GENESIS_SCAN_BONUS.FIRST_ANALYSIS;
    items.push({ label: 'first_analysis', points: GENESIS_SCAN_BONUS.FIRST_ANALYSIS });
  }
  if (input.isMainnet) {
    scanBonus += GENESIS_SCAN_BONUS.MAINNET_LINK;
    items.push({ label: 'mainnet_link', points: GENESIS_SCAN_BONUS.MAINNET_LINK });
  }
  if (input.isTestnet) {
    scanBonus += GENESIS_SCAN_BONUS.TESTNET_LINK;
    items.push({ label: 'testnet_link', points: GENESIS_SCAN_BONUS.TESTNET_LINK });
  }

  // Wallet Age
  const walletAgeBonus = resolveHighestTier(GENESIS_WALLET_AGE_BONUS, input.walletAgeMonths, 'minMonths');
  if (walletAgeBonus > 0) items.push({ label: 'wallet_age', points: walletAgeBonus });

  // Lifetime Activity
  const lifetimeActivityBonus = resolveHighestTier(GENESIS_LIFETIME_ACTIVITY_BONUS, input.lifetimeTxCount, 'minTx');
  if (lifetimeActivityBonus > 0) items.push({ label: 'lifetime_activity', points: lifetimeActivityBonus });

  // Volume
  const volumeBonus = resolveHighestTier(GENESIS_VOLUME_BONUS, input.lifetimeVolumePi, 'minVolume');
  if (volumeBonus > 0) items.push({ label: 'volume', points: volumeBonus });

  // Ecosystem
  let ecosystemBonus = 0;
  const tokenPoints = input.tokensDiscovered * GENESIS_ECOSYSTEM_BONUS.PER_TOKEN_DISCOVERED;
  if (tokenPoints > 0) {
    ecosystemBonus += tokenPoints;
    items.push({ label: 'tokens_discovered', points: tokenPoints });
  }
  const dappPoints = input.dappsDiscovered * GENESIS_ECOSYSTEM_BONUS.PER_DAPP_DISCOVERED;
  if (dappPoints > 0) {
    ecosystemBonus += dappPoints;
    items.push({ label: 'dapps_discovered', points: dappPoints });
  }
  if (input.stakingDiscovered) {
    ecosystemBonus += GENESIS_ECOSYSTEM_BONUS.STAKING_DISCOVERED;
    items.push({ label: 'staking_discovered', points: GENESIS_ECOSYSTEM_BONUS.STAKING_DISCOVERED });
  }

  const totalGenesis = scanBonus + walletAgeBonus + lifetimeActivityBonus + volumeBonus + ecosystemBonus;
  const cappedGenesis = Math.min(totalGenesis, CATEGORY_CAPS.GENESIS);

  return {
    scanBonus,
    walletAgeBonus,
    lifetimeActivityBonus,
    volumeBonus,
    ecosystemBonus,
    totalGenesis,
    cappedGenesis,
    items,
  };
}
