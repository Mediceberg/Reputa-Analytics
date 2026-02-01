import React, { useMemo } from 'react'; 
import { User, Wallet, Activity, Calendar, Award, Star, TrendingUp, Shield, Zap, Target, Mail, ShieldCheck, HelpCircle, FileText } from 'lucide-react';
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
      {/* Unified Profile Card */}
      <div 
        className="rounded-2xl p-5 sm:p-6"
        style={{ 
          background: 'linear-gradient(145deg, rgba(15, 17, 23, 0.98) 0%, rgba(20, 24, 32, 0.95) 100%)',
          border: `1px solid ${trustColors.border}`,
          boxShadow: `0 8px 32px -8px ${trustColors.bg}`,
        }}
      >
        <div className="flex items-start gap-4 mb-6">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${trustColors.bg} 0%, rgba(0, 217, 255, 0.1) 100%)`,
              border: `1px solid ${trustColors.border}`,
            }}
          >
            <User className="w-8 h-8" style={{ color: trustColors.text }} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-white truncate">{username || 'Pioneer'}</h2>
              {isProUser && (
                <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase text-amber-400 bg-amber-500/20 border border-amber-500/30">
                  VIP
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-gray-500 font-mono text-[10px]">
              <Wallet className="w-3 h-3" />
              <span className="truncate">{formatAddress(walletData.address)}</span>
            </div>
            
            <div className="flex items-center gap-2 mt-2">
               <div 
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${mode.mode === 'mainnet' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                  {mode.mode}
                </span>
              </div>
              <div 
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
                style={{ background: trustColors.bg, border: `1px solid ${trustColors.border}` }}
              >
                {LEVEL_ICONS[levelProgress.currentLevel]}
                <span className="text-[9px] font-bold" style={{ color: trustColors.text }}>
                  {isRTL ? levelName.ar : levelName.en} • Lv.{levelProgress.levelIndex + 1}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Stats Row */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
            <p className="text-[9px] uppercase text-gray-500 mb-1 font-bold tracking-wider">{isRTL ? 'السمعة' : 'Reputation Score'}</p>
            <p className="text-2xl font-black" style={{ color: trustColors.text }}>{levelProgress.displayScore.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
            <p className="text-[9px] uppercase text-gray-500 mb-1 font-bold tracking-wider">{isRTL ? 'الرصيد' : 'Wallet Balance'}</p>
            <p className="text-2xl font-black text-white">{(walletData.balance || 0).toFixed(2)} <span className="text-sm text-amber-400">π</span></p>
          </div>
        </div>

        {/* Progress Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2 text-[10px]">
            <span className="text-gray-400 font-bold">LEVEL PROGRESS</span>
            {levelProgress.nextLevel && (
              <span style={{ color: trustColors.text }} className="font-bold">{levelProgress.pointsToNextLevel.toLocaleString()} PTS TO NEXT</span>
            )}
          </div>
          <div className="w-full h-1.5 rounded-full overflow-hidden bg-white/5">
            <div 
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{ 
                width: `${levelProgress.progressInLevel}%`,
                background: `linear-gradient(90deg, ${trustColors.text} 0%, #00D9FF 100%)`,
                boxShadow: `0 0 10px ${trustColors.text}40`,
              }}
            />
          </div>
        </div>

        {/* Activity Snapshot Section */}
        <div className="pt-6 border-t border-white/5">
          <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">{isRTL ? 'ملخص النشاط' : 'Activity Snapshot'}</h3>
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center">
              <p className="text-sm font-bold text-white">{walletData.transactions?.length || 0}</p>
              <p className="text-[8px] text-gray-500 uppercase font-bold">{isRTL ? 'فحوصات' : 'TXNS'}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-white">{walletData.accountAge || 0}d</p>
              <p className="text-[8px] text-gray-500 uppercase font-bold">{isRTL ? 'أيام نشطة' : 'DAYS'}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-emerald-400">{walletData.transactions?.filter(tx => tx.type === 'received').length || 0}</p>
              <p className="text-[8px] text-gray-500 uppercase font-bold">{isRTL ? 'وارد' : 'RECV'}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-red-400">{walletData.transactions?.filter(tx => tx.type === 'sent').length || 0}</p>
              <p className="text-[8px] text-gray-500 uppercase font-bold">{isRTL ? 'صادر' : 'SENT'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Actions / Support */}
      <div className="flex justify-center items-center gap-6 py-2">
        <button className="flex flex-col items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
          <ShieldCheck className="w-4 h-4 text-gray-400" />
          <span className="text-[8px] font-bold text-gray-500 uppercase">Privacy</span>
        </button>
        <button className="flex flex-col items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
          <FileText className="w-4 h-4 text-gray-400" />
          <span className="text-[8px] font-bold text-gray-500 uppercase">Terms</span>
        </button>
        <button className="flex flex-col items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
          <HelpCircle className="w-4 h-4 text-gray-400" />
          <span className="text-[8px] font-bold text-gray-500 uppercase">Help</span>
        </button>
        <a 
          href="mailto:reputa.score@gmail.com" 
          className="flex flex-col items-center gap-1 opacity-60 hover:opacity-100 transition-opacity"
        >
          <Mail className="w-4 h-4 text-red-400" />
          <span className="text-[8px] font-bold text-gray-500 uppercase">Support</span>
        </a>
      </div>

      {/* Check In Component */}
      <DailyCheckIn 
        onPointsEarned={onPointsEarned}
        isDemo={mode.mode === 'demo'}
      />

      {/* Score Breakdown Section */}
      <div 
        className="rounded-2xl p-5"
        style={{ 
          background: 'rgba(15, 17, 23, 0.6)',
          border: '1px solid rgba(139, 92, 246, 0.1)',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-4 h-4 text-purple-400" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400">{isRTL ? 'تفاصيل السمعة' : 'Reputation Breakdown'}</h3>
        </div>
        <div className="space-y-3">
          <ScoreRow label={isRTL ? 'عمر المحفظة' : 'Account Maturity'} value={atomicResult.walletAge.totalPoints} max={200} />
          <ScoreRow label={isRTL ? 'التفاعل' : 'Network Interaction'} value={atomicResult.interaction.totalPoints} max={300} />
          <ScoreRow label={isRTL ? 'معاملات Pi' : 'Protocol Usage'} value={atomicResult.piNetwork.totalPoints} max={250} />
          <ScoreRow label={isRTL ? 'Pi Dex' : 'DEX Activity'} value={atomicResult.piDex.totalPoints} max={200} />
          <ScoreRow label={isRTL ? 'Staking' : 'Trust Staking'} value={atomicResult.staking.totalPoints} max={100} />
        </div>
      </div>
    </div>
  );
}

function ScoreRow({ label, value, max, isNegative }: { label: string; value: number; max?: number; isNegative?: boolean }) {
  const displayValue = value;
  const color = displayValue >= 0 ? (displayValue > 10 ? 'text-emerald-400' : 'text-gray-400') : 'text-red-400';
  const percentage = max ? Math.min(100, (Math.abs(value) / max) * 100) : 0;
  
  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-medium text-gray-400">{label}</span>
        <span className={`text-xs font-bold ${color}`}>
          {displayValue >= 0 ? '+' : ''}{displayValue}
        </span>
      </div>
      {max && !isNegative && (
        <div className="w-full h-1 rounded-full overflow-hidden bg-white/5">
          <div 
            className="h-full rounded-full transition-all duration-700"
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

