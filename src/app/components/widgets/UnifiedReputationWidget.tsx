/**
 * Unified Reputation Widget
 * Reads total/sub-scores from the same reputation engine object.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  RefreshCw,
  Activity,
  Network,
  ChevronRight,
} from 'lucide-react';

import { TRUST_LEVEL_COLORS, getLevelProgress } from '../../protocol/atomicScoring';
=======
import { 
  calculateAtomicReputation, 
  AtomicReputationResult, 
  AtomicTrustLevel,
  TRUST_LEVEL_COLORS,
  getLevelProgress,
  WalletActivityData
} from '../../protocol/atomicScoring';
import { calculateReputationAtomic } from '../../protocol/ReputationAtomic';

import { reputationService } from '../../services/reputationService';
import { useReputationEngine } from '../../hooks/useReputationEngine';

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
  compact = false,
}: UnifiedReputationWidgetProps) {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const engine = useReputationEngine(uid);
  const progress = getLevelProgress(engine.totalScore);
  const colors = TRUST_LEVEL_COLORS[engine.atomicTrustLevel];

  const loadReputation = useCallback(async () => {
    if (!uid) {
      setLoading(false);
      return;
    }

    try {
      await reputationService.loadUserReputation(uid, walletAddress);
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
      await reputationService.syncBlockchainData(walletAddress);
    } catch (error) {
      console.error('[UnifiedReputationWidget] Sync error:', error);
    } finally {
      setSyncing(false);
    }
  }, [walletAddress, syncing]);

  useEffect(() => {
    loadReputation();
  }, [loadReputation]);



  const totalScore = calculateReputationAtomic({ Mainnet_Points: blockchainScore, Testnet_Points: 0, App_Engagement_Points: checkInPoints }).totalScore;
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
        <div className="h-24 bg-white/5 rounded-xl" />
      </div>
    );
  }

  if (compact) {
    return (
      <button
        type="button"
        className="glass-card w-full p-4 border text-left cursor-pointer hover:scale-[1.01] transition-all"
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
              <div className="text-2xl font-black text-white">{engine.totalScore}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: colors.text }}>
                {engine.atomicTrustLevel}
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-500" />
        </div>
      </button>
    );
  }

  return (
    <div className="glass-card p-6 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5" style={{ color: colors.text }} />
          <h3 className="text-sm font-black uppercase tracking-widest text-white">Reputation Engine</h3>
        </div>
        <button
          onClick={syncBlockchain}
          disabled={syncing || !walletAddress}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-50"
          aria-label="Sync Mainnet data"
        >
          <RefreshCw className={`w-4 h-4 text-gray-300 ${syncing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-5 rounded-2xl mb-4" style={{ background: colors.bg, border: `1px solid ${colors.border}` }}>
        <div className="text-4xl font-black" style={{ color: colors.text }}>{engine.totalScore}</div>
        <div className="text-xs uppercase tracking-wider text-gray-300 mt-1">Total Score (Single Source of Truth)</div>

        <div className="mt-3 h-1.5 bg-black/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: colors.text }}
            initial={{ width: 0 }}
            animate={{ width: `${progress.progressInLevel}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-white/5 border border-white/10">
          <div className="text-[10px] text-gray-400 uppercase">Mainnet_Points</div>
          <div className="text-lg font-black text-purple-300">{engine.Mainnet_Points}</div>
        </div>
        <div className="p-3 rounded-xl bg-white/5 border border-white/10">
          <div className="text-[10px] text-gray-400 uppercase">Testnet_Points</div>
          <div className="text-lg font-black text-cyan-300">{engine.Testnet_Points}</div>
        </div>
        <div className="p-3 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-1 text-[10px] text-gray-400 uppercase">
            <Activity className="w-3 h-3" /> App_Engagement_Points
          </div>
          <div className="text-lg font-black text-emerald-300">{engine.App_Engagement_Points}</div>
        </div>
      </div>

      <div className="mt-3 text-[10px] text-gray-500 flex items-center gap-2">
        <Network className="w-3 h-3" />
        Total = Mainnet_Points + Testnet_Points + App_Engagement_Points
      </div>
    </div>
  );
}
