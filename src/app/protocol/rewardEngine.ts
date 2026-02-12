/**
 * Reward Engine — محرك المكافآت
 * 
 * يعمل عند كل: فتح التطبيق / Refresh / Scan جديد
 * يقارن البيانات الحالية مع آخر Snapshot ويولّد pendingRewards
 * النقاط لا تُضاف مباشرة — يجب على المستخدم الضغط على Claim Rewards
 * 
 * التدفق:
 *   Scan → حساب نشاط جديد → توليد Pending Rewards → Claim → إضافة للنقاط
 */

import {
  CATEGORY_CAPS,
  WEEKLY_BLOCKCHAIN_REWARDS,
  MONTHLY_WALLET_REWARDS,
  APP_INTERACTION_REWARDS,
} from './scoringRules';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PendingReward {
  id: string;
  category: 'recurring' | 'app';
  action: string;
  points: number;
  timestamp: string;
  description: string;
  descriptionAr: string;
}

export interface ScanSnapshot {
  walletAddress: string;
  balance: number;
  totalTransactions: number;
  totalSent: number;
  totalReceived: number;
  totalVolume: number;
  uniqueContacts: number;
  uniqueTokens: number;
  uniqueDapps: number;
  hasStaking: boolean;
  hasDexTrades: boolean;
  txCount: number;
  receivedCount: number;
  sentCount: number;
  snapshotDate: string;
}

export interface RewardState {
  uid: string;
  lastScanSnapshot: ScanSnapshot | null;
  lastMonthlyCheck: string | null;
  pendingRewards: PendingReward[];
  claimedRecurringTotal: number;
  claimedAppTotal: number;
  totalReferrals: number;
  activeReferrals: number;
  completedTasks: number;
  totalWeeklyClaims: number;
  streakDays: number;
}

export interface ClaimResult {
  claimedPoints: number;
  recurringClaimed: number;
  appClaimed: number;
  claimedRewards: PendingReward[];
  newClaimedRecurringTotal: number;
  newClaimedAppTotal: number;
}

// ─── Snapshot Diff → Pending Rewards ─────────────────────────────────────────

/**
 * يقارن Snapshot الحالي مع آخر Snapshot محفوظ
 * ويولّد مكافآت معلقة (pendingRewards) على النشاط الجديد فقط
 */
export function calculateScanRewards(
  current: ScanSnapshot,
  previous: ScanSnapshot | null,
): PendingReward[] {
  const rewards: PendingReward[] = [];
  const now = new Date().toISOString();
  let idCounter = 0;
  const nextId = () => `scan_${Date.now()}_${idCounter++}`;

  if (!previous) {
    // أول Scan — لا مكافآت recurring (Genesis يتكفل بها)
    return rewards;
  }

  // ─── Weekly Blockchain Rewards (Recurring 20%) ───────────────────────────

  // معاملات إرسال جديدة
  const newSent = Math.max(0, current.sentCount - previous.sentCount);
  if (newSent > 0) {
    rewards.push({
      id: nextId(),
      category: 'recurring',
      action: 'new_transaction',
      points: newSent * WEEKLY_BLOCKCHAIN_REWARDS.NEW_TRANSACTION,
      timestamp: now,
      description: `${newSent} new sent transaction(s)`,
      descriptionAr: `${newSent} معاملة إرسال جديدة`,
    });
  }

  // استقبال جديد
  const newReceived = Math.max(0, current.receivedCount - previous.receivedCount);
  if (newReceived > 0) {
    rewards.push({
      id: nextId(),
      category: 'recurring',
      action: 'new_receive',
      points: newReceived * WEEKLY_BLOCKCHAIN_REWARDS.NEW_RECEIVE,
      timestamp: now,
      description: `${newReceived} new received transaction(s)`,
      descriptionAr: `${newReceived} معاملة استقبال جديدة`,
    });
  }

  // تداول Dex
  if (current.hasDexTrades && !previous.hasDexTrades) {
    rewards.push({
      id: nextId(),
      category: 'recurring',
      action: 'dex_trade',
      points: WEEKLY_BLOCKCHAIN_REWARDS.DEX_TRADE,
      timestamp: now,
      description: 'New DEX trade detected',
      descriptionAr: 'تم اكتشاف تداول Dex جديد',
    });
  }

  // حجم تداول > 50π
  const volumeDiff = current.totalVolume - (previous.totalVolume || 0);
  if (volumeDiff > 50) {
    rewards.push({
      id: nextId(),
      category: 'recurring',
      action: 'volume_above_50',
      points: WEEKLY_BLOCKCHAIN_REWARDS.VOLUME_ABOVE_50,
      timestamp: now,
      description: `Trading volume increased by ${volumeDiff.toFixed(2)}π`,
      descriptionAr: `زيادة حجم التداول بـ ${volumeDiff.toFixed(2)}π`,
    });
  }

  // أول توكن جديد
  const newTokens = Math.max(0, current.uniqueTokens - previous.uniqueTokens);
  if (newTokens > 0) {
    rewards.push({
      id: nextId(),
      category: 'recurring',
      action: 'first_new_token',
      points: WEEKLY_BLOCKCHAIN_REWARDS.FIRST_NEW_TOKEN,
      timestamp: now,
      description: `${newTokens} new token(s) discovered`,
      descriptionAr: `${newTokens} توكن جديد مكتشف`,
    });
  }

  // اكتشاف النظام البيئي (توكن / DApp / Stake)
  const newDapps = Math.max(0, current.uniqueDapps - previous.uniqueDapps);
  if (newDapps > 0) {
    const ecoPoints = Math.min(
      newDapps * WEEKLY_BLOCKCHAIN_REWARDS.ECOSYSTEM_DISCOVERY.max,
      WEEKLY_BLOCKCHAIN_REWARDS.ECOSYSTEM_DISCOVERY.max * 5,
    );
    rewards.push({
      id: nextId(),
      category: 'recurring',
      action: 'ecosystem_discovery',
      points: ecoPoints,
      timestamp: now,
      description: `${newDapps} new DApp(s)/ecosystem discovery`,
      descriptionAr: `${newDapps} اكتشاف جديد في النظام البيئي`,
    });
  }

  if (current.hasStaking && !previous.hasStaking) {
    rewards.push({
      id: nextId(),
      category: 'recurring',
      action: 'ecosystem_staking',
      points: WEEKLY_BLOCKCHAIN_REWARDS.ECOSYSTEM_DISCOVERY.max,
      timestamp: now,
      description: 'Staking discovered',
      descriptionAr: 'تم اكتشاف Staking',
    });
  }

  // ─── Monthly Wallet Growth Rewards (Recurring 20%) ───────────────────────

  const prevDate = new Date(previous.snapshotDate);
  const currDate = new Date(current.snapshotDate);
  const daysSinceLast = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceLast >= 28) {
    // زيادة الرصيد
    if (current.balance > previous.balance) {
      rewards.push({
        id: nextId(),
        category: 'recurring',
        action: 'balance_increase',
        points: MONTHLY_WALLET_REWARDS.BALANCE_INCREASE,
        timestamp: now,
        description: `Balance grew by ${(current.balance - previous.balance).toFixed(2)}π`,
        descriptionAr: `زيادة الرصيد بـ ${(current.balance - previous.balance).toFixed(2)}π`,
      });
    }

    // نشاط شهري مستمر (معاملات جديدة خلال الشهر)
    const monthlyNewTx = newSent + newReceived;
    if (monthlyNewTx > 0) {
      rewards.push({
        id: nextId(),
        category: 'recurring',
        action: 'continuous_activity',
        points: MONTHLY_WALLET_REWARDS.CONTINUOUS_ACTIVITY,
        timestamp: now,
        description: 'Monthly continuous activity bonus',
        descriptionAr: 'مكافأة النشاط الشهري المستمر',
      });
    }

    // استخدام Dapp جديد
    if (newDapps > 0) {
      rewards.push({
        id: nextId(),
        category: 'recurring',
        action: 'new_dapp_usage',
        points: MONTHLY_WALLET_REWARDS.NEW_DAPP_USAGE,
        timestamp: now,
        description: 'New DApp usage this month',
        descriptionAr: 'استخدام Dapp جديد هذا الشهر',
      });
    }

    // نمو حجم التداول
    if (volumeDiff > 0) {
      rewards.push({
        id: nextId(),
        category: 'recurring',
        action: 'volume_growth',
        points: MONTHLY_WALLET_REWARDS.VOLUME_GROWTH,
        timestamp: now,
        description: 'Monthly trading volume growth',
        descriptionAr: 'نمو حجم التداول الشهري',
      });
    }
  }

  return rewards;
}

// ─── App Interaction Rewards (30%) ───────────────────────────────────────────

export function createDailyCheckInReward(withAd: boolean): PendingReward {
  const points = withAd
    ? APP_INTERACTION_REWARDS.DAILY_CHECKIN_WITH_AD
    : APP_INTERACTION_REWARDS.DAILY_CHECKIN;
  return {
    id: `checkin_${Date.now()}`,
    category: 'app',
    action: withAd ? 'daily_checkin_ad' : 'daily_checkin',
    points,
    timestamp: new Date().toISOString(),
    description: withAd ? 'Daily check-in with ad bonus' : 'Daily check-in',
    descriptionAr: withAd ? 'تسجيل دخول يومي مع إعلان' : 'تسجيل دخول يومي',
  };
}

export function createStreakReward(streakDays: number): PendingReward {
  return {
    id: `streak_${Date.now()}`,
    category: 'app',
    action: 'streak',
    points: APP_INTERACTION_REWARDS.STREAK_PER_DAY * streakDays,
    timestamp: new Date().toISOString(),
    description: `${streakDays}-day streak bonus`,
    descriptionAr: `مكافأة سلسلة ${streakDays} يوم`,
  };
}

export function createReferralReward(isNew: boolean): PendingReward {
  const points = isNew
    ? APP_INTERACTION_REWARDS.REFERRAL_NEW
    : APP_INTERACTION_REWARDS.REFERRAL_ACTIVE;
  return {
    id: `referral_${Date.now()}`,
    category: 'app',
    action: isNew ? 'referral_new' : 'referral_active',
    points,
    timestamp: new Date().toISOString(),
    description: isNew ? 'New referral bonus' : 'Active referral monthly bonus',
    descriptionAr: isNew ? 'مكافأة دعوة صديق جديد' : 'مكافأة صديق نشط شهرياً',
  };
}

export function createTaskReward(taskName: string): PendingReward {
  return {
    id: `task_${Date.now()}`,
    category: 'app',
    action: 'task_complete',
    points: APP_INTERACTION_REWARDS.TASK_COMPLETE,
    timestamp: new Date().toISOString(),
    description: `Task completed: ${taskName}`,
    descriptionAr: `تم إتمام المهمة: ${taskName}`,
  };
}

export function createWeeklyClaimBonus(): PendingReward {
  return {
    id: `weekly_claim_${Date.now()}`,
    category: 'app',
    action: 'weekly_claim',
    points: APP_INTERACTION_REWARDS.WEEKLY_CLAIM,
    timestamp: new Date().toISOString(),
    description: 'Weekly claim bonus',
    descriptionAr: 'مكافأة Claim أسبوعي',
  };
}

export function createReferralMilestoneReward(totalReferrals: number): PendingReward | null {
  if (totalReferrals >= 10 && totalReferrals % 10 === 0) {
    return {
      id: `ref_milestone_${Date.now()}`,
      category: 'app',
      action: 'referral_milestone',
      points: APP_INTERACTION_REWARDS.REFERRAL_10_MILESTONE,
      timestamp: new Date().toISOString(),
      description: `${totalReferrals} referrals milestone`,
      descriptionAr: `إنجاز ${totalReferrals} إحالة`,
    };
  }
  return null;
}

// ─── Claim Mechanism ─────────────────────────────────────────────────────────

/**
 * يحوّل المكافآت المعلقة إلى نقاط رئيسية
 * مع احترام سقف كل فئة (Recurring 200K / App 300K)
 */
export function claimPendingRewards(
  pendingRewards: PendingReward[],
  currentRecurringTotal: number,
  currentAppTotal: number,
): ClaimResult {
  if (pendingRewards.length === 0) {
    return {
      claimedPoints: 0,
      recurringClaimed: 0,
      appClaimed: 0,
      claimedRewards: [],
      newClaimedRecurringTotal: currentRecurringTotal,
      newClaimedAppTotal: currentAppTotal,
    };
  }

  let recurringClaimed = 0;
  let appClaimed = 0;
  const claimedRewards: PendingReward[] = [];

  const recurringRoom = Math.max(0, CATEGORY_CAPS.RECURRING - currentRecurringTotal);
  const appRoom = Math.max(0, CATEGORY_CAPS.APP - currentAppTotal);

  for (const reward of pendingRewards) {
    if (reward.category === 'recurring') {
      const canClaim = Math.min(reward.points, recurringRoom - recurringClaimed);
      if (canClaim > 0) {
        recurringClaimed += canClaim;
        claimedRewards.push({ ...reward, points: canClaim });
      }
    } else if (reward.category === 'app') {
      const canClaim = Math.min(reward.points, appRoom - appClaimed);
      if (canClaim > 0) {
        appClaimed += canClaim;
        claimedRewards.push({ ...reward, points: canClaim });
      }
    }
  }

  return {
    claimedPoints: recurringClaimed + appClaimed,
    recurringClaimed,
    appClaimed,
    claimedRewards,
    newClaimedRecurringTotal: currentRecurringTotal + recurringClaimed,
    newClaimedAppTotal: currentAppTotal + appClaimed,
  };
}

// ─── Default State ───────────────────────────────────────────────────────────

export function createDefaultRewardState(uid: string): RewardState {
  return {
    uid,
    lastScanSnapshot: null,
    lastMonthlyCheck: null,
    pendingRewards: [],
    claimedRecurringTotal: 0,
    claimedAppTotal: 0,
    totalReferrals: 0,
    activeReferrals: 0,
    completedTasks: 0,
    totalWeeklyClaims: 0,
    streakDays: 0,
  };
}
