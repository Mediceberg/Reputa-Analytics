import { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, Wallet, Trophy, Medal, Search, Filter, RefreshCw, 
  ArrowUpDown, Activity, Clock, TrendingUp, Lock, Unlock, Coins,
  ExternalLink, AlertCircle, CheckCircle2
} from 'lucide-react';
import { 
  fetchTop100Wallets, 
  Top100Wallet, 
  Top100WalletsSnapshot,
  subscribeToWallets,
  startAutoRefresh,
  stopAutoRefresh,
  formatBalance,
  getStatusColor,
  getWalletRankLabel
} from '../services/top100WalletsService';

interface TopWalletsPageProps {
  onBack: () => void;
}

export function TopWalletsPage({ onBack }: TopWalletsPageProps) {
  const [snapshot, setSnapshot] = useState<Top100WalletsSnapshot | null>(null);
  const [wallets, setWallets] = useState<Top100Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'rank' | 'balance' | 'unlocked' | 'locked' | 'change'>('rank');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'whale' | 'shark' | 'dolphin' | 'tuna' | 'fish'>('all');
  const [lastRefresh, setLastRefresh] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const loadWallets = useCallback(async (forceRefresh: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTop100Wallets(forceRefresh);
      setSnapshot(data);
      setWallets(data.wallets);
      setLastRefresh(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to load wallets:', err);
      setError('Failed to load wallet data. Using cached data if available.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWallets();
    startAutoRefresh(15 * 60 * 1000);

    const unsubscribe = subscribeToWallets((newSnapshot) => {
      setSnapshot(newSnapshot);
      setWallets(newSnapshot.wallets);
      setLastRefresh(new Date().toLocaleTimeString());
    });

    return () => {
      unsubscribe();
      stopAutoRefresh();
    };
  }, [loadWallets]);

  const formatNumber = (num: number): string => {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-sm font-bold text-gray-500">#{rank}</span>;
  };

  const getWalletStatusStyles = (status: string) => {
    switch (status) {
      case 'whale': return { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30', label: 'Whale (10M+)' };
      case 'shark': return { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30', label: 'Shark (1M+)' };
      case 'dolphin': return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30', label: 'Dolphin (100K+)' };
      case 'tuna': return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30', label: 'Tuna (10K+)' };
      case 'fish': return { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30', label: 'Fish' };
      default: return { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30', label: 'Unknown' };
    }
  };

  const toggleSortOrder = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder(field === 'rank' ? 'asc' : 'desc');
    }
  };

  const filteredWallets = wallets
    .filter(w => {
      if (filterStatus !== 'all' && w.status !== filterStatus) return false;
      if (searchQuery && !w.address.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'balance': comparison = b.totalBalance - a.totalBalance; break;
        case 'unlocked': comparison = b.unlockedBalance - a.unlockedBalance; break;
        case 'locked': comparison = b.lockedBalance - a.lockedBalance; break;
        case 'change': comparison = (b.change7d || 0) - (a.change7d || 0); break;
        default: comparison = a.rank - b.rank;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const stats = {
    totalBalance: wallets.reduce((sum, w) => sum + w.totalBalance, 0),
    totalLocked: wallets.reduce((sum, w) => sum + w.lockedBalance, 0),
    totalUnlocked: wallets.reduce((sum, w) => sum + w.unlockedBalance, 0),
    whaleCount: wallets.filter(w => w.status === 'whale').length,
    sharkCount: wallets.filter(w => w.status === 'shark').length,
  };

  const circulatingSupply = snapshot?.circulatingSupply || 8396155970;
  const top100Percentage = ((stats.totalBalance / circulatingSupply) * 100).toFixed(2);

  return (
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(180deg, #0A0B0F 0%, #0F1117 100%)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            aria-label="Go back to Network Explorer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          >
            <ArrowLeft className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-400">Back</span>
          </button>

          <div className="flex items-center gap-4">
            {snapshot && (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                snapshot.isLive 
                  ? 'bg-emerald-500/10 border-emerald-500/30' 
                  : 'bg-amber-500/10 border-amber-500/30'
              }`}>
                {snapshot.isLive ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-3 h-3 text-amber-400" />
                )}
                <span className={`text-xs font-medium ${snapshot.isLive ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {snapshot.isLive ? 'Live Data' : 'Cached Data'} • {snapshot.source}
                </span>
              </div>
            )}

            <button
              onClick={() => loadWallets(true)}
              disabled={loading}
              aria-label="Refresh wallet list"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Refresh</span>
            </button>
          </div>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4"
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)',
              boxShadow: '0 0 40px rgba(139, 92, 246, 0.3)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
            }}
          >
            <Wallet className="w-10 h-10 text-purple-400" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Top 100 Pi Network Wallets
          </h1>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Real-time data from Pi Network blockchain • Auto-refreshes every 15 minutes
          </p>
          {lastRefresh && (
            <p className="text-xs text-gray-500 mt-2">Last updated: {lastRefresh}</p>
          )}
          {error && (
            <div className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-3 h-3 text-red-400" />
              <span className="text-xs font-medium text-red-400">{error}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Coins className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Total Balance</p>
                <p className="text-lg font-bold text-white">{formatNumber(stats.totalBalance)} π</p>
                <p className="text-xs text-cyan-400">{top100Percentage}% of supply</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Unlock className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Unlocked</p>
                <p className="text-lg font-bold text-white">{formatNumber(stats.totalUnlocked)} π</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Lock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Locked</p>
                <p className="text-lg font-bold text-white">{formatNumber(stats.totalLocked)} π</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Whales / Sharks</p>
                <p className="text-lg font-bold text-white">{stats.whaleCount} / {stats.sharkCount}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-gray-500" />
            {(['all', 'whale', 'shark', 'dolphin', 'tuna'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-2 rounded-lg text-xs font-bold capitalize transition-all ${
                  filterStatus === status
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'bg-white/5 text-gray-500 border border-white/10 hover:text-gray-400'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {loading && wallets.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-4 text-xs font-bold text-gray-500 uppercase">
                    <button onClick={() => toggleSortOrder('rank')} className="flex items-center gap-1 hover:text-gray-300">
                      Rank {sortBy === 'rank' && <ArrowUpDown className="w-3 h-3" />}
                    </button>
                  </th>
                  <th className="text-left py-4 px-4 text-xs font-bold text-gray-500 uppercase">Address</th>
                  <th className="text-right py-4 px-4 text-xs font-bold text-gray-500 uppercase">
                    <button onClick={() => toggleSortOrder('balance')} className="flex items-center gap-1 ml-auto hover:text-gray-300">
                      Total Balance {sortBy === 'balance' && <ArrowUpDown className="w-3 h-3" />}
                    </button>
                  </th>
                  <th className="text-right py-4 px-4 text-xs font-bold text-gray-500 uppercase hidden md:table-cell">
                    <button onClick={() => toggleSortOrder('unlocked')} className="flex items-center gap-1 ml-auto hover:text-gray-300">
                      Unlocked {sortBy === 'unlocked' && <ArrowUpDown className="w-3 h-3" />}
                    </button>
                  </th>
                  <th className="text-right py-4 px-4 text-xs font-bold text-gray-500 uppercase hidden md:table-cell">
                    <button onClick={() => toggleSortOrder('locked')} className="flex items-center gap-1 ml-auto hover:text-gray-300">
                      Locked {sortBy === 'locked' && <ArrowUpDown className="w-3 h-3" />}
                    </button>
                  </th>
                  <th className="text-right py-4 px-4 text-xs font-bold text-gray-500 uppercase hidden lg:table-cell">Staking</th>
                  <th className="text-right py-4 px-4 text-xs font-bold text-gray-500 uppercase hidden lg:table-cell">
                    <button onClick={() => toggleSortOrder('change')} className="flex items-center gap-1 ml-auto hover:text-gray-300">
                      7d Change {sortBy === 'change' && <ArrowUpDown className="w-3 h-3" />}
                    </button>
                  </th>
                  <th className="text-center py-4 px-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredWallets.map((wallet) => {
                  const statusStyles = getWalletStatusStyles(wallet.status);
                  return (
                    <tr 
                      key={wallet.address} 
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {getRankIcon(wallet.rank)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-white">{wallet.address}</span>
                          <a 
                            href={`https://piscan.io/account/${wallet.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-500 hover:text-cyan-400 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{getWalletRankLabel(wallet.rank)}</p>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-lg font-bold text-white">{formatBalance(wallet.totalBalance)}</span>
                        <span className="text-gray-400 ml-1">π</span>
                        <p className="text-xs text-cyan-400">{wallet.percentageOfSupply.toFixed(4)}%</p>
                      </td>
                      <td className="py-4 px-4 text-right hidden md:table-cell">
                        <span className="text-sm text-emerald-400">{formatBalance(wallet.unlockedBalance)} π</span>
                      </td>
                      <td className="py-4 px-4 text-right hidden md:table-cell">
                        <span className="text-sm text-amber-400">{formatBalance(wallet.lockedBalance)} π</span>
                      </td>
                      <td className="py-4 px-4 text-right hidden lg:table-cell">
                        <span className="text-sm text-purple-400">{formatBalance(wallet.stakingAmount)} π</span>
                      </td>
                      <td className="py-4 px-4 text-right hidden lg:table-cell">
                        {wallet.change7d !== undefined ? (
                          <span className={`text-sm font-medium ${wallet.change7d >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {wallet.change7d >= 0 ? '+' : ''}{wallet.change7d.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold capitalize ${statusStyles.bg} ${statusStyles.text} border ${statusStyles.border}`}>
                          {wallet.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filteredWallets.length === 0 && !loading && (
          <div className="text-center py-20">
            <p className="text-gray-500">No wallets match your search criteria</p>
          </div>
        )}

        <div className="mt-8 p-4 rounded-xl bg-white/5 border border-white/10">
          <h3 className="text-sm font-bold text-gray-400 mb-3">Data Source Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-500">
            <div>
              <p className="font-medium text-gray-400">Primary Source</p>
              <p>PiScan.io Rich List API</p>
            </div>
            <div>
              <p className="font-medium text-gray-400">Fallback Source</p>
              <p>Pi Block Explorer API</p>
            </div>
            <div>
              <p className="font-medium text-gray-400">Refresh Interval</p>
              <p>Every 15 minutes (auto)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
