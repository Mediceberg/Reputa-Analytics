/**
 * Unified Reputation Widget
 * Single source of truth for reputation display
 * Uses atomicScoring protocol exclusively - no duplicate calculations
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  RefreshCw, 
  Activity, 
  Clock, 
  Zap, 
  Network,
  Wallet,
  TrendingUp,
  Users,
  ChevronRight
} from 'lucide-react';
import { 
  calculateAtomicReputation, 
  AtomicReputationResult, 
  AtomicTrustLevel,
  TRUST_LEVEL_COLORS,
  getLevelProgress,
  WalletActivityData
} from '../../protocol/atomicScoring';
import { reputationService } from '../../services/reputationService';
import { walletDataService, WalletSnapshot, ActivityEvent } from '../../services/walletDataService';

interface UnifiedReputationWidgetProps {
  walletAddress?: string;
  uid?: string;
  onViewDetails?: () => void;
  compact?: boolean;
}

export function UnifiedReputationWidget({ 
  walletAddress, 
  uid,
  onViewDetails,
  compact = false 
}: UnifiedReputationWidgetProps) {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [atomicResult, setAtomicResult] = useState<AtomicReputationResult | null>(null);
  const [blockchainScore, setBlockchainScore] = useState(0);
  const [checkInPoints, setCheckInPoints] = useState(0);
  const [walletSnapshot, setWalletSnapshot] = useState<WalletSnapshot | null>(null);
  const [recentEvents, setRecentEvents] = useState<ActivityEvent[]>([]);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const loadReputation = useCallback(async () => {
    setLoading(true);
    try {
      if (uid) {
        const state = await reputationService.loadUserReputation(uid, walletAddress);
        setBlockchainScore(state.blockchainScore || 0);
        setCheckInPoints(state.dailyCheckInPoints || 0);
        setRecentEvents(state.blockchainEvents || []);
        setWalletSnapshot(state.walletSnapshot || null);
        setLastSync(state.lastBlockchainSync);

        if (state.walletSnapshot) {
          const activityData = walletDataService.convertToWalletActivityData(
            state.walletSnapshot,
            { 
              previousSnapshot: null, 
              currentSnapshot: state.walletSnapshot,
              newTransactions: [],
              balanceChange: 0,
              newContacts: 0,
              activityEvents: []
            }
          );
          const result = calculateAtomicReputation(activityData);
          setAtomicResult(result);
        }
      }
    } catch (error) {
      console.error('[UnifiedReputationWidget] Load error:', error);
    } finally {
      setLoading(false);
    }
  }, [uid, walletAddress]);

  const syncBlockchain = useCallback(async () => {
    if (!walletAddress || syncing) return;
    
    setSyncing(true);
    try {
      const result = await reputationService.syncBlockchainData(walletAddress);
      if (result.success) {
        setBlockchainScore(result.newScore);
        setRecentEvents(result.newEvents);
        setLastSync(new Date().toISOString());
        await loadReputation();
      }
    } catch (error) {
      console.error('[UnifiedReputationWidget] Sync error:', error);
    } finally {
      setSyncing(false);
    }
  }, [walletAddress, syncing, loadReputation]);

  useEffect(() => {
    loadReputation();
  }, [loadReputation]);

  const totalScore = blockchainScore + checkInPoints;
  const trustLevel: AtomicTrustLevel = atomicResult?.trustLevel || 'Medium';
  const colors = TRUST_LEVEL_COLORS[trustLevel];
  const progress = getLevelProgress(totalScore);

  const formatTimeAgo = (timestamp: string) => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="glass-card p-6 border border-purple-500/20 animate-pulse">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20" />
          <div className="h-4 w-36 bg-white/10 rounded" />
        </div>
        <div className="h-32 bg-white/5 rounded-xl" />
      </div>
    );
  }

  if (compact) {
    return (
      <div 
        className="glass-card p-4 border cursor-pointer hover:scale-[1.01] transition-all"
        style={{ borderColor: colors.border }}
        onClick={onViewDetails}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
            >
              <Shield className="w-6 h-6" style={{ color: colors.text }} />
            </div>
            <div>
              <div className="text-2xl font-black text-white">{totalScore}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: colors.text }}>
                {trustLevel}
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-500" />
        </div>
      </div>
    );
  }

  return (
    <div 
      className="glass-card p-6 border relative overflow-hidden"
      style={{ borderColor: colors.border }}
    >
      <div 
        className="absolute inset-0 opacity-5"
        style={{ background: `radial-gradient(circle at 50% 0%, ${colors.text} 0%, transparent 50%)` }}
      />

      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
          >
            <Shield className="w-5 h-5" style={{ color: colors.text }} />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-white">
              Reputa Score
            </h3>
            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">
              Unified Protocol
            </span>
          </div>
        </div>
        
        <button 
          onClick={syncBlockchain}
          disabled={syncing || !walletAddress}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-white/5 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-gray-400 ${syncing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div 
        className="p-6 rounded-2xl mb-6 text-center relative overflow-hidden"
        style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
      >
        <div className="relative z-10">
          <div className="text-5xl font-black" style={{ color: colors.text }}>
            {totalScore}
          </div>
          <div className="inline-flex items-center gap-2 mt-2 px-4 py-1.5 rounded-full bg-black/20">
            <span className="text-xs font-black uppercase tracking-widest" style={{ color: colors.text }}>
              {trustLevel}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Level Progress</span>
            {progress.nextLevel && (
              <span className="text-[9px] font-bold" style={{ color: colors.text }}>
                {progress.pointsToNextLevel} to {progress.nextLevel}
              </span>
            )}
          </div>
          <div className="h-1.5 bg-black/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: colors.text }}
              initial={{ width: 0 }}
              animate={{ width: `${progress.progressInLevel}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-xl bg-white/5 border border-white/5">
          <div className="flex items-center gap-2 mb-1">
            <Network className="w-4 h-4 text-purple-400" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Blockchain</span>
          </div>
          <div className="text-xl font-black text-purple-400">{blockchainScore}</div>
        </div>
        <div className="p-3 rounded-xl bg-white/5 border border-white/5">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Check-ins</span>
          </div>
          <div className="text-xl font-black text-cyan-400">{checkInPoints}</div>
        </div>
      </div>

      {walletSnapshot && (
        <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-white/5 border border-white/5 mb-4">
          <div className="text-center">
            <Wallet className="w-4 h-4 text-gray-500 mx-auto mb-1" />
            <div className="text-sm font-bold text-white">{walletSnapshot.balance.toFixed(2)}</div>
            <div className="text-[8px] text-gray-500 uppercase">Balance</div>
          </div>
          <div className="text-center">
            <Clock className="w-4 h-4 text-gray-500 mx-auto mb-1" />
            <div className="text-sm font-bold text-white">{walletSnapshot.accountAgeDays}</div>
            <div className="text-[8px] text-gray-500 uppercase">Days</div>
          </div>
          <div className="text-center">
            <Users className="w-4 h-4 text-gray-500 mx-auto mb-1" />
            <div className="text-sm font-bold text-white">{walletSnapshot.uniqueContacts}</div>
            <div className="text-[8px] text-gray-500 uppercase">Contacts</div>
          </div>
        </div>
      )}

      {recentEvents.length > 0 && (
        <div className="space-y-1">
          <div className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-2">
            Recent Activity
          </div>
          <AnimatePresence>
            {recentEvents.slice(0, 3).map((event, i) => (
              <motion.div
                key={`${event.timestamp}-${i}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-2 rounded-lg bg-white/5"
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3 h-3 text-gray-500" />
                  <span className="text-[10px] text-gray-400">{event.description}</span>
                </div>
                <span className={`text-[10px] font-bold ${event.points >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {event.points >= 0 ? '+' : ''}{event.points}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {lastSync && (
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
          <span className="text-[8px] font-bold uppercase tracking-widest text-gray-600">
            Last Sync
          </span>
          <span className="text-[8px] font-bold text-gray-500">
            {formatTimeAgo(lastSync)}
          </span>
        </div>
      )}

      {onViewDetails && (
        <button
          onClick={onViewDetails}
          className="mt-4 w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center gap-2 transition-all group"
        >
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white">
            View Full Breakdown
          </span>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white" />
        </button>
      )}
    </div>
  );
}
