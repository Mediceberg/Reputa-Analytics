import { useState, useEffect } from 'react'; 
import { ArrowLeft, Globe, TrendingUp, Lock, Unlock, Users, Database, RefreshCw, Activity, Zap, Clock, Server } from 'lucide-react';
import { fetchNetworkMetrics, NetworkMetrics } from '../services/piNetworkData';

interface NetworkInfoPageProps {
  onBack: () => void;
}

export function NetworkInfoPage({ onBack }: NetworkInfoPageProps) {
  const [metrics, setMetrics] = useState<NetworkMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMainnet, setIsMainnet] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const data = await fetchNetworkMetrics(isMainnet);
      setMetrics(data);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 60000);
    return () => clearInterval(interval);
  }, [isMainnet]);

  const formatNumber = (num: number): string => {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toLocaleString();
  };

  const formatFullNumber = (num: number): string => {
    return num.toLocaleString('en-US');
  };

  const getPercentage = (value: number, total: number): number => {
    return Math.min(100, (value / total) * 100);
  };

  const statCards = metrics ? [
    {
      icon: TrendingUp,
      label: 'Circulating Supply',
      value: formatNumber(metrics.circulatingSupply),
      fullValue: formatFullNumber(metrics.circulatingSupply) + ' π',
      percentage: getPercentage(metrics.circulatingSupply, metrics.maxSupply),
      color: '#00D9FF',
      description: 'Total Pi currently in circulation on the network',
    },
    {
      icon: Lock,
      label: 'Locked Mining Rewards',
      value: formatNumber(metrics.lockedMiningRewards),
      fullValue: formatFullNumber(metrics.lockedMiningRewards) + ' π',
      percentage: getPercentage(metrics.lockedMiningRewards, metrics.maxSupply),
      color: '#8B5CF6',
      description: 'Mining rewards locked for future distribution',
    },
    {
      icon: Unlock,
      label: 'Unlocked Mining',
      value: formatNumber(metrics.unlockedMiningRewards),
      fullValue: formatFullNumber(metrics.unlockedMiningRewards) + ' π',
      percentage: getPercentage(metrics.unlockedMiningRewards, metrics.maxSupply),
      color: '#10B981',
      description: 'Mining rewards available for transfer',
    },
    {
      icon: Database,
      label: 'Total Migrated',
      value: formatNumber(metrics.totalMigratedMining),
      fullValue: formatFullNumber(metrics.totalMigratedMining) + ' π',
      percentage: getPercentage(metrics.totalMigratedMining, metrics.maxSupply),
      color: '#F59E0B',
      description: 'Pi migrated from testnet to mainnet',
    },
    {
      icon: Users,
      label: 'Active Wallets',
      value: formatNumber(metrics.activeWallets),
      fullValue: formatFullNumber(metrics.activeWallets) + ' wallets',
      percentage: null,
      color: '#EC4899',
      description: 'Unique wallet addresses with activity',
    },
    {
      icon: Server,
      label: 'Max Supply',
      value: formatNumber(metrics.maxSupply),
      fullValue: formatFullNumber(metrics.maxSupply) + ' π',
      percentage: 100,
      color: '#6366F1',
      description: 'Maximum Pi that will ever exist',
    },
  ] : [];

  return (
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(180deg, #0A0B0F 0%, #0F1117 100%)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            aria-label="Go back to Network Explorer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          >
            <ArrowLeft className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-400">Back</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
              <button
                onClick={() => setIsMainnet(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isMainnet ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-gray-500 hover:text-gray-400'
                }`}
              >
                Mainnet
              </button>
              <button
                onClick={() => setIsMainnet(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  !isMainnet ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-gray-500 hover:text-gray-400'
                }`}
              >
                Testnet
              </button>
            </div>

            <button
              onClick={loadMetrics}
              disabled={loading}
              aria-label="Refresh network metrics"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Refresh</span>
            </button>
          </div>
        </div>

        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 217, 255, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
              boxShadow: '0 0 40px rgba(0, 217, 255, 0.3)',
              border: '1px solid rgba(0, 217, 255, 0.3)',
            }}
          >
            <Globe className="w-10 h-10 text-cyan-400" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Pi Network Metrics
          </h1>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Real-time statistics and analytics for the Pi Network blockchain
          </p>
          {metrics?.isEstimated && (
            <div className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Activity className="w-3 h-3 text-amber-400" />
              <span className="text-xs font-medium text-amber-400">Estimated data based on official announcements</span>
            </div>
          )}
        </div>

        {loading && !metrics ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin" />
              <span className="text-gray-400 text-sm">Loading network data...</span>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {statCards.map((stat, index) => (
                <div
                  key={index}
                  className="p-6 rounded-2xl transition-all hover:scale-[1.02] group"
                  style={{
                    background: 'linear-gradient(135deg, rgba(30, 33, 40, 0.6) 0%, rgba(20, 22, 28, 0.8) 100%)',
                    border: `1px solid ${stat.color}20`,
                    boxShadow: `0 4px 20px ${stat.color}10`,
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ background: `${stat.color}15`, border: `1px solid ${stat.color}30` }}
                    >
                      <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                    </div>
                    {stat.percentage !== null && (
                      <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: `${stat.color}15`, color: stat.color }}>
                        {stat.percentage.toFixed(1)}%
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">{stat.label}</h3>
                  <p className="text-3xl font-black text-white mb-1" style={{ fontFamily: 'var(--font-mono)' }}>
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 mb-3" style={{ fontFamily: 'var(--font-mono)' }}>
                    {stat.fullValue}
                  </p>

                  {stat.percentage !== null && (
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden mb-3">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${stat.percentage}%`,
                          background: `linear-gradient(90deg, ${stat.color}60, ${stat.color})`,
                          boxShadow: `0 0 10px ${stat.color}50`,
                        }}
                      />
                    </div>
                  )}

                  <p className="text-xs text-gray-500">{stat.description}</p>
                </div>
              ))}
            </div>

            {metrics && (
              <div className="p-6 rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(30, 33, 40, 0.6) 0%, rgba(20, 22, 28, 0.8) 100%)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                }}
              >
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-400" />
                  Supply Distribution
                </h3>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Circulating</span>
                      <span className="text-cyan-400 font-mono">{getPercentage(metrics.circulatingSupply, metrics.maxSupply).toFixed(2)}%</span>
                    </div>
                    <div className="h-4 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${getPercentage(metrics.circulatingSupply, metrics.maxSupply)}%`,
                          background: 'linear-gradient(90deg, #00D9FF, #00D9FF80)',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Locked Mining</span>
                      <span className="text-purple-400 font-mono">{getPercentage(metrics.lockedMiningRewards, metrics.maxSupply).toFixed(2)}%</span>
                    </div>
                    <div className="h-4 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${getPercentage(metrics.lockedMiningRewards, metrics.maxSupply)}%`,
                          background: 'linear-gradient(90deg, #8B5CF6, #8B5CF680)',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Remaining</span>
                      <span className="text-gray-500 font-mono">
                        {(100 - getPercentage(metrics.circulatingSupply + metrics.lockedMiningRewards, metrics.maxSupply)).toFixed(2)}%
                      </span>
                    </div>
                    <div className="h-4 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${100 - getPercentage(metrics.circulatingSupply + metrics.lockedMiningRewards, metrics.maxSupply)}%`,
                          background: 'linear-gradient(90deg, #374151, #37415180)',
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs">Last updated: {lastRefresh.toLocaleTimeString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isMainnet ? 'bg-cyan-400' : 'bg-purple-400'} animate-pulse`} />
                    <span className="text-xs text-gray-400">{isMainnet ? 'Mainnet' : 'Testnet'}</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
