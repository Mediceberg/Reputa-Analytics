import { useState } from 'react';
import { Info, X, Zap, Gift, Activity, Clock, TrendingUp, Award, ArrowRight, Star } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface PointsExplainerProps {
  currentPoints: number;
  checkInPoints?: number;
  transactionPoints?: number;
  activityPoints?: number;
  streakBonus?: number;
}

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

const LEVELS = [
  { name: 'Pioneer', minPoints: 0, maxPoints: 99, color: '#6B7280' },
  { name: 'Explorer', minPoints: 100, maxPoints: 499, color: '#10B981' },
  { name: 'Trader', minPoints: 500, maxPoints: 999, color: '#00D9FF' },
  { name: 'Whale', minPoints: 1000, maxPoints: 4999, color: '#8B5CF6' },
  { name: 'Legend', minPoints: 5000, maxPoints: Infinity, color: '#F59E0B' },
];

export function PointsExplainer({ 
  currentPoints, 
  checkInPoints = 0, 
  transactionPoints = 0, 
  activityPoints = 0,
  streakBonus = 0 
}: PointsExplainerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();

  const currentLevel = LEVELS.find(l => currentPoints >= l.minPoints && currentPoints <= l.maxPoints) || LEVELS[0];
  const nextLevel = LEVELS.find(l => l.minPoints > currentPoints);
  const progressToNext = nextLevel 
    ? ((currentPoints - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100
    : 100;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Learn how points are calculated"
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/50"
      >
        <Info className="w-4 h-4" />
        <span className="text-xs font-bold">How Points Work</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          <div 
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
            style={{
              background: 'linear-gradient(180deg, #0F1117 0%, #0A0B0F 100%)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              boxShadow: '0 0 60px rgba(245, 158, 11, 0.2)',
            }}
          >
            <div className="sticky top-0 z-10 p-6 border-b border-white/10" style={{ background: '#0F1117' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(251, 191, 36, 0.2) 100%)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                    }}
                  >
                    <Zap className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black uppercase text-white">Points System</h2>
                    <p className="text-xs text-gray-500">How to earn and level up</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Close"
                  className="p-2 rounded-lg hover:bg-white/10 transition-all"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div 
                className="p-5 rounded-xl"
                style={{
                  background: `linear-gradient(135deg, ${currentLevel.color}15 0%, ${currentLevel.color}05 100%)`,
                  border: `1px solid ${currentLevel.color}40`,
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Current Level</p>
                    <p className="text-2xl font-black" style={{ color: currentLevel.color }}>
                      {currentLevel.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">Total Points</p>
                    <p className="text-2xl font-black text-white">{currentPoints.toLocaleString()}</p>
                  </div>
                </div>
                
                {nextLevel && (
                  <div>
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                      <span>{currentLevel.name}</span>
                      <span className="flex items-center gap-1">
                        <ArrowRight className="w-3 h-3" />
                        {nextLevel.name} ({nextLevel.minPoints} pts)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${Math.min(progressToNext, 100)}%`,
                          background: `linear-gradient(90deg, ${currentLevel.color} 0%, ${nextLevel.color} 100%)`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      {nextLevel.minPoints - currentPoints} points to {nextLevel.name}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-[10px] font-bold uppercase text-emerald-400 mb-1">Check-ins</p>
                  <p className="text-lg font-black text-white">{checkInPoints}</p>
                </div>
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                  <p className="text-[10px] font-bold uppercase text-cyan-400 mb-1">Transactions</p>
                  <p className="text-lg font-black text-white">{transactionPoints}</p>
                </div>
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <p className="text-[10px] font-bold uppercase text-purple-400 mb-1">Activity</p>
                  <p className="text-lg font-black text-white">{activityPoints}</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <p className="text-[10px] font-bold uppercase text-amber-400 mb-1">Streak</p>
                  <p className="text-lg font-black text-white">{streakBonus}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase text-white">How to Earn Points</h3>
                
                {POINTS_BREAKDOWN.map((category, idx) => {
                  const Icon = category.icon;
                  const colorMap: Record<string, string> = {
                    emerald: 'rgba(16, 185, 129',
                    cyan: 'rgba(0, 217, 255',
                    purple: 'rgba(139, 92, 246',
                  };
                  const color = colorMap[category.color] || colorMap.cyan;
                  
                  return (
                    <div 
                      key={idx}
                      className="p-4 rounded-xl"
                      style={{
                        background: `${color}, 0.05)`,
                        border: `1px solid ${color}, 0.2)`,
                      }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Icon className="w-4 h-4" style={{ color: `${color}, 1)` }} />
                        <span className="text-sm font-bold" style={{ color: `${color}, 1)` }}>
                          {category.category}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {category.items.map((item, itemIdx) => (
                          <div key={itemIdx} className="flex items-center justify-between">
                            <div>
                              <span className="text-sm text-white">{item.action}</span>
                              <span className="text-xs text-gray-500 ml-2">({item.description})</span>
                            </div>
                            <span className="px-2 py-1 rounded-full text-xs font-bold" style={{ 
                              background: `${color}, 0.2)`,
                              color: `${color}, 1)`,
                            }}>
                              +{item.points} pts
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  Level Benefits
                </h3>
                
                <div className="grid gap-2">
                  {LEVELS.map((level, idx) => (
                    <div 
                      key={idx}
                      className={`p-3 rounded-xl flex items-center justify-between ${
                        level.name === currentLevel.name ? '' : 'opacity-60'
                      }`}
                      style={{
                        background: `${level.color}10`,
                        border: `1px solid ${level.color}30`,
                        boxShadow: level.name === currentLevel.name ? `0 0 0 2px ${level.color}` : 'none',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <Star className="w-4 h-4" style={{ color: level.color }} />
                        <div>
                          <span className="font-bold text-white">{level.name}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({level.minPoints}{level.maxPoints === Infinity ? '+' : `-${level.maxPoints}`} pts)
                          </span>
                        </div>
                      </div>
                      {level.name === currentLevel.name && (
                        <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-white/10 text-white">
                          Current
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
