/**
 * Reputation Evolution Component
 * Displays real-time reputation data from blockchain with activity history
 */

import React from 'react';  
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight,
  RefreshCw,
  Wallet,
  Clock,
  Shield,
  TrendingUp,
  Zap
} from 'lucide-react';
import { ActivityEvent, WalletSnapshot } from '../services/walletDataService';
import { TRUST_LEVEL_COLORS, AtomicTrustLevel, getLevelProgress } from '../protocol/atomicScoring';

interface ReputationEvolutionProps {
  reputationScore: number;
  blockchainScore: number;
  checkInPoints: number;
  trustLevel: AtomicTrustLevel;
  blockchainEvents: ActivityEvent[];
  walletSnapshot?: WalletSnapshot;
  lastSync: string | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const ReputationEvolution: React.FC<ReputationEvolutionProps> = ({
  reputationScore,
  blockchainScore,
  checkInPoints,
  trustLevel,
  blockchainEvents,
  walletSnapshot,
  lastSync,
  onRefresh,
  isRefreshing = false,
}) => {
  const colors = TRUST_LEVEL_COLORS[trustLevel] || TRUST_LEVEL_COLORS['Novice'];
  const progress = getLevelProgress(reputationScore);

  const formatTimeAgo = (timestamp: string | Date) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'received_tx':
        return <ArrowDownRight className="w-4 h-4 text-green-400" />;
      case 'sent_tx':
        return <ArrowUpRight className="w-4 h-4 text-orange-400" />;
      case 'wallet_created':
        return <Wallet className="w-4 h-4 text-purple-400" />;
      case 'new_contacts':
        return <Zap className="w-4 h-4 text-cyan-400" />;
      case 'inactivity_warning':
        return <Clock className="w-4 h-4 text-red-400" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-4">
      <div 
        className="p-4 rounded-2xl"
        style={{
          background: 'rgba(15, 17, 23, 0.8)',
          border: `1px solid ${colors.border}`,
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" style={{ color: colors.text }} />
            <h3 className="text-sm font-bold text-white">Blockchain Reputation</h3>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg transition-all hover:bg-white/10 disabled:opacity-50"
              style={{ color: colors.text }}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div 
            className="p-3 rounded-xl text-center"
            style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)' }}
          >
            <div className="text-2xl font-bold text-purple-400">{blockchainScore}</div>
            <div className="text-[10px] text-gray-400 uppercase">Blockchain</div>
          </div>
          <div 
            className="p-3 rounded-xl text-center"
            style={{ background: 'rgba(0, 217, 255, 0.1)', border: '1px solid rgba(0, 217, 255, 0.2)' }}
          >
            <div className="text-2xl font-bold text-cyan-400">{checkInPoints}</div>
            <div className="text-[10px] text-gray-400 uppercase">Check-ins</div>
          </div>
          <div 
            className="p-3 rounded-xl text-center"
            style={{ background: `${colors.bg}`, border: `1px solid ${colors.border}` }}
          >
            <div className="text-2xl font-bold" style={{ color: colors.text }}>{reputationScore}</div>
            <div className="text-[10px] text-gray-400 uppercase">Total</div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Level Progress</span>
            <span className="text-xs font-medium" style={{ color: colors.text }}>
              {trustLevel}
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: colors.text }}
              initial={{ width: 0 }}
              animate={{ width: `${progress.progressInLevel}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          {progress.nextLevel && (
            <div className="mt-1 text-[10px] text-gray-500 text-right">
              {progress.pointsToNextLevel} pts to {progress.nextLevel}
            </div>
          )}
        </div>

        {walletSnapshot && (
          <div className="grid grid-cols-2 gap-2 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-gray-500" />
              <div>
                <div className="text-xs text-white font-medium">
                  {walletSnapshot.balance.toFixed(2)} Pi
                </div>
                <div className="text-[10px] text-gray-500">Balance</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-gray-500" />
              <div>
                <div className="text-xs text-white font-medium">
                  {walletSnapshot.totalTransactions}
                </div>
                <div className="text-[10px] text-gray-500">Transactions</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <div>
                <div className="text-xs text-white font-medium">
                  {walletSnapshot.accountAgeDays} days
                </div>
                <div className="text-[10px] text-gray-500">Wallet Age</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gray-500" />
              <div>
                <div className="text-xs text-white font-medium">
                  {walletSnapshot.uniqueContacts}
                </div>
                <div className="text-[10px] text-gray-500">Unique Contacts</div>
              </div>
            </div>
          </div>
        )}

        {lastSync && (
          <div className="mt-3 text-[10px] text-gray-500 text-center">
            Last synced: {formatTimeAgo(lastSync)}
          </div>
        )}
      </div>

      {blockchainEvents.length > 0 && (
        <div 
          className="p-4 rounded-2xl"
          style={{
            background: 'rgba(15, 17, 23, 0.8)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Activity History</h4>
          </div>

          <div className="space-y-2 min-h-60 overflow-y-auto custom-scrollbar">
            <AnimatePresence>
              {blockchainEvents.slice(0, 20).map((event, index) => (
                <motion.div
                  key={`${event.timestamp}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-2 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                >
                  <div className="flex items-center gap-2">
                    {getEventIcon(event.type)}
                    <div>
                      <div className="text-xs text-white">{event.description}</div>
                      <div className="text-[10px] text-gray-500">
                        {formatTimeAgo(event.timestamp)}
                      </div>
                    </div>
                  </div>
                  <div 
                    className={`text-xs font-bold ${
                      event.points >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {event.points >= 0 ? '+' : ''}{event.points}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReputationEvolution;
