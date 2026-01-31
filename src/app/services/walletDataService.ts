/**
 * Wallet Data Service
 * Fetches REAL blockchain data from Pi Network (Testnet/Mainnet)
 * No mock data - only authentic blockchain information
 */

import type { WalletActivityData, AtomicReputationResult } from '../protocol/atomicScoring'; 
import { calculateAtomicReputation } from '../protocol/atomicScoring';

const PI_TESTNET_API = 'https://api.testnet.minepi.com';
const PI_MAINNET_API = 'https://api.mainnet.minepi.com';

export interface RealTransaction {
  id: string;
  hash: string;
  timestamp: Date;
  amount: number;
  from: string;
  to: string;
  type: 'sent' | 'received' | 'internal';
  memo?: string;
  successful: boolean;
}

export interface WalletSnapshot {
  walletAddress: string;
  balance: number;
  totalTransactions: number;
  transactions: RealTransaction[];
  firstTransactionDate: Date | null;
  lastTransactionDate: Date | null;
  accountAgeDays: number;
  totalSent: number;
  totalReceived: number;
  uniqueContacts: number;
  snapshotDate: Date;
}

export interface WalletComparison {
  previousSnapshot: WalletSnapshot | null;
  currentSnapshot: WalletSnapshot;
  newTransactions: RealTransaction[];
  balanceChange: number;
  newContacts: number;
  activityEvents: ActivityEvent[];
}

export interface ActivityEvent {
  type: string;
  points: number;
  timestamp: Date;
  description: string;
  txHash?: string;
}

export interface UserWalletState {
  uid: string;
  walletAddress: string;
  currentSnapshot: WalletSnapshot;
  reputationScore: number;
  activityHistory: ActivityEvent[];
  lastCalculation: Date;
  calculationHistory: {
    date: Date;
    score: number;
    events: ActivityEvent[];
  }[];
}

class WalletDataService {
  private static instance: WalletDataService;
  private network: 'testnet' | 'mainnet' = 'testnet';
  private userStates: Map<string, UserWalletState> = new Map();

  private constructor() {
    const envNetwork = typeof window !== 'undefined' 
      ? localStorage.getItem('PI_NETWORK') 
      : null;
    this.network = (envNetwork === 'mainnet') ? 'mainnet' : 'testnet';
  }

  static getInstance(): WalletDataService {
    if (!WalletDataService.instance) {
      WalletDataService.instance = new WalletDataService();
    }
    return WalletDataService.instance;
  }

  private getApiBase(): string {
    return this.network === 'mainnet' ? PI_MAINNET_API : PI_TESTNET_API;
  }

  async fetchAccountData(walletAddress: string): Promise<{
    balance: number;
    subentryCount: number;
    exists: boolean;
  }> {
    try {
      const response = await fetch(`${this.getApiBase()}/accounts/${walletAddress}`);
      if (!response.ok) {
        if (response.status === 404) {
          return { balance: 0, subentryCount: 0, exists: false };
        }
        throw new Error(`Account fetch failed: ${response.status}`);
      }
      
      const data = await response.json();
      const nativeBalance = data.balances?.find((b: any) => b.asset_type === 'native');
      
      return {
        balance: nativeBalance ? parseFloat(nativeBalance.balance) : 0,
        subentryCount: data.subentry_count || 0,
        exists: true,
      };
    } catch (error) {
      console.error('[WalletDataService] Account fetch error:', error);
      return { balance: 0, subentryCount: 0, exists: false };
    }
  }

  async fetchTransactionHistory(walletAddress: string, limit: number = 100): Promise<RealTransaction[]> {
    try {
      const response = await fetch(
        `${this.getApiBase()}/accounts/${walletAddress}/payments?limit=${limit}&order=desc`
      );
      
      if (!response.ok) {
        console.warn('[WalletDataService] Payments fetch failed:', response.status);
        return [];
      }
      
      const data = await response.json();
      const records = data._embedded?.records || [];
      
      return records.map((record: any) => ({
        id: record.id,
        hash: record.transaction_hash || record.id,
        timestamp: new Date(record.created_at),
        amount: parseFloat(record.amount || '0'),
        from: record.from || '',
        to: record.to || '',
        type: record.from === walletAddress ? 'sent' : 'received',
        memo: record.memo || '',
        successful: record.successful !== false,
      }));
    } catch (error) {
      console.error('[WalletDataService] Transaction fetch error:', error);
      return [];
    }
  }

  async fetchFirstTransaction(walletAddress: string): Promise<Date | null> {
    try {
      const response = await fetch(
        `${this.getApiBase()}/accounts/${walletAddress}/transactions?limit=1&order=asc`
      );
      
      if (!response.ok) return null;
      
      const data = await response.json();
      const firstTx = data._embedded?.records?.[0];
      
      return firstTx ? new Date(firstTx.created_at) : null;
    } catch (error) {
      console.error('[WalletDataService] First tx fetch error:', error);
      return null;
    }
  }

  async createWalletSnapshot(walletAddress: string): Promise<WalletSnapshot> {
    const [accountData, transactions, firstTxDate] = await Promise.all([
      this.fetchAccountData(walletAddress),
      this.fetchTransactionHistory(walletAddress, 100),
      this.fetchFirstTransaction(walletAddress),
    ]);

    const now = new Date();
    const accountAgeDays = firstTxDate 
      ? Math.floor((now.getTime() - firstTxDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const totalSent = transactions
      .filter(tx => tx.type === 'sent')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalReceived = transactions
      .filter(tx => tx.type === 'received')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const uniqueContacts = new Set([
      ...transactions.filter(tx => tx.type === 'sent').map(tx => tx.to),
      ...transactions.filter(tx => tx.type === 'received').map(tx => tx.from),
    ]).size;

    const lastTx = transactions[0];
    const lastTransactionDate = lastTx ? lastTx.timestamp : null;

    return {
      walletAddress,
      balance: accountData.balance,
      totalTransactions: transactions.length + accountData.subentryCount,
      transactions,
      firstTransactionDate: firstTxDate,
      lastTransactionDate,
      accountAgeDays,
      totalSent,
      totalReceived,
      uniqueContacts,
      snapshotDate: now,
    };
  }

  compareSnapshots(previous: WalletSnapshot | null, current: WalletSnapshot): WalletComparison {
    if (!previous) {
      const activityEvents: ActivityEvent[] = [];
      
      if (current.accountAgeDays > 0) {
        activityEvents.push({
          type: 'wallet_created',
          points: Math.min(current.accountAgeDays, 365) * 2,
          timestamp: current.firstTransactionDate || new Date(),
          description: `Wallet age: ${current.accountAgeDays} days`,
        });
      }

      current.transactions.forEach(tx => {
        activityEvents.push({
          type: tx.type === 'received' ? 'received_tx' : 'sent_tx',
          points: tx.type === 'received' ? 2 : 1,
          timestamp: tx.timestamp,
          description: `${tx.type === 'received' ? 'Received' : 'Sent'} ${tx.amount.toFixed(2)} Pi`,
          txHash: tx.hash,
        });
      });

      return {
        previousSnapshot: null,
        currentSnapshot: current,
        newTransactions: current.transactions,
        balanceChange: current.balance,
        newContacts: current.uniqueContacts,
        activityEvents,
      };
    }

    const previousTxIds = new Set(previous.transactions.map(tx => tx.id));
    const newTransactions = current.transactions.filter(tx => !previousTxIds.has(tx.id));
    const balanceChange = current.balance - previous.balance;

    const previousContacts = new Set([
      ...previous.transactions.filter(tx => tx.type === 'sent').map(tx => tx.to),
      ...previous.transactions.filter(tx => tx.type === 'received').map(tx => tx.from),
    ]);
    const currentContacts = new Set([
      ...current.transactions.filter(tx => tx.type === 'sent').map(tx => tx.to),
      ...current.transactions.filter(tx => tx.type === 'received').map(tx => tx.from),
    ]);
    const newContacts = [...currentContacts].filter(c => !previousContacts.has(c)).length;

    const activityEvents: ActivityEvent[] = [];

    newTransactions.forEach(tx => {
      if (tx.type === 'received') {
        activityEvents.push({
          type: 'received_tx',
          points: 2,
          timestamp: tx.timestamp,
          description: `Received ${tx.amount.toFixed(2)} Pi`,
          txHash: tx.hash,
        });
      } else {
        activityEvents.push({
          type: 'sent_tx',
          points: 1,
          timestamp: tx.timestamp,
          description: `Sent ${tx.amount.toFixed(2)} Pi`,
          txHash: tx.hash,
        });
      }
    });

    if (newContacts > 0) {
      activityEvents.push({
        type: 'new_contacts',
        points: newContacts * 3,
        timestamp: current.snapshotDate,
        description: `Interacted with ${newContacts} new wallet(s)`,
      });
    }

    const daysSinceLastActivity = previous.lastTransactionDate
      ? Math.floor((current.snapshotDate.getTime() - previous.lastTransactionDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    if (daysSinceLastActivity > 90 && newTransactions.length === 0) {
      activityEvents.push({
        type: 'inactivity_warning',
        points: -5,
        timestamp: current.snapshotDate,
        description: `No activity for ${daysSinceLastActivity} days`,
      });
    }

    return {
      previousSnapshot: previous,
      currentSnapshot: current,
      newTransactions,
      balanceChange,
      newContacts,
      activityEvents,
    };
  }

  convertToWalletActivityData(snapshot: WalletSnapshot, comparison: WalletComparison): WalletActivityData {
    const now = new Date();
    const lastActivityDate = snapshot.lastTransactionDate || now;

    const receivedTxs = snapshot.transactions.filter(tx => tx.type === 'received');
    const sentTxs = snapshot.transactions.filter(tx => tx.type === 'sent');

    const smallExternalTransfers = sentTxs.filter(tx => tx.amount < 1).length;
    const recentSentTxs = sentTxs.filter(tx => {
      const daysSinceTx = (now.getTime() - tx.timestamp.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceTx < 7;
    });
    const frequentExternalTransfers = recentSentTxs.length > 10 ? Math.floor(recentSentTxs.length / 10) : 0;

    const totalSentRecent = recentSentTxs.reduce((sum, tx) => sum + tx.amount, 0);
    const suddenExits = totalSentRecent > snapshot.balance * 0.5 ? 1 : 0;

    const txDates = snapshot.transactions.map(tx => tx.timestamp);

    return {
      accountAgeDays: snapshot.accountAgeDays,
      lastActivityDate,
      dailyCheckins: 0,
      adBonuses: 0,
      reportViews: 0,
      toolUsage: 0,
      internalTxCount: receivedTxs.length,
      appInteractions: Math.min(Math.floor(snapshot.uniqueContacts / 3), 10),
      sdkPayments: snapshot.transactions.filter(tx => tx.memo?.includes('Pi SDK')).length,
      normalTrades: 0,
      uniqueTokens: 0,
      regularActivityWeeks: Math.min(Math.floor(snapshot.accountAgeDays / 7), 52),
      stakingDays: 0,
      smallExternalTransfers,
      frequentExternalTransfers,
      suddenExits,
      continuousDrain: 0,
      spamCount: 0,
      farmingInstances: 0,
      suspiciousLinks: 0,
      txDates,
    };
  }

  async loadUserWalletState(uid: string, walletAddress: string): Promise<UserWalletState> {
    try {
      const response = await fetch(`/api/user?action=getWalletState&uid=${encodeURIComponent(uid)}`);
      const data = await response.json();

      if (data.success && data.data) {
        const state: UserWalletState = {
          uid,
          walletAddress,
          currentSnapshot: data.data.currentSnapshot,
          reputationScore: data.data.reputationScore || 0,
          activityHistory: data.data.activityHistory || [],
          lastCalculation: new Date(data.data.lastCalculation || Date.now()),
          calculationHistory: data.data.calculationHistory || [],
        };
        this.userStates.set(uid, state);
        return state;
      }
    } catch (error) {
      console.error('[WalletDataService] Error loading user state:', error);
    }

    return {
      uid,
      walletAddress,
      currentSnapshot: await this.createWalletSnapshot(walletAddress),
      reputationScore: 0,
      activityHistory: [],
      lastCalculation: new Date(),
      calculationHistory: [],
    };
  }

  async saveUserWalletState(state: UserWalletState): Promise<boolean> {
    try {
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveWalletState',
          uid: state.uid,
          walletState: {
            walletAddress: state.walletAddress,
            currentSnapshot: state.currentSnapshot,
            reputationScore: state.reputationScore,
            activityHistory: state.activityHistory.slice(0, 100),
            lastCalculation: state.lastCalculation.toISOString(),
            calculationHistory: state.calculationHistory.slice(0, 50),
          },
        }),
      });

      const data = await response.json();
      if (data.success) {
        this.userStates.set(state.uid, state);
        return true;
      }
    } catch (error) {
      console.error('[WalletDataService] Error saving user state:', error);
    }
    return false;
  }

  async calculateReputationFromRealData(
    uid: string,
    walletAddress: string
  ): Promise<{
    reputation: AtomicReputationResult;
    comparison: WalletComparison;
    newEvents: ActivityEvent[];
    scoreChange: number;
  }> {
    const existingState = this.userStates.get(uid);
    const previousSnapshot = existingState?.currentSnapshot || null;

    const currentSnapshot = await this.createWalletSnapshot(walletAddress);
    const comparison = this.compareSnapshots(previousSnapshot, currentSnapshot);

    const walletActivityData = this.convertToWalletActivityData(currentSnapshot, comparison);
    const reputation = calculateAtomicReputation(walletActivityData);

    const eventPoints = comparison.activityEvents.reduce((sum, e) => sum + e.points, 0);
    const previousScore = existingState?.reputationScore || 0;
    const newScore = previousScore + eventPoints;
    const scoreChange = newScore - previousScore;

    const updatedState: UserWalletState = {
      uid,
      walletAddress,
      currentSnapshot,
      reputationScore: Math.max(0, newScore),
      activityHistory: [
        ...comparison.activityEvents,
        ...(existingState?.activityHistory || []),
      ].slice(0, 100),
      lastCalculation: new Date(),
      calculationHistory: [
        {
          date: new Date(),
          score: newScore,
          events: comparison.activityEvents,
        },
        ...(existingState?.calculationHistory || []),
      ].slice(0, 50),
    };

    await this.saveUserWalletState(updatedState);

    return {
      reputation,
      comparison,
      newEvents: comparison.activityEvents,
      scoreChange,
    };
  }

  getUserState(uid: string): UserWalletState | undefined {
    return this.userStates.get(uid);
  }

  setNetwork(network: 'testnet' | 'mainnet') {
    this.network = network;
    localStorage.setItem('PI_NETWORK', network);
  }

  getNetwork(): 'testnet' | 'mainnet' {
    return this.network;
  }
}

export const walletDataService = WalletDataService.getInstance();
