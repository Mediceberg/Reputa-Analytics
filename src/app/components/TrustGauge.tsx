import { useEffect, useState } from 'react'; 
import { motion } from 'motion/react';
import { ShieldCheck, ShieldAlert, ShieldBan, Sparkles, Zap, TrendingUp } from 'lucide-react';
import { Card } from './ui/card';
import type { TrustLevel } from '../protocol/types';

interface TrustGaugeProps {
  score: number;
  trustLevel: TrustLevel;
  consistencyScore?: number;
  networkTrust?: number;
}

export function TrustGauge({ score, trustLevel, consistencyScore, networkTrust }: TrustGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 100);
    return () => clearTimeout(timer);
  }, [score]);

  useEffect(() => {
    const duration = 1000;
    const steps = 60;
    const increment = score / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayScore(score);
        clearInterval(interval);
      } else {
        setDisplayScore(Math.round(increment * currentStep));
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [score]);

  const getGaugeColor = (level: TrustLevel): string => {
    switch (level) {
      case 'Elite': return '#10b981';
      case 'High': return '#06b6d4';
      case 'Medium': return '#eab308';
      case 'Low': return '#ef4444';
      default: return '#06b6d4';
    }
  };

  const getIcon = () => {
    if (trustLevel === 'Elite' || trustLevel === 'High') return <ShieldCheck className="w-8 h-8" />;
    if (trustLevel === 'Medium') return <ShieldAlert className="w-8 h-8" />;
    return <ShieldBan className="w-8 h-8" />;
  };

  const getDescription = () => {
    switch (trustLevel) {
      case 'Elite':
        return 'Exceptional reputation. This wallet demonstrates elite-level trustworthiness across all behavioral metrics.';
      case 'High':
        return 'Strong reputation with consistent positive signals. High trust indicators across network analysis.';
      case 'Medium':
        return 'Moderate trust signals detected. Standard verification recommended for significant transactions.';
      case 'Low':
        return 'Limited trust indicators. Enhanced due diligence advised before engaging in transactions.';
      default: return '';
    }
  };

  const gaugeColor = getGaugeColor(trustLevel);
  const rotation = (score / 1000) * 180 - 90;

  return (
    <Card className="p-6 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 border border-cyan-500/20 shadow-2xl shadow-cyan-500/10 overflow-hidden relative backdrop-blur-xl">
      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-500/10 to-pink-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `linear-gradient(rgba(0, 217, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 217, 255, 0.1) 1px, transparent 1px)`,
        backgroundSize: '20px 20px'
      }}></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h2 className="font-bold text-xl text-white">Trust Intelligence Score</h2>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full border border-cyan-400/30 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wide">Reputa Analysis</span>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Gauge SVG */}
          <div className="relative w-64 h-40 flex-shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 200 120" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="gaugeGradientDark" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="33%" stopColor="#eab308" />
                  <stop offset="66%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
                <filter id="glowDark">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <filter id="neonGlow">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                  <feFlood floodColor={gaugeColor} floodOpacity="0.5"/>
                  <feComposite in2="coloredBlur" operator="in"/>
                  <feMerge>
                    <feMergeNode/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {/* Background Arc */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="14"
                strokeLinecap="round"
              />
              
              {/* Animated Gradient Arc */}
              <motion.path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="url(#gaugeGradientDark)"
                strokeWidth="14"
                strokeLinecap="round"
                filter="url(#glowDark)"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: animatedScore / 1000 }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />

              {/* Needle */}
              <motion.line
                x1="100"
                y1="100"
                x2="100"
                y2="40" 
                stroke={gaugeColor}
                strokeWidth="4"
                strokeLinecap="round"
                filter="url(#neonGlow)"
                initial={{ rotate: -90 }}
                animate={{ rotate: rotation }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                style={{ transformOrigin: '100px 100px' }}
              />
              
              {/* Center Dot */}
              <circle cx="100" cy="100" r="8" fill={gaugeColor} stroke="rgba(255,255,255,0.3)" strokeWidth="2" filter="url(#neonGlow)" />
            </svg>

            {/* Score Display */}
            <div className="absolute top-[40%] inset-x-0 flex flex-col items-center justify-center z-50 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col items-center"
              >
                <span className="font-black text-5xl leading-none drop-shadow-lg" style={{ color: gaugeColor, textShadow: `0 0 20px ${gaugeColor}40` }}>
                  {displayScore}
                </span>
                <span className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                  out of 1000
                </span>
              </motion.div>
            </div>
          </div>

          {/* Trust Info */}
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-sm border border-white/10"
                style={{ 
                  background: `linear-gradient(135deg, ${gaugeColor}30, ${gaugeColor}10)`,
                  color: gaugeColor,
                  boxShadow: `0 0 20px ${gaugeColor}30`
                }}
              >
                {getIcon()}
              </div>
              <div>
                <h3 className="font-bold text-xl text-white">
                  {trustLevel === 'Elite' ? 'Elite Wallet' : trustLevel === 'High' ? 'Trusted Wallet' : trustLevel === 'Medium' ? 'Moderate Risk' : 'High Risk'}
                </h3>
                <p className="text-sm text-gray-400">
                  Based on {trustLevel === 'Elite' ? 'exceptional' : trustLevel === 'High' ? 'positive' : trustLevel === 'Medium' ? 'mixed' : 'limited'} signals
                </p>
              </div>
            </div>

            <p className="text-gray-400 mb-6 leading-relaxed">{getDescription()}</p>

            {/* Score Breakdown */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl border border-purple-500/30 backdrop-blur-sm">
                <p className="text-[10px] text-purple-400 font-bold uppercase mb-1">Balance</p>
                <p className="font-bold text-purple-300">30%</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 rounded-xl border border-cyan-500/30 backdrop-blur-sm">
                <p className="text-[10px] text-cyan-400 font-bold uppercase mb-1">Age</p>
                <p className="font-bold text-cyan-300">40%</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-xl border border-emerald-500/30 backdrop-blur-sm">
                <p className="text-[10px] text-emerald-400 font-bold uppercase mb-1">Activity</p>
                <p className="font-bold text-emerald-300">30%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
