import { useState, useEffect } from 'react';
import { Trophy, RefreshCw, Wallet, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchTopWallets, TopWallet } from '../../services/piNetworkData';
import { useLanguage } from '../../hooks/useLanguage';

interface TopWalletsWidgetProps {
  isMainnet?: boolean;
  initialLimit?: number;
}

export function TopWalletsWidget({ isMainnet = false, initialLimit = 10 }: TopWalletsWidgetProps) {
  const { t } = useLanguage();
  const [wallets, setWallets] = useState<TopWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayLimit, setDisplayLimit] = useState(initialLimit);
  const [expanded, setExpanded] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTopWallets(isMainnet);
      setWallets(data);
    } catch (err) {
      setError('Failed to fetch wallet data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isMainnet]);

  const formatNumber = (num: number): string => {
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const getStatusColor = (status: TopWallet['status']) => {
    switch (status) {
      case 'active': return 'bg-emerald-500';
      case 'dormant': return 'bg-amber-500';
      case 'new': return 'bg-cyan-500';
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { bg: 'bg-amber-500/20', border: 'border-amber-500/50', text: 'text-amber-400', icon: '🥇' };
    if (rank === 2) return { bg: 'bg-gray-400/20', border: 'border-gray-400/50', text: 'text-gray-300', icon: '🥈' };
    if (rank === 3) return { bg: 'bg-amber-700/20', border: 'border-amber-700/50', text: 'text-amber-600', icon: '🥉' };
    if (rank <= 10) return { bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-400', icon: '' };
    return { bg: 'bg-white/5', border: 'border-white/10', text: 'text-gray-500', icon: '' };
  };

  const toggleExpand = () => {
    setExpanded(!expanded);
    setDisplayLimit(expanded ? initialLimit : 100);
  };

  if (loading && wallets.length === 0) {
    return (
      <div className="glass-card p-6 border border-purple-500/20 animate-pulse">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20" />
          <div className="h-4 w-40 bg-white/10 rounded" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-14 bg-white/5 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 border border-purple-500/20 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-amber-500/20 flex items-center justify-center border border-purple-500/30">
            <Trophy className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-white">
              Top 100 Wallets
            </h3>
            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">
              By Balance
            </span>
          </div>
        </div>
        
        <button 
          onClick={fetchData}
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

      {/* Wallet List */}
      <div className={`space-y-2 ${expanded ? 'max-h-[500px] overflow-y-auto pr-2 custom-scrollbar' : ''}`}>
        {wallets.slice(0, displayLimit).map((wallet) => {
          const rankStyle = getRankBadge(wallet.rank);
          return (
            <div 
              key={wallet.rank}
              className={`p-3 rounded-xl ${rankStyle.bg} border ${rankStyle.border} flex items-center justify-between group hover:scale-[1.01] transition-all cursor-pointer`}
            >
              <div className="flex items-center gap-3">
                {/* Rank */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${wallet.rank <= 3 ? '' : 'bg-white/5'}`}>
                  {rankStyle.icon ? (
                    <span className="text-lg">{rankStyle.icon}</span>
                  ) : (
                    <span className={`text-xs font-black ${rankStyle.text}`}>#{wallet.rank}</span>
                  )}
                </div>

                {/* Address */}
                <div>
                  <div className="flex items-center gap-2">
                    <Wallet className="w-3 h-3 text-gray-500" />
                    <span className="text-[11px] font-mono font-bold text-white">{wallet.address}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(wallet.status)}`} />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">
                      {wallet.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Balance */}
              <div className="text-right">
                <p className="text-sm font-black text-white">
                  {formatNumber(wallet.balance)} <span className="text-cyan-400 text-[10px]">π</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expand/Collapse Button */}
      <button 
        onClick={toggleExpand}
        className="mt-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center gap-2 transition-all group"
      >
        {expanded ? (
          <>
            <ChevronUp className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors">Show Less</span>
          </>
        ) : (
          <>
            <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors">Show All 100</span>
          </>
        )}
      </button>

    </div>
  );
}
