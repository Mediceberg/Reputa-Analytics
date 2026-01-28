import { useMemo } from 'react';
import { User, Wallet, Activity, Calendar, Award, CheckCircle, Star, TrendingUp, Shield, Zap, Target, Flame } from 'lucide-react';
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
import { MiningDaysWidget } from './MiningDaysWidget';
import { PointsExplainer } from './PointsExplainer';
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
  onPointsEarned: (points: number, type: 'checkin' | 'ad') => void;
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
    <div className={`space-y-5 animate-in fade-in duration-300 ${isRTL ? 'rtl' : ''}`}>
      <div 
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{ 
          background: 'linear-gradient(145deg, rgba(15, 17, 23, 0.95) 0%, rgba(20, 24, 32, 0.9) 100%)',
          border: `1px solid ${trustColors.border}`,
          boxShadow: `0 0 40px ${trustColors.bg}`,
        }}
      >
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(circle at 80% 20%, ${trustColors.text}20 0%, transparent 50%)`,
          }}
        />

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-center gap-5 mb-6">
            <div className="relative flex-shrink-0">
              <div 
                className="w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${trustColors.bg} 0%, rgba(0, 217, 255, 0.15) 100%)`,
                  border: `2px solid ${trustColors.border}`,
                  boxShadow: `0 0 30px ${trustColors.bg}, inset 0 0 20px ${trustColors.bg}`,
                }}
              >
                <User className="w-10 h-10" style={{ color: trustColors.text }} />
              </div>
              <div 
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  border: '2px solid rgba(10, 11, 15, 0.9)',
                  boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)',
                }}
              >
                <CheckCircle className="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <h2 className="text-xl font-bold text-white truncate">
                  {username || 'Pioneer'}
                </h2>
                {isProUser && (
                  <span 
                    className="px-2 py-0.5 rounded text-[9px] font-black uppercase text-amber-400 bg-amber-500/20"
                    style={{ border: '1px solid rgba(245, 158, 11, 0.4)' }}
                  >
                    VIP
                  </span>
                )}
              </div>
              <p className="text-xs font-mono mb-3" style={{ color: 'rgba(160, 164, 184, 0.6)' }}>
                {formatAddress(walletData.address)}
              </p>
              
              <div 
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{ 
                  background: trustColors.bg, 
                  border: `1px solid ${trustColors.border}`,
                  boxShadow: `0 0 15px ${trustColors.bg}`,
                }}
              >
                {LEVEL_ICONS[levelProgress.currentLevel]}
                <span 
                  className="text-xs font-bold uppercase"
                  style={{ color: trustColors.text }}
                >
                  {isRTL ? levelName.ar : levelName.en}
                </span>
                <span 
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(0,0,0,0.3)', color: trustColors.text }}
                >
                  Lv.{levelProgress.levelIndex + 1}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div 
              className="p-4 rounded-xl text-center"
              style={{
                background: `linear-gradient(145deg, ${trustColors.bg} 0%, rgba(0, 0, 0, 0.3) 100%)`,
                border: `1px solid ${trustColors.border}`,
              }}
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <Target className="w-4 h-4" style={{ color: trustColors.text }} />
                <span className="text-[10px] font-bold uppercase" style={{ color: 'rgba(160, 164, 184, 0.7)' }}>
                  {isRTL ? 'نقاط السمعة' : 'Reputa Score'}
                </span>
              </div>
              <p className="text-2xl font-black" style={{ color: trustColors.text }}>
                {levelProgress.displayScore.toLocaleString()}
              </p>
            </div>

            <div 
              className="p-4 rounded-xl text-center"
              style={{
                background: 'linear-gradient(145deg, rgba(139, 92, 246, 0.15) 0%, rgba(0, 0, 0, 0.3) 100%)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
              }}
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <Flame className="w-4 h-4 text-purple-400" />
                <span className="text-[10px] font-bold uppercase" style={{ color: 'rgba(160, 164, 184, 0.7)' }}>
                  {isRTL ? 'إجمالي النقاط' : 'Total Points'}
                </span>
              </div>
              <p className="text-2xl font-black text-purple-400">
                {userPoints.total.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="mb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase" style={{ color: 'rgba(160, 164, 184, 0.6)' }}>
                {isRTL ? 'المستوى' : 'Level'} {levelProgress.levelIndex + 1}/7
              </span>
              {levelProgress.nextLevel && (
                <span className="text-[10px] font-medium" style={{ color: trustColors.text }}>
                  {levelProgress.pointsToNextLevel.toLocaleString()} {isRTL ? 'نقطة لـ' : 'pts to'} {isRTL ? LEVEL_NAMES[levelProgress.nextLevel].ar : LEVEL_NAMES[levelProgress.nextLevel].en}
                </span>
              )}
            </div>
            
            <div className="relative">
              <div 
                className="w-full h-3 rounded-full overflow-hidden"
                style={{ background: 'rgba(255, 255, 255, 0.08)' }}
              >
                <div 
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ 
                    width: `${levelProgress.progressInLevel}%`,
                    background: `linear-gradient(90deg, ${trustColors.text} 0%, ${trustColors.border} 100%)`,
                    boxShadow: `0 0 15px ${trustColors.text}`,
                  }}
                />
              </div>
              
              <div className="absolute -top-0.5 left-0 right-0 flex justify-between pointer-events-none">
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="w-1 h-4 rounded-full"
                    style={{
                      background: i <= levelProgress.levelIndex 
                        ? trustColors.text 
                        : 'rgba(255, 255, 255, 0.1)',
                      boxShadow: i <= levelProgress.levelIndex ? `0 0 5px ${trustColors.text}` : 'none',
                    }}
                  />
                ))}
              </div>
            </div>
            
            <p className="text-[9px] mt-2 text-center" style={{ color: 'rgba(160, 164, 184, 0.5)' }}>
              {isRTL 
                ? `الحد الأقصى للنظام: ${scoreCap.toLocaleString()} نقطة`
                : `System cap: ${scoreCap.toLocaleString()} pts`
              }
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard 
          icon={<Wallet className="w-4 h-4 text-cyan-400" />}
          label={isRTL ? 'الرصيد' : 'Balance'}
          value={`${(walletData.balance || 0).toFixed(2)} π`}
          color="cyan"
        />
        <StatCard 
          icon={<Activity className="w-4 h-4 text-purple-400" />}
          label={isRTL ? 'المعاملات' : 'Transactions'}
          value={walletData.transactions?.length?.toString() || '0'}
          color="purple"
        />
        <StatCard 
          icon={<Calendar className="w-4 h-4 text-emerald-400" />}
          label={isRTL ? 'عمر الحساب' : 'Account Age'}
          value={`${walletData.accountAge || 0} ${isRTL ? 'يوم' : 'days'}`}
          color="emerald"
        />
        <StatCard 
          icon={<TrendingUp className="w-4 h-4 text-pink-400" />}
          label={isRTL ? 'نشاط أسبوعي' : 'Weekly'}
          value={`${atomicResult.piDex.regularActivity || 0}`}
          color="pink"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div 
          className="rounded-xl p-5"
          style={{ 
            background: 'linear-gradient(145deg, rgba(15, 17, 23, 0.9) 0%, rgba(20, 24, 32, 0.85) 100%)',
            border: '1px solid rgba(0, 217, 255, 0.2)',
          }}
        >
          <h3 className="text-sm font-bold uppercase tracking-wide mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-400">{isRTL ? 'ملخص النشاط' : 'Activity Summary'}</span>
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <ActivityBox 
              label={isRTL ? 'مستلم' : 'Received'} 
              value={walletData.transactions?.filter(tx => tx.type === 'received').length || 0}
              color="emerald"
            />
            <ActivityBox 
              label={isRTL ? 'مرسل' : 'Sent'} 
              value={walletData.transactions?.filter(tx => tx.type === 'sent').length || 0}
              color="red"
            />
            <ActivityBox 
              label={isRTL ? 'الحجم' : 'Volume'} 
              value={`${(walletData.transactions?.reduce((acc, tx) => acc + tx.amount, 0) || 0).toFixed(1)}π`}
              color="cyan"
            />
          </div>
        </div>

        <div 
          className="rounded-xl p-5"
          style={{ 
            background: 'linear-gradient(145deg, rgba(15, 17, 23, 0.9) 0%, rgba(20, 24, 32, 0.85) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
          }}
        >
          <h3 className="text-sm font-bold uppercase tracking-wide mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-400" />
            <span className="text-purple-400">{isRTL ? 'تفاصيل السمعة' : 'Score Breakdown'}</span>
          </h3>
          <div className="space-y-2">
            <ScoreRow label={isRTL ? 'عمر المحفظة' : 'Wallet Age'} value={atomicResult.walletAge.totalPoints} max={200} />
            <ScoreRow label={isRTL ? 'التفاعل' : 'Interaction'} value={atomicResult.interaction.totalPoints} max={300} />
            <ScoreRow label={isRTL ? 'معاملات Pi' : 'Pi Network'} value={atomicResult.piNetwork.totalPoints} max={250} />
            <ScoreRow label={isRTL ? 'Pi Dex' : 'Pi Dex'} value={atomicResult.piDex.totalPoints} max={200} />
            <ScoreRow label={isRTL ? 'Staking' : 'Staking'} value={atomicResult.staking.totalPoints} max={100} />
            <ScoreRow 
              label={isRTL ? 'عقوبات' : 'Penalties'} 
              value={-(atomicResult.externalPenalty.totalPenalty + atomicResult.suspiciousPenalty.totalPenalty)} 
              isNegative 
            />
          </div>
        </div>
      </div>

      <DailyCheckIn 
        onPointsEarned={onPointsEarned}
        isDemo={mode.mode === 'demo'}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MiningDaysWidget 
          miningDays={walletData.accountAge || 0}
          isDemo={mode.mode === 'demo'}
        />
        <div 
          className="rounded-xl p-4 flex items-center justify-between"
          style={{ 
            background: 'linear-gradient(145deg, rgba(15, 17, 23, 0.9) 0%, rgba(20, 24, 32, 0.85) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
          }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(0, 217, 255, 0.15) 100%)',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                boxShadow: '0 0 20px rgba(139, 92, 246, 0.2)',
              }}
            >
              <Award className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-0.5">
                {isRTL ? 'نقاط المستخدم' : 'User Points'}
              </p>
              <p className="text-2xl font-black text-white">{userPoints.total.toLocaleString()}</p>
            </div>
          </div>
          <PointsExplainer 
            currentPoints={userPoints.total}
            checkInPoints={userPoints.checkIn}
            transactionPoints={userPoints.transactions}
            activityPoints={userPoints.activity}
            streakBonus={userPoints.streak}
          />
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
