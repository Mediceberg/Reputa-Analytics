import { useState, useEffect } from 'react';
import { ArrowLeft, Wallet, Trophy, Medal, Search, Filter, RefreshCw, ArrowUpDown, Activity, Clock, TrendingUp } from 'lucide-react';
import { fetchTopWallets, TopWallet } from '../services/piNetworkData';

interface TopWalletsPageProps {
  onBack: () => void;
}

export function TopWalletsPage({ onBack }: TopWalletsPageProps) {
  const [wallets, setWallets] = useState<TopWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'rank' | 'balance' | 'activity'>('rank');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'dormant' | 'new'>('all');
  const [isMainnet, setIsMainnet] = useState(true);

  const loadWallets = async () => {
    setLoading(true);
    try {
      const data = await fetchTopWallets(isMainnet);
      setWallets(data);
    } catch (error) {
      console.error('Failed to load wallets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallets();
  }, [isMainnet]);

  const formatNumber = (num: number): string => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' };
      case 'dormant': return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' };
      case 'new': return { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' };
      default: return { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' };
    }
  };

  const filteredWallets = wallets
    .filter(w => {
      if (filterStatus !== 'all' && w.status !== filterStatus) return false;
      if (searchQuery && !w.address.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'balance': return b.balance - a.balance;
        case 'activity': return b.activityScore - a.activityScore;
        default: return a.rank - b.rank;
      }
    });

  const stats = {
    totalBalance: wallets.reduce((sum, w) => sum + w.balance, 0),
    avgActivity: wallets.reduce((sum, w) => sum + w.activityScore, 0) / wallets.length || 0,
    activeCount: wallets.filter(w => w.status === 'active').length,
  };

  return (
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(180deg, #0A0B0F 0%, #0F1117 100%)' }}>
      <div className="max-w-6xl mx-auto">
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
              onClick={loadWallets}
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
            Top 100 Wallets
          </h1>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Explore the most active and highest-balance wallets on the Pi Network
          </p>
          <div className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Activity className="w-3 h-3 text-amber-400" />
            <span className="text-xs font-medium text-amber-400">Sample data for privacy protection</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Total Balance</p>
                <p className="text-xl font-bold text-white">{formatNumber(stats.totalBalance)} π</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Activity className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Avg Activity Score</p>
                <p className="text-xl font-bold text-white">{stats.avgActivity.toFixed(1)}</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Active Wallets</p>
                <p className="text-xl font-bold text-white">{stats.activeCount} / 100</p>
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

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            {['all', 'active', 'dormant', 'new'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status as any)}
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

          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-gray-500" />
            {[
              { key: 'rank', label: 'Rank' },
              { key: 'balance', label: 'Balance' },
              { key: 'activity', label: 'Activity' },
            ].map((sort) => (
              <button
                key={sort.key}
                onClick={() => setSortBy(sort.key as any)}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  sortBy === sort.key
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'bg-white/5 text-gray-500 border border-white/10 hover:text-gray-400'
                }`}
              >
                {sort.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
              <span className="text-gray-400 text-sm">Loading wallets...</span>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden border border-white/10"
            style={{ background: 'linear-gradient(135deg, rgba(30, 33, 40, 0.6) 0%, rgba(20, 22, 28, 0.8) 100%)' }}
          >
            <div className="grid grid-cols-12 gap-4 p-4 bg-white/5 border-b border-white/10 text-xs font-bold text-gray-500 uppercase">
              <div className="col-span-1">Rank</div>
              <div className="col-span-4">Address</div>
              <div className="col-span-2 text-right">Balance</div>
              <div className="col-span-2 text-center">Activity</div>
              <div className="col-span-2 text-center">Last Active</div>
              <div className="col-span-1 text-center">Status</div>
            </div>

            <div className="max-h-[600px] overflow-y-auto">
              {filteredWallets.map((wallet, index) => {
                const statusColors = getStatusColor(wallet.status);
                return (
                  <div
                    key={wallet.rank}
                    className={`grid grid-cols-12 gap-4 p-4 items-center border-b border-white/5 hover:bg-white/5 transition-all ${
                      index < 3 ? 'bg-gradient-to-r from-yellow-500/5 to-transparent' : ''
                    }`}
                  >
                    <div className="col-span-1 flex items-center justify-center">
                      {getRankIcon(wallet.rank)}
                    </div>
                    <div className="col-span-4">
                      <span className="font-mono text-sm text-white">{wallet.address}</span>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="font-bold text-white">{formatNumber(wallet.balance)}</span>
                      <span className="text-cyan-400 ml-1">π</span>
                    </div>
                    <div className="col-span-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-500"
                            style={{ width: `${wallet.activityScore}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">{wallet.activityScore}</span>
                      </div>
                    </div>
                    <div className="col-span-2 text-center">
                      <div className="flex items-center justify-center gap-1 text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span className="text-xs">{formatTime(wallet.lastActive)}</span>
                      </div>
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${statusColors.bg} ${statusColors.text} border ${statusColors.border}`}>
                        {wallet.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-white/5 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Showing {filteredWallets.length} of {wallets.length} wallets
              </span>
              <span className="text-xs text-gray-500">
                {isMainnet ? 'Mainnet' : 'Testnet'} Data
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
