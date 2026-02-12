import { useState } from 'react';
import { Info, Zap, ArrowRight, Star, ChevronLeft, Award, Shield, Globe, Coins, TrendingUp, Gift, Users, CheckCircle, Sparkles, Target } from 'lucide-react';
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

const LEVELS: { name: AtomicTrustLevel; minPoints: number; maxPoints: number; description: string }[] = [
  { name: 'Novice',        minPoints: 0,       maxPoints: 10_000,    description: 'New or unverified accounts' },
  { name: 'Explorer',      minPoints: 10_001,  maxPoints: 50_000,    description: 'Early Testnet activity' },
  { name: 'Contributor',   minPoints: 50_001,  maxPoints: 150_000,   description: 'Active app participation' },
  { name: 'Verified',      minPoints: 150_001, maxPoints: 300_000,   description: 'KYC passed, Mainnet balance' },
  { name: 'Trusted',       minPoints: 300_001, maxPoints: 450_000,   description: 'Trusted Reputa community member' },
  { name: 'Ambassador',    minPoints: 450_001, maxPoints: 600_000,   description: 'Strong influence, daily activity' },
  { name: 'Elite',         minPoints: 600_001, maxPoints: 750_000,   description: 'Whales or active developers' },
  { name: 'Sentinel',      minPoints: 750_001, maxPoints: 850_000,   description: 'Network guardians, highest trust' },
  { name: 'Oracle',        minPoints: 850_001, maxPoints: 950_000,   description: 'Protocol reviewers & influencers' },
  { name: 'Atomic Legend',  minPoints: 950_001, maxPoints: 1_000_000, description: 'Top 0.1% of all users' },
];

// ─── Action Weight Tables ──────────────────────────────────────────────────

const GENESIS_ACTIONS = [
  { action: 'Wallet Link',           weight: '5,000',   icon: <Shield className="w-3.5 h-3.5 text-purple-400" /> },
  { action: 'First Analysis',        weight: '1,000',   icon: <Zap className="w-3.5 h-3.5 text-cyan-400" /> },
  { action: 'Mainnet Link',          weight: '5,000',   icon: <Globe className="w-3.5 h-3.5 text-emerald-400" /> },
  { action: 'Testnet Link',          weight: '3,000',   icon: <Globe className="w-3.5 h-3.5 text-blue-400" /> },
  { action: 'Wallet Age (>4y)',      weight: '100,000', icon: <TrendingUp className="w-3.5 h-3.5 text-amber-400" /> },
  { action: 'Lifetime Tx (1000+)',   weight: '100,000', icon: <Coins className="w-3.5 h-3.5 text-green-400" /> },
  { action: 'Volume (>1M π)',        weight: '80,000',  icon: <TrendingUp className="w-3.5 h-3.5 text-pink-400" /> },
  { action: 'Per Token Discovered',  weight: '300',     icon: <Star className="w-3.5 h-3.5 text-yellow-400" /> },
  { action: 'Staking Detected',      weight: '3,000',   icon: <Shield className="w-3.5 h-3.5 text-indigo-400" /> },
];

const RECURRING_ACTIONS = [
  { action: 'New Sent Transaction',   weight: '+20',     icon: <Coins className="w-3.5 h-3.5 text-cyan-400" /> },
  { action: 'New Received Tx',        weight: '+20',     icon: <Coins className="w-3.5 h-3.5 text-cyan-400" /> },
  { action: 'DEX Trade',              weight: '+50',     icon: <TrendingUp className="w-3.5 h-3.5 text-cyan-400" /> },
  { action: 'Volume > 50π',           weight: '+1,000',  icon: <TrendingUp className="w-3.5 h-3.5 text-cyan-400" /> },
  { action: 'New Token Discovered',   weight: '+500',    icon: <Star className="w-3.5 h-3.5 text-cyan-400" /> },
  { action: 'Balance Increase (mo)',  weight: '+500',    icon: <TrendingUp className="w-3.5 h-3.5 text-blue-400" /> },
  { action: 'Continuous Activity',    weight: '+800',    icon: <CheckCircle className="w-3.5 h-3.5 text-blue-400" /> },
  { action: 'Volume Growth (mo)',     weight: '+500',    icon: <TrendingUp className="w-3.5 h-3.5 text-blue-400" /> },
];

const APP_ACTIONS = [
  { action: 'Daily Check-in',         weight: '+30',    icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> },
  { action: 'Check-in with Ad',       weight: '+50',    icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> },
  { action: 'Streak (per day)',        weight: '+4',     icon: <Zap className="w-3.5 h-3.5 text-emerald-400" /> },
  { action: 'New Referral',           weight: '+100',   icon: <Users className="w-3.5 h-3.5 text-emerald-400" /> },
  { action: 'Active Referral (mo)',   weight: '+50',    icon: <Users className="w-3.5 h-3.5 text-emerald-400" /> },
  { action: 'Task Complete',          weight: '+500',   icon: <Target className="w-3.5 h-3.5 text-emerald-400" /> },
  { action: 'Weekly Claim Bonus',     weight: '+100',   icon: <Gift className="w-3.5 h-3.5 text-emerald-400" /> },
  { action: '10 Referrals Milestone', weight: '+500',   icon: <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> },
];

// ─── Section Component ─────────────────────────────────────────────────────

function ActionTable({ title, subtitle, color, actions }: { title: string; subtitle: string; color: string; actions: typeof GENESIS_ACTIONS }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ background: color }} />
        <h4 className="text-xs font-black uppercase tracking-wider" style={{ color }}>{title}</h4>
        <span className="text-[9px] text-white/30 ml-auto">{subtitle}</span>
      </div>
      <div className="space-y-1">
        {actions.map((a) => (
          <div key={a.action} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="flex items-center gap-2">
              {a.icon}
              <span className="text-[11px] text-white/70">{a.action}</span>
            </div>
            <span className="text-[11px] font-bold text-amber-400">{a.weight}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export function PointsExplainer({
  currentPoints,
  mainnetPoints = 0,
  testnetPoints = 0,
  appEngagementPoints = 0,
  controlledOpen,
  setControlledOpen,
}: PointsExplainerProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [tab, setTab] = useState<'levels' | 'actions'>('levels');
  const levelProgress = getLevelProgress(currentPoints);
  const currentLevelColors = TRUST_LEVEL_COLORS[levelProgress.currentLevel];

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
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm pointer-events-auto" onClick={() => setOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 sm:pt-14 pointer-events-none">
            <div
              className="pointer-events-auto w-full max-w-lg mx-3 sm:mx-4 rounded-2xl overflow-hidden flex flex-col max-h-[88vh] sm:max-h-[85vh]"
              style={{ background: 'rgba(10, 11, 15, 0.99)', border: '1px solid rgba(255,255,255,0.08)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex-shrink-0 px-4 py-3 flex items-center gap-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <button onClick={() => setOpen(false)} aria-label="Go back" className="p-2 -ml-2 rounded-lg hover:bg-white/5 transition-all">
                  <ChevronLeft className="w-5 h-5 text-white/70" />
                </button>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: currentLevelColors.bg, border: `1px solid ${currentLevelColors.border}` }}>
                    <Zap className="w-4 h-4" style={{ color: currentLevelColors.text }} />
                  </div>
                  <div>
                    <h1 className="text-sm font-bold text-white">How Points Work</h1>
                    <p className="text-[10px] text-white/40">Genesis → Atomic Legend</p>
                  </div>
                </div>
              </div>

              {/* Tab Switcher */}
              <div className="flex-shrink-0 px-4 pt-3 flex gap-2">
                <button
                  onClick={() => setTab('levels')}
                  className="flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                  style={{
                    background: tab === 'levels' ? currentLevelColors.bg : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${tab === 'levels' ? currentLevelColors.border : 'rgba(255,255,255,0.06)'}`,
                    color: tab === 'levels' ? currentLevelColors.text : 'rgba(255,255,255,0.4)',
                  }}
                >
                  10 Levels
                </button>
                <button
                  onClick={() => setTab('actions')}
                  className="flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                  style={{
                    background: tab === 'actions' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${tab === 'actions' ? 'rgba(251, 191, 36, 0.3)' : 'rgba(255,255,255,0.06)'}`,
                    color: tab === 'actions' ? '#FBBF24' : 'rgba(255,255,255,0.4)',
                  }}
                >
                  Action Weights
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                <div className="p-4 space-y-4 pb-8">

                  {/* ═══ TAB: LEVELS ═══ */}
                  {tab === 'levels' && (
                    <>
                      {/* Score Formula */}
                      <div className="p-4 rounded-xl" style={{ background: 'rgba(20, 22, 30, 0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="text-xs text-white/70 leading-relaxed">
                          Total = <b className="text-purple-400">Genesis (50%)</b> + <b className="text-cyan-400">Recurring (20%)</b> + <b className="text-emerald-400">App (30%)</b>
                        </p>
                        <p className="text-[10px] text-white/40 mt-1">Capped at {SCORE_CAP.toLocaleString()} points. Rewards require Claim to be added.</p>
                      </div>

                      {/* Distribution */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                          <p className="text-[8px] text-purple-300 uppercase font-bold">Genesis</p>
                          <p className="text-lg font-black text-white">500K</p>
                          <p className="text-[9px] text-purple-400/60">One-time</p>
                        </div>
                        <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(0, 217, 255, 0.1)', border: '1px solid rgba(0, 217, 255, 0.2)' }}>
                          <p className="text-[8px] text-cyan-300 uppercase font-bold">Recurring</p>
                          <p className="text-lg font-black text-white">200K</p>
                          <p className="text-[9px] text-cyan-400/60">Weekly/Monthly</p>
                        </div>
                        <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                          <p className="text-[8px] text-emerald-300 uppercase font-bold">App</p>
                          <p className="text-lg font-black text-white">300K</p>
                          <p className="text-[9px] text-emerald-400/60">Daily/Social</p>
                        </div>
                      </div>

                      {/* Current Level */}
                      <div className="p-4 rounded-xl" style={{ background: currentLevelColors.bg, border: `1px solid ${currentLevelColors.border}` }}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] text-white/60 uppercase">Your Level</p>
                          <p className="text-2xl font-black text-white">{levelProgress.displayScore.toLocaleString()}</p>
                        </div>
                        <p className="text-lg font-black" style={{ color: currentLevelColors.text }}>{levelProgress.currentLevel}</p>
                        {levelProgress.nextLevel && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-[10px] text-white/60 mb-1">
                              <span>{levelProgress.currentLevel}</span>
                              <span className="flex items-center gap-1"><ArrowRight className="w-3 h-3" />{levelProgress.nextLevel}</span>
                            </div>
                            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${Math.min(levelProgress.progressInLevel, 100)}%`, background: `linear-gradient(90deg, ${currentLevelColors.text}, ${currentLevelColors.border})` }} />
                            </div>
                            <p className="text-[10px] text-white/50 mt-2">{levelProgress.pointsToNextLevel.toLocaleString()} points to next level</p>
                          </div>
                        )}
                      </div>

                      {/* All 10 Levels */}
                      <div className="space-y-1.5">
                        <h3 className="text-xs font-bold uppercase text-white/80 tracking-wider flex items-center gap-2">
                          <Award className="w-4 h-4" style={{ color: currentLevelColors.text }} />
                          Atomic Decimal System — 10 Levels
                        </h3>
                        {LEVELS.map((level, i) => {
                          const colors = TRUST_LEVEL_COLORS[level.name];
                          const isCurrent = level.name === levelProgress.currentLevel;
                          const isPassed = currentPoints > level.maxPoints;
                          return (
                            <div
                              key={level.name}
                              className="px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all"
                              style={{
                                background: isCurrent ? colors.bg : isPassed ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.015)',
                                border: `1px solid ${isCurrent ? colors.border : 'rgba(255,255,255,0.06)'}`,
                                opacity: isPassed && !isCurrent ? 0.6 : 1,
                              }}
                            >
                              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black" style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}>
                                {i + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <Star className="w-3 h-3 flex-shrink-0" style={{ color: colors.text }} />
                                  <span className="text-xs font-bold text-white truncate">{level.name}</span>
                                  {isCurrent && <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/60 font-bold">YOU</span>}
                                </div>
                                <p className="text-[9px] text-white/35 mt-0.5">{level.description}</p>
                              </div>
                              <span className="text-[9px] text-white/40 flex-shrink-0 font-mono">
                                {level.minPoints.toLocaleString()}-{level.maxPoints.toLocaleString()}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Journey Flow */}
                      <div className="p-4 rounded-xl space-y-3" style={{ background: 'rgba(20, 22, 30, 0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-white/50">Your Journey</h4>
                        <div className="space-y-2">
                          {[
                            { step: '1', label: 'Genesis Boost', desc: 'First scan → massive one-time bonus', color: '#8B5CF6' },
                            { step: '2', label: 'Smart Re-Scan', desc: 'Every scan = new rewards on new activity', color: '#00D9FF' },
                            { step: '3', label: 'Claim Rewards', desc: 'Pending → Main points after you Claim', color: '#FBBF24' },
                            { step: '4', label: 'Daily Growth', desc: 'Check-ins, streaks, referrals, tasks', color: '#22C55E' },
                            { step: '∞', label: 'No Limit', desc: 'Every week & month brings new rewards', color: '#EC4899' },
                          ].map((s) => (
                            <div key={s.step} className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0" style={{ background: `${s.color}20`, color: s.color, border: `1px solid ${s.color}40` }}>
                                {s.step}
                              </div>
                              <div>
                                <p className="text-[11px] font-bold text-white">{s.label}</p>
                                <p className="text-[9px] text-white/40">{s.desc}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* ═══ TAB: ACTION WEIGHTS ═══ */}
                  {tab === 'actions' && (
                    <>
                      <div className="p-3 rounded-xl" style={{ background: 'rgba(251, 191, 36, 0.06)', border: '1px solid rgba(251, 191, 36, 0.15)' }}>
                        <p className="text-[10px] text-amber-400/70 leading-relaxed">
                          Every action has a programmatic weight. Points go to <b className="text-amber-400">Pending Rewards</b> first, then added to your score after <b className="text-amber-400">Claim</b>.
                        </p>
                      </div>

                      <ActionTable
                        title="Genesis (50%)"
                        subtitle="One-time · First Scan"
                        color="#8B5CF6"
                        actions={GENESIS_ACTIONS}
                      />

                      <ActionTable
                        title="Recurring (20%)"
                        subtitle="Weekly / Monthly · Blockchain"
                        color="#00D9FF"
                        actions={RECURRING_ACTIONS}
                      />

                      <ActionTable
                        title="App Interaction (30%)"
                        subtitle="Daily / Social · In-App"
                        color="#22C55E"
                        actions={APP_ACTIONS}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
