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
 * حساب السمعة الكامل مع الفئات الثلاث:
 *   Genesis  (50%) — مرة واحدة عند أول Scan
 *   Recurring(20%) — نشاط يومي/دوري
 *   App      (30%) — تفاعل بلوكشين
 * 
 * النقاط لا تُضاف للرصيد النهائي إلا بعد عملية Claim.
 */
export function calculateFullReputation(input: FullReputationInput): FullReputationResult {
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
