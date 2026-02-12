import { useState, useEffect, useRef, useCallback } from 'react';
import { Zap, Award, Shield, TrendingUp, Coins, Globe, Star, ChevronRight, Sparkles } from 'lucide-react';
import { TRUST_LEVEL_COLORS, type AtomicTrustLevel, LEVEL_NAMES, getLevelProgress } from '../protocol/atomicScoring';
import type { GenesisResult } from '../protocol/scoringRules';

// ─── Animated Counter Hook ─────────────────────────────────────────────────

function useAnimatedCounter(target: number, duration: number = 2000, delay: number = 0): number {
  const [current, setCurrent] = useState(0);
  const startTime = useRef<number | null>(null);
  const rafId = useRef<number>(0);

  useEffect(() => {
    if (target <= 0) return;
    const timeout = setTimeout(() => {
      const animate = (timestamp: number) => {
        if (!startTime.current) startTime.current = timestamp;
        const elapsed = timestamp - startTime.current;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setCurrent(Math.round(eased * target));
        if (progress < 1) {
          rafId.current = requestAnimationFrame(animate);
        }
      };
      rafId.current = requestAnimationFrame(animate);
    }, delay);
    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(rafId.current);
    };
  }, [target, duration, delay]);

  return current;
}

// ─── Types ─────────────────────────────────────────────────────────────────

interface FirstScanResultsProps {
  genesisResult: GenesisResult;
  totalScore: number;
  trustLevel: AtomicTrustLevel;
  walletAddress: string;
  onContinue: () => void;
}

// ─── Level Badge ───────────────────────────────────────────────────────────

function LevelBadge({ level, size = 'lg' }: { level: AtomicTrustLevel; size?: 'sm' | 'lg' }) {
  const colors = TRUST_LEVEL_COLORS[level];
  const isLg = size === 'lg';
  return (
    <div
      className={`inline-flex items-center gap-1.5 ${isLg ? 'px-4 py-2' : 'px-2.5 py-1'} rounded-full font-black uppercase tracking-wider`}
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        color: colors.text,
        fontSize: isLg ? '13px' : '9px',
        boxShadow: `0 0 20px ${colors.border}`,
      }}
    >
      <Star className={isLg ? 'w-4 h-4' : 'w-3 h-3'} />
      {level}
    </div>
  );
}

// ─── Score Item Row ────────────────────────────────────────────────────────

function ScoreItemRow({ label, points, icon, delay }: { label: string; points: number; icon: React.ReactNode; delay: number }) {
  const [visible, setVisible] = useState(false);
  const animatedPoints = useAnimatedCounter(visible ? points : 0, 800, 0);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  if (points <= 0) return null;

  return (
    <div
      className="flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-500"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(-20px)',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(139, 92, 246, 0.15)' }}>
          {icon}
        </div>
        <span className="text-xs text-white/80 font-medium">{label}</span>
      </div>
      <span className="text-sm font-black text-emerald-400">+{animatedPoints.toLocaleString()}</span>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export function FirstScanResults({ genesisResult, totalScore, trustLevel, walletAddress, onContinue }: FirstScanResultsProps) {
  const [phase, setPhase] = useState<'scanning' | 'reveal' | 'details'>('scanning');
  const animatedTotal = useAnimatedCounter(phase !== 'scanning' ? totalScore : 0, 2500, 300);
  const levelProgress = getLevelProgress(totalScore);
  const colors = TRUST_LEVEL_COLORS[trustLevel];

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('reveal'), 2200);
    const t2 = setTimeout(() => setPhase('details'), 3800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Scanning phase
  if (phase === 'scanning') {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center" style={{ background: 'radial-gradient(ellipse at center, rgba(15, 17, 23, 0.98) 0%, #0a0b0f 100%)' }}>
        <div className="relative">
          <div className="absolute inset-0 rounded-full animate-ping" style={{ background: `radial-gradient(circle, ${colors.border} 0%, transparent 70%)`, transform: 'scale(3)', opacity: 0.3 }} />
          <div className="absolute inset-0 rounded-full animate-spin" style={{ width: 120, height: 120, border: `3px solid transparent`, borderTopColor: colors.text, borderRightColor: colors.text }} />
          <div className="w-[120px] h-[120px] rounded-full flex items-center justify-center" style={{ background: colors.bg, border: `2px solid ${colors.border}` }}>
            <Zap className="w-12 h-12 animate-pulse" style={{ color: colors.text }} />
          </div>
        </div>
        <p className="mt-8 text-sm font-black uppercase tracking-[0.4em] animate-pulse" style={{ color: colors.text }}>
          Analyzing Blockchain...
        </p>
        <div className="mt-4 flex gap-1.5">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background: colors.text, animationDelay: `${i * 0.15}s`, opacity: 0.6 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col overflow-y-auto" style={{ background: 'radial-gradient(ellipse at top, rgba(15, 17, 23, 0.99) 0%, #0a0b0f 100%)' }}>
      {/* Glow Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] pointer-events-none" style={{ background: `radial-gradient(circle, ${colors.border} 0%, transparent 60%)`, opacity: 0.15, filter: 'blur(80px)' }} />

      <div className="relative w-full max-w-lg mx-auto px-4 pt-12 pb-24 flex flex-col items-center">
        {/* Genesis Badge */}
        <div className="mb-4 flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Genesis Reputation Boost</span>
        </div>

        {/* Main Score */}
        <div className="relative mb-2">
          <div className="absolute inset-0 rounded-full" style={{ background: `radial-gradient(circle, ${colors.border} 0%, transparent 70%)`, transform: 'scale(2.5)', opacity: 0.2, filter: 'blur(40px)' }} />
          <div className="relative text-center">
            <p className="text-[72px] sm:text-[96px] font-black leading-none" style={{ color: '#fff', textShadow: `0 0 60px ${colors.border}, 0 0 120px ${colors.border}` }}>
              {animatedTotal.toLocaleString()}
            </p>
            <p className="text-xs text-white/40 uppercase tracking-[0.3em] font-bold mt-1">Reputation Points</p>
          </div>
        </div>

        {/* Trust Level */}
        <div className="mb-8">
          <LevelBadge level={trustLevel} />
        </div>

        {/* Level Progress */}
        <div className="w-full mb-8 px-2">
          <div className="flex items-center justify-between text-[10px] text-white/50 mb-2">
            <span>Level {levelProgress.levelIndex + 1}</span>
            <span>{levelProgress.nextLevel || 'MAX'}</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div
              className="h-full rounded-full transition-all duration-[2s] ease-out"
              style={{
                width: phase === 'details' ? `${Math.min(levelProgress.progressInLevel, 100)}%` : '0%',
                background: `linear-gradient(90deg, ${colors.text}, ${colors.border})`,
                boxShadow: `0 0 10px ${colors.border}`,
              }}
            />
          </div>
          {levelProgress.nextLevel && (
            <p className="text-[10px] text-white/40 mt-1.5 text-center">
              {levelProgress.pointsToNextLevel.toLocaleString()} points to <span style={{ color: colors.text }}>{levelProgress.nextLevel}</span>
            </p>
          )}
        </div>

        {/* Score Breakdown */}
        {phase === 'details' && (
          <div className="w-full space-y-2 mb-8">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-3 flex items-center gap-2">
              <Award className="w-3.5 h-3.5" style={{ color: colors.text }} />
              Genesis Breakdown
            </h3>

            {genesisResult.items.map((item, i) => {
              const iconMap: Record<string, React.ReactNode> = {
                wallet_link: <Shield className="w-4 h-4 text-purple-400" />,
                first_analysis: <Zap className="w-4 h-4 text-cyan-400" />,
                mainnet_link: <Globe className="w-4 h-4 text-emerald-400" />,
                testnet_link: <Globe className="w-4 h-4 text-blue-400" />,
                wallet_age: <TrendingUp className="w-4 h-4 text-amber-400" />,
                lifetime_activity: <Coins className="w-4 h-4 text-green-400" />,
                volume: <TrendingUp className="w-4 h-4 text-pink-400" />,
                tokens_discovered: <Star className="w-4 h-4 text-yellow-400" />,
                dapps_discovered: <Globe className="w-4 h-4 text-violet-400" />,
                staking_discovered: <Shield className="w-4 h-4 text-indigo-400" />,
              };
              const labelMap: Record<string, string> = {
                wallet_link: 'Wallet Connected',
                first_analysis: 'First Analysis Complete',
                mainnet_link: 'Mainnet Linked',
                testnet_link: 'Testnet Linked',
                wallet_age: 'Wallet Age Bonus',
                lifetime_activity: 'Lifetime Activity',
                volume: 'Trading Volume',
                tokens_discovered: 'Tokens Discovered',
                dapps_discovered: 'DApps Discovered',
                staking_discovered: 'Staking Detected',
              };
              return (
                <ScoreItemRow
                  key={item.label}
                  label={labelMap[item.label] || item.label}
                  points={item.points}
                  icon={iconMap[item.label] || <Zap className="w-4 h-4 text-white/50" />}
                  delay={200 + i * 250}
                />
              );
            })}
          </div>
        )}

        {/* Category Distribution */}
        {phase === 'details' && (
          <div className="w-full grid grid-cols-3 gap-2 mb-8">
            <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
              <p className="text-[8px] text-purple-300 uppercase font-bold">Genesis</p>
              <p className="text-lg font-black text-white">{genesisResult.cappedGenesis.toLocaleString()}</p>
              <p className="text-[9px] text-purple-400">50% cap</p>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(0, 217, 255, 0.1)', border: '1px solid rgba(0, 217, 255, 0.2)' }}>
              <p className="text-[8px] text-cyan-300 uppercase font-bold">Recurring</p>
              <p className="text-lg font-black text-white/40">0</p>
              <p className="text-[9px] text-cyan-400">20% cap</p>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
              <p className="text-[8px] text-emerald-300 uppercase font-bold">App</p>
              <p className="text-lg font-black text-white/40">0</p>
              <p className="text-[9px] text-emerald-400">30% cap</p>
            </div>
          </div>
        )}

        {/* Continue Button */}
        {phase === 'details' && (
          <button
            onClick={onContinue}
            className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-all"
            style={{
              background: `linear-gradient(135deg, ${colors.bg} 0%, rgba(15, 17, 23, 0.8) 100%)`,
              border: `1px solid ${colors.border}`,
              color: colors.text,
              boxShadow: `0 0 30px ${colors.border}`,
            }}
          >
            Continue to Dashboard
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
