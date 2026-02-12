/**
 * Unified Reputation Service
 * Single source of truth for all reputation-related operations
 * Integrates with WalletDataService for real blockchain data
 * Connects to the backend API for persistent storage
 * Uses the Central Scoring Rules Engine for all calculations
 */

import {  
  calculateAtomicReputation, 
  WalletActivityData,
  AtomicReputationResult,
  AtomicTrustLevel,
  getLevelProgress,
  TRUST_LEVEL_COLORS
} from '../protocol/atomicScoring';
import { calculateReputationAtomic } from '../protocol/ReputationAtomic';
import { walletDataService, WalletSnapshot, ActivityEvent } from './walletDataService';
import {
  SCORING_RULES,
  calculateLevelFromScore,
  calculateStreakBonus,
  canApplyRule,
  validateStreak,
  CumulativeScore,
  BACKEND_SCORE_CAP,
} from '../protocol/scoringRulesEngine';
import {
  type PendingReward,
  type RewardState,
  type ScanSnapshot,
  type ClaimResult,
  calculateScanRewards,
  claimPendingRewards,
  createDailyCheckInReward,
  createStreakReward,
  createWeeklyClaimBonus,
  createDefaultRewardState,
} from '../protocol/rewardEngine';
import { TOTAL_SCORE_CAP, CATEGORY_CAPS } from '../protocol/scoringRules';

export interface UserReputationState {
  uid: string;
  walletAddress?: string;
  reputationScore: number;
  blockchainScore: number;
  dailyCheckInPoints: number;
  totalCheckInDays: number;
  lastCheckIn: string | null;
  lastAdWatch: string | null;
  streak: number;
  adClaimedForCheckIn: string | null;
  lastCheckInId: string | null;
  interactionHistory: InteractionEvent[];
  blockchainEvents: ActivityEvent[];
  walletSnapshot?: WalletSnapshot;
  lastUpdated: string | null;
  lastBlockchainSync: string | null;
  isNew?: boolean;
  genesisCompleted?: boolean;
  genesisScore?: number;
  rewardState?: RewardState;
}

export interface InteractionEvent {
  type: string;
  points: number;
  timestamp: string;
  description: string;
}

const API_USER = '/api/user';
const API_REPUTATION = '/api/reputation';

export class ReputationService {
  private static instance: ReputationService;
  private currentState: UserReputationState | null = null;
  private uid: string | null = null;
  private isDemo: boolean = false;
  private syncQueue: Array<{ action: string; data: any }> = [];
  private isSyncing: boolean = false;
  private unifiedScoreListeners = new Set<(score: UnifiedScoreData) => void>();
  private rewardState: RewardState | null = null;

  private constructor() {}

  static getInstance(): ReputationService {
    if (!ReputationService.instance) {
      ReputationService.instance = new ReputationService();
    }
    return ReputationService.instance;
  }

  setUserId(uid: string) {
    this.uid = uid;
  }

  subscribeUnifiedScore(listener: (score: UnifiedScoreData) => void): () => void {
    this.unifiedScoreListeners.add(listener);
    listener(this.getUnifiedScore());

    return () => {
      this.unifiedScoreListeners.delete(listener);
    };
  }

  private notifyUnifiedScoreListeners(): void {
    const score = this.getUnifiedScore();
    this.unifiedScoreListeners.forEach((listener) => {
      try {
        listener(score);
      } catch (error) {
        console.error('[ReputationService] Unified score listener failed:', error);
      }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('reputation:updated', { detail: score }));
    }
  }

  getUserId(): string | null {
    return this.uid;
  }

  async loadUserReputation(uid: string, walletAddress?: string): Promise<UserReputationState> {
    this.uid = uid;

    if (uid === 'demo' || uid.toLowerCase().includes('demo')) {
      this.isDemo = true;
      console.log('[ReputationService] Demo mode enabled for uid:', uid);
    }

    if (this.isDemo) {
      this.currentState = {
        uid,
        walletAddress: walletAddress || 'GDU22WEH7M3O...DEMO',
        reputationScore: 632,
        blockchainScore: 450,
        dailyCheckInPoints: 182,
        totalCheckInDays: 28,
        lastCheckIn: new Date().toISOString().split('T')[0],
        lastAdWatch: null,
        streak: 7,
        adClaimedForCheckIn: null,
        lastCheckInId: null,
        interactionHistory: [
          { type: 'daily_checkin', points: 25, timestamp: new Date().toISOString(), description: 'Day 7 streak bonus' },
          { type: 'wallet_scan', points: 50, timestamp: new Date(Date.now() - 86400000).toISOString(), description: 'Blockchain activity' },
        ],
        blockchainEvents: [],
        walletSnapshot: undefined,
        lastUpdated: new Date().toISOString(),
        lastBlockchainSync: new Date().toISOString(),
        isNew: false,
      };
      this.notifyUnifiedScoreListeners();
      return this.currentState!;
    }

    const localState = this.getLocalState(uid);

    try {
      const response = await fetch(`${API_REPUTATION}?action=get&uid=${encodeURIComponent(uid)}`);
      const data = await response.json();

      if (data.success && data.data) {
        const apiHasData = data.data.lastUpdated || 
                           data.data.reputationScore > 0 || 
                           data.data.blockchainScore > 0 ||
                           data.data.totalCheckInDays > 0;
        
        if (apiHasData) {
          this.currentState = {
            uid,
            walletAddress: data.data.walletAddress || walletAddress,
            reputationScore: data.data.totalReputationScore || data.data.reputationScore || 0,
            blockchainScore: data.data.blockchainScore || 0,
            dailyCheckInPoints: data.data.checkInScore || data.data.dailyCheckInPoints || 0,
            totalCheckInDays: data.data.totalCheckInDays || 0,
            lastCheckIn: data.data.lastCheckInDate || data.data.lastCheckIn || null,
            lastAdWatch: null,
            streak: data.data.currentStreak || data.data.streak || 0,
            adClaimedForCheckIn: null,
            lastCheckInId: null,
            interactionHistory: (data.data.recentEvents || data.data.interactionHistory || []).map((e: any) => ({
              type: e.type,
              points: e.points,
              timestamp: e.timestamp,
              description: e.description,
            })),
            blockchainEvents: data.data.blockchainEvents || [],
            walletSnapshot: data.data.walletSnapshot,
            lastUpdated: data.data.lastUpdated || null,
            lastBlockchainSync: data.data.lastScanTimestamp || data.data.lastBlockchainSync || null,
            isNew: false,
          };
          this.saveLocalState(this.currentState);
          this.notifyUnifiedScoreListeners();
          console.log('[ReputationService] Loaded from API:', this.currentState.reputationScore);
          return this.currentState;
        } else if (localState && (localState.reputationScore > 0 || localState.totalCheckInDays > 0)) {
          console.log('[ReputationService] API empty, using local state:', localState.reputationScore);
          this.currentState = localState;
          this.notifyUnifiedScoreListeners();
          this.syncLocalToServer(localState);
          return localState;
        }
      }
    } catch (error) {
      console.error('[ReputationService] Error loading from KV API, trying local:', error);
    }

    if (localState && (localState.reputationScore > 0 || localState.totalCheckInDays > 0)) {
      console.log('[ReputationService] Using local fallback:', localState.reputationScore);
      this.currentState = localState;
      this.notifyUnifiedScoreListeners();
      return localState;
    }

    this.currentState = this.createNewState(uid);
    if (walletAddress) {
      this.currentState.walletAddress = walletAddress;
    }
    this.notifyUnifiedScoreListeners();
    return this.currentState;
  }

  private createNewState(uid: string): UserReputationState {
    return {
      uid,
      reputationScore: 0,
      blockchainScore: 0,
      dailyCheckInPoints: 0,
      totalCheckInDays: 0,
      lastCheckIn: null,
      lastAdWatch: null,
      streak: 0,
      adClaimedForCheckIn: null,
      lastCheckInId: null,
      interactionHistory: [],
      blockchainEvents: [],
      lastUpdated: null,
      lastBlockchainSync: null,
      isNew: true,
    };
  }

  private getLocalState(uid: string): UserReputationState | null {
    try {
      const stored = localStorage.getItem(`reputation_${uid}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('[ReputationService] Error reading local state:', e);
    }
    return null;
  }

  private saveLocalState(state: UserReputationState) {
    try {
      localStorage.setItem(`reputation_${state.uid}`, JSON.stringify(state));
    } catch (e) {
      console.error('[ReputationService] Error saving local state:', e);
    }

    this.notifyUnifiedScoreListeners();
  }

  private async syncLocalToServer(state: UserReputationState): Promise<void> {
    try {
      console.log('[ReputationService] Syncing local state to server for uid:', state.uid);
      await fetch(`${API_USER}?action=saveReputation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveReputation',
          uid: state.uid,
          walletAddress: state.walletAddress,
          reputationScore: state.reputationScore,
          blockchainScore: state.blockchainScore,
          dailyCheckInPoints: state.dailyCheckInPoints,
          totalCheckInDays: state.totalCheckInDays,
          lastCheckIn: state.lastCheckIn,
          interactionHistory: state.interactionHistory,
          blockchainEvents: state.blockchainEvents,
          walletSnapshot: state.walletSnapshot,
          lastBlockchainSync: state.lastBlockchainSync,
        }),
      });
      console.log('[ReputationService] Successfully synced to server');
    } catch (error) {
      console.error('[ReputationService] Failed to sync to server:', error);
    }
  }

  async saveReputation(state: UserReputationState): Promise<boolean> {
    if (this.isDemo) {
      this.currentState = state;
      this.notifyUnifiedScoreListeners();
      return true;
    }

    this.currentState = state;
    this.saveLocalState(state);
    this.notifyUnifiedScoreListeners();
    return true;
  }

  setDemoMode(isDemo: boolean): void {
    this.isDemo = isDemo;
    console.log(`[ReputationService] Demo mode: ${isDemo}`);
  }

  isDemoMode(): boolean {
    return this.isDemo;
  }

  async performDailyCheckIn(): Promise<{ success: boolean; pointsEarned: number; newState: UserReputationState }> {
    if (!this.currentState || !this.uid) {
      throw new Error('User not loaded');
    }

    if (this.isDemo) {
      return this.performDemoCheckIn();
    }

    try {
      const response = await fetch(API_REPUTATION, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'checkIn',
          uid: this.uid,
          walletAddress: this.currentState.walletAddress,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const newState: UserReputationState = {
          ...this.currentState,
          reputationScore: data.data.totalReputationScore,
          dailyCheckInPoints: this.currentState.dailyCheckInPoints + data.data.pointsEarned,
          totalCheckInDays: data.data.totalCheckInDays,
          lastCheckIn: new Date().toISOString(),
          streak: data.data.currentStreak,
          interactionHistory: [
            {
              type: 'daily_checkin',
              points: data.data.pointsEarned,
              timestamp: new Date().toISOString(),
              description: `Daily check-in (+${data.data.basePoints} pts${data.data.streakBonus > 0 ? `, +${data.data.streakBonus} streak bonus` : ''})`,
            },
            ...this.currentState.interactionHistory.slice(0, 99),
          ],
          lastUpdated: new Date().toISOString(),
        };
        this.currentState = newState;
        this.saveLocalState(newState);
        console.log('[ReputationService] performDailyCheckIn success', {
          uid: this.uid,
          pointsEarned: data.data.pointsEarned,
          totalCheckInDays: newState.totalCheckInDays,
          dailyCheckInPoints: newState.dailyCheckInPoints,
          reputationScore: newState.reputationScore,
        });
        return { success: true, pointsEarned: data.data.pointsEarned, newState };
      } else {
        return { success: false, pointsEarned: 0, newState: this.currentState };
      }
    } catch (error) {
      console.error('[ReputationService] Check-in API error, using local fallback:', error);
      return this.performLocalCheckIn();
    }
  }

  private performDemoCheckIn(): { success: boolean; pointsEarned: number; newState: UserReputationState } {
    if (!this.currentState) {
      return { success: false, pointsEarned: 0, newState: this.createNewState(this.uid || 'demo') };
    }
    const basePoints = SCORING_RULES.DAILY_CHECKIN.basePoints;
    const newState = { ...this.currentState };
    newState.dailyCheckInPoints += basePoints;
    newState.totalCheckInDays += 1;
    newState.streak = (newState.streak || 0) + 1;
    this.currentState = newState;
    this.notifyUnifiedScoreListeners();
    return { success: true, pointsEarned: basePoints, newState };
  }

  private async performLocalCheckIn(): Promise<{ success: boolean; pointsEarned: number; newState: UserReputationState }> {
    if (!this.currentState) {
      return { success: false, pointsEarned: 0, newState: this.createNewState(this.uid || 'local') };
    }

    const canCheck = this.canPerformCheckIn();
    if (!canCheck.canCheckIn) {
      return { success: false, pointsEarned: 0, newState: this.currentState };
    }

    const now = new Date();
    const checkInId = `checkin_${now.getTime()}`;
    
    const streakCheck = validateStreak(this.currentState.lastCheckIn);
    let newStreak = streakCheck.resetStreak ? 1 : (this.currentState.streak || 0) + 1;
    
    const basePoints = SCORING_RULES.DAILY_CHECKIN.basePoints;
    const streakBonus = calculateStreakBonus(newStreak);
    const totalPointsEarned = basePoints + streakBonus;

    const newState: UserReputationState = {
      ...this.currentState,
      dailyCheckInPoints: this.currentState.dailyCheckInPoints + totalPointsEarned,
      totalCheckInDays: this.currentState.totalCheckInDays + 1,
      lastCheckIn: now.toISOString(),
      lastCheckInId: checkInId,
      streak: newStreak,
      interactionHistory: [
        {
          type: 'daily_checkin',
          points: totalPointsEarned,
          timestamp: now.toISOString(),
          description: `Daily check-in (+${basePoints} pts${streakBonus > 0 ? `, +${streakBonus} streak bonus` : ''})`,
        },
        ...this.currentState.interactionHistory.slice(0, 99),
      ],
      lastUpdated: now.toISOString(),
    };

    this.saveLocalState(newState);
    this.addToSyncQueue('checkIn', { uid: this.uid, walletAddress: this.currentState.walletAddress });
    this.currentState = newState;
    this.notifyUnifiedScoreListeners();

    console.log('[ReputationService] performLocalCheckIn', {
      uid: this.uid,
      pointsEarned: totalPointsEarned,
      totalCheckInDays: newState.totalCheckInDays,
      dailyCheckInPoints: newState.dailyCheckInPoints,
      reputationScore: newState.reputationScore,
    });

    return { success: true, pointsEarned: totalPointsEarned, newState };
  }

  private addToSyncQueue(action: string, data: any): void {
    this.syncQueue.push({ action, data });
    this.trySyncQueue();
  }

  private async trySyncQueue(): Promise<void> {
    if (this.isSyncing || this.syncQueue.length === 0) return;
    
    this.isSyncing = true;
    while (this.syncQueue.length > 0) {
      const item = this.syncQueue[0];
      try {
        await fetch(API_REPUTATION, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: item.action, ...item.data }),
        });
        this.syncQueue.shift();
      } catch (error) {
        console.error('[ReputationService] Sync failed, will retry:', error);
        break;
      }
    }
    this.isSyncing = false;
  }

  async claimAdBonus(): Promise<{ success: boolean; pointsEarned: number; newState: UserReputationState }> {
    if (!this.currentState || !this.uid) {
      throw new Error('User not loaded');
    }

    if (this.isDemo) {
      return this.claimDemoAdBonus();
    }

    try {
      const response = await fetch(API_REPUTATION, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'claimAdBonus',
          uid: this.uid,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const adBonusPoints = data.data.pointsEarned;
        const newState: UserReputationState = {
          ...this.currentState,
          reputationScore: data.data.totalReputationScore,
          dailyCheckInPoints: this.currentState.dailyCheckInPoints + adBonusPoints,
          lastAdWatch: new Date().toISOString(),
          adClaimedForCheckIn: this.currentState.lastCheckInId,
          interactionHistory: [
            {
              type: 'ad_bonus',
              points: adBonusPoints,
              timestamp: new Date().toISOString(),
              description: `Ad bonus claimed (+${adBonusPoints} pts)`,
            },
            ...this.currentState.interactionHistory.slice(0, 99),
          ],
          lastUpdated: new Date().toISOString(),
        };
        this.currentState = newState;
        this.saveLocalState(newState);
        return { success: true, pointsEarned: adBonusPoints, newState };
      }
      return { success: false, pointsEarned: 0, newState: this.currentState };
    } catch (error) {
      console.error('[ReputationService] Ad bonus API error:', error);
      return this.claimLocalAdBonus();
    }
  }

  private claimDemoAdBonus(): { success: boolean; pointsEarned: number; newState: UserReputationState } {
    if (!this.currentState) {
      return { success: false, pointsEarned: 0, newState: this.createNewState(this.uid || 'demo') };
    }
    const adBonusPoints = SCORING_RULES.AD_BONUS.basePoints;
    const newState = { ...this.currentState };
    newState.dailyCheckInPoints += adBonusPoints;
    this.currentState = newState;
    this.notifyUnifiedScoreListeners();
    return { success: true, pointsEarned: adBonusPoints, newState };
  }

  private async claimLocalAdBonus(): Promise<{ success: boolean; pointsEarned: number; newState: UserReputationState }> {
    if (!this.currentState) {
      return { success: false, pointsEarned: 0, newState: this.createNewState(this.uid || 'local') };
    }

    const now = new Date();
    const adBonusPoints = SCORING_RULES.AD_BONUS.basePoints;

    const newState: UserReputationState = {
      ...this.currentState,
      dailyCheckInPoints: this.currentState.dailyCheckInPoints + adBonusPoints,
      lastAdWatch: now.toISOString(),
      adClaimedForCheckIn: this.currentState.lastCheckInId,
      interactionHistory: [
        {
          type: 'ad_bonus',
          points: adBonusPoints,
          timestamp: now.toISOString(),
          description: `Ad bonus claimed (+${adBonusPoints} pts)`,
        },
        ...this.currentState.interactionHistory.slice(0, 99),
      ],
      lastUpdated: now.toISOString(),
    };

    this.saveLocalState(newState);
    this.addToSyncQueue('claimAdBonus', { uid: this.uid });
    this.currentState = newState;

    return {
      success: true,
      pointsEarned: adBonusPoints,
      newState,
    };
  }

  async mergeCheckInPointsToReputation(pointsToMerge?: number): Promise<{ success: boolean; newState: UserReputationState }> {
    if (!this.currentState || !this.uid) {
      throw new Error('User not loaded');
    }

    const points = pointsToMerge || this.currentState.dailyCheckInPoints;

    // enforce minimum days before allowing merge (server-side guard)
    const MIN_MERGE_DAYS = 7;
    if ((this.currentState.totalCheckInDays || 0) < MIN_MERGE_DAYS) {
      console.log('[ReputationService] mergeCheckInPointsToReputation blocked - insufficient days', {
        uid: this.uid,
        totalCheckInDays: this.currentState.totalCheckInDays,
        requiredDays: MIN_MERGE_DAYS,
      });
      return { success: false, newState: this.currentState };
    }

    if (points <= 0) {
      return { success: false, newState: this.currentState };
    }

    if (points > this.currentState.dailyCheckInPoints) {
      return { success: false, newState: this.currentState };
    }

    if (this.isDemo) {
      const newState: UserReputationState = {
        ...this.currentState,
        reputationScore: this.calculateUnifiedScore(this.currentState.blockchainScore, 0, this.currentState.dailyCheckInPoints - points),
        dailyCheckInPoints: this.currentState.dailyCheckInPoints - points,
      };
      this.currentState = newState;
      this.notifyUnifiedScoreListeners();
      console.log('[ReputationService] mergeCheckInPointsToReputation (demo)', {
        uid: this.uid,
        merged: points,
        reputationScore: newState.reputationScore,
        dailyCheckInPoints: newState.dailyCheckInPoints,
      });
      return { success: true, newState };
    }

    const now = new Date();
    const newState: UserReputationState = {
      ...this.currentState,
      reputationScore: this.calculateUnifiedScore(this.currentState.blockchainScore, 0, this.currentState.dailyCheckInPoints - points),
      dailyCheckInPoints: this.currentState.dailyCheckInPoints - points,
      interactionHistory: [
        {
          type: 'weekly_merge',
          points: points,
          timestamp: now.toISOString(),
          description: `Merged ${points} check-in points to reputation`,
        },
        ...this.currentState.interactionHistory.slice(0, 99),
      ],
      lastUpdated: now.toISOString(),
    };

    this.currentState = newState;
    this.saveLocalState(newState);
    this.notifyUnifiedScoreListeners();
    console.log('[ReputationService] mergeCheckInPointsToReputation', {
      uid: this.uid,
      merged: points,
      reputationScore: newState.reputationScore,
      dailyCheckInPoints: newState.dailyCheckInPoints,
    });
    return { success: true, newState };
  }

  canCheckIn(): { canCheckIn: boolean; countdown: string; hoursRemaining: number } {
    const result = this.canPerformCheckIn();
    const COOLDOWN_MS = SCORING_RULES.DAILY_CHECKIN.cooldown || 24 * 60 * 60 * 1000;
    const hoursRemaining = result.remainingMs > 0 ? result.remainingMs / (1000 * 60 * 60) : 0;
    return {
      canCheckIn: result.canCheckIn,
      countdown: result.countdown || '00:00:00',
      hoursRemaining: hoursRemaining,
    };
  }

  canClaimAdBonus(): boolean {
    if (!this.currentState?.lastCheckIn) return false;
    if (!this.currentState.lastCheckInId) return false;
    return this.currentState.adClaimedForCheckIn !== this.currentState.lastCheckInId;
  }

  getCurrentState(): UserReputationState | null {
    return this.currentState;
  }

  getReputationProgress(): ReturnType<typeof getLevelProgress> | null {
    if (!this.currentState) return null;
    return getLevelProgress(this.currentState.reputationScore);
  }

  calculateFullReputation(walletData: WalletActivityData): AtomicReputationResult {
    return calculateAtomicReputation(walletData);
  }

  async syncBlockchainData(walletAddress: string): Promise<{
    success: boolean;
    newEvents: ActivityEvent[];
    scoreChange: number;
    newScore: number;
  }> {
    if (!this.currentState || !this.uid) {
      throw new Error('User not loaded');
    }

    try {
      console.log('[ReputationService] Syncing blockchain data for:', walletAddress);

      const result = await walletDataService.calculateReputationFromRealData(
        this.uid,
        walletAddress
      );

      const now = new Date();
      const newBlockchainScore = result.reputation.adjustedScore;
      const previousBlockchainScore = this.currentState.blockchainScore || 0;
      const scoreChange = newBlockchainScore - previousBlockchainScore;

      const newState: UserReputationState = {
        ...this.currentState,
        walletAddress,
        blockchainScore: newBlockchainScore,
        reputationScore: this.calculateUnifiedScore(newBlockchainScore, 0, this.currentState.dailyCheckInPoints),
        blockchainEvents: [
          ...result.newEvents,
          ...this.currentState.blockchainEvents.slice(0, 99),
        ],
        walletSnapshot: result.comparison.currentSnapshot,
        lastBlockchainSync: now.toISOString(),
        lastUpdated: now.toISOString(),
      };

      await this.saveReputation(newState);
      this.currentState = newState;
      this.notifyUnifiedScoreListeners();

      console.log('[ReputationService] Blockchain sync complete:', {
        newScore: newBlockchainScore,
        change: scoreChange,
        events: result.newEvents.length,
      });

      return {
        success: true,
        newEvents: result.newEvents,
        scoreChange,
        newScore: newBlockchainScore,
      };
    } catch (error) {
      console.error('[ReputationService] Blockchain sync error:', error);
      return {
        success: false,
        newEvents: [],
        scoreChange: 0,
        newScore: this.currentState?.blockchainScore || 0,
      };
    }
  }

  async addBlockchainEvent(event: ActivityEvent): Promise<boolean> {
    if (!this.currentState) return false;

    const now = new Date();
    const newState: UserReputationState = {
      ...this.currentState,
      blockchainScore: this.currentState.blockchainScore + event.points,
      reputationScore: this.calculateUnifiedScore(this.currentState.blockchainScore + event.points, 0, this.currentState.dailyCheckInPoints),
      blockchainEvents: [
        event,
        ...this.currentState.blockchainEvents.slice(0, 99),
      ],
      lastUpdated: now.toISOString(),
    };

    await this.saveReputation(newState);
    this.currentState = newState;
    this.notifyUnifiedScoreListeners();
    return true;
  }

  private calculateUnifiedScore(mainnetPoints: number, testnetPoints: number, appEngagementPoints: number): number {
    return calculateReputationAtomic({
      Mainnet_Points: mainnetPoints,
      Testnet_Points: testnetPoints,
      App_Engagement_Points: appEngagementPoints,
    }).totalScore;
  }

  getBlockchainScore(): number {
    return this.currentState?.blockchainScore || 0;
  }

  getTotalScore(): number {
    if (!this.currentState) return 0;
    return this.calculateUnifiedScore(this.currentState.blockchainScore || 0, 0, this.currentState.dailyCheckInPoints || 0);
  }

  getBlockchainEvents(): ActivityEvent[] {
    return this.currentState?.blockchainEvents || [];
  }

  getWalletSnapshot(): WalletSnapshot | undefined {
    return this.currentState?.walletSnapshot;
  }

  needsBlockchainSync(): boolean {
    if (!this.currentState?.lastBlockchainSync) return true;
    
    const lastSync = new Date(this.currentState.lastBlockchainSync);
    const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);
    return hoursSinceSync > 1;
  }

  /**
   * Get unified score data - Single Source of Truth for all pages
   * This method calculates and returns all reputation data from the central protocol
   */
  getUnifiedScore(): UnifiedScoreData {
    if (!this.currentState) {
      return this.getDefaultUnifiedScore();
    }

    const totalScore = this.getTotalScore();
    const levelInfo = calculateLevelFromScore(totalScore);
    const atomicLevel = this.mapRankToAtomicLevel(levelInfo.rank);
    const colors = TRUST_LEVEL_COLORS[atomicLevel];

    const pending = this.getPendingRewards();

    return {
      totalScore,
      blockchainScore: this.currentState.blockchainScore || 0,
      dailyCheckInPoints: this.currentState.dailyCheckInPoints || 0,
      level: levelInfo.level,
      trustRank: levelInfo.rank,
      atomicTrustLevel: atomicLevel,
      progressPercent: levelInfo.progressPercent,
      pointsToNext: levelInfo.pointsToNext,
      maxScore: BACKEND_SCORE_CAP,
      streak: this.currentState.streak || 0,
      totalCheckInDays: this.currentState.totalCheckInDays || 0,
      lastCheckIn: this.currentState.lastCheckIn,
      lastUpdated: this.currentState.lastUpdated,
      colors,
      walletAddress: this.currentState.walletAddress,
      uid: this.currentState.uid,
      pendingRewardsCount: pending.rewards.length,
      pendingRewardsTotal: pending.totalPoints,
      genesisCompleted: this.currentState.genesisCompleted || false,
      genesisScore: this.currentState.genesisScore || 0,
    };
  }

  /**
   * Return a cached unified score from localStorage synchronously to avoid UI flicker
   */
  getCachedUnifiedScore(uid?: string): UnifiedScoreData | null {
    try {
      const readUid = uid || this.uid;
      if (!readUid) return null;
      const stored = localStorage.getItem(`reputation_${readUid}`);
      if (!stored) return null;
      const parsed = JSON.parse(stored) as UserReputationState;
      const totalScore = this.calculateUnifiedScore(parsed.blockchainScore || 0, 0, parsed.dailyCheckInPoints || 0);
      const levelInfo = parsed ? ({ level: 1, rank: 'Novice', progressPercent: 0, pointsToNext: 100 } as any) : null;
      const colors = levelInfo ? { bg: '#000', text: '#fff', border: 'rgba(255,255,255,0.08)' } : { bg: '#000', text: '#fff', border: 'rgba(255,255,255,0.08)' };

      const pendingCount = parsed.rewardState?.pendingRewards?.length || 0;
      const pendingTotal = (parsed.rewardState?.pendingRewards || []).reduce((s: number, r: any) => s + (r.points || 0), 0);

      return {
        totalScore,
        blockchainScore: parsed.blockchainScore || 0,
        dailyCheckInPoints: parsed.dailyCheckInPoints || 0,
        level: levelInfo.level || 1,
        trustRank: levelInfo.rank || 'Novice',
        atomicTrustLevel: (levelInfo.rank || 'Novice') as any,
        progressPercent: levelInfo.progressPercent || 0,
        pointsToNext: levelInfo.pointsToNext || 100,
        maxScore: BACKEND_SCORE_CAP,
        streak: parsed.streak || 0,
        totalCheckInDays: parsed.totalCheckInDays || 0,
        lastCheckIn: parsed.lastCheckIn || null,
        lastUpdated: parsed.lastUpdated || null,
        colors,
        walletAddress: parsed.walletAddress,
        uid: parsed.uid,
        pendingRewardsCount: pendingCount,
        pendingRewardsTotal: pendingTotal,
        genesisCompleted: parsed.genesisCompleted || false,
        genesisScore: parsed.genesisScore || 0,
      };
    } catch (e) {
      return null;
    }
  }

  private getDefaultUnifiedScore(): UnifiedScoreData {
    const colors = TRUST_LEVEL_COLORS['Novice'];
    return {
      totalScore: 0,
      blockchainScore: 0,
      dailyCheckInPoints: 0,
      level: 1,
      trustRank: 'Novice',
      atomicTrustLevel: 'Novice',
      progressPercent: 0,
      pointsToNext: 100,
      maxScore: BACKEND_SCORE_CAP,
      streak: 0,
      totalCheckInDays: 0,
      lastCheckIn: null,
      lastUpdated: null,
      colors,
      walletAddress: undefined,
      uid: '',
      pendingRewardsCount: 0,
      pendingRewardsTotal: 0,
      genesisCompleted: false,
      genesisScore: 0,
    };
  }

  private mapRankToAtomicLevel(rank: string): AtomicTrustLevel {
    const mapping: Record<string, AtomicTrustLevel> = {
      'Novice': 'Novice',
      'Explorer': 'Explorer',
      'Contributor': 'Contributor',
      'Verified': 'Verified',
      'Trusted': 'Trusted',
      'Ambassador': 'Ambassador',
      'Elite': 'Elite',
      'Sentinel': 'Sentinel',
      'Oracle': 'Oracle',
      'Atomic Legend': 'Atomic Legend',
    };
    return mapping[rank] || 'Novice';
  }

  /**
   * Check if user can perform daily check-in using central rules
   */
  canPerformCheckIn(): { canCheckIn: boolean; countdown: string; remainingMs: number } {
    const result = canApplyRule('DAILY_CHECKIN', this.currentState?.lastCheckIn || null);
    return {
      canCheckIn: result.canApply,
      countdown: result.countdown,
      remainingMs: result.remainingMs,
    };
  }

  /**
   * Get scoring rules for UI display
   */
  getScoringRules(): typeof SCORING_RULES {
    return SCORING_RULES;
  }

  /**
   * Calculate streak bonus using central rules
   */
  getStreakBonus(streak: number): number {
    return calculateStreakBonus(streak);
  }

  /**
   * Validate if streak should be reset
   */
  checkStreakValidity(): { isValid: boolean; resetStreak: boolean } {
    return validateStreak(this.currentState?.lastCheckIn || null);
  }

  // ─── Reward Engine Integration ───────────────────────────────────────────

  private getRewardState(): RewardState {
    if (this.rewardState) return this.rewardState;
    if (this.currentState?.rewardState) {
      this.rewardState = this.currentState.rewardState;
      return this.rewardState;
    }
    this.rewardState = createDefaultRewardState(this.uid || '');
    return this.rewardState;
  }

  /**
   * Build a ScanSnapshot from a WalletSnapshot for the reward engine
   */
  private walletToScanSnapshot(ws: WalletSnapshot): ScanSnapshot {
    return {
      walletAddress: ws.walletAddress,
      balance: ws.balance,
      totalTransactions: ws.totalTransactions,
      totalSent: ws.totalSent,
      totalReceived: ws.totalReceived,
      totalVolume: ws.totalSent + ws.totalReceived,
      uniqueContacts: ws.uniqueContacts,
      uniqueTokens: 0,
      uniqueDapps: 0,
      hasStaking: false,
      hasDexTrades: false,
      txCount: ws.transactions.length,
      receivedCount: ws.transactions.filter(tx => tx.type === 'received').length,
      sentCount: ws.transactions.filter(tx => tx.type === 'sent').length,
      snapshotDate: (ws.snapshotDate instanceof Date ? ws.snapshotDate : new Date(ws.snapshotDate)).toISOString(),
    };
  }

  /**
   * Smart Re-Scan: Compare current blockchain data with last snapshot,
   * generate pending rewards for new activity only.
   * كل Scan = فرصة مكافأة جديدة
   */
  async performSmartScan(walletAddress: string): Promise<{
    success: boolean;
    newPendingRewards: PendingReward[];
    totalPending: number;
    scanSnapshot: ScanSnapshot;
  }> {
    if (!this.currentState || !this.uid) {
      throw new Error('User not loaded');
    }

    try {
      const walletSnapshot = await walletDataService.createWalletSnapshot(walletAddress);
      const currentScan = this.walletToScanSnapshot(walletSnapshot);
      const rs = this.getRewardState();

      // حساب المكافآت الجديدة بناءً على فرق Snapshot
      const newRewards = calculateScanRewards(currentScan, rs.lastScanSnapshot);

      // إضافة مكافآت الـ App (Daily Check-in streak)
      if (rs.streakDays > 0) {
        newRewards.push(createStreakReward(rs.streakDays));
      }

      // تحديث حالة المكافآت
      rs.lastScanSnapshot = currentScan;
      rs.pendingRewards = [...rs.pendingRewards, ...newRewards];

      // تحديث الحالة الرئيسية
      this.currentState = {
        ...this.currentState,
        walletAddress,
        walletSnapshot,
        rewardState: rs,
        lastBlockchainSync: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      };
      this.rewardState = rs;

      await this.saveReputation(this.currentState);
      this.notifyUnifiedScoreListeners();

      const totalPending = rs.pendingRewards.reduce((sum, r) => sum + r.points, 0);

      console.log('[ReputationService] Smart scan complete:', {
        newRewards: newRewards.length,
        totalPending,
      });

      return {
        success: true,
        newPendingRewards: newRewards,
        totalPending,
        scanSnapshot: currentScan,
      };
    } catch (error) {
      console.error('[ReputationService] Smart scan error:', error);
      return {
        success: false,
        newPendingRewards: [],
        totalPending: 0,
        scanSnapshot: this.getRewardState().lastScanSnapshot || {} as ScanSnapshot,
      };
    }
  }

  /**
   * Add a pending reward to the queue (for app interactions)
   */
  addPendingReward(reward: PendingReward): void {
    const rs = this.getRewardState();
    rs.pendingRewards.push(reward);
    this.rewardState = rs;
    if (this.currentState) {
      this.currentState.rewardState = rs;
      this.saveLocalState(this.currentState);
      this.notifyUnifiedScoreListeners();
    }
  }

  /**
   * 🟢 Claim Rewards — تحويل المكافآت المعلقة إلى النقاط الرئيسية
   * النقاط لا تُضاف مباشرة — يجب على المستخدم الضغط على Claim
   */
  async claimRewards(): Promise<ClaimResult> {
    if (!this.currentState || !this.uid) {
      throw new Error('User not loaded');
    }

    const rs = this.getRewardState();

    if (rs.pendingRewards.length === 0) {
      return {
        claimedPoints: 0,
        recurringClaimed: 0,
        appClaimed: 0,
        claimedRewards: [],
        newClaimedRecurringTotal: rs.claimedRecurringTotal,
        newClaimedAppTotal: rs.claimedAppTotal,
      };
    }

    const result = claimPendingRewards(
      rs.pendingRewards,
      rs.claimedRecurringTotal,
      rs.claimedAppTotal,
    );

    // Weekly claim bonus
    rs.totalWeeklyClaims += 1;
    const weeklyBonus = createWeeklyClaimBonus();

    // تحديث حالة المكافآت
    rs.claimedRecurringTotal = result.newClaimedRecurringTotal;
    rs.claimedAppTotal = result.newClaimedAppTotal;
    rs.pendingRewards = [weeklyBonus]; // الـ weekly bonus يبقى pending للـ claim القادم

    // تحديث النقاط الرئيسية
    const newBlockchainScore = this.currentState.blockchainScore + result.recurringClaimed;
    const newDailyPoints = this.currentState.dailyCheckInPoints + result.appClaimed;

    const newState: UserReputationState = {
      ...this.currentState,
      blockchainScore: newBlockchainScore,
      dailyCheckInPoints: newDailyPoints,
      reputationScore: this.calculateUnifiedScore(newBlockchainScore, 0, newDailyPoints),
      rewardState: rs,
      interactionHistory: [
        {
          type: 'claim_rewards',
          points: result.claimedPoints,
          timestamp: new Date().toISOString(),
          description: `Claimed ${result.claimedPoints} points (${result.recurringClaimed} recurring + ${result.appClaimed} app)`,
        },
        ...this.currentState.interactionHistory.slice(0, 99),
      ],
      lastUpdated: new Date().toISOString(),
    };

    this.currentState = newState;
    this.rewardState = rs;
    await this.saveReputation(newState);
    this.notifyUnifiedScoreListeners();

    console.log('[ReputationService] Claim rewards:', {
      claimed: result.claimedPoints,
      recurring: result.recurringClaimed,
      app: result.appClaimed,
      totalWeeklyClaims: rs.totalWeeklyClaims,
    });

    return result;
  }

  /**
   * Get current pending rewards info
   */
  getPendingRewards(): { rewards: PendingReward[]; totalPoints: number; recurringPoints: number; appPoints: number } {
    const rs = this.getRewardState();
    const recurringPoints = rs.pendingRewards
      .filter(r => r.category === 'recurring')
      .reduce((sum, r) => sum + r.points, 0);
    const appPoints = rs.pendingRewards
      .filter(r => r.category === 'app')
      .reduce((sum, r) => sum + r.points, 0);
    return {
      rewards: rs.pendingRewards,
      totalPoints: recurringPoints + appPoints,
      recurringPoints,
      appPoints,
    };
  }

  /**
   * Get the full reward state for persistence/display
   */
  getRewardStateData(): RewardState {
    return this.getRewardState();
  }
}

export interface UnifiedScoreData {
  totalScore: number;
  blockchainScore: number;
  dailyCheckInPoints: number;
  level: number;
  trustRank: string;
  atomicTrustLevel: AtomicTrustLevel;
  progressPercent: number;
  pointsToNext: number;
  maxScore: number;
  streak: number;
  totalCheckInDays: number;
  lastCheckIn: string | null;
  lastUpdated: string | null;
  colors: { bg: string; text: string; border: string };
  walletAddress?: string;
  uid: string;
  pendingRewardsCount: number;
  pendingRewardsTotal: number;
  genesisCompleted: boolean;
  genesisScore: number;
}

export const reputationService = ReputationService.getInstance();
