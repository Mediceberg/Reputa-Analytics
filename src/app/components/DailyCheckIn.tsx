import { useState, useEffect, useCallback } from 'react';
import { Calendar, Gift, Play, CheckCircle, Zap, Merge } from 'lucide-react';
import { reputationService, UserReputationState } from '../services/reputationService';
import { SCORING_RULES } from '../protocol/scoringRulesEngine';

interface DailyCheckInProps {
  userId?: string;
  onPointsEarned?: (points: number, type: 'checkin' | 'merge') => void;
}

const CHECKIN_POINTS = SCORING_RULES.DAILY_CHECKIN.basePoints;
const AD_BONUS_POINTS = SCORING_RULES.AD_BONUS.basePoints;

export function DailyCheckIn({ userId, onPointsEarned }: DailyCheckInProps) {
  const [state, setState] = useState<UserReputationState | null>(null);
  const [canCheckIn, setCanCheckIn] = useState(true);
  const [countdown, setCountdown] = useState('');
  const [isMerging, setIsMerging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadState() {
      const uid = userId || localStorage.getItem('piUserId') || `user_${Date.now()}`;
      const loadedState = await reputationService.loadUserReputation(uid);
      setState(loadedState);
      setIsLoading(false);
    }

    loadState();
  }, [userId]);

  const updateAvailability = useCallback(() => {
    if (!state) return;

    const result = reputationService.canCheckIn();
    setCanCheckIn(result.canCheckIn);
    setCountdown(result.countdown);
  }, [state]);

  useEffect(() => {
    updateAvailability();
    const interval = setInterval(updateAvailability, 1000);
    return () => clearInterval(interval);
  }, [updateAvailability]);

  const handleCheckIn = async () => {
    if (!state) return;

    try {
      const result = await reputationService.performDailyCheckIn();
      if (result.success) {
        setState(result.newState);
        onPointsEarned?.(result.pointsEarned, 'checkin');
        updateAvailability();
      }
    } catch (error) {
      console.error('Check-in error:', error);
    }
  };

  const handleMergePoints = async () => {
    if (!state || state.dailyCheckInPoints <= 0) return;

    setIsMerging(true);
    
    try {
      const pointsToMerge = state.dailyCheckInPoints;
      const result = await reputationService.mergeCheckInPointsToReputation();
      if (result.success) {
        setState(result.newState);
        onPointsEarned?.(pointsToMerge, 'merge');
      }
    } catch (error) {
      console.error('Merge error:', error);
    }
    
    setIsMerging(false);
  };

  if (isLoading) {
    return (
      <div className="glass-card p-6 flex items-center justify-center min-h-[200px]">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!state) {
    return null;
  }

  const canMerge = state.dailyCheckInPoints > 0;

  return (
    <div 
      className="glass-card p-4 sm:p-5 relative overflow-hidden"
      style={{ border: '1px solid rgba(245, 158, 11, 0.3)' }}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(251, 191, 36, 0.2) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
              }}
            >
              <Calendar className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Daily Check-in</h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-amber-400 font-semibold">
                  {state.streak} day streak
                </span>
                <Zap className="w-3 h-3 text-amber-400" />
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-xl font-black text-cyan-400">{state.dailyCheckInPoints}</p>
            <p className="text-[9px] text-gray-500 uppercase">Points</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div 
            className="p-3 rounded-xl"
            style={{
              background: canCheckIn 
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)'
                : 'rgba(255, 255, 255, 0.03)',
              border: canCheckIn 
                ? '1px solid rgba(16, 185, 129, 0.3)'
                : '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <Gift className={`w-4 h-4 ${canCheckIn ? 'text-emerald-400' : 'text-gray-500'}`} />
              <span className={`text-xs font-bold ${canCheckIn ? 'text-emerald-400' : 'text-gray-500'}`}>
                Check-in
              </span>
              <span className="ml-auto text-[10px] text-emerald-400 font-bold">+{CHECKIN_POINTS}</span>
            </div>

            {canCheckIn ? (
              <button
                onClick={handleCheckIn}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold text-xs transition-all active:scale-[0.98]"
              >
                <CheckCircle className="w-3.5 h-3.5 inline mr-1.5" />
                Claim
              </button>
            ) : (
              <div className="text-center py-1">
                <p className="text-lg font-mono font-bold text-amber-400">{countdown}</p>
                <p className="text-[9px] text-gray-500">until next</p>
              </div>
            )}
          </div>

          <div 
            className="p-3 rounded-xl"
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              opacity: 0.6,
            }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <Play className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-bold text-gray-500">Ad Bonus</span>
              <span className="ml-auto text-[10px] text-gray-500 font-bold">+{AD_BONUS_POINTS}</span>
            </div>

            <div className="text-center py-2">
              <p className="text-[10px] text-gray-500">Coming Soon</p>
            </div>
          </div>
        </div>

        {canMerge && (
          <button
            onClick={handleMergePoints}
            disabled={isMerging}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {isMerging ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Merge className="w-4 h-4" />
                Merge {state.dailyCheckInPoints} pts to Reputation
              </>
            )}
          </button>
        )}

        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[10px]">
          <span className="text-gray-500">
            Total: <span className="text-amber-400 font-bold">{state.totalCheckInDays}</span> days
          </span>
          <span className="text-gray-500">
            Reputation: <span className="text-emerald-400 font-bold">{state.reputationScore}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
