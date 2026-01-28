/**
 * Atomic Reputation Scoring Engine
 * Dynamic, fair reputation protocol for Pi Network
 * Based on behavior, consistency, and economic activity
 */

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
  decayFactor?: number;
}

export interface WalletAgeScore {
  activeMonths: number;
  inactivityPenalty: number;
  totalPoints: number;
  items: AtomicScoreItem[];
}

export interface InteractionScore {
  dailyCheckins: number;
  adBonuses: number;
  reportViews: number;
  toolUsage: number;
  totalPoints: number;
  items: AtomicScoreItem[];
}

export interface PiNetworkTransactionScore {
  internalTxCount: number;
  appInteractions: number;
  sdkPayments: number;
  totalPoints: number;
  items: AtomicScoreItem[];
}

export interface PiDexScore {
  normalTrades: number;
  tokenDiversity: number;
  regularActivity: number;
  totalPoints: number;
  items: AtomicScoreItem[];
}

export interface StakingScore {
  stakingDays: number;
  tier: 'none' | 'short' | 'medium' | 'long';
  totalPoints: number;
  items: AtomicScoreItem[];
}

export interface ExternalTxPenalty {
  smallTransfers: number;
  frequentTransfers: number;
  suddenExits: number;
  continuousDrain: number;
  totalPenalty: number;
  items: AtomicScoreItem[];
}

export interface SuspiciousBehaviorPenalty {
  spamActivity: number;
  farmingBehavior: number;
  suspiciousLinks: number;
  totalPenalty: number;
  items: AtomicScoreItem[];
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

const BACKEND_SCORE_CAP = 10000;

const TRUST_LEVEL_THRESHOLDS: { min: number; max: number; level: AtomicTrustLevel; index: number }[] = [
  { min: -Infinity, max: 0, level: 'Very Low Trust', index: 0 },
  { min: 0, max: BACKEND_SCORE_CAP * 0.10, level: 'Low Trust', index: 1 },
  { min: BACKEND_SCORE_CAP * 0.10, max: BACKEND_SCORE_CAP * 0.25, level: 'Medium', index: 2 },
  { min: BACKEND_SCORE_CAP * 0.25, max: BACKEND_SCORE_CAP * 0.45, level: 'Active', index: 3 },
  { min: BACKEND_SCORE_CAP * 0.45, max: BACKEND_SCORE_CAP * 0.65, level: 'Trusted', index: 4 },
  { min: BACKEND_SCORE_CAP * 0.65, max: BACKEND_SCORE_CAP * 0.85, level: 'Pioneer+', index: 5 },
  { min: BACKEND_SCORE_CAP * 0.85, max: Infinity, level: 'Elite', index: 6 },
];

export function getBackendScoreCap(): number {
  return BACKEND_SCORE_CAP;
}

export function getLevelProgress(rawScore: number): { 
  currentLevel: AtomicTrustLevel; 
  levelIndex: number;
  progressInLevel: number;
  pointsToNextLevel: number;
  nextLevel: AtomicTrustLevel | null;
  displayScore: number;
  backendScore: number;
} {
  const backendScore = Math.min(rawScore, BACKEND_SCORE_CAP);
  const displayScore = rawScore;
  
  let currentThreshold = TRUST_LEVEL_THRESHOLDS[1];
  for (const threshold of TRUST_LEVEL_THRESHOLDS) {
    if (backendScore >= threshold.min && backendScore < threshold.max) {
      currentThreshold = threshold;
      break;
    }
  }
  
  const nextThresholdIndex = currentThreshold.index + 1;
  const nextThreshold = nextThresholdIndex < TRUST_LEVEL_THRESHOLDS.length 
    ? TRUST_LEVEL_THRESHOLDS[nextThresholdIndex] 
    : null;
  
  const levelRange = currentThreshold.max === Infinity 
    ? BACKEND_SCORE_CAP - currentThreshold.min 
    : currentThreshold.max - currentThreshold.min;
  const pointsInLevel = backendScore - currentThreshold.min;
  const progressInLevel = Math.min(100, (pointsInLevel / levelRange) * 100);
  
  const pointsToNextLevel = nextThreshold 
    ? Math.max(0, nextThreshold.min - backendScore)
    : 0;
  
  return {
    currentLevel: currentThreshold.level,
    levelIndex: currentThreshold.index,
    progressInLevel,
    pointsToNextLevel,
    nextLevel: nextThreshold?.level || null,
    displayScore,
    backendScore,
  };
}

function applyTimeDecay(items: AtomicScoreItem[], now: Date): number {
  return items.reduce((sum, item) => {
    if (item.points <= 0) return sum + item.points;
    
    const ageInDays = (now.getTime() - item.timestamp.getTime()) / (1000 * 60 * 60 * 24);
    let decay = 1;
    
    if (ageInDays > 180) decay = 0.5;
    else if (ageInDays > 90) decay = 0.7;
    else if (ageInDays > 30) decay = 0.9;
    
    item.decayFactor = decay;
    return sum + (item.points * decay);
  }, 0);
}

function getTrustLevel(score: number): AtomicTrustLevel {
  for (const threshold of TRUST_LEVEL_THRESHOLDS) {
    if (score >= threshold.min && score < threshold.max) {
      return threshold.level;
    }
  }
  return 'Medium';
}

export function calculateWalletAgeScore(
  accountAgeDays: number,
  lastActivityDate: Date,
  now: Date = new Date()
): WalletAgeScore {
  const items: AtomicScoreItem[] = [];
  
  const activeMonths = Math.floor(accountAgeDays / 30);
  for (let i = 0; i < activeMonths; i++) {
    items.push({
      category: 'wallet_age',
      action: 'active_month',
      points: 2,
      timestamp: new Date(now.getTime() - (i * 30 * 24 * 60 * 60 * 1000)),
      explanation: `+2 لشهر ${i + 1} من النشاط`,
    });
  }
  
  const sixMonthPeriods = Math.floor(accountAgeDays / 180);
  for (let i = 0; i < sixMonthPeriods; i++) {
    items.push({
      category: 'wallet_age',
      action: 'six_month_active',
      points: 1,
      timestamp: new Date(now.getTime() - (i * 180 * 24 * 60 * 60 * 1000)),
      explanation: `+1 لـ 6 أشهر بدون خمول`,
    });
  }
  
  const daysSinceActivity = (now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24);
  let inactivityPenalty = 0;
  if (daysSinceActivity > 90) {
    inactivityPenalty = -5;
    items.push({
      category: 'wallet_age',
      action: 'inactivity_penalty',
      points: -5,
      timestamp: now,
      explanation: `-5 للخمول أكثر من 90 يوم`,
    });
  }
  
  const totalPoints = items.reduce((sum, item) => sum + item.points, 0);
  
  return {
    activeMonths,
    inactivityPenalty,
    totalPoints,
    items,
  };
}

export function calculateInteractionScore(
  dailyCheckins: number,
  adBonuses: number,
  reportViews: number,
  toolUsage: number,
  now: Date = new Date()
): InteractionScore {
  const items: AtomicScoreItem[] = [];
  
  for (let i = 0; i < dailyCheckins; i++) {
    items.push({
      category: 'interaction',
      action: 'daily_checkin',
      points: 3,
      timestamp: new Date(now.getTime() - (i * 24 * 60 * 60 * 1000)),
      explanation: `+3 للتسجيل اليومي`,
    });
  }
  
  for (let i = 0; i < adBonuses; i++) {
    items.push({
      category: 'interaction',
      action: 'ad_bonus',
      points: 5,
      timestamp: new Date(now.getTime() - (i * 24 * 60 * 60 * 1000)),
      explanation: `+5 للتسجيل + مشاهدة إعلان`,
    });
  }
  
  for (let i = 0; i < reportViews; i++) {
    items.push({
      category: 'interaction',
      action: 'report_view',
      points: 1,
      timestamp: new Date(now.getTime() - (i * 2 * 24 * 60 * 60 * 1000)),
      explanation: `+1 لفتح تقرير`,
    });
  }
  
  for (let i = 0; i < toolUsage; i++) {
    items.push({
      category: 'interaction',
      action: 'tool_usage',
      points: 2,
      timestamp: new Date(now.getTime() - (i * 3 * 24 * 60 * 60 * 1000)),
      explanation: `+2 لاستخدام أداة تحليل`,
    });
  }
  
  const totalPoints = items.reduce((sum, item) => sum + item.points, 0);
  
  return {
    dailyCheckins,
    adBonuses,
    reportViews,
    toolUsage,
    totalPoints,
    items,
  };
}

export function calculatePiNetworkScore(
  internalTxCount: number,
  appInteractions: number,
  sdkPayments: number,
  txDates: Date[] = [],
  now: Date = new Date()
): PiNetworkTransactionScore {
  const items: AtomicScoreItem[] = [];
  
  for (let i = 0; i < internalTxCount; i++) {
    const txDate = txDates[i] || new Date(now.getTime() - (i * 5 * 24 * 60 * 60 * 1000));
    items.push({
      category: 'pi_network',
      action: 'internal_tx',
      points: 2,
      timestamp: txDate,
      explanation: `+2 لمعاملة داخلية`,
    });
  }
  
  for (let i = 0; i < appInteractions; i++) {
    items.push({
      category: 'pi_network',
      action: 'app_interaction',
      points: 5,
      timestamp: new Date(now.getTime() - (i * 7 * 24 * 60 * 60 * 1000)),
      explanation: `+5 للتفاعل مع تطبيق Pi`,
    });
  }
  
  for (let i = 0; i < sdkPayments; i++) {
    items.push({
      category: 'pi_network',
      action: 'sdk_payment',
      points: 6,
      timestamp: new Date(now.getTime() - (i * 14 * 24 * 60 * 60 * 1000)),
      explanation: `+6 لدفع عبر Pi SDK`,
    });
  }
  
  const totalPoints = items.reduce((sum, item) => sum + item.points, 0);
  
  return {
    internalTxCount,
    appInteractions,
    sdkPayments,
    totalPoints,
    items,
  };
}

export function calculatePiDexScore(
  normalTrades: number,
  uniqueTokens: number,
  regularActivityWeeks: number,
  now: Date = new Date()
): PiDexScore {
  const items: AtomicScoreItem[] = [];
  
  for (let i = 0; i < normalTrades; i++) {
    items.push({
      category: 'pi_dex',
      action: 'normal_trade',
      points: 4,
      timestamp: new Date(now.getTime() - (i * 3 * 24 * 60 * 60 * 1000)),
      explanation: `+4 لصفقة طبيعية`,
    });
  }
  
  if (uniqueTokens >= 3) {
    items.push({
      category: 'pi_dex',
      action: 'token_diversity',
      points: 3,
      timestamp: now,
      explanation: `+3 لتنويع التوكنات (${uniqueTokens} توكن)`,
    });
  }
  
  for (let i = 0; i < regularActivityWeeks; i++) {
    items.push({
      category: 'pi_dex',
      action: 'regular_activity',
      points: 5,
      timestamp: new Date(now.getTime() - (i * 7 * 24 * 60 * 60 * 1000)),
      explanation: `+5 لنشاط منتظم (أسبوع ${i + 1})`,
    });
  }
  
  const totalPoints = items.reduce((sum, item) => sum + item.points, 0);
  
  return {
    normalTrades,
    tokenDiversity: uniqueTokens,
    regularActivity: regularActivityWeeks,
    totalPoints,
    items,
  };
}

export function calculateStakingScore(
  stakingDays: number,
  now: Date = new Date()
): StakingScore {
  const items: AtomicScoreItem[] = [];
  let tier: 'none' | 'short' | 'medium' | 'long' = 'none';
  
  if (stakingDays > 0) {
    if (stakingDays > 90) {
      tier = 'long';
      items.push({
        category: 'staking',
        action: 'long_term_stake',
        points: 10,
        timestamp: now,
        explanation: `+10 للـ Staking طويل المدى (>${stakingDays} يوم)`,
      });
    } else if (stakingDays >= 30) {
      tier = 'medium';
      items.push({
        category: 'staking',
        action: 'medium_term_stake',
        points: 6,
        timestamp: now,
        explanation: `+6 للـ Staking متوسط المدى (30-90 يوم)`,
      });
    } else {
      tier = 'short';
      items.push({
        category: 'staking',
        action: 'short_term_stake',
        points: 3,
        timestamp: now,
        explanation: `+3 للـ Staking قصير المدى (<30 يوم)`,
      });
    }
  }
  
  const totalPoints = items.reduce((sum, item) => sum + item.points, 0);
  
  return {
    stakingDays,
    tier,
    totalPoints,
    items,
  };
}

export function calculateExternalPenalty(
  smallTransfers: number,
  frequentTransfers: number,
  suddenExits: number,
  continuousDrain: number,
  now: Date = new Date()
): ExternalTxPenalty {
  const items: AtomicScoreItem[] = [];
  
  for (let i = 0; i < smallTransfers; i++) {
    items.push({
      category: 'external_penalty',
      action: 'small_transfer',
      points: -2,
      timestamp: now,
      explanation: `-2 لتحويل خارجي صغير`,
    });
  }
  
  for (let i = 0; i < frequentTransfers; i++) {
    items.push({
      category: 'external_penalty',
      action: 'frequent_transfer',
      points: -5,
      timestamp: now,
      explanation: `-5 لتحويل خارجي متكرر`,
    });
  }
  
  for (let i = 0; i < suddenExits; i++) {
    items.push({
      category: 'external_penalty',
      action: 'sudden_exit',
      points: -10,
      timestamp: now,
      explanation: `-10 لخروج فجائي كبير`,
    });
  }
  
  for (let i = 0; i < continuousDrain; i++) {
    items.push({
      category: 'external_penalty',
      action: 'continuous_drain',
      points: -15,
      timestamp: now,
      explanation: `-15 لتصريف مستمر`,
    });
  }
  
  const totalPenalty = items.reduce((sum, item) => sum + item.points, 0);
  
  return {
    smallTransfers,
    frequentTransfers,
    suddenExits,
    continuousDrain,
    totalPenalty,
    items,
  };
}

export function calculateSuspiciousPenalty(
  spamCount: number,
  farmingInstances: number,
  suspiciousLinks: number,
  now: Date = new Date()
): SuspiciousBehaviorPenalty {
  const items: AtomicScoreItem[] = [];
  
  for (let i = 0; i < spamCount; i++) {
    items.push({
      category: 'suspicious',
      action: 'spam_activity',
      points: -3,
      timestamp: now,
      explanation: `-3 لنشاط سبام`,
    });
  }
  
  for (let i = 0; i < farmingInstances; i++) {
    items.push({
      category: 'suspicious',
      action: 'farming_behavior',
      points: -8,
      timestamp: now,
      explanation: `-8 لسلوك Farming`,
    });
  }
  
  for (let i = 0; i < suspiciousLinks; i++) {
    items.push({
      category: 'suspicious',
      action: 'suspicious_link',
      points: -12,
      timestamp: now,
      explanation: `-12 لارتباط مشبوه`,
    });
  }
  
  const totalPenalty = items.reduce((sum, item) => sum + item.points, 0);
  
  return {
    spamActivity: spamCount,
    farmingBehavior: farmingInstances,
    suspiciousLinks,
    totalPenalty,
    items,
  };
}

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

export function calculateAtomicReputation(
  data: WalletActivityData,
  now: Date = new Date()
): AtomicReputationResult {
  const walletAge = calculateWalletAgeScore(data.accountAgeDays, data.lastActivityDate, now);
  const interaction = calculateInteractionScore(
    data.dailyCheckins,
    data.adBonuses,
    data.reportViews,
    data.toolUsage,
    now
  );
  const piNetwork = calculatePiNetworkScore(
    data.internalTxCount,
    data.appInteractions,
    data.sdkPayments,
    data.txDates,
    now
  );
  const piDex = calculatePiDexScore(
    data.normalTrades,
    data.uniqueTokens,
    data.regularActivityWeeks,
    now
  );
  const staking = calculateStakingScore(data.stakingDays, now);
  const externalPenalty = calculateExternalPenalty(
    data.smallExternalTransfers,
    data.frequentExternalTransfers,
    data.suddenExits,
    data.continuousDrain,
    now
  );
  const suspiciousPenalty = calculateSuspiciousPenalty(
    data.spamCount,
    data.farmingInstances,
    data.suspiciousLinks,
    now
  );
  
  const allItems = [
    ...walletAge.items,
    ...interaction.items,
    ...piNetwork.items,
    ...piDex.items,
    ...staking.items,
    ...externalPenalty.items,
    ...suspiciousPenalty.items,
  ];
  
  const rawScore = allItems.reduce((sum, item) => sum + item.points, 0);
  const adjustedScore = Math.round(applyTimeDecay(allItems, now));
  const trustLevel = getTrustLevel(adjustedScore);
  
  return {
    rawScore,
    adjustedScore,
    trustLevel,
    walletAge,
    interaction,
    piNetwork,
    piDex,
    staking,
    externalPenalty,
    suspiciousPenalty,
    allItems,
    lastUpdated: now,
  };
}

export function generateDemoActivityData(): WalletActivityData {
  return {
    accountAgeDays: 245,
    lastActivityDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    dailyCheckins: 15,
    adBonuses: 8,
    reportViews: 12,
    toolUsage: 6,
    internalTxCount: 28,
    appInteractions: 5,
    sdkPayments: 2,
    normalTrades: 7,
    uniqueTokens: 4,
    regularActivityWeeks: 6,
    stakingDays: 45,
    smallExternalTransfers: 1,
    frequentExternalTransfers: 0,
    suddenExits: 0,
    continuousDrain: 0,
    spamCount: 0,
    farmingInstances: 0,
    suspiciousLinks: 0,
  };
}

export const LEVEL_NAMES: AtomicTrustLevel[] = [
  'Very Low Trust',
  'Low Trust',
  'Medium',
  'Active',
  'Trusted',
  'Pioneer+',
  'Elite',
];

export type TrustLevel = 'Low' | 'Medium' | 'High' | 'Elite';

export function mapAtomicToTrustLevel(atomicLevel: AtomicTrustLevel): TrustLevel {
  switch (atomicLevel) {
    case 'Elite': return 'Elite';
    case 'Pioneer+':
    case 'Trusted': return 'High';
    case 'Active':
    case 'Medium': return 'Medium';
    case 'Low Trust':
    case 'Very Low Trust': return 'Low';
    default: return 'Medium';
  }
}

export const TRUST_LEVEL_COLORS: Record<AtomicTrustLevel, { bg: string; text: string; border: string }> = {
  'Very Low Trust': { bg: 'rgba(239, 68, 68, 0.2)', text: '#EF4444', border: 'rgba(239, 68, 68, 0.5)' },
  'Low Trust': { bg: 'rgba(249, 115, 22, 0.2)', text: '#F97316', border: 'rgba(249, 115, 22, 0.5)' },
  'Medium': { bg: 'rgba(234, 179, 8, 0.2)', text: '#EAB308', border: 'rgba(234, 179, 8, 0.5)' },
  'Active': { bg: 'rgba(34, 197, 94, 0.2)', text: '#22C55E', border: 'rgba(34, 197, 94, 0.5)' },
  'Trusted': { bg: 'rgba(59, 130, 246, 0.2)', text: '#3B82F6', border: 'rgba(59, 130, 246, 0.5)' },
  'Pioneer+': { bg: 'rgba(139, 92, 246, 0.2)', text: '#8B5CF6', border: 'rgba(139, 92, 246, 0.5)' },
  'Elite': { bg: 'rgba(0, 217, 255, 0.2)', text: '#00D9FF', border: 'rgba(0, 217, 255, 0.5)' },
};

export const CATEGORY_LABELS: Record<string, { en: string; ar: string }> = {
  'wallet_age': { en: 'Wallet Age', ar: 'عمر المحفظة' },
  'interaction': { en: 'Interaction', ar: 'التفاعل' },
  'pi_network': { en: 'Pi Network Transactions', ar: 'معاملات Pi Network' },
  'pi_dex': { en: 'Pi Dex Activity', ar: 'نشاط Pi Dex' },
  'staking': { en: 'Staking', ar: 'Staking' },
  'external_penalty': { en: 'External Transfers', ar: 'التحويلات الخارجية' },
  'suspicious': { en: 'Suspicious Behavior', ar: 'السلوك المشبوه' },
};
