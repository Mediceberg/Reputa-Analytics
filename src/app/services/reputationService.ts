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
}

export interface InteractionEvent {
  type: string;
  points: number;
  timestamp: string;
  description: string;
}

const API_BASE = '/api/user';

export class ReputationService {
  private static instance: ReputationService;
  private currentState: UserReputationState | null = null;
  private uid: string | null = null;

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

  getUserId(): string | null {
    return this.uid;
  }

  async loadUserReputation(uid: string, walletAddress?: string): Promise<UserReputationState> {
    this.uid = uid;

    try {
      const response = await fetch(`${API_BASE}?action=getReputation&uid=${encodeURIComponent(uid)}`);
      const data = await response.json();

      if (data.success && data.data) {
        this.currentState = {
          uid,
          walletAddress: data.data.walletAddress || walletAddress,
          reputationScore: data.data.reputationScore || 0,
          blockchainScore: data.data.blockchainScore || 0,
          dailyCheckInPoints: data.data.dailyCheckInPoints || 0,
          totalCheckInDays: data.data.totalCheckInDays || 0,
          lastCheckIn: data.data.lastCheckIn || null,
          lastAdWatch: data.data.lastAdWatch || null,
          streak: data.data.streak || 0,
          adClaimedForCheckIn: data.data.adClaimedForCheckIn || null,
          lastCheckInId: data.data.lastCheckInId || null,
          interactionHistory: data.data.interactionHistory || [],
          blockchainEvents: data.data.blockchainEvents || [],
          walletSnapshot: data.data.walletSnapshot || undefined,
          lastUpdated: data.data.lastUpdated || null,
          lastBlockchainSync: data.data.lastBlockchainSync || null,
          isNew: data.data.isNew || false,
        };
        return this.currentState;
      }
    } catch (error) {
      console.error('[ReputationService] Error loading reputation:', error);
    }

    const fallback = this.getLocalState(uid);
    if (fallback) {
      this.currentState = fallback;
      return fallback;
    }

    this.currentState = this.createNewState(uid);
    if (walletAddress) {
      this.currentState.walletAddress = walletAddress;
    }
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
  }

  async saveReputation(state: UserReputationState): Promise<boolean> {
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveReputation',
          ...state,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        this.currentState = state;
        this.saveLocalState(state);
        return true;
      }
    } catch (error) {
      console.error('[ReputationService] Error saving reputation:', error);
      this.saveLocalState(state);
    }
    return false;
  }

  async performDailyCheckIn(): Promise<{ success: boolean; pointsEarned: number; newState: UserReputationState }> {
    if (!this.currentState || !this.uid) {
      throw new Error('User not loaded');
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

    await this.saveReputation(newState);
    this.currentState = newState;

    return {
      success: true,
      pointsEarned: totalPointsEarned,
      newState,
    };
  }

  async claimAdBonus(): Promise<{ success: boolean; pointsEarned: number; newState: UserReputationState }> {
    if (!this.currentState || !this.uid) {
      throw new Error('User not loaded');
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

    await this.saveReputation(newState);
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

    if (points <= 0) {
      return { success: false, newState: this.currentState };
    }

    if (points > this.currentState.dailyCheckInPoints) {
      return { success: false, newState: this.currentState };
    }

    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mergePoints',
          uid: this.uid,
          pointsToMerge: points,
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        const newState: UserReputationState = {
          ...this.currentState,
          reputationScore: data.data.reputationScore,
          dailyCheckInPoints: data.data.dailyCheckInPoints,
          interactionHistory: data.data.interactionHistory || this.currentState.interactionHistory,
          lastUpdated: data.data.lastUpdated,
        };

        this.currentState = newState;
        this.saveLocalState(newState);
        return { success: true, newState };
      }
    } catch (error) {
      console.error('[ReputationService] Error merging points:', error);
    }

    const now = new Date();
    const newState: UserReputationState = {
      ...this.currentState,
      reputationScore: this.currentState.reputationScore + points,
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
    return { success: true, newState };
  }

  canCheckIn(): { canCheckIn: boolean; countdown: string; hoursRemaining: number } {
    const result = this.canPerformCheckIn();
    const COOLDOWN_HOURS = SCORING_RULES.DAILY_CHECKIN.cooldownHours;
    const hoursRemaining = result.remainingMs > 0 ? result.remainingMs / (1000 * 60 * 60) : 0;
    return {
      canCheckIn: result.canCheckIn,
      countdown: result.countdown,
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
        reputationScore: this.currentState.dailyCheckInPoints + newBlockchainScore,
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
      reputationScore: this.currentState.reputationScore + event.points,
      blockchainEvents: [
        event,
        ...this.currentState.blockchainEvents.slice(0, 99),
      ],
      lastUpdated: now.toISOString(),
    };

    await this.saveReputation(newState);
    this.currentState = newState;
    return true;
  }

  getBlockchainScore(): number {
    return this.currentState?.blockchainScore || 0;
  }

  getTotalScore(): number {
    if (!this.currentState) return 0;
    return (this.currentState.blockchainScore || 0) + 
           (this.currentState.dailyCheckInPoints || 0);
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
    };
  }

  private getDefaultUnifiedScore(): UnifiedScoreData {
    const colors = TRUST_LEVEL_COLORS['Very Low Trust'];
    return {
      totalScore: 0,
      blockchainScore: 0,
      dailyCheckInPoints: 0,
      level: 1,
      trustRank: 'Very Low Trust',
      atomicTrustLevel: 'Very Low Trust',
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
    };
  }

  private mapRankToAtomicLevel(rank: string): AtomicTrustLevel {
    const mapping: Record<string, AtomicTrustLevel> = {
      'Very Low Trust': 'Very Low Trust',
      'Low Trust': 'Low Trust',
      'Medium': 'Medium',
      'Active': 'Active',
      'Trusted': 'Trusted',
      'Pioneer+': 'Pioneer+',
      'Elite': 'Elite',
    };
    return mapping[rank] || 'Low Trust';
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
}

export const reputationService = ReputationService.getInstance();
