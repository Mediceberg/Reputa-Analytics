import { useState, useEffect, useRef } from 'react';
import { Gift, Zap, ArrowUp, ChevronRight } from 'lucide-react';
import type { PendingReward } from '../protocol/rewardEngine';

// ─── Animated Counter ──────────────────────────────────────────────────────

function useAnimatedNumber(target: number, duration: number = 600): number {
  const [current, setCurrent] = useState(target);
  const prevRef = useRef(target);
  const rafRef = useRef(0);
  const startRef = useRef(0);

  useEffect(() => {
    const from = prevRef.current;
    if (from === target) return;
    startRef.current = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(from + (target - from) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
      else prevRef.current = target;
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return current;
}

// ─── Types ─────────────────────────────────────────────────────────────────

interface PendingRewardsCounterProps {
  rewards: PendingReward[];
  totalPoints: number;
  recurringPoints: number;
  appPoints: number;
  onClaim: () => void;
  isClaimable: boolean;
}

// ─── Main Component ────────────────────────────────────────────────────────

export function PendingRewardsCounter({
  rewards,
  totalPoints,
  recurringPoints,
  appPoints,
  onClaim,
  isClaimable,
}: PendingRewardsCounterProps) {
  const [expanded, setExpanded] = useState(false);
  const [justClaimed, setJustClaimed] = useState(false);
  const animatedTotal = useAnimatedNumber(totalPoints);
  const [pulse, setPulse] = useState(false);

  // Pulse effect when new rewards arrive
  useEffect(() => {
    if (totalPoints > 0) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 1500);
      return () => clearTimeout(t);
    }
  }, [rewards.length]);

  const handleClaim = () => {
    if (!isClaimable || totalPoints <= 0) return;
    setJustClaimed(true);
    onClaim();
    setTimeout(() => setJustClaimed(false), 2000);
  };

  if (totalPoints <= 0 && !justClaimed) return null;

  return (
    <div className="w-full">
      {/* Compact Counter Bar */}
      <div
        className={`relative overflow-hidden rounded-2xl transition-all duration-300 ${pulse ? 'scale-[1.01]' : ''}`}
        style={{
          background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
          border: '1px solid rgba(251, 191, 36, 0.2)',
          boxShadow: pulse ? '0 0 25px rgba(251, 191, 36, 0.15)' : 'none',
        }}
      >
        {/* Shimmer effect */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(251, 191, 36, 0.05) 50%, transparent 100%)',
            animation: totalPoints > 0 ? 'shimmer 3s ease-in-out infinite' : 'none',
          }}
        />

        <div className="relative p-4">
          <div className="flex items-center justify-between">
            {/* Left: Icon + Points */}
            <div className="flex items-center gap-3 flex-1" onClick={() => setExpanded(!expanded)} style={{ cursor: 'pointer' }}>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center relative"
                style={{
                  background: 'rgba(251, 191, 36, 0.15)',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                }}
              >
                <Gift className="w-5 h-5 text-amber-400" />
                {rewards.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                    <span className="text-[8px] font-black text-white">{rewards.length}</span>
                  </div>
                )}
              </div>

              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-amber-400/70">Pending Rewards</p>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-black text-white">
                    +{animatedTotal.toLocaleString()}
                  </p>
                  <ArrowUp className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                </div>
              </div>
            </div>

            {/* Right: Claim Button */}
            <button
              onClick={handleClaim}
              disabled={!isClaimable || totalPoints <= 0}
              className="px-5 py-2.5 rounded-xl font-black uppercase tracking-wider text-[10px] transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: justClaimed
                  ? 'rgba(34, 197, 94, 0.2)'
                  : 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(251, 191, 36, 0.3) 100%)',
                border: `1px solid ${justClaimed ? 'rgba(34, 197, 94, 0.4)' : 'rgba(251, 191, 36, 0.4)'}`,
                color: justClaimed ? '#22C55E' : '#FBBF24',
                boxShadow: justClaimed ? '0 0 15px rgba(34, 197, 94, 0.2)' : '0 0 15px rgba(251, 191, 36, 0.15)',
              }}
            >
              {justClaimed ? 'Claimed!' : 'Claim'}
            </button>
          </div>

          {/* Mini breakdown */}
          <div className="flex items-center gap-4 mt-2.5 ml-[52px]">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span className="text-[9px] text-white/40">Blockchain: <span className="text-cyan-400 font-bold">+{recurringPoints}</span></span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[9px] text-white/40">App: <span className="text-emerald-400 font-bold">+{appPoints}</span></span>
            </div>
            <button onClick={() => setExpanded(!expanded)} className="ml-auto text-[9px] text-white/30 flex items-center gap-0.5 hover:text-white/50 transition-colors">
              Details
              <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
            </button>
          </div>
        </div>

        {/* Expanded detail list */}
        {expanded && rewards.length > 0 && (
          <div className="border-t px-4 pb-4 pt-3 space-y-1.5" style={{ borderColor: 'rgba(251, 191, 36, 0.1)' }}>
            {rewards.slice(0, 10).map((reward, i) => (
              <div
                key={reward.id}
                className="flex items-center justify-between py-1.5 px-3 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.02)' }}
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-3 h-3" style={{ color: reward.category === 'recurring' ? '#00D9FF' : '#22C55E' }} />
                  <span className="text-[10px] text-white/60">{reward.description}</span>
                </div>
                <span className="text-[10px] font-bold text-amber-400">+{reward.points}</span>
              </div>
            ))}
            {rewards.length > 10 && (
              <p className="text-[9px] text-white/30 text-center pt-1">+{rewards.length - 10} more rewards</p>
            )}
          </div>
        )}
      </div>

      {/* Shimmer keyframes (inline style) */}
      <style>{`
        @keyframes shimmer {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
