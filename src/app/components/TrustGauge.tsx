import { useEffect, useState } from 'react'; 
import { motion } from 'motion/react';
import { ShieldCheck, ShieldAlert, ShieldBan, Sparkles, Zap } from 'lucide-react';
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
    <Card className="p-6 bg-gradient-to-br from-white to-slate-50/50 border-slate-200/50 shadow-xl overflow-hidden relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      
      <div className="relative">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-xl text-gray-900">Trust Intelligence Score</h2>
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-full border border-cyan-200/50">
            <Sparkles className="w-4 h-4 text-cyan-600" />
            <span className="text-xs font-bold text-cyan-700 uppercase tracking-wide">Reputa Analysis</span>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative w-64 h-40 flex-shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 200 120" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="33%" stopColor="#eab308" />
                  <stop offset="66%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="14"
                strokeLinecap="round"
              />
              
              <motion.path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="url(#gaugeGradient)"
                strokeWidth="14"
                strokeLinecap="round"
                filter="url(#glow)"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: animatedScore / 1000 }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />

              <motion.line
                x1="100"
                y1="100"
                x2="100"
                y2="40" 
                stroke={gaugeColor}
                strokeWidth="4"
                strokeLinecap="round"
                initial={{ rotate: -90 }}
                animate={{ rotate: rotation }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                style={{ transformOrigin: '100px 100px' }}
              />
              
              <circle cx="100" cy="100" r="8" fill={gaugeColor} stroke="white" strokeWidth="3" filter="url(#glow)" />
            </svg>

            <div className="absolute top-[40%] inset-x-0 flex flex-col items-center justify-center z-50 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col items-center"
              >
                <span className="font-black text-5xl leading-none drop-shadow-sm" style={{ color: gaugeColor }}>
                  {displayScore}
                </span>
                <span className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                  out of 1000
                </span>
              </motion.div>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                style={{ 
                  background: `linear-gradient(135deg, ${gaugeColor}20, ${gaugeColor}40)`,
                  color: gaugeColor 
                }}
              >
                {getIcon()}
              </div>
              <div>
                <h3 className="font-bold text-xl text-gray-900">
                  {trustLevel === 'Elite' ? 'Elite Wallet' : trustLevel === 'High' ? 'Trusted Wallet' : trustLevel === 'Medium' ? 'Moderate Risk' : 'High Risk'}
                </h3>
                <p className="text-sm text-gray-500">
                  Based on {trustLevel === 'Elite' ? 'exceptional' : trustLevel === 'High' ? 'positive' : trustLevel === 'Medium' ? 'mixed' : 'limited'} signals
                </p>
              </div>
            </div>

            <p className="text-gray-600 mb-6 leading-relaxed">{getDescription()}</p>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl border border-purple-200/50">
                <p className="text-[10px] text-purple-600 font-bold uppercase mb-1">Balance</p>
                <p className="font-bold text-purple-700">30%</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-cyan-50 to-cyan-100/50 rounded-xl border border-cyan-200/50">
                <p className="text-[10px] text-cyan-600 font-bold uppercase mb-1">Age</p>
                <p className="font-bold text-cyan-700">40%</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl border border-emerald-200/50">
                <p className="text-[10px] text-emerald-600 font-bold uppercase mb-1">Activity</p>
                <p className="font-bold text-emerald-700">30%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
