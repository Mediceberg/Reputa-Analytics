import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ArrowLeft, Zap, CheckCircle, Clock, ArrowUpRight, ArrowDownLeft, 
  Wallet, Activity, TrendingUp, Gift, Sparkles, RefreshCw, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WalletData, Transaction } from '../protocol/types';
import { AtomicReputationResult } from '../protocol/atomicScoring';
import { reputationService } from '../services/reputationService';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ClaimableActivity {
  id: string;
  type: 'transaction' | 'balance_milestone' | 'wallet_age' | 'streak' | 'new_contact';
  title: string;
  description: string;
  points: number;
  timestamp: Date;
  network: 'mainnet' | 'testnet';
  status: 'pending' | 'claiming' | 'claimed';
  txHash?: string;
}

interface ActivityHubProps {
  walletAddress: string;
  walletData: WalletData;
  atomicResult: AtomicReputationResult;
  isMainnet: boolean;
  onScoreUpdate: () => void;
  onBack: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateClaimableActivities(walletData: WalletData, isMainnet: boolean): ClaimableActivity[] {
  const activities: ClaimableActivity[] = [];
  const network = isMainnet ? 'mainnet' : 'testnet';
  const claimedIds = getClaimedIds();

  // Generate from recent transactions
  const recentTxs = (walletData.transactions || []).slice(0, 20);
  recentTxs.forEach((tx, i) => {
    const id = `tx_${tx.id || i}`;
    if (claimedIds.has(id)) return;

    const isReceived = tx.type === 'internal' || tx.type === 'received';
    const points = isReceived ? 40 : 20;

    activities.push({
      id,
      type: 'transaction',
      title: isReceived ? 'Received Transaction' : 'Sent Transaction',
      description: `${isReceived ? 'Received' : 'Sent'} ${tx.amount.toFixed(2)} π`,
      points,
      timestamp: tx.timestamp instanceof Date ? tx.timestamp : new Date(tx.timestamp),
      network,
      status: 'pending',
      txHash: tx.id,
    });
  });

  // Wallet age milestones
  const ageDays = walletData.accountAge || 0;
  const milestones = [
    { days: 30, points: 100, label: '1 Month Active' },
    { days: 90, points: 300, label: '3 Months Active' },
    { days: 180, points: 500, label: '6 Months Active' },
    { days: 365, points: 1000, label: '1 Year Active' },
    { days: 730, points: 2000, label: '2 Years Active' },
  ];
  milestones.forEach((m) => {
    const id = `age_${m.days}`;
    if (ageDays >= m.days && !claimedIds.has(id)) {
      activities.push({
        id,
        type: 'wallet_age',
        title: 'Wallet Age Milestone',
        description: m.label,
        points: m.points,
        timestamp: new Date(),
        network,
        status: 'pending',
      });
    }
  });

  // Balance milestones
  const balance = walletData.balance || 0;
  const balanceMilestones = [
    { min: 10, points: 50, label: 'Balance > 10 π' },
    { min: 50, points: 150, label: 'Balance > 50 π' },
    { min: 100, points: 300, label: 'Balance > 100 π' },
    { min: 500, points: 500, label: 'Balance > 500 π' },
  ];
  balanceMilestones.forEach((m) => {
    const id = `bal_${m.min}`;
    if (balance >= m.min && !claimedIds.has(id)) {
      activities.push({
        id,
        type: 'balance_milestone',
        title: 'Balance Milestone',
        description: m.label,
        points: m.points,
        timestamp: new Date(),
        network,
        status: 'pending',
      });
    }
  });

  // Sort by points descending (most valuable first)
  return activities.sort((a, b) => b.points - a.points);
}

function getClaimedIds(): Set<string> {
  try {
    const stored = localStorage.getItem('activity_hub_claimed');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch { return new Set(); }
}

function saveClaimedId(id: string) {
  try {
    const claimed = getClaimedIds();
    claimed.add(id);
    localStorage.setItem('activity_hub_claimed', JSON.stringify([...claimed]));
  } catch { /* silent */ }
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const ACTIVITY_ICONS: Record<ClaimableActivity['type'], React.ReactNode> = {
  transaction: <ArrowUpRight className="w-4 h-4" />,
  balance_milestone: <Wallet className="w-4 h-4" />,
  wallet_age: <Clock className="w-4 h-4" />,
  streak: <Zap className="w-4 h-4" />,
  new_contact: <Activity className="w-4 h-4" />,
};

const ACTIVITY_COLORS: Record<ClaimableActivity['type'], string> = {
  transaction: '#00D9FF',
  balance_milestone: '#8B5CF6',
  wallet_age: '#10B981',
  streak: '#F59E0B',
  new_contact: '#EC4899',
};

// ─── Component ───────────────────────────────────────────────────────────────

export function ActivityHub({ 
  walletAddress, walletData, atomicResult, isMainnet, onScoreUpdate, onBack 
}: ActivityHubProps) {
  const [activities, setActivities] = useState<ClaimableActivity[]>([]);
  const [claimedTotal, setClaimedTotal] = useState(0);
  const [showSuccess, setShowSuccess] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load activities
  const loadActivities = useCallback(() => {
    const items = generateClaimableActivities(walletData, isMainnet);
    setActivities(items);
  }, [walletData, isMainnet]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  // Calculate totals
  const pendingCount = activities.filter(a => a.status === 'pending').length;
  const pendingPoints = activities.filter(a => a.status === 'pending').reduce((s, a) => s + a.points, 0);

  // Claim single activity
  const handleClaim = async (activity: ClaimableActivity) => {
    // Set claiming state
    setActivities(prev => prev.map(a => 
      a.id === activity.id ? { ...a, status: 'claiming' as const } : a
    ));

    // Simulate brief processing delay
    await new Promise(r => setTimeout(r, 600));

    // Save to localStorage
    saveClaimedId(activity.id);

    // Add points via reputationService
    try {
      const state = reputationService.getCurrentState();
      if (state) {
        await reputationService.addBlockchainEvent({
          type: activity.type === 'transaction' ? 'received_tx' : 'wallet_created',
          points: activity.points,
          timestamp: activity.timestamp,
          description: `${activity.title}: ${activity.description} (+${activity.points} pts)`,
        });
      }
    } catch (e) {
      console.error('[ActivityHub] Claim error:', e);
    }

    // Update UI
    setClaimedTotal(prev => prev + activity.points);
    setShowSuccess(activity.id);

    // Remove from list with animation delay
    setTimeout(() => {
      setActivities(prev => prev.filter(a => a.id !== activity.id));
      setShowSuccess(null);
      onScoreUpdate();
    }, 1200);
  };

  // Claim all pending
  const handleClaimAll = async () => {
    const pending = activities.filter(a => a.status === 'pending');
    for (const activity of pending) {
      await handleClaim(activity);
      await new Promise(r => setTimeout(r, 300));
    }
  };

  // Refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(r => setTimeout(r, 800));
    loadActivities();
    setIsRefreshing(false);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-gray-400" />
          </button>
          <div>
            <h2 className="text-lg font-black uppercase tracking-wide text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-400" />
              Activity Hub
            </h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">
              Live Monitor & Claim Center
            </p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-indigo-400 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
          <p className="text-[9px] font-bold uppercase text-indigo-400">Pending</p>
          <p className="text-lg font-black text-white">{pendingCount}</p>
        </div>
        <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <p className="text-[9px] font-bold uppercase text-emerald-400">Claimable</p>
          <p className="text-lg font-black text-emerald-400">+{pendingPoints.toLocaleString()}</p>
        </div>
        <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
          <p className="text-[9px] font-bold uppercase text-purple-400">Claimed</p>
          <p className="text-lg font-black text-purple-400">+{claimedTotal.toLocaleString()}</p>
        </div>
      </div>

      {/* Claim All Button */}
      {pendingCount > 0 && (
        <button
          onClick={handleClaimAll}
          className="w-full p-3.5 rounded-xl font-bold text-sm uppercase tracking-wider transition-all hover:scale-[1.01] active:scale-[0.99]"
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            color: '#A5B4FC',
          }}
        >
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            Claim All ({pendingCount} activities · +{pendingPoints.toLocaleString()} pts)
          </div>
        </button>
      )}

      {/* Network Badge */}
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isMainnet ? 'bg-emerald-500' : 'bg-amber-500'}`} />
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
          {isMainnet ? 'Mainnet' : 'Testnet'} Activity Feed
        </span>
      </div>

      {/* Activity List */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {activities.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-16 text-center"
            >
              <Shield className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-sm font-bold text-gray-500">All caught up!</p>
              <p className="text-[10px] text-gray-600 mt-1">No pending activities to claim. New activities will appear here automatically.</p>
            </motion.div>
          ) : (
            activities.map((activity) => (
              <motion.div
                key={activity.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 100, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="relative rounded-xl overflow-hidden"
                style={{
                  background: 'linear-gradient(145deg, rgba(15, 17, 23, 0.9) 0%, rgba(20, 24, 32, 0.7) 100%)',
                  border: `1px solid ${showSuccess === activity.id ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255, 255, 255, 0.06)'}`,
                }}
              >
                {/* Success overlay */}
                <AnimatePresence>
                  {showSuccess === activity.id && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-10 flex items-center justify-center rounded-xl"
                      style={{ background: 'rgba(16, 185, 129, 0.15)' }}
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                        <span className="text-sm font-bold text-emerald-400">Claimed Successfully!</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center gap-3 p-3.5">
                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: `${ACTIVITY_COLORS[activity.type]}15`,
                      border: `1px solid ${ACTIVITY_COLORS[activity.type]}30`,
                      color: ACTIVITY_COLORS[activity.type],
                    }}
                  >
                    {ACTIVITY_ICONS[activity.type]}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-white truncate">{activity.title}</p>
                      <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                        activity.network === 'mainnet' 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {activity.network === 'mainnet' ? 'M' : 'T'}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 truncate">{activity.description}</p>
                    <p className="text-[9px] text-gray-600 mt-0.5">{formatTimeAgo(activity.timestamp)}</p>
                  </div>

                  {/* Points + Claim */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-black text-emerald-400">+{activity.points}</span>
                    <button
                      onClick={() => handleClaim(activity)}
                      disabled={activity.status !== 'pending'}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                        activity.status === 'claiming'
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 cursor-wait'
                          : activity.status === 'pending'
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30 hover:scale-105 active:scale-95'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {activity.status === 'claiming' ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : activity.status === 'claimed' ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        'Claim'
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Score Summary Footer */}
      <div 
        className="p-4 rounded-xl text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.15)',
        }}
      >
        <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-1">Current Atomic Score</p>
        <p className="text-2xl font-black text-white">{atomicResult.adjustedScore.toLocaleString()}</p>
        <p className="text-[10px] text-gray-500 mt-1">
          Mainnet {atomicResult.mainnetScore.toLocaleString()} · Testnet {atomicResult.testnetScore.toLocaleString()} · App {atomicResult.appEngageScore.toLocaleString()}
        </p>
      </div>
    </div>
  );
}
