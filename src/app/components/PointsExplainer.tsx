import { useState } from 'react';
import { Info, Zap, Gift, Activity, TrendingUp, Award, ArrowRight, Star, ChevronLeft } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import {
  getLevelProgress,
  getBackendScoreCap,
  TRUST_LEVEL_COLORS,
  AtomicTrustLevel
} from '../protocol/atomicScoring';

interface PointsExplainerProps {
  currentPoints: number;
  checkInPoints?: number;
  transactionPoints?: number;
  activityPoints?: number;
  streakBonus?: number;
  controlledOpen?: boolean;
  setControlledOpen?: (v: boolean) => void;
}

const SCORE_CAP = getBackendScoreCap();

const LEVELS: { name: AtomicTrustLevel; minPoints: number; maxPoints: number }[] = [
  { name: 'Very Low Trust', minPoints: -Infinity, maxPoints: 0 },
  { name: 'Low Trust', minPoints: 0, maxPoints: Math.floor(SCORE_CAP * 0.10) },
  { name: 'Medium', minPoints: Math.floor(SCORE_CAP * 0.10), maxPoints: Math.floor(SCORE_CAP * 0.25) },
  { name: 'Active', minPoints: Math.floor(SCORE_CAP * 0.25), maxPoints: Math.floor(SCORE_CAP * 0.45) },
  { name: 'Trusted', minPoints: Math.floor(SCORE_CAP * 0.45), maxPoints: Math.floor(SCORE_CAP * 0.65) },
  { name: 'Pioneer+', minPoints: Math.floor(SCORE_CAP * 0.65), maxPoints: Math.floor(SCORE_CAP * 0.85) },
  { name: 'Elite', minPoints: Math.floor(SCORE_CAP * 0.85), maxPoints: Infinity },
];

const POINTS_BREAKDOWN = [
  {
    category: 'Daily Check-in',
    icon: Gift,
    color: 'emerald',
    items: [
      { action: 'Daily check-in', points: 3, description: 'One per 24 hours' },
      { action: 'Watch bonus ad', points: 5, description: 'After check-in' },
      { action: '7-day streak', points: 10, description: 'Bonus reward' },
    ],
  },
  {
    category: 'Transactions',
    icon: Activity,
    color: 'cyan',
    items: [
      { action: 'Send Pi', points: 2, description: 'Per transaction' },
      { action: 'Receive Pi', points: 1, description: 'Per transaction' },
      { action: 'Pi Dex trade', points: 5, description: 'Per trade' },
    ],
  },
  {
    category: 'Activity',
    icon: TrendingUp,
    color: 'purple',
    items: [
      { action: 'Active wallet (30d)', points: 15, description: 'Monthly bonus' },
      { action: 'High volume trader', points: 25, description: '100+ txns' },
      { action: 'Account age bonus', points: 10, description: 'Per year' },
    ],
  },
];

export function PointsExplainer({
  currentPoints,
  checkInPoints = 0,
  transactionPoints = 0,
  activityPoints = 0,
  streakBonus = 0,
  controlledOpen,
  setControlledOpen
}: PointsExplainerProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const { t } = useLanguage();

  const levelProgress = getLevelProgress(currentPoints);
  const currentLevelColors = TRUST_LEVEL_COLORS[levelProgress.currentLevel];

  const nextLevelData = levelProgress.nextLevel ? LEVELS.find(l => l.name === levelProgress.nextLevel) : null;

  const open = controlledOpen ?? internalOpen;
  const setOpen = (v: boolean) => {
    if (typeof setControlledOpen === 'function') setControlledOpen(v);
    else setInternalOpen(v);
  };

  return (
    <>
      {!setControlledOpen && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Learn how points are calculated"
          className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          style={{
            background: currentLevelColors.bg,
            border: `1px solid ${currentLevelColors.border}`,
          }}
        >
          <Info className="w-4 h-4" style={{ color: currentLevelColors.text }} />
          <span className="text-xs font-bold" style={{ color: currentLevelColors.text }}>How Points Work</span>
        </button>
      )}

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 pointer-events-none">
            <div
              className="pointer-events-auto w-full max-w-3xl mx-4 rounded-xl overflow-hidden flex flex-col"
              style={{ background: 'rgba(15, 17, 23, 0.98)', border: '1px solid rgba(255,255,255,0.06)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex-shrink-0 px-4 py-3 flex items-center gap-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Go back"
                  className="p-2 -ml-2 rounded-lg hover:bg-white/5 transition-all"
                >
                  <ChevronLeft className="w-5 h-5 text-white/70" />
                </button>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      background: currentLevelColors.bg,
                      border: `1px solid ${currentLevelColors.border}`,
                    }}
                  >
                    <Zap className="w-4 h-4" style={{ color: currentLevelColors.text }} />
                  </div>
                  <div>
                    <h1 className="text-sm font-bold text-white">Points System</h1>
                    <p className="text-[10px] text-white/40">Atomic Scoring Protocol</p>
                  </div>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-4">
                  {/* Current Level Card */}
                  <div
                    className="p-4 rounded-xl"
                    style={{
                      background: 'rgba(20, 22, 30, 0.8)',
                      border: `1px solid ${currentLevelColors.border}`,
                      boxShadow: `0 0 30px ${currentLevelColors.bg}`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Current Level</p>
                        <p className="text-xl font-black" style={{ color: currentLevelColors.text }}>
                          {levelProgress.currentLevel}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Total Points</p>
                        <p className="text-2xl font-black text-white">{levelProgress.displayScore.toLocaleString()}</p>
                      </div>
                    </div>

                    {levelProgress.nextLevel && nextLevelData && (
                      <div className="pt-3 border-t border-white/5">
                        <div className="flex items-center justify-between text-[10px] text-white/50 mb-2">
                          <span>{levelProgress.currentLevel}</span>
                          <span className="flex items-center gap-1">
                            <ArrowRight className="w-3 h-3" />
                            {levelProgress.nextLevel} ({nextLevelData.minPoints.toLocaleString()} pts)
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(levelProgress.progressInLevel, 100)}%`,
                              background: `linear-gradient(90deg, ${currentLevelColors.text} 0%, ${TRUST_LEVEL_COLORS[levelProgress.nextLevel].text} 100%)`,
                            }}
                          />
                        </div>
                        <p className="text-[10px] text-white/40 mt-2 text-center">
                          {levelProgress.pointsToNextLevel.toLocaleString()} points to {levelProgress.nextLevel}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Points Breakdown Stats */}
                  <div className="grid grid-cols-4 gap-2">
                    <div className="p-2.5 rounded-xl text-center" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      <p className="text-[8px] font-bold uppercase text-emerald-400 mb-0.5">Check-ins</p>
                      <p className="text-base font-black text-white">{checkInPoints}</p>
                    </div>
                    <div className="p-2.5 rounded-xl text-center" style={{ background: 'rgba(0, 217, 255, 0.1)', border: '1px solid rgba(0, 217, 255, 0.2)' }}>
                      <p className="text-[8px] font-bold uppercase text-cyan-400 mb-0.5">Transactions</p>
                      <p className="text-base font-black text-white">{transactionPoints}</p>
                    </div>
                    <div className="p-2.5 rounded-xl text-center" style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                      <p className="text-[8px] font-bold uppercase text-purple-400 mb-0.5">Activity</p>
                      <p className="text-base font-black text-white">{activityPoints}</p>
                    </div>
                    <div className="p-2.5 rounded-xl text-center" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                      <p className="text-[8px] font-bold uppercase text-amber-400 mb-0.5">Streak</p>
                      <p className="text-base font-black text-white">{streakBonus}</p>
                    </div>
                  </div>

                  {/* Points Breakdown Categories */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase text-white/80 tracking-wider">How to Earn Points</h3>
                    {POINTS_BREAKDOWN.map((category, idx) => {
                      const Icon = category.icon;
                      const colorMap: Record<string, { bg: string; text: string; border: string }> = {
                        emerald: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10B981', border: 'rgba(16, 185, 129, 0.25)' },
                        cyan: { bg: 'rgba(0, 217, 255, 0.1)', text: '#00D9FF', border: 'rgba(0, 217, 255, 0.25)' },
                        purple: { bg: 'rgba(139, 92, 246, 0.1)', text: '#8B5CF6', border: 'rgba(139, 92, 246, 0.25)' },
                      };
                      const colors = colorMap[category.color] || colorMap.cyan;

                      return (
                        <div
                          key={idx}
                          className="p-3 rounded-xl"
                          style={{
                            background: colors.bg,
                            border: `1px solid ${colors.border}`,
                          }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className="w-4 h-4" style={{ color: colors.text }} />
                            <span className="text-xs font-bold" style={{ color: colors.text }}>
                              {category.category}
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            {category.items.map((item, itemIdx) => (
                              <div key={itemIdx} className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <span className="text-xs text-white font-medium">{item.action}</span>
                                  <span className="text-[10px] text-white/40 ml-1">({item.description})</span>
                                </div>
                                <span
                                  className="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ml-2"
                                  style={{
                                    background: colors.bg,
                                    color: colors.text,
                                    border: `1px solid ${colors.border}`,
                                  }}
                                >
                                  +{item.points}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Trust Levels */}
                  <div className="space-y-3 pb-4">
                    <h3 className="text-xs font-bold uppercase text-white/80 tracking-wider flex items-center gap-2">
                      <Award className="w-4 h-4" style={{ color: currentLevelColors.text }} />
                      Trust Levels (Max: {SCORE_CAP.toLocaleString()} pts)
                    </h3>

                    <div className="space-y-1.5">
                      {LEVELS.filter(l => l.minPoints > -Infinity).map((level, idx) => {
                        const levelColors = TRUST_LEVEL_COLORS[level.name];
                        const isCurrentLevel = level.name === levelProgress.currentLevel;

                        return (
                          <div
                            key={idx}
                            className="px-3 py-2.5 rounded-xl flex items-center justify-between"
                            style={{
                              background: isCurrentLevel ? levelColors.bg : 'rgba(255, 255, 255, 0.02)',
                              border: `1px solid ${isCurrentLevel ? levelColors.border : 'rgba(255, 255, 255, 0.05)'}`,
                              boxShadow: isCurrentLevel ? `0 0 15px ${levelColors.bg}` : 'none',
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <Star
                                className="w-3.5 h-3.5"
                                style={{ color: isCurrentLevel ? levelColors.text : 'rgba(255, 255, 255, 0.3)' }}
                              />
                              <div>
                                <span
                                  className="text-xs font-bold"
                                  style={{ color: isCurrentLevel ? levelColors.text : 'rgba(255, 255, 255, 0.6)' }}
                                >
                                  {level.name}
                                </span>
                                <span className="text-[9px] text-white/30 ml-1.5">
                                  ({level.minPoints.toLocaleString()}{level.maxPoints === Infinity ? '+' : `-${level.maxPoints.toLocaleString()}`})
                                </span>
                              </div>
                            </div>
                            {isCurrentLevel && (
                              <span
                                className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase"
                                style={{
                                  background: levelColors.bg,
                                  color: levelColors.text,
                                  border: `1px solid ${levelColors.border}`
                                }}
                              >
                                Current
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
