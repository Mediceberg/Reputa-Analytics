import { User, Shield, Zap, Award, Star, TrendingUp, Share2 } from 'lucide-react'; 
import { AtomicTrustLevel, TRUST_LEVEL_COLORS } from '../protocol/atomicScoring';

interface MainCardProps {
  username: string;
  walletAddress: string;
  balance?: number;
  reputaScore: number;
  level: number;
  trustLevel: AtomicTrustLevel;
  progressPercent: number;
  pointsToNext: number;
  maxPoints: number;
  isVip?: boolean;
  onShare?: () => void;
}

const LEVEL_ICONS: Record<AtomicTrustLevel, React.ReactNode> = {
  'Very Low Trust': <Shield className="w-4 h-4" />,
  'Low Trust': <Shield className="w-4 h-4" />,
  'Medium': <Shield className="w-4 h-4" />,
  'Active': <Zap className="w-4 h-4" />,
  'Trusted': <Star className="w-4 h-4" />,
  'Pioneer+': <Award className="w-4 h-4" />,
  'Elite': <Award className="w-4 h-4" />,
};

const TRUST_LABELS: Record<AtomicTrustLevel, { label: string; nextLabel: string }> = {
  'Very Low Trust': { label: 'VERY LOW', nextLabel: 'Low' },
  'Low Trust': { label: 'LOW TRUST', nextLabel: 'Medium' },
  'Medium': { label: 'MEDIUM', nextLabel: 'Active' },
  'Active': { label: 'ACTIVE', nextLabel: 'Trusted' },
  'Trusted': { label: 'TRUSTED', nextLabel: 'Pioneer+' },
  'Pioneer+': { label: 'PIONEER+', nextLabel: 'Elite' },
  'Elite': { label: 'ELITE', nextLabel: 'Max' },
};

export function MainCard({
  username,
  walletAddress,
  balance,
  reputaScore,
  level,
  trustLevel,
  progressPercent,
  pointsToNext,
  maxPoints,
  isVip = false,
  onShare,
}: MainCardProps) {
  const trustColors = TRUST_LEVEL_COLORS[trustLevel];
  const trustInfo = TRUST_LABELS[trustLevel];

  const formatAddress = (addr: string) => {
    if (!addr || addr.length < 16) return addr || 'Not Connected';
    return `${addr.slice(0, 8)}...${addr.slice(-4)}...${addr.endsWith('DEMO') ? 'DEMO' : addr.slice(-4)}`;
  };

  return (
    <div 
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, rgba(20, 22, 30, 0.98) 0%, rgba(15, 17, 23, 0.95) 100%)',
        border: `1px solid ${trustColors.border}`,
        boxShadow: `0 4px 30px ${trustColors.bg}, 0 0 0 1px rgba(0, 0, 0, 0.3)`,
      }}
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: `linear-gradient(135deg, ${trustColors.bg} 0%, rgba(0, 217, 255, 0.15) 100%)`,
              border: `1.5px solid ${trustColors.border}`,
              boxShadow: `0 0 20px ${trustColors.bg}`,
            }}
          >
            <User className="w-6 h-6" style={{ color: trustColors.text }} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white truncate">{username || 'Pioneer'}</h2>
              {isVip && (
                <span 
                  className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase"
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.3) 0%, rgba(251, 191, 36, 0.2) 100%)',
                    border: '1px solid rgba(245, 158, 11, 0.5)',
                    color: '#F59E0B',
                  }}
                >
                  VIP
                </span>
              )}
            </div>
            <p className="text-[11px] font-mono text-gray-500 truncate">{formatAddress(walletAddress)}</p>
          </div>
          
          {onShare && (
            <button
              onClick={onShare}
              className="p-2.5 rounded-xl transition-all active:scale-95 shrink-0"
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(168, 85, 247, 0.15) 100%)',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                boxShadow: '0 0 15px rgba(139, 92, 246, 0.2)',
              }}
              title="Share your score"
            >
              <Share2 className="w-5 h-5 text-purple-400" />
            </button>
          )}
        </div>

        <div 
          className="flex items-center justify-between p-3 rounded-xl mb-4"
          style={{
            background: 'linear-gradient(135deg, rgba(0, 217, 255, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)',
            border: '1px solid rgba(0, 217, 255, 0.25)',
            boxShadow: '0 4px 15px rgba(0, 217, 255, 0.1)',
          }}
        >
          <div className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(0, 217, 255, 0.2) 0%, rgba(139, 92, 246, 0.15) 100%)',
                border: '1px solid rgba(0, 217, 255, 0.3)',
              }}
            >
              <span className="text-cyan-400 font-bold text-lg">π</span>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-medium">Wallet Balance</p>
              <p className="text-xl font-black text-cyan-400">
                {balance !== undefined ? balance.toFixed(2) : '--'} <span className="text-base">π</span>
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-gray-500 uppercase">Network</p>
            <p className="text-sm font-bold text-purple-400">Pi Mainnet</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <div 
            className="p-3 rounded-xl text-center"
            style={{
              background: `linear-gradient(145deg, ${trustColors.bg} 0%, rgba(0, 0, 0, 0.4) 100%)`,
              border: `1px solid ${trustColors.border}`,
            }}
          >
            <p className="text-2xl sm:text-3xl font-black" style={{ color: trustColors.text }}>
              {reputaScore}
            </p>
            <div className="flex items-center justify-center gap-1 mt-1">
              <span className="text-[9px] uppercase font-bold text-gray-400">Reputa</span>
              <span 
                className="text-[8px] px-1 py-0.5 rounded"
                style={{ background: trustColors.bg, color: trustColors.text }}
              >
                {progressPercent}%
              </span>
            </div>
            <p className="text-[9px] uppercase font-bold text-gray-400">Score</p>
          </div>

          <div 
            className="p-3 rounded-xl text-center flex flex-col items-center justify-center"
            style={{
              background: 'linear-gradient(145deg, rgba(139, 92, 246, 0.15) 0%, rgba(0, 0, 0, 0.4) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
            }}
          >
            <p className="text-2xl sm:text-3xl font-black text-purple-400">{level}</p>
            <p className="text-[9px] uppercase font-bold text-gray-400 mt-1">Level</p>
          </div>

          <div 
            className="p-3 rounded-xl text-center flex flex-col items-center justify-center"
            style={{
              background: `linear-gradient(145deg, ${trustColors.bg} 0%, rgba(0, 0, 0, 0.4) 100%)`,
              border: `1px solid ${trustColors.border}`,
            }}
          >
            <div 
              className="px-2 py-1 rounded-lg mb-1"
              style={{ background: trustColors.bg, border: `1px solid ${trustColors.border}` }}
            >
              <p className="text-xs sm:text-sm font-black uppercase" style={{ color: trustColors.text }}>
                {trustInfo.label}
              </p>
            </div>
            <p className="text-[9px] uppercase font-bold text-gray-400">Trust Rank</p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase" style={{ color: trustColors.text }}>
                {trustInfo.label}
              </span>
              <TrendingUp className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-400">{trustInfo.nextLabel}</span>
            </div>
            <span className="text-xs font-bold" style={{ color: trustColors.text }}>
              {pointsToNext.toLocaleString()} pts to next
            </span>
          </div>

          <div className="relative">
            <div 
              className="w-full h-2.5 rounded-full overflow-hidden"
              style={{ background: 'rgba(255, 255, 255, 0.08)' }}
            >
              <div 
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ 
                  width: `${progressPercent}%`,
                  background: `linear-gradient(90deg, ${trustColors.text} 0%, #00D9FF 100%)`,
                  boxShadow: `0 0 10px ${trustColors.text}`,
                }}
              />
            </div>
            
            <div className="absolute top-1/2 -translate-y-1/2 left-0 w-3 h-3 rounded-full" 
              style={{ 
                background: trustColors.text, 
                boxShadow: `0 0 8px ${trustColors.text}`,
                left: `calc(${progressPercent}% - 6px)`,
              }} 
            />
          </div>

          <div className="flex items-center justify-between mt-2 text-[10px]">
            <span className="text-gray-500">{progressPercent}% complete</span>
            <span className="text-gray-400">Max: {maxPoints.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
