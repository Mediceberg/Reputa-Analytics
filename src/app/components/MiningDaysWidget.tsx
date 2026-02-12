import { useState } from 'react'; 
import { Pickaxe, Info, X, Calendar, TrendingUp, Shield, Unlock } from 'lucide-react'; 
import { useLanguage } from '../hooks/useLanguage';

interface MiningDaysWidgetProps {
  miningDays?: number;
  lockedMining?: number;
  unlockedMining?: number;
  isDemo?: boolean;
}

export function MiningDaysWidget({ 
  miningDays = 0, 
  lockedMining = 0, 
  unlockedMining = 0,
  isDemo = false 
}: MiningDaysWidgetProps) {
  const [showInfo, setShowInfo] = useState(false);
  const { t } = useLanguage();

  const estimatedDays = isDemo ? 847 : miningDays;
  const estimatedLocked = isDemo ? 12450.5 : lockedMining;
  const estimatedUnlocked = isDemo ? 3215.8 : unlockedMining;

  return (
    <>
      <div 
        className="glass-card p-4 cursor-pointer hover:scale-[1.02] transition-all"
        style={{ border: '1px solid rgba(245, 158, 11, 0.3)' }}
        onClick={() => setShowInfo(true)}
        role="button"
        aria-label="View mining days details"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setShowInfo(true)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(251, 191, 36, 0.2) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                boxShadow: '0 0 20px rgba(245, 158, 11, 0.2)',
              }}
            >
              <Pickaxe className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Mining Days</p>
              <p className="text-xl font-black text-white">{estimatedDays.toLocaleString()}</p>
            </div>
          </div>
          <div className="p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 transition-all">
            <Info className="w-4 h-4 text-amber-400" />
          </div>
        </div>
        
        {isDemo && (
          <div className="mt-2 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-center">
            <span className="text-[10px] font-bold text-amber-400/70">Demo Estimate</span>
          </div>
        )}
      </div>

      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowInfo(false)}
          />
          
          <div 
            className="relative w-full max-w-md rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, #0F1117 0%, #0A0B0F 100%)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              boxShadow: '0 0 60px rgba(245, 158, 11, 0.2)',
            }}
          >
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(251, 191, 36, 0.2) 100%)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                    }}
                  >
                    <Pickaxe className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black uppercase text-white">Mining Days</h2>
                    <p className="text-xs text-gray-500">Pi Network mining activity</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInfo(false)}
                  aria-label="Close"
                  className="p-2 rounded-lg hover:bg-white/10 transition-all"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-2">Total Mining Days</p>
                <p 
                  className="text-5xl font-black"
                  style={{
                    background: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {estimatedDays.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-2">days since first mining session</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Unlock className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] font-bold uppercase text-emerald-400">Unlocked</span>
                  </div>
                  <p className="text-lg font-black text-white">{estimatedUnlocked.toLocaleString()} π</p>
                  <p className="text-[10px] text-gray-500 mt-1">Available balance</p>
                </div>
                
                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-purple-400" />
                    <span className="text-[10px] font-bold uppercase text-purple-400">Locked</span>
                  </div>
                  <p className="text-lg font-black text-white">{estimatedLocked.toLocaleString()} π</p>
                  <p className="text-[10px] text-gray-500 mt-1">Lockup period</p>
                </div>
              </div>

              <div 
                className="p-4 rounded-xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <h4 className="text-xs font-bold uppercase text-gray-400 mb-3">What are Mining Days?</h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    <span>Mining days represent your total active mining sessions on Pi Network</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <span>More mining days indicate longer commitment to the Pi ecosystem</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span>Locked Pi is part of the lockup mechanism to support network stability</span>
                  </li>
                </ul>
              </div>

              {isDemo && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
                  <p className="text-xs text-amber-400">
                    <Info className="w-3 h-3 inline mr-1" />
                    Demo mode - showing estimated values
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
