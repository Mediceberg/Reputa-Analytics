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
  Lock,
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
  'Elite': { minScore: 8500, benefits: ['Priority transaction processing', 'Reduced fees', 'VIP support access', 'Early feature access'] },
  'Pioneer+': { minScore: 6500, benefits: ['Enhanced transaction limits', 'Priority support', 'Special community badges'] },
  'Trusted': { minScore: 4500, benefits: ['Higher transaction limits', 'Enhanced security features', 'Community badges'] },
  'Active': { minScore: 2500, benefits: ['Standard transaction limits', 'Basic features access', 'Regular support'] },
  'Medium': { minScore: 1000, benefits: ['Standard transaction limits', 'Basic features access'] },
  'Low Trust': { minScore: 0, benefits: ['Limited features', 'Higher verification requirements'] },
  'Very Low Trust': { minScore: -1000, benefits: ['Very limited features', 'Full verification required'] },
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
  return (
    <div className="p-5 rounded-xl bg-white/5 border border-white/10">
      <div className="flex items-center gap-3 mb-2">
        <Icon className="w-5 h-5" style={{ color }} />
        <span className="text-xs text-gray-500 uppercase">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

export function UnifiedReputaOverview({ result, isVerified = false, language = 'en' }: UnifiedReputaOverviewProps) {
  const maxScore = getBackendScoreCap();
  const progress = getLevelProgress(result.adjustedScore);
  const colors = TRUST_LEVEL_COLORS[result.trustLevel];

  const scoreBreakdown = useMemo(() => {
    const totalPositive = Math.max(1, 
      result.walletAge.totalPoints + 
      result.interaction.totalPoints + 
      result.piNetwork.totalPoints + 
      result.piDex.totalPoints + 
      result.staking.totalPoints
    );

    return [
      { 
        id: 'pi_network',
        label: language === 'ar' ? 'معاملات Pi Network' : 'Pi Network Transactions', 
        value: result.piNetwork.totalPoints, 
        max: totalPositive, 
        icon: ArrowRightLeft, 
        color: '#00D9FF' 
      },
      { 
        id: 'wallet_age',
        label: language === 'ar' ? 'عمر المحفظة' : 'Wallet Age', 
        value: result.walletAge.totalPoints, 
        max: totalPositive, 
        icon: Clock, 
        color: '#8B5CF6' 
      },
      { 
        id: 'interaction',
        label: language === 'ar' ? 'التفاعل' : 'Interaction', 
        value: result.interaction.totalPoints, 
        max: totalPositive, 
        icon: Zap, 
        color: '#F97316' 
      },
      { 
        id: 'pi_dex',
        label: language === 'ar' ? 'نشاط Pi Dex' : 'Pi Dex Activity', 
        value: result.piDex.totalPoints, 
        max: totalPositive, 
        icon: TrendingUp, 
        color: '#10B981' 
      },
      { 
        id: 'staking',
        label: language === 'ar' ? 'Staking' : 'Staking Status', 
        value: result.staking.totalPoints, 
        max: totalPositive, 
        icon: Lock, 
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
      value: `${Math.min(100, Math.round((result.interaction.totalPoints / 50) * 100))}%`,
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

  const trustLevels: AtomicTrustLevel[] = ['Elite', 'Pioneer+', 'Trusted', 'Active', 'Medium', 'Low Trust', 'Very Low Trust'];

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
            {(['Elite', 'Pioneer+', 'Medium', 'Low Trust'] as AtomicTrustLevel[]).map((level, index) => {
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
