import { useState, useEffect, useCallback } from 'react';
import { Network, Globe, Shield, Unlock, Users, RefreshCw, Activity, TrendingUp, Coins } from 'lucide-react';
import { fetchNetworkMetrics, NetworkMetrics, subscribeToMetrics, startAutoRefresh, stopAutoRefresh } from '../../services/piNetworkData';
import { useLanguage } from '../../hooks/useLanguage';

interface NetworkInfoWidgetProps {
  isMainnet?: boolean;
  refreshInterval?: number;
}

export function NetworkInfoWidget({ isMainnet = true, refreshInterval = 30000 }: NetworkInfoWidgetProps) {
  const { t } = useLanguage();
  const [metrics, setMetrics] = useState<NetworkMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNetworkMetrics(isMainnet, forceRefresh);
      setMetrics(data);
      setLastRefresh(new Date());
    } catch (err) {
      setError('Failed to fetch network data');
    } finally {
      setLoading(false);
    }
  }, [isMainnet]);

  useEffect(() => {
    fetchData();
    
    const unsubscribe = subscribeToMetrics((newMetrics) => {
      setMetrics(newMetrics);
      setLastRefresh(new Date());
    });
    
    startAutoRefresh(refreshInterval);
    
    return () => {
      unsubscribe();
      stopAutoRefresh();
    };
  }, [isMainnet, refreshInterval, fetchData]);

  const formatNumber = (num: number): string => {
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toLocaleString();
  };

  const formatNumberFull = (num: number): string => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(num);
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && !metrics) {
    return (
      <div className="glass-card p-6 border border-cyan-500/20 animate-pulse">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20" />
          <div className="h-4 w-32 bg-white/10 rounded" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-12 bg-white/5 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 border border-cyan-500/20 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center border border-cyan-500/30">
            <Network className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-white">
              {isMainnet ? 'MAINNET METRICS' : 'TESTNET METRICS'}
            </h3>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isMainnet ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">
                Pi Block Explorer
              </span>
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => fetchData(true)}
          disabled={loading}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-white/5 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
          {error}
        </div>
      )}

      {metrics && (
        <div className="space-y-3">
          {/* Total Migrated Mining Rewards */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between group hover:border-amber-500/20 transition-all">
            <div className="flex items-center gap-3">
              <Activity className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total Migrated Mining</span>
            </div>
            <span className="text-sm font-black text-white">{formatNumberFull(metrics.totalMigratedMining)} <span className="text-amber-400">π</span></span>
          </div>

          {/* Currently Locked Mining Rewards */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between group hover:border-purple-500/20 transition-all">
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-purple-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Currently Locked Mining</span>
            </div>
            <span className="text-sm font-black text-white">{formatNumberFull(metrics.lockedMiningRewards)} <span className="text-purple-400">π</span></span>
          </div>

          {/* Currently Unlocked Mining Rewards */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between group hover:border-emerald-500/20 transition-all">
            <div className="flex items-center gap-3">
              <Unlock className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Currently Unlocked Mining</span>
            </div>
            <span className="text-sm font-black text-white">{formatNumberFull(metrics.unlockedMiningRewards)} <span className="text-emerald-400">π</span></span>
          </div>

          {/* Circulating Supply */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between group hover:border-cyan-500/20 transition-all">
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Circulating Supply</span>
            </div>
            <span className="text-sm font-black text-white">{formatNumberFull(metrics.circulatingSupply)} <span className="text-cyan-400">π</span></span>
          </div>

          {/* Effective Total Supply */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between group hover:border-pink-500/20 transition-all">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-4 h-4 text-pink-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Effective Total Supply (R/65%)</span>
            </div>
            <span className="text-sm font-black text-white">{formatNumberFull(metrics.effectiveTotalSupply)} <span className="text-pink-400">π</span></span>
          </div>

          {/* Max Supply */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between group hover:border-blue-500/20 transition-all">
            <div className="flex items-center gap-3">
              <Coins className="w-4 h-4 text-blue-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Max Supply</span>
            </div>
            <span className="text-sm font-black text-white">{formatNumberFull(metrics.maxSupply)} <span className="text-blue-400">π</span></span>
          </div>

          {/* Supply Progress */}
          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Supply Progress</span>
              <span className="text-[9px] font-bold text-cyan-400">
                {((metrics.circulatingSupply / metrics.maxSupply) * 100).toFixed(4)}%
              </span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-1000"
                style={{ width: `${Math.max(1, (metrics.circulatingSupply / metrics.maxSupply) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[8px] text-gray-600">0</span>
              <span className="text-[8px] text-gray-600">{formatNumber(metrics.maxSupply)} π Max</span>
            </div>
          </div>
        </div>
      )}

      {/* Last Updated - Simplified footer */}
      {metrics && (
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${
              metrics.source === 'blockexplorer' ? 'bg-emerald-500' : 'bg-amber-500'
            } animate-pulse`} />
            <span className="text-[8px] font-bold uppercase tracking-widest text-gray-500">
              {metrics.source === 'blockexplorer' ? 'Live Data' : 'Estimated'} • {formatDate(metrics.lastUpdated)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
