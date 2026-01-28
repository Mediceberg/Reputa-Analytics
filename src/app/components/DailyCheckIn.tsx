import { useState, useEffect } from 'react';
import { Calendar, Gift, Play, Clock, CheckCircle, Star, Zap } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface DailyCheckInProps {
  onPointsEarned: (points: number, type: 'checkin' | 'ad') => void;
  isDemo?: boolean;
}

interface CheckInState {
  lastCheckIn: string | null;
  lastAdWatch: string | null;
  lastCheckInId: string | null;
  adClaimedForCheckIn: string | null;
  totalCheckIns: number;
  streak: number;
  totalPointsFromCheckIn: number;
  totalPointsFromAds: number;
  streakBonusPoints: number;
}

const CHECKIN_POINTS = 3;
const AD_BONUS_POINTS = 5;
const COOLDOWN_HOURS = 24;

export function DailyCheckIn({ onPointsEarned, isDemo = false }: DailyCheckInProps) {
  const { t } = useLanguage();
  const [checkInState, setCheckInState] = useState<CheckInState>({
    lastCheckIn: null,
    lastAdWatch: null,
    lastCheckInId: null,
    adClaimedForCheckIn: null,
    totalCheckIns: 0,
    streak: 0,
    totalPointsFromCheckIn: 0,
    totalPointsFromAds: 0,
    streakBonusPoints: 0,
  });
  const [canCheckIn, setCanCheckIn] = useState(true);
  const [canWatchAd, setCanWatchAd] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [showSuccess, setShowSuccess] = useState<'checkin' | 'ad' | null>(null);

  useEffect(() => {
    if (isDemo) {
      return;
    }
    const savedState = localStorage.getItem('dailyCheckInState');
    if (savedState) {
      const parsed = JSON.parse(savedState) as CheckInState;
      setCheckInState(parsed);
      updateAvailability(parsed);
    }
  }, [isDemo]);

  useEffect(() => {
    const interval = setInterval(() => {
      updateAvailability(checkInState);
    }, 1000);
    return () => clearInterval(interval);
  }, [checkInState]);

  const updateAvailability = (state: CheckInState) => {
    const now = new Date();
    
    if (state.lastCheckIn) {
      const lastCheckInDate = new Date(state.lastCheckIn);
      const timeDiff = now.getTime() - lastCheckInDate.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      if (hoursDiff < COOLDOWN_HOURS) {
        setCanCheckIn(false);
        const remainingMs = (COOLDOWN_HOURS * 60 * 60 * 1000) - timeDiff;
        const hours = Math.floor(remainingMs / (1000 * 60 * 60));
        const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);
        setCountdown(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        
        const adNotClaimedForThisCheckIn = state.adClaimedForCheckIn !== state.lastCheckInId;
        setCanWatchAd(adNotClaimedForThisCheckIn);
      } else {
        setCanCheckIn(true);
        setCanWatchAd(false);
        setCountdown('');
      }
    } else {
      setCanCheckIn(true);
      setCanWatchAd(false);
      setCountdown('');
    }
  };

  const handleCheckIn = () => {
    const now = new Date();
    const lastDate = checkInState.lastCheckIn ? new Date(checkInState.lastCheckIn) : null;
    const checkInId = `checkin_${now.getTime()}`;
    
    let newStreak = 1;
    let streakBonus = 0;
    if (lastDate) {
      const hoursDiff = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60);
      if (hoursDiff >= 24 && hoursDiff < 48) {
        newStreak = checkInState.streak + 1;
        if (newStreak === 7) {
          streakBonus = 10;
        }
      }
    }

    const newState: CheckInState = {
      lastCheckIn: now.toISOString(),
      lastAdWatch: checkInState.lastAdWatch,
      lastCheckInId: checkInId,
      adClaimedForCheckIn: checkInState.adClaimedForCheckIn,
      totalCheckIns: checkInState.totalCheckIns + 1,
      streak: newStreak,
      totalPointsFromCheckIn: checkInState.totalPointsFromCheckIn + CHECKIN_POINTS,
      totalPointsFromAds: checkInState.totalPointsFromAds,
      streakBonusPoints: checkInState.streakBonusPoints + streakBonus,
    };

    setCheckInState(newState);
    if (!isDemo) {
      localStorage.setItem('dailyCheckInState', JSON.stringify(newState));
    }
    onPointsEarned(CHECKIN_POINTS + streakBonus, 'checkin');
    setShowSuccess('checkin');
    setTimeout(() => setShowSuccess(null), 3000);
    updateAvailability(newState);
  };

  const handleWatchAd = () => {
    setIsWatchingAd(true);
    
    setTimeout(() => {
      const now = new Date();
      const newState: CheckInState = {
        ...checkInState,
        lastAdWatch: now.toISOString(),
        adClaimedForCheckIn: checkInState.lastCheckInId,
        totalPointsFromAds: checkInState.totalPointsFromAds + AD_BONUS_POINTS,
      };

      setCheckInState(newState);
      if (!isDemo) {
        localStorage.setItem('dailyCheckInState', JSON.stringify(newState));
      }
      onPointsEarned(AD_BONUS_POINTS, 'ad');
      setIsWatchingAd(false);
      setShowSuccess('ad');
      setTimeout(() => setShowSuccess(null), 3000);
      updateAvailability(newState);
    }, 3000);
  };

  return (
    <div 
      className="glass-card p-6 relative overflow-hidden"
      style={{ border: '1px solid rgba(245, 158, 11, 0.3)' }}
    >
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          background: 'radial-gradient(circle at 50% 0%, rgba(245, 158, 11, 0.4) 0%, transparent 70%)',
        }}
      />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(251, 191, 36, 0.2) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
              }}
            >
              <Calendar className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wide text-white">
                Daily Check-in
              </h3>
              <p className="text-[10px] text-gray-500">
                {isDemo ? 'Demo Mode' : 'Earn points daily'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30">
              <span className="text-xs font-bold text-amber-400">
                <Zap className="w-3 h-3 inline mr-1" />
                {checkInState.streak} day streak
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            className="p-4 rounded-xl"
            style={{
              background: canCheckIn 
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)'
                : 'rgba(255, 255, 255, 0.02)',
              border: canCheckIn 
                ? '1px solid rgba(16, 185, 129, 0.3)'
                : '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Gift className={`w-5 h-5 ${canCheckIn ? 'text-emerald-400' : 'text-gray-500'}`} />
                <span className={`text-sm font-bold ${canCheckIn ? 'text-emerald-400' : 'text-gray-500'}`}>
                  Check-in Reward
                </span>
              </div>
              <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                +{CHECKIN_POINTS} pts
              </span>
            </div>

            {canCheckIn ? (
              <button
                onClick={handleCheckIn}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold transition-all hover:opacity-90 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <CheckCircle className="w-4 h-4 inline mr-2" />
                Claim Daily Reward
              </button>
            ) : (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-500">Next check-in in</span>
                </div>
                <p className="text-2xl font-mono font-bold text-amber-400">{countdown}</p>
              </div>
            )}
          </div>

          <div 
            className="p-4 rounded-xl"
            style={{
              background: canWatchAd 
                ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)'
                : 'rgba(255, 255, 255, 0.02)',
              border: canWatchAd 
                ? '1px solid rgba(139, 92, 246, 0.3)'
                : '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Play className={`w-5 h-5 ${canWatchAd ? 'text-purple-400' : 'text-gray-500'}`} />
                <span className={`text-sm font-bold ${canWatchAd ? 'text-purple-400' : 'text-gray-500'}`}>
                  Bonus Ad
                </span>
              </div>
              <span className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold">
                +{AD_BONUS_POINTS} pts
              </span>
            </div>

            {canWatchAd ? (
              <button
                onClick={handleWatchAd}
                disabled={isWatchingAd}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold transition-all hover:opacity-90 hover:scale-[1.02] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                {isWatchingAd ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Watching...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 inline mr-2" />
                    Watch Ad for Bonus
                  </>
                )}
              </button>
            ) : (
              <div className="text-center py-2">
                <p className="text-xs text-gray-500">
                  {!checkInState.lastCheckIn 
                    ? 'Check in first to unlock'
                    : checkInState.adClaimedForCheckIn === checkInState.lastCheckInId
                      ? 'Already claimed for this check-in'
                      : 'Check in to unlock bonus'}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">
              Total check-ins: <span className="text-amber-400 font-bold">{checkInState.totalCheckIns}</span>
            </span>
            <span className="text-gray-500">
              Total earned: <span className="text-emerald-400 font-bold">
                {checkInState.totalPointsFromCheckIn + checkInState.totalPointsFromAds + checkInState.streakBonusPoints} pts
              </span>
            </span>
          </div>
        </div>
      </div>

      {showSuccess && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/60 z-20 animate-in fade-in duration-300"
        >
          <div className="text-center">
            <div 
              className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{
                background: showSuccess === 'checkin' 
                  ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                  : 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)',
                boxShadow: showSuccess === 'checkin'
                  ? '0 0 40px rgba(16, 185, 129, 0.5)'
                  : '0 0 40px rgba(139, 92, 246, 0.5)',
              }}
            >
              <Star className="w-8 h-8 text-white" />
            </div>
            <p className="text-2xl font-black text-white mb-1">
              +{showSuccess === 'checkin' ? CHECKIN_POINTS : AD_BONUS_POINTS} Points!
            </p>
            <p className="text-sm text-gray-400">
              {showSuccess === 'checkin' ? 'Daily check-in complete!' : 'Ad bonus claimed!'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
