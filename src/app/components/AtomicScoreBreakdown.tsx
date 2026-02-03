import React, { useState } from 'react'; 
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Clock, 
  Zap, 
  ArrowRightLeft, 
  TrendingUp, 
  Lock, 
  AlertTriangle, 
  ChevronDown,
  ChevronUp,
  Info,
  X
} from 'lucide-react';
import { 
  AtomicReputationResult, 
  AtomicScoreItem, 
  AtomicTrustLevel,
  TRUST_LEVEL_COLORS,
  CATEGORY_LABELS 
} from '../protocol/atomicScoring';

interface AtomicScoreBreakdownProps {
  result: AtomicReputationResult;
  language?: 'en' | 'ar';
}

const categoryIcons: Record<string, React.ReactNode> = {
  'wallet_age': <Clock className="w-4 h-4" />,
  'interaction': <Zap className="w-4 h-4" />,
  'pi_network': <ArrowRightLeft className="w-4 h-4" />,
  'pi_dex': <TrendingUp className="w-4 h-4" />,
  'staking': <Lock className="w-4 h-4" />,
  'external_penalty': <AlertTriangle className="w-4 h-4" />,
  'suspicious': <AlertTriangle className="w-4 h-4" />,
};

function TrustLevelBadge({ level }: { level: AtomicTrustLevel }) {
  const colors = TRUST_LEVEL_COLORS[level];
  
  return (
    <span 
      className="px-3 py-1 rounded-full text-sm font-bold"
      style={{
        background: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
      }}
    >
      {level}
    </span>
  );
}

function ScoreGauge({ score, maxScore = 200 }: { score: number; maxScore?: number }) {
  const percentage = Math.min(Math.max((score / maxScore) * 100, 0), 100);
  const isNegative = score < 0;
  
  return (
    <div className="relative w-full h-4 bg-gray-800 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="h-full rounded-full"
        style={{
          background: isNegative 
            ? 'linear-gradient(90deg, #EF4444, #F97316)'
            : 'linear-gradient(90deg, #00D9FF, #8B5CF6)',
        }}
      />
      <div 
        className="absolute top-0 left-0 w-full h-full"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
        }}
      />
    </div>
  );
}

function CategoryCard({ 
  category, 
  items, 
  totalPoints,
  language = 'en'
}: { 
  category: string; 
  items: AtomicScoreItem[]; 
  totalPoints: number;
  language?: 'en' | 'ar';
}) {
  const [expanded, setExpanded] = useState(false);
  const isNegative = totalPoints < 0;
  const label = CATEGORY_LABELS[category]?.[language] || category;
  
  return (
    <div 
      className="rounded-xl overflow-hidden"
      style={{
        background: 'rgba(30, 33, 40, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
        aria-expanded={expanded}
        aria-label={`${label} - ${totalPoints} points`}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: isNegative 
                ? 'rgba(239, 68, 68, 0.2)' 
                : 'rgba(0, 217, 255, 0.2)',
              color: isNegative ? '#EF4444' : '#00D9FF',
            }}
          >
            {categoryIcons[category]}
          </div>
          <span className="font-medium text-white/90">{label}</span>
        </div>
        <div className="flex items-center gap-3">
          <span 
            className="font-bold text-lg"
            style={{ color: isNegative ? '#EF4444' : '#22C55E' }}
          >
            {isNegative ? '' : '+'}{totalPoints}
          </span>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>
      
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-white/10"
          >
            <div className="p-4 space-y-2 min-h-48 overflow-y-auto">
              {items.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-2">
                  {language === 'ar' ? 'لا توجد نقاط في هذه الفئة' : 'No points in this category'}
                </p>
              ) : (
                items.map((item, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5"
                  >
                    <span className="text-sm text-gray-300" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                      {item.explanation}
                    </span>
                    <div className="flex items-center gap-2">
                      <span 
                        className="font-mono text-sm font-bold"
                        style={{ color: item.points < 0 ? '#EF4444' : '#22C55E' }}
                      >
                        {item.points > 0 ? '+' : ''}{item.points}
                      </span>
                      {item.decayFactor && item.decayFactor < 1 && (
                        <span className="text-xs text-amber-400">
                          ×{item.decayFactor.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AtomicScoreBreakdown({ result, language = 'en' }: AtomicScoreBreakdownProps) {
  const [showInfo, setShowInfo] = useState(false);
  
  const categories = [
    { key: 'wallet_age', items: result.walletAge.items, total: result.walletAge.totalPoints },
    { key: 'interaction', items: result.interaction.items, total: result.interaction.totalPoints },
    { key: 'pi_network', items: result.piNetwork.items, total: result.piNetwork.totalPoints },
    { key: 'pi_dex', items: result.piDex.items, total: result.piDex.totalPoints },
    { key: 'staking', items: result.staking.items, total: result.staking.totalPoints },
    { key: 'external_penalty', items: result.externalPenalty.items, total: result.externalPenalty.totalPenalty },
    { key: 'suspicious', items: result.suspiciousPenalty.items, total: result.suspiciousPenalty.totalPenalty },
  ];
  
  const positiveTotal = categories
    .filter(c => c.total > 0)
    .reduce((sum, c) => sum + c.total, 0);
  const negativeTotal = categories
    .filter(c => c.total < 0)
    .reduce((sum, c) => sum + c.total, 0);
  
  return (
    <div className="space-y-6">
      <div 
        className="glass-card p-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 33, 40, 0.8) 0%, rgba(20, 22, 28, 0.9) 100%)',
          border: '1px solid rgba(0, 217, 255, 0.2)',
        }}
      >
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            background: 'radial-gradient(circle at 30% 20%, rgba(0, 217, 255, 0.3) 0%, transparent 50%)',
          }}
        />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 217, 255, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
                  border: '1px solid rgba(0, 217, 255, 0.3)',
                }}
              >
                <Shield className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {language === 'ar' ? 'بروتوكول السمعة الذري' : 'Atomic Reputation Protocol'}
                </h3>
                <p className="text-sm text-gray-400">
                  {language === 'ar' ? 'نظام تقييم عادل وشفاف' : 'Fair & Transparent Scoring'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowInfo(true)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Show info"
            >
              <Info className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-400 mb-1">
                {language === 'ar' ? 'النتيجة المعدلة' : 'Adjusted Score'}
              </p>
              <div className="flex items-baseline gap-2">
                <span 
                  className="text-4xl font-bold"
                  style={{ 
                    color: TRUST_LEVEL_COLORS[result.trustLevel].text,
                    textShadow: `0 0 20px ${TRUST_LEVEL_COLORS[result.trustLevel].text}40`,
                  }}
                >
                  {result.adjustedScore}
                </span>
                <span className="text-gray-500 text-sm">
                  / 200+
                </span>
              </div>
            </div>
            <TrustLevelBadge level={result.trustLevel} />
          </div>
          
          <ScoreGauge score={result.adjustedScore} />
          
          <div className="flex items-center justify-between mt-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-green-400">+{positiveTotal}</span>
              <span className="text-gray-500">
                {language === 'ar' ? 'نقاط إيجابية' : 'Positive'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-red-400">{negativeTotal}</span>
              <span className="text-gray-500">
                {language === 'ar' ? 'خصومات' : 'Penalties'}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
          {language === 'ar' ? 'تفاصيل النقاط' : 'Score Breakdown'}
        </h4>
        {categories.map(cat => (
          <div key={cat.key}>
            <CategoryCard
              category={cat.key}
              items={cat.items}
              totalPoints={cat.total}
              language={language}
            />
          </div>
        ))}
      </div>
      
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
            onClick={() => setShowInfo(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl p-6 min-h-[80vh] overflow-y-auto"
              style={{
                background: 'linear-gradient(135deg, rgba(30, 33, 40, 0.98) 0%, rgba(20, 22, 28, 0.98) 100%)',
                border: '1px solid rgba(0, 217, 255, 0.3)',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">
                  {language === 'ar' ? 'كيف يعمل النظام؟' : 'How It Works'}
                </h3>
                <button
                  onClick={() => setShowInfo(false)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              
              <div className="space-y-4 text-sm text-gray-300" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <div>
                  <h4 className="font-bold text-cyan-400 mb-2">
                    {language === 'ar' ? 'نظام التنقيط الذري' : 'Atomic Scoring System'}
                  </h4>
                  <p>
                    {language === 'ar' 
                      ? 'نظام سمعة ديناميكي لا يعتمد على حجم المحفظة. يقيّم التفاعل، الاستمرارية، والسلوك الاقتصادي.'
                      : 'A dynamic reputation system that doesn\'t rely on wallet size. Evaluates interaction, consistency, and economic behavior.'}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-bold text-purple-400 mb-2">
                    {language === 'ar' ? 'مستويات الثقة' : 'Trust Levels'}
                  </h4>
                  <div className="space-y-1">
                    {Object.entries(TRUST_LEVEL_COLORS).map(([level, colors]) => (
                      <div key={level} className="flex items-center gap-2">
                        <span 
                          className="w-3 h-3 rounded-full"
                          style={{ background: colors.text }}
                        />
                        <span>{level}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-bold text-amber-400 mb-2">
                    {language === 'ar' ? 'تناقص الزمن' : 'Time Decay'}
                  </h4>
                  <p>
                    {language === 'ar' 
                      ? 'النقاط الإيجابية القديمة تفقد قيمتها تدريجياً. النشاط الحديث له وزن أعلى.'
                      : 'Older positive points gradually lose value. Recent activity has higher weight.'}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AtomicScoreBreakdown;
