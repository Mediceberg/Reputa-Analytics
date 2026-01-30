import React, { useMemo } from 'react';
import { User, Wallet, Activity, Calendar, Award, Star, TrendingUp, Shield, Zap, Target } from 'lucide-react';
import { WalletData, AppMode } from '../protocol/types';
import { 
  calculateAtomicReputation, 
  generateDemoActivityData, 
  getLevelProgress,
  AtomicTrustLevel,
  TRUST_LEVEL_COLORS,
  AtomicReputationResult,
  getBackendScoreCap
} from '../protocol/atomicScoring';
import { DailyCheckIn } from './DailyCheckIn';
import { useLanguage } from '../hooks/useLanguage';
import { WalletActivityData } from '../services/piNetworkData';

interface ProfileSectionProps {
  walletData: WalletData;
  username: string;
  isProUser: boolean;
  mode: AppMode;
  userPoints: {
    total: number;
    checkIn: number;
    transactions: number;
    activity: number;
    streak: number;
  };
  onPointsEarned: (points: number, type: 'checkin' | 'merge') => void;
  activityData?: WalletActivityData;
}

function formatAddress(address: string): string {
  if (!address || address.length < 16) return address || 'Not Connected';
  return `${address.slice(0, 8)}...${address.slice(-8)}`;
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

const LEVEL_NAMES: Record<AtomicTrustLevel, { en: string; ar: string }> = {
  'Very Low Trust': { en: 'Very Low', ar: 'ضعيف جداً' },
  'Low Trust': { en: 'Low', ar: 'ضعيف' },
  'Medium': { en: 'Medium', ar: 'متوسط' },
  'Active': { en: 'Active', ar: 'نشط' },
  'Trusted': { en: 'Trusted', ar: 'موثوق' },
  'Pioneer+': { en: 'Pioneer+', ar: 'رائد+' },
  'Elite': { en: 'Elite', ar: 'نخبة' },
};

export function ProfileSection({ 
  walletData, 
  username, 
  isProUser, 
  mode,
  userPoints,
  onPointsEarned,
  activityData
}: ProfileSectionProps) {
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';
  const scoreCap = getBackendScoreCap();

  const atomicResult = useMemo<AtomicReputationResult>(() => {
    if (activityData) {
      return calculateAtomicReputation(activityData);
    }
    const demoData = generateDemoActivityData();
    demoData.accountAgeDays = walletData.accountAge || 180;
    demoData.internalTxCount = walletData.transactions?.length || 25;
    demoData.dailyCheckins = 0;
    demoData.adBonuses = 0;
    return calculateAtomicReputation(demoData);
  }, [activityData, walletData.accountAge, walletData.transactions?.length]);

  const levelProgress = useMemo(() => {
    const earnedPoints = userPoints.checkIn + userPoints.activity + userPoints.streak;
    return getLevelProgress(atomicResult.adjustedScore + earnedPoints);
  }, [atomicResult.adjustedScore, userPoints.checkIn, userPoints.activity, userPoints.streak]);

  const trustColors = TRUST_LEVEL_COLORS[levelProgress.currentLevel];
  const levelName = LEVEL_NAMES[levelProgress.currentLevel];

  return (
    <div className={`space-y-4 animate-in fade-in duration-300 ${isRTL ? 'rtl' : ''}`}>
      <div 
        className="rounded-xl p-4 sm:p-5"
        style={{ 
          background: 'linear-gradient(145deg, rgba(15, 17, 23, 0.95) 0%, rgba(20, 24, 32, 0.9) 100%)',
          border: `1px solid ${trustColors.border}`,
        }}
      >
        <div className="flex items-center gap-4 mb-4">
          <div 
            className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${trustColors.bg} 0%, rgba(0, 217, 255, 0.15) 100%)`,
              border: `1px solid ${trustColors.border}`,
            }}
          >
            <User className="w-7 h-7" style={{ color: trustColors.text }} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-white truncate">{username || 'Pioneer'}</h2>
              {isProUser && (
                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase text-amber-400 bg-amber-500/20">
                  VIP
                </span>
              )}
            </div>
            <p className="text-[11px] font-mono text-gray-500 truncate">{formatAddress(walletData.address)}</p>
            <div 
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg mt-1.5"
              style={{ background: trustColors.bg, border: `1px solid ${trustColors.border}` }}
            >
              {LEVEL_ICONS[levelProgress.currentLevel]}
              <span className="text-[10px] font-bold" style={{ color: trustColors.text }}>
                {isRTL ? levelName.ar : levelName.en} • Lv.{levelProgress.levelIndex + 1}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-lg text-center" style={{ background: `${trustColors.bg}`, border: `1px solid ${trustColors.border}` }}>
            <p className="text-[9px] uppercase text-gray-400 mb-0.5">{isRTL ? 'السمعة' : 'Score'}</p>
            <p className="text-xl font-black" style={{ color: trustColors.text }}>{levelProgress.displayScore.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-lg text-center" style={{ background: 'rgba(0, 217, 255, 0.1)', border: '1px solid rgba(0, 217, 255, 0.2)' }}>
            <p className="text-[9px] uppercase text-gray-400 mb-0.5">{isRTL ? 'الرصيد' : 'Balance'}</p>
            <p className="text-xl font-black text-cyan-400">{(walletData.balance || 0).toFixed(2)} π</p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5 text-[10px]">
            <span className="text-gray-400">Level {levelProgress.levelIndex + 1}/7</span>
            {levelProgress.nextLevel && (
              <span style={{ color: trustColors.text }}>{levelProgress.pointsToNextLevel.toLocaleString()} to next</span>
            )}
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.08)' }}>
            <div 
              className="h-full rounded-full transition-all duration-700"
              style={{ 
                width: `${levelProgress.progressInLevel}%`,
                background: `linear-gradient(90deg, ${trustColors.text} 0%, #00D9FF 100%)`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div className="p-2.5 rounded-lg text-center" style={{ background: 'rgba(0, 217, 255, 0.1)', border: '1px solid rgba(0, 217, 255, 0.15)' }}>
          <Wallet className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
          <p className="text-[9px] text-gray-500 mb-0.5">Tx</p>
          <p className="text-sm font-bold text-white">{walletData.transactions?.length || 0}</p>
        </div>
        <div className="p-2.5 rounded-lg text-center" style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
          <Calendar className="w-4 h-4 text-purple-400 mx-auto mb-1" />
          <p className="text-[9px] text-gray-500 mb-0.5">Age</p>
          <p className="text-sm font-bold text-white">{walletData.accountAge || 0}d</p>
        </div>
        <div className="p-2.5 rounded-lg text-center" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
          <Activity className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
          <p className="text-[9px] text-gray-500 mb-0.5">Recv</p>
          <p className="text-sm font-bold text-white">{walletData.transactions?.filter(tx => tx.type === 'received').length || 0}</p>
        </div>
        <div className="p-2.5 rounded-lg text-center" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
          <TrendingUp className="w-4 h-4 text-red-400 mx-auto mb-1" />
          <p className="text-[9px] text-gray-500 mb-0.5">Sent</p>
          <p className="text-sm font-bold text-white">{walletData.transactions?.filter(tx => tx.type === 'sent').length || 0}</p>
        </div>
      </div>

      <DailyCheckIn 
        onPointsEarned={onPointsEarned}
        isDemo={mode.mode === 'demo'}
      />

      <div 
        className="rounded-xl p-4"
        style={{ 
          background: 'linear-gradient(145deg, rgba(15, 17, 23, 0.9) 0%, rgba(20, 24, 32, 0.85) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-bold uppercase text-purple-400">{isRTL ? 'تفاصيل السمعة' : 'Score Breakdown'}</h3>
        </div>
        <div className="space-y-1.5">
          <ScoreRow label={isRTL ? 'عمر المحفظة' : 'Wallet Age'} value={atomicResult.walletAge.totalPoints} max={200} />
          <ScoreRow label={isRTL ? 'التفاعل' : 'Interaction'} value={atomicResult.interaction.totalPoints} max={300} />
          <ScoreRow label={isRTL ? 'معاملات Pi' : 'Pi Network'} value={atomicResult.piNetwork.totalPoints} max={250} />
          <ScoreRow label={isRTL ? 'Pi Dex' : 'Pi Dex'} value={atomicResult.piDex.totalPoints} max={200} />
          <ScoreRow label={isRTL ? 'Staking' : 'Staking'} value={atomicResult.staking.totalPoints} max={100} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const colorMap: Record<string, { border: string; bg: string }> = {
    cyan: { border: 'rgba(0, 217, 255, 0.2)', bg: 'rgba(0, 217, 255, 0.1)' },
    purple: { border: 'rgba(139, 92, 246, 0.2)', bg: 'rgba(139, 92, 246, 0.1)' },
    emerald: { border: 'rgba(16, 185, 129, 0.2)', bg: 'rgba(16, 185, 129, 0.1)' },
    pink: { border: 'rgba(236, 72, 153, 0.2)', bg: 'rgba(236, 72, 153, 0.1)' },
  };
  const colors = colorMap[color] || colorMap.cyan;

  return (
    <div 
      className="rounded-xl p-3"
      style={{ 
        background: `linear-gradient(145deg, ${colors.bg} 0%, rgba(15, 17, 23, 0.8) 100%)`,
        border: `1px solid ${colors.border}`,
      }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        {icon}
        <span className="text-[9px] font-bold uppercase" style={{ color: 'rgba(160, 164, 184, 0.7)' }}>{label}</span>
      </div>
      <p className="text-lg font-black text-white">{value}</p>
    </div>
  );
}

function ActivityBox({ label, value, color }: { label: string; value: number | string; color: string }) {
  const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    emerald: { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.25)', text: 'text-emerald-400' },
    red: { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.25)', text: 'text-red-400' },
    cyan: { bg: 'rgba(0, 217, 255, 0.1)', border: 'rgba(0, 217, 255, 0.25)', text: 'text-cyan-400' },
  };
  const colors = colorMap[color] || colorMap.cyan;

  return (
    <div 
      className="p-3 rounded-xl text-center"
      style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
    >
      <p className={`text-[10px] font-bold uppercase mb-1 ${colors.text}`}>{label}</p>
      <p className={`text-lg font-black ${colors.text}`}>{value}</p>
    </div>
  );
}

function ScoreRow({ label, value, max, isNegative }: { label: string; value: number; max?: number; isNegative?: boolean }) {
  const displayValue = value;
  const color = displayValue >= 0 ? (displayValue > 10 ? 'text-emerald-400' : 'text-gray-400') : 'text-red-400';
  const percentage = max ? Math.min(100, (Math.abs(value) / max) * 100) : 0;
  
  return (
    <div className="py-1.5" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs" style={{ color: 'rgba(160, 164, 184, 0.8)' }}>{label}</span>
        <span className={`text-sm font-bold ${color}`}>
          {displayValue >= 0 ? '+' : ''}{displayValue}
        </span>
      </div>
      {max && !isNegative && (
        <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{ 
              width: `${percentage}%`,
              background: displayValue > 0 ? 'linear-gradient(90deg, #10B981 0%, #059669 100%)' : 'rgba(255, 255, 255, 0.1)',
            }}
          />
        </div>
      )}
    </div>
  );
}
