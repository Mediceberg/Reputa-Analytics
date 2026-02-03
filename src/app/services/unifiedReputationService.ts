/**
 * Unified Reputation Protocol Service
 * Central integration point for all reputation calculations and MongoDB syncing
 * Ensures consistency across the entire application
 */

import { WalletData } from '../protocol/types';

export interface UserReputationState {
  pioneerId: string;
  username: string;
  walletAddress: string;
  mainnetScore: number;
  testnetScore: number;
  appPoints: number;
  totalReputationScore: number;
  level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  pointsBreakdown: {
    walletAgePoints: number;
    transactionQualityPoints: number;
    stakingPoints: number;
    tokenHoldingPoints: number;
    activityPoints: number;
    dexActivityPoints: number;
    offChainPenalty: number;
    dailyLoginPoints: number;
    referralPoints: number;
    taskPoints: number;
  };
  level_numeric: number;
  trustRank: string;
  lastUpdated: string;
  nextLevelThreshold: number;
  pointsToNextLevel: number;
  isVIP: boolean;
  dailyCheckinStreak: number;
  referralCount: number;
  completedTasks: number;
}

export interface DailyActivity {
  pioneerId: string;
  date: string;
  checkedIn: boolean;
  earnedPoints: number;
  activities: string[];
}

export class UnifiedReputationService {
  private baseUrl = '/api';
  private cachedUser: UserReputationState | null = null;
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes
  private lastCacheTime = 0;

  /**
   * Initialize user reputation record in MongoDB
   */
  async initializeUserReputation(pioneerId: string, walletAddress: string, username: string): Promise<UserReputationState> {
    try {
      const response = await fetch(`${this.baseUrl}/reputation/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pioneerId,
          walletAddress,
          username
        })
      });

      if (!response.ok) throw new Error('Failed to initialize user reputation');
      return await response.json();
    } catch (error) {
      console.error('❌ Failed to initialize reputation:', error);
      // Return fallback default values
      return this.getDefaultUserState(pioneerId, walletAddress, username);
    }
  }

  /**
   * Get complete user reputation state from MongoDB
   */
  async getUserReputation(pioneerId: string): Promise<UserReputationState> {
    // Check cache
    if (this.cachedUser && Date.now() - this.lastCacheTime < this.cacheExpiry) {
      return this.cachedUser;
    }

    try {
      const response = await fetch(`${this.baseUrl}/reputation/${pioneerId}`);
      if (!response.ok) throw new Error('Failed to fetch user reputation');

      const data = await response.json();
      this.cachedUser = data;
      this.lastCacheTime = Date.now();
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch reputation:', error);
      throw error;
    }
  }

  /**
   * Update user reputation from blockchain data
   */
  async syncUserReputation(pioneerId: string, walletData: WalletData): Promise<UserReputationState> {
    try {
      const response = await fetch(`${this.baseUrl}/reputation/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pioneerId,
          walletData
        })
      });

      if (!response.ok) throw new Error('Failed to sync reputation');
      
      const result = await response.json();
      this.cachedUser = result;
      this.lastCacheTime = Date.now();
      return result;
    } catch (error) {
      console.error('❌ Failed to sync reputation:', error);
      throw error;
    }
  }

  /**
   * Record daily check-in
   */
  async recordDailyCheckin(pioneerId: string): Promise<DailyActivity> {
    try {
      const response = await fetch(`${this.baseUrl}/reputation/daily-checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pioneerId })
      });

      if (!response.ok) throw new Error('Failed to record check-in');
      
      const result = await response.json();
      this.cachedUser = null; // Invalidate cache
      return result;
    } catch (error) {
      console.error('❌ Failed to record daily check-in:', error);
      throw error;
    }
  }

  /**
   * Add referral
   */
  async addReferral(pioneerId: string, referredPioneerId: string): Promise<UserReputationState> {
    try {
      const response = await fetch(`${this.baseUrl}/reputation/referral`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pioneerId,
          referredPioneerId
        })
      });

      if (!response.ok) throw new Error('Failed to add referral');
      
      const result = await response.json();
      this.cachedUser = null; // Invalidate cache
      return result;
    } catch (error) {
      console.error('❌ Failed to add referral:', error);
      throw error;
    }
  }

  /**
   * Record task completion
   */
  async recordTaskCompletion(pioneerId: string, taskId: string, points: number): Promise<UserReputationState> {
    try {
      const response = await fetch(`${this.baseUrl}/reputation/task-complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pioneerId,
          taskId,
          points
        })
      });

      if (!response.ok) throw new Error('Failed to record task completion');
      
      const result = await response.json();
      this.cachedUser = null; // Invalidate cache
      return result;
    } catch (error) {
      console.error('❌ Failed to record task completion:', error);
      throw error;
    }
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit: number = 100, network: 'mainnet' | 'testnet' | 'all' = 'all'): Promise<UserReputationState[]> {
    try {
      const response = await fetch(`${this.baseUrl}/reputation/leaderboard?limit=${limit}&network=${network}`);
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      return await response.json();
    } catch (error) {
      console.error('❌ Failed to fetch leaderboard:', error);
      return [];
    }
  }

  /**
   * Calculate level from score
   */
  calculateLevel(score: number): 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' {
    if (score >= 90000) return 'Diamond';
    if (score >= 70000) return 'Platinum';
    if (score >= 50000) return 'Gold';
    if (score >= 30000) return 'Silver';
    return 'Bronze';
  }

  /**
   * Calculate level numeric value
   */
  calculateLevelNumeric(score: number): number {
    if (score >= 90000) return 6;
    if (score >= 70000) return 5;
    if (score >= 50000) return 4;
    if (score >= 30000) return 3;
    if (score >= 10000) return 2;
    return 1;
  }

  /**
   * Calculate points to next level
   */
  calculatePointsToNextLevel(score: number): number {
    const level = this.calculateLevel(score);
    const thresholds: Record<string, number> = {
      'Bronze': 30000,
      'Silver': 50000,
      'Gold': 70000,
      'Platinum': 90000,
      'Diamond': 100000
    };
    return Math.max(0, thresholds[level] - score);
  }

  /**
   * Get default user state
   */
  private getDefaultUserState(pioneerId: string, walletAddress: string, username: string): UserReputationState {
    return {
      pioneerId,
      username,
      walletAddress,
      mainnetScore: 0,
      testnetScore: 0,
      appPoints: 0,
      totalReputationScore: 0,
      level: 'Bronze',
      pointsBreakdown: {
        walletAgePoints: 0,
        transactionQualityPoints: 0,
        stakingPoints: 0,
        tokenHoldingPoints: 0,
        activityPoints: 0,
        dexActivityPoints: 0,
        offChainPenalty: 0,
        dailyLoginPoints: 0,
        referralPoints: 0,
        taskPoints: 0
      },
      level_numeric: 1,
      trustRank: 'Newcomer',
      lastUpdated: new Date().toISOString(),
      nextLevelThreshold: 30000,
      pointsToNextLevel: 30000,
      isVIP: false,
      dailyCheckinStreak: 0,
      referralCount: 0,
      completedTasks: 0
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cachedUser = null;
    this.lastCacheTime = 0;
  }

  /**
   * Export user data
   */
  async exportUserData(pioneerId: string): Promise<UserReputationState> {
    return this.getUserReputation(pioneerId);
  }
}

// Export singleton instance
export const unifiedReputationService = new UnifiedReputationService();
