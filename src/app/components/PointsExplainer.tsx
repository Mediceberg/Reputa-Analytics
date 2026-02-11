import { useState } from 'react';
import { Info, Zap, ArrowRight, Star, ChevronLeft, Award } from 'lucide-react';
import {
  getLevelProgress,
  getBackendScoreCap,
  TRUST_LEVEL_COLORS,
  AtomicTrustLevel,
} from '../protocol/atomicScoring';

interface PointsExplainerProps {
  currentPoints: number;
  mainnetPoints?: number;
  testnetPoints?: number;
  appEngagementPoints?: number;
  controlledOpen?: boolean;
  setControlledOpen?: (v: boolean) => void;
}

const SCORE_CAP = getBackendScoreCap();

const LEVELS: { name: AtomicTrustLevel; minPoints: number; maxPoints: number }[] = [
  { name: 'Very Low Trust', minPoints: -Infinity, maxPoints: 0 },
  { name: 'Low Trust', minPoints: 0, maxPoints: Math.floor(SCORE_CAP * 0.1) },
  { name: 'Medium', minPoints: Math.floor(SCORE_CAP * 0.1), maxPoints: Math.floor(SCORE_CAP * 0.25) },
  { name: 'Active', minPoints: Math.floor(SCORE_CAP * 0.25), maxPoints: Math.floor(SCORE_CAP * 0.45) },
  { name: 'Trusted', minPoints: Math.floor(SCORE_CAP * 0.45), maxPoints: Math.floor(SCORE_CAP * 0.65) },
  { name: 'Pioneer+', minPoints: Math.floor(SCORE_CAP * 0.65), maxPoints: Math.floor(SCORE_CAP * 0.85) },
  { name: 'Elite', minPoints: Math.floor(SCORE_CAP * 0.85), maxPoints: Infinity },
];

export function PointsExplainer({
  currentPoints,
  mainnetPoints = 0,
  testnetPoints = 0,
  appEngagementPoints = 0,
  controlledOpen,
  setControlledOpen,
}: PointsExplainerProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const levelProgress = getLevelProgress(currentPoints);
  const currentLevelColors = TRUST_LEVEL_COLORS[levelProgress.currentLevel];
  const nextLevelData = levelProgress.nextLevel ? LEVELS.find((l) => l.name === levelProgress.nextLevel) : null;

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
          style={{ background: currentLevelColors.bg, border: `1px solid ${currentLevelColors.border}` }}
        >
          <Info className="w-4 h-4" style={{ color: currentLevelColors.text }} />
          <span className="text-xs font-bold" style={{ color: currentLevelColors.text }}>How Points Work</span>
        </button>
      )}

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 pointer-events-auto" onClick={() => setOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 pointer-events-none">
            <div
              className="pointer-events-auto w-full max-w-3xl mx-3 sm:mx-4 rounded-xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[80vh]"
              style={{ background: 'rgba(15, 17, 23, 0.98)', border: '1px solid rgba(255,255,255,0.06)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex-shrink-0 px-4 py-3 flex items-center gap-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <button onClick={() => setOpen(false)} aria-label="Go back" className="p-2 -ml-2 rounded-lg hover:bg-white/5 transition-all">
                  <ChevronLeft className="w-5 h-5 text-white/70" />
                </button>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: currentLevelColors.bg, border: `1px solid ${currentLevelColors.border}` }}>
                    <Zap className="w-4 h-4" style={{ color: currentLevelColors.text }} />
                  </div>
                  <div>
                    <h1 className="text-sm font-bold text-white">ReputationAtomic Protocol</h1>
                    <p className="text-[10px] text-white/40">Single Source of Truth</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain">
                <div className="p-4 space-y-4 pb-8">
                  <div className="p-4 rounded-xl" style={{ background: 'rgba(20, 22, 30, 0.8)', border: `1px solid ${currentLevelColors.border}` }}>
                    <p className="text-xs text-white/70 leading-relaxed">
                      Total Score = <b>Mainnet_Points</b> + <b>Testnet_Points</b> + <b>App_Engagement_Points</b> (capped at {SCORE_CAP.toLocaleString()}).
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 rounded-xl text-center bg-purple-500/10 border border-purple-500/20">
                      <p className="text-[9px] text-purple-300 uppercase">Mainnet_Points</p>
                      <p className="text-xl font-black text-white">{mainnetPoints}</p>
                    </div>
                    <div className="p-3 rounded-xl text-center bg-cyan-500/10 border border-cyan-500/20">
                      <p className="text-[9px] text-cyan-300 uppercase">Testnet_Points</p>
                      <p className="text-xl font-black text-white">{testnetPoints}</p>
                    </div>
                    <div className="p-3 rounded-xl text-center bg-emerald-500/10 border border-emerald-500/20">
                      <p className="text-[9px] text-emerald-300 uppercase">App_Engagement_Points</p>
                      <p className="text-xl font-black text-white">{appEngagementPoints}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl" style={{ background: currentLevelColors.bg, border: `1px solid ${currentLevelColors.border}` }}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] text-white/60 uppercase">Current Level</p>
                      <p className="text-2xl font-black text-white">{levelProgress.displayScore.toLocaleString()}</p>
                    </div>
                    <p className="text-lg font-black" style={{ color: currentLevelColors.text }}>{levelProgress.currentLevel}</p>
                    {levelProgress.nextLevel && nextLevelData && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[10px] text-white/60 mb-1">
                          <span>{levelProgress.currentLevel}</span>
                          <span className="flex items-center gap-1"><ArrowRight className="w-3 h-3" />{levelProgress.nextLevel}</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full" style={{ width: `${Math.min(levelProgress.progressInLevel, 100)}%`, background: currentLevelColors.text }} />
                        </div>
                        <p className="text-[10px] text-white/50 mt-2">{levelProgress.pointsToNextLevel.toLocaleString()} points to next level</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-xs font-bold uppercase text-white/80 tracking-wider flex items-center gap-2">
                      <Award className="w-4 h-4" style={{ color: currentLevelColors.text }} />
                      Trust Levels
                    </h3>
                    {LEVELS.filter((l) => l.minPoints > -Infinity).map((level) => {
                      const colors = TRUST_LEVEL_COLORS[level.name];
                      const isCurrent = level.name === levelProgress.currentLevel;
                      return (
                        <div key={level.name} className="px-3 py-2 rounded-xl flex items-center justify-between" style={{ background: isCurrent ? colors.bg : 'rgba(255,255,255,0.02)', border: `1px solid ${isCurrent ? colors.border : 'rgba(255,255,255,0.08)'}` }}>
                          <div className="flex items-center gap-2">
                            <Star className="w-3 h-3" style={{ color: colors.text }} />
                            <span className="text-xs text-white">{level.name}</span>
                          </div>
                          <span className="text-[10px] text-white/60">{level.minPoints.toLocaleString()}{level.maxPoints === Infinity ? '+' : `-${level.maxPoints.toLocaleString()}`}</span>
                        </div>
                      );
                    })}
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
