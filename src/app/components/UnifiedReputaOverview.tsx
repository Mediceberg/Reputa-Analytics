import React, { useMemo } from 'react'; 
import { motion } from 'motion/react'; 
import {
  Shield, 
  Star, 
  Activity, 
  Clock, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle, 
  Zap, 
  Award, 
  Target, 
  BarChart3,
  ArrowRightLeft
} from 'lucide-react';
import { 
  AtomicReputationResult, 
  AtomicTrustLevel,
  TRUST_LEVEL_COLORS,
  getBackendScoreCap,
  getLevelProgress,
  CATEGORY_LABELS
} from '../protocol/atomicScoring';

interface UnifiedReputaOverviewProps {
  result: AtomicReputationResult;
  isVerified?: boolean;
  language?: 'en' | 'ar';
}

const ATOMIC_TRUST_BENEFITS: Record<AtomicTrustLevel, { minScore: number; benefits: string[] }> = {
  'Atomic Legend': { minScore: 950_001, benefits: ['Ultimate access', 'Exclusive rewards', 'Protocol governance', 'Top 0.1% badge'] },
  'Oracle': { minScore: 850_001, benefits: ['Protocol review access', 'Advanced analytics', 'Priority governance'] },
  'Sentinel': { minScore: 750_001, benefits: ['Network guardian role', 'Enhanced security', 'Priority support'] },
  'Elite': { minScore: 600_001, benefits: ['Priority processing', 'Reduced fees', 'VIP support', 'Early features'] },
  'Ambassador': { minScore: 450_001, benefits: ['Enhanced limits', 'Priority support', 'Community badges'] },
  'Trusted': { minScore: 300_001, benefits: ['Higher limits', 'Enhanced security', 'Community badges'] },
  'Verified': { minScore: 150_001, benefits: ['Standard limits', 'Full features', 'Regular support'] },
  'Contributor': { minScore: 50_001, benefits: ['Standard limits', 'Basic features access'] },
  'Explorer': { minScore: 10_001, benefits: ['Limited features', 'Basic access'] },
  'Novice': { minScore: 0, benefits: ['Very limited features', 'Verification required'] },
};

function CircularGauge({ score, maxScore, trustLevel }: { score: number; maxScore: number; trustLevel: AtomicTrustLevel }) {
  const colors = TRUST_LEVEL_COLORS[trustLevel];
  const percentage = Math.min(100, Math.max(0, (score / maxScore) * 100));
  const circumference = 2 * Math.PI * 80;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-48 h-48 mx-auto">
      <svg className="w-full h-full -rotate-90">
        <circle
          cx="96"
          cy="96"
          r="80"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="12"
        />
        <motion.circle
          cx="96"
          cy="96"
          r="80"
          fill="none"
          stroke={colors.text}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          style={{
            filter: `drop-shadow(0 0 10px ${colors.text}50)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span 
          className="text-5xl font-black text-white"
          style={{ fontFamily: 'var(--font-mono)' }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {score}
        </motion.span>
        <span className="text-xs text-gray-500 uppercase tracking-wider">/ {maxScore}</span>
      </div>
    </div>
  );
}

function CategoryProgressBar({ 
  label, 
  value, 
  maxValue, 
  icon: Icon, 
  color 
}: { 
  label: string; 
  value: number; 
  maxValue: number; 
  icon: React.ComponentType<any>; 
  color: string;
}) {
  const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color }} />
          <span className="text-sm text-gray-300">{label}</span>
        </div>
        <span className="text-sm font-bold" style={{ color }}>
          {Math.round(percentage)}%
        </span>
      </div>
      <div className="h-3 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{
            background: `linear-gradient(90deg, ${color}80, ${color})`,
            boxShadow: `0 0 10px ${color}50`,
          }}
        />
      </div>
    </div>
  );
}

function formatStatValue(value: string | number): string {
  if (typeof value === 'number') {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 10_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toLocaleString();
  }
  return value;
}

function QuickStatCard({ 
  icon: Icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ComponentType<any>; 
  label: string; 
  value: string | number; 
  color: string;
}) {
  const displayValue = formatStatValue(value);
  const isLong = displayValue.length > 8;

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-white/5 border border-white/10 overflow-hidden">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" style={{ color }} />
        <span className="text-[10px] sm:text-xs text-gray-500 uppercase truncate">{label}</span>
      </div>
      <p className={`font-bold text-white truncate ${isLong ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'}`}>
        {displayValue}
      </p>
    </div>
  );
}

export function UnifiedReputaOverview({ result, isVerified = false, language = 'en' }: UnifiedReputaOverviewProps) {
  const maxScore = getBackendScoreCap();
  const progress = getLevelProgress(result.adjustedScore);
  const colors = TRUST_LEVEL_COLORS[result.trustLevel];

  const scoreBreakdown = useMemo(() => {
    // Use the weighted silo scores (50/30/20) from atomicResult.breakdown
    const bd = result.breakdown;
    const mainnetPct = bd?.mainnetPercent ?? 0;
    const testnetPct = bd?.testnetPercent ?? 0;
    const appPct = bd?.appPercent ?? 0;

    // Show 3 main silos with their weight-based percentages
    // Mainnet (50%) includes: Wallet Age + Transactions + DEX + Staking
    // App (30%) includes: Check-ins + Ad Bonuses + Reports + Tools
    // Testnet (20%) includes: Testnet Transactions + SDK + Weekly Activity
    return [
      { 
        id: 'mainnet',
        label: language === 'ar' ? 'Mainnet (50%)' : 'Mainnet (50%)', 
        value: mainnetPct, 
        max: 100, 
        icon: ArrowRightLeft, 
        color: '#00D9FF' 
      },
      { 
        id: 'app_engage',
        label: language === 'ar' ? 'تفاعل التطبيق (30%)' : 'App Engagement (30%)', 
        value: appPct, 
        max: 100, 
        icon: Zap, 
        color: '#F97316' 
      },
      { 
        id: 'testnet',
        label: language === 'ar' ? 'Testnet (20%)' : 'Testnet (20%)', 
        value: testnetPct, 
        max: 100, 
        icon: TrendingUp, 
        color: '#8B5CF6' 
      },
      { 
        id: 'wallet_age',
        label: language === 'ar' ? 'عمر المحفظة' : 'Wallet Age', 
        value: result.walletAge.totalPoints, 
        max: Math.max(1, result.walletAge.totalPoints + result.piNetwork.totalPoints), 
        icon: Clock, 
        color: '#10B981' 
      },
      { 
        id: 'staking',
        label: language === 'ar' ? 'Staking' : 'Staking Status', 
        value: result.staking.totalPoints, 
        max: Math.max(1, result.staking.totalPoints + 50000), 
        icon: Shield, 
        color: '#F59E0B' 
      },
    ];
  }, [result, language]);

  const quickStats = useMemo(() => [
    { 
      id: 'transactions',
      icon: ArrowRightLeft, 
      label: language === 'ar' ? 'المعاملات' : 'Transactions', 
      value: result.piNetwork.internalTxCount + result.piNetwork.appInteractions + result.piNetwork.sdkPayments,
      color: '#00D9FF'
    },
    { 
      id: 'account_age',
      icon: Clock, 
      label: language === 'ar' ? 'عمر الحساب' : 'Account Age', 
      value: `${result.walletAge.activeMonths} mo`,
      color: '#8B5CF6'
    },
    { 
      id: 'activity_level',
      icon: Zap, 
      label: language === 'ar' ? 'مستوى النشاط' : 'Activity Level', 
      value: `${Math.min(100, Math.round((result.adjustedScore / maxScore) * 100))}%`,
      color: '#F59E0B'
    },
    { 
      id: 'trust_percentile',
      icon: Target, 
      label: language === 'ar' ? 'المرتبة' : 'Trust Percentile', 
      value: `Top ${Math.max(5, 100 - Math.round((result.adjustedScore / maxScore) * 100))}%`,
      color: '#10B981'
    },
  ], [result, maxScore, language]);

  const trustLevels: AtomicTrustLevel[] = ['Atomic Legend', 'Oracle', 'Sentinel', 'Elite', 'Ambassador', 'Trusted', 'Verified', 'Contributor', 'Explorer', 'Novice'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <div 
          className="p-8 rounded-2xl text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(30, 33, 40, 0.6) 0%, rgba(20, 22, 28, 0.8) 100%)',
            border: `1px solid ${colors.border}`,
            boxShadow: `0 0 40px ${colors.text}10`,
          }}
        >
          <CircularGauge 
            score={result.adjustedScore} 
            maxScore={maxScore} 
            trustLevel={result.trustLevel} 
          />

          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl mb-4 mt-6"
            style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Award className="w-5 h-5" style={{ color: colors.text }} />
            <span className="text-lg font-bold" style={{ color: colors.text }}>
              {result.trustLevel}
            </span>
          </motion.div>

          <div className="flex items-center justify-center gap-2 mt-4">
            {isVerified ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-emerald-400 font-medium">
                  {language === 'ar' ? 'موثق على البلوكتشين' : 'On-Chain Verified'}
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-amber-400 font-medium">
                  {language === 'ar' ? 'نتيجة تقديرية' : 'Estimated Score'}
                </span>
              </>
            )}
          </div>

          {!isVerified && (
            <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs text-amber-400">
                {language === 'ar' 
                  ? 'اربط محفظتك للحصول على تحليل دقيق' 
                  : 'Connect your wallet for accurate on-chain analysis'}
              </p>
            </div>
          )}

          {progress.nextLevel && (
            <div className="mt-4 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
              <p className="text-xs text-cyan-400">
                {language === 'ar' 
                  ? `${progress.pointsToNextLevel} نقطة للوصول إلى ${progress.nextLevel}` 
                  : `${progress.pointsToNextLevel} pts to reach ${progress.nextLevel}`}
              </p>
              <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500"
                  style={{ width: `${progress.progressInLevel}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <div 
          className="p-6 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(30, 33, 40, 0.6) 0%, rgba(20, 22, 28, 0.8) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
          }}
        >
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            {language === 'ar' ? 'تفاصيل النقاط - بروتوكول Atomic' : 'Score Breakdown - Atomic Protocol'}
          </h3>

          <div className="space-y-5">
            {scoreBreakdown.map((item) => (
              <div key={item.id}>
                <CategoryProgressBar
                  label={item.label}
                  value={item.value}
                  maxValue={item.max}
                  icon={item.icon}
                  color={item.color}
                />
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-green-400">+{result.rawScore - Math.abs(result.externalPenalty.totalPenalty + result.suspiciousPenalty.totalPenalty)}</span>
                <span className="text-gray-500">{language === 'ar' ? 'نقاط إيجابية' : 'Positive Points'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-red-400">{result.externalPenalty.totalPenalty + result.suspiciousPenalty.totalPenalty}</span>
                <span className="text-gray-500">{language === 'ar' ? 'خصومات' : 'Penalties'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {quickStats.map((stat) => (
            <div key={stat.id}>
              <QuickStatCard
                icon={stat.icon}
                label={stat.label}
                value={stat.value}
                color={stat.color}
              />
            </div>
          ))}
        </div>

        <div 
          className="p-6 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(30, 33, 40, 0.6) 0%, rgba(20, 22, 28, 0.8) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
          }}
        >
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400" />
            {language === 'ar' ? 'مزايا مستوى الثقة' : 'Trust Level Benefits'}
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {(['Atomic Legend', 'Elite', 'Trusted', 'Novice'] as AtomicTrustLevel[]).map((level, index) => {
              const isCurrentTier = level === result.trustLevel;
              const tierColors = TRUST_LEVEL_COLORS[level];
              const tierBenefits = ATOMIC_TRUST_BENEFITS[level];
              
              return (
                <div
                  key={index}
                  className={`p-4 rounded-xl transition-all ${isCurrentTier ? 'ring-2' : 'opacity-60'}`}
                    style={{
                    background: isCurrentTier ? `${tierColors.text}10` : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isCurrentTier ? tierColors.border : 'rgba(255,255,255,0.1)'}`,
                    boxShadow: isCurrentTier ? `0 0 10px ${tierColors.text}55` : undefined,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold" style={{ color: tierColors.text }}>{level}</span>
                    <span className="text-xs text-gray-500">({tierBenefits.minScore}+ pts)</span>
                  </div>
                  <ul className="space-y-1">
                    {tierBenefits.benefits.map((benefit, i) => (
                      <li key={i} className="text-xs text-gray-400 flex items-center gap-1">
                        <div className="w-1 h-1 rounded-full" style={{ background: tierColors.text }} />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UnifiedReputaOverview;
