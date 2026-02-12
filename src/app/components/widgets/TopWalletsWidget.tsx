import { useState, useEffect } from 'react';
import { Trophy, RefreshCw, ChevronDown, ChevronUp, Star, Zap } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { TRUST_LEVEL_COLORS, AtomicTrustLevel } from '../../protocol/atomicScoring';

interface TopReputaUser {
  rank: number;
  uid: string;
  username: string | null;
  walletAddress: string | null;
  reputationScore: number;
  trustLevel: AtomicTrustLevel;
  lastUpdated: string | null;
}

interface TopWalletsWidgetProps {
  isMainnet?: boolean;
  initialLimit?: number;
}

export function TopWalletsWidget({ initialLimit = 10 }: TopWalletsWidgetProps) {
  const { language } = useLanguage();
  const [users, setUsers] = useState<TopReputaUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayLimit, setDisplayLimit] = useState(initialLimit);
  const [expanded, setExpanded] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/user?action=getTopUsers&limit=100');
      const data = await response.json();
      
      if (data.success && data.data.users) {
        setUsers(data.data.users);
      } else {
        setUsers(getDemoUsers());
      }
    } catch (err) {
      console.error('Failed to fetch top users:', err);
      setUsers(getDemoUsers());
    } finally {
      setLoading(false);
    }
  };

  const getDemoUsers = (): TopReputaUser[] => {
    const trustLevels: AtomicTrustLevel[] = ['Atomic Legend', 'Oracle', 'Sentinel', 'Elite', 'Ambassador', 'Trusted', 'Verified', 'Contributor', 'Explorer', 'Novice'];
    const demoScores = [892, 756, 684, 632, 578, 521, 467, 412, 358, 305];
    
    return demoScores.map((score, i) => ({
      rank: i + 1,
      uid: `demo_${i + 1}`,
      username: generateDemoUsername(i),
      walletAddress: generateDemoWallet(i),
      reputationScore: score,
      trustLevel: trustLevels[i],
      lastUpdated: new Date().toISOString()
    }));
  };

  const generateDemoUsername = (index: number): string => {
    const prefixes = ['Pi', 'Crypto', 'Pioneer', 'Star', 'Alpha', 'Pro', 'Elite', 'Prime', 'Top', 'Best'];
    const suffixes = ['Master', 'King', 'Lord', 'Chief', 'Boss', 'Hero', 'Star', 'Pro', 'Dev', 'Whale'];
    return `${prefixes[index % prefixes.length]}${suffixes[(index + 3) % suffixes.length]}`;
  };

  const generateDemoWallet = (index: number): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ23456789';
    const prefix = Array.from({ length: 4 }, (_, j) => chars[(index * 7 + j * 3) % chars.length]).join('');
    const suffix = Array.from({ length: 5 }, (_, j) => chars[(index * 11 + j * 5) % chars.length]).join('');
    return `G${prefix}...${suffix}`;
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { bg: 'bg-amber-500/20', border: 'border-amber-500/50', text: 'text-amber-400', icon: '🥇' };
    if (rank === 2) return { bg: 'bg-gray-400/20', border: 'border-gray-400/50', text: 'text-gray-300', icon: '🥈' };
    if (rank === 3) return { bg: 'bg-amber-700/20', border: 'border-amber-700/50', text: 'text-amber-600', icon: '🥉' };
    if (rank <= 10) return { bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-400', icon: '' };
    return { bg: 'bg-white/5', border: 'border-white/10', text: 'text-gray-500', icon: '' };
  };

  const getTrustLevelColor = (level: AtomicTrustLevel): string => {
    const colors = TRUST_LEVEL_COLORS[level];
    return colors?.text || '#A0A4B8';
  };

  const toggleExpand = () => {
    setExpanded(!expanded);
    setDisplayLimit(expanded ? initialLimit : 100);
  };

  if (loading && users.length === 0) {
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
    <div className="glass-card p-4 sm:p-6 border border-purple-500/20 flex flex-col min-h-[400px]">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-amber-500/20 flex items-center justify-center border border-purple-500/30">
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-[12px] sm:text-sm font-black uppercase tracking-widest text-white">
              {language === 'ar' ? 'أفضل 100 تصنيف Reputa' : 'RANK TOP 100 REPUTA SCORE'}
            </h3>
            <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-purple-400">
              {language === 'ar' ? 'نخبة رواد الشبكة' : 'ELITE NETWORK PIONEERS'}
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
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-[10px] text-red-400">
          {error}
        </div>
      )}

      <div className={`space-y-2 flex-1 overflow-y-auto pr-1 custom-scrollbar ${expanded ? 'min-h-[60vh]' : 'min-h-[350px]'}`}>
        {users.length > 0 ? users.slice(0, displayLimit).map((user) => {
          const rankStyle = getRankBadge(user.rank);
          const trustColor = getTrustLevelColor(user.trustLevel);
          
          return (
            <div 
              key={user.uid}
              className={`p-2.5 sm:p-3 rounded-xl ${rankStyle.bg} border ${rankStyle.border} flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer`}
            >
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${user.rank <= 3 ? '' : 'bg-white/5'}`}>
                  {rankStyle.icon ? (
                    <span className="text-base sm:text-lg">{rankStyle.icon}</span>
                  ) : (
                    <span className={`text-[10px] font-black ${rankStyle.text}`}>#{user.rank}</span>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[10px] sm:text-[11px] font-mono font-bold text-white truncate">
                      {user.username || (user.walletAddress ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}` : `Pioneer_${user.uid.substring(0, 4)}`)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span 
                      className="text-[8px] font-bold uppercase tracking-widest truncate"
                      style={{ color: trustColor }}
                    >
                      {user.trustLevel}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right flex items-center gap-1.5 shrink-0 ml-2">
                <div>
                  <p className="text-xs sm:text-sm font-black text-white flex items-center justify-end gap-1">
                    {user.reputationScore.toLocaleString()}
                    <Star className="w-2.5 h-2.5 text-amber-400" />
                  </p>
                  <p className="text-[8px] text-gray-500 font-bold uppercase">
                    SCORE
                  </p>
                </div>
              </div>
            </div>
          );
        }) : !loading && (
          <div className="py-10 text-center text-gray-500 text-[10px] uppercase font-bold tracking-widest">
            No data available
          </div>
        )}
      </div>

      <button 
        onClick={toggleExpand}
        className="mt-4 py-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 flex items-center justify-center gap-2 transition-all group active:scale-95"
      >
        {expanded ? (
          <>
            <ChevronUp className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[9px] font-black uppercase tracking-widest text-purple-400">
              {language === 'ar' ? 'عرض أقل' : 'SHOW LESS'}
            </span>
          </>
        ) : (
          <>
            <ChevronDown className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[9px] font-black uppercase tracking-widest text-purple-400">
              {language === 'ar' ? 'عرض قائمة الـ 100' : 'EXPLORE TOP 100'}
            </span>
          </>
        )}
      </button>
    </div>
  );
}
