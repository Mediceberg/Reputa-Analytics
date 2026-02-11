/**
 * Unified Reputation Score Engine Adapter
 * Single source of truth: ReputationAtomic protocol (Mainnet/Testnet/App engagement only)
 */

import { WalletBlockchainData } from './blockchainDataFetcher';
import { calculateReputationAtomic } from '../app/protocol/ReputationAtomic';

export interface PointsBreakdown {
  mainnetScore: number;
  testnetScore: number;
  appPoints: number;
  totalReputationScore: number;
  totalPoints: number;
  level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  pointsDetails: {
    walletAgePoints: number;
    transactionQualityPoints: number;
    stakingPoints: number;
    tokenHoldingPoints: number;
    activityPoints: number;
    dexActivityPoints: number;
    offChainPenalty: number;
    totalBlockchainPoints: number;
    dailyLoginPoints: number;
    referralPoints: number;
    taskPoints: number;
    totalAppPoints: number;
  };
}

export interface UserPointsState {
  pioneerId: string;
  totalPoints: number;
  reputationScore: number;
  mainnetScore: number;
  testnetScore: number;
  appPoints: number;
  level: string;
  lastUpdated: Date;
  breakdown: PointsBreakdown;
}

export class ReputaPointsCalculator {
  calculateUserReputation(
    mainnetData: WalletBlockchainData | null,
    testnetData: WalletBlockchainData | null,
    appActivityData: {
      totalDailyLogins: number;
      dailyLoginsWithAds: number;
      confirmedReferrals: number;
      completedTasks: number;
    }
  ): PointsBreakdown {
    const mainnetScore = Math.max(0, mainnetData?.totalTransactions || 0);
    const testnetScore = Math.max(0, testnetData?.totalTransactions || 0);
    const appPoints =
      Math.max(0, appActivityData.totalDailyLogins) +
      Math.max(0, appActivityData.dailyLoginsWithAds) +
      Math.max(0, appActivityData.confirmedReferrals) +
      Math.max(0, appActivityData.completedTasks);

    const atomic = calculateReputationAtomic({
      Mainnet_Points: mainnetScore,
      Testnet_Points: testnetScore,
      App_Engagement_Points: appPoints,
    });

    const totalReputationScore = atomic.totalScore;
    const totalPoints = atomic.totalScore;
    const level = this.calculateLevel(totalReputationScore);

    return {
      mainnetScore: atomic.Mainnet_Points,
      testnetScore: atomic.Testnet_Points,
      appPoints: atomic.App_Engagement_Points,
      totalReputationScore,
      totalPoints,
      level,
      pointsDetails: {
        walletAgePoints: 0,
        transactionQualityPoints: 0,
        stakingPoints: 0,
        tokenHoldingPoints: 0,
        activityPoints: 0,
        dexActivityPoints: 0,
        offChainPenalty: 0,
        totalBlockchainPoints: atomic.Mainnet_Points + atomic.Testnet_Points,
        dailyLoginPoints: appActivityData.totalDailyLogins,
        referralPoints: appActivityData.confirmedReferrals,
        taskPoints: appActivityData.completedTasks,
        totalAppPoints: atomic.App_Engagement_Points,
      },
    };
  }

  private calculateLevel(reputationScore: number): 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' {
    if (reputationScore >= 90000) return 'Diamond';
    if (reputationScore >= 70000) return 'Platinum';
    if (reputationScore >= 50000) return 'Gold';
    if (reputationScore >= 30000) return 'Silver';
    return 'Bronze';
  }
}

export default { ReputaPointsCalculator };
