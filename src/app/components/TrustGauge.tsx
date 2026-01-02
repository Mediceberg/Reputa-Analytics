import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, ShieldAlert, ShieldBan, Sparkles } from 'lucide-react';
import { Card } from './ui/card';
import type { TrustLevel } from '../App';

interface TrustGaugeProps {
  score: number; // 0-1000
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

  // Animate the number display
  useEffect(() => {
    const duration = 1000; // 1 second
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
      case 'Elite': return '#10b981'; // emerald
      case 'High': return '#3b82f6'; // blue
      case 'Medium': return '#eab308'; // yellow
      case 'Low': return '#ef4444'; // red
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
    }
  };

  const gaugeColor = getGaugeColor(trustLevel);
  const normalizedScore = score / 10; // Convert 0-1000 to 0-100 for animation
  const rotation = (normalizedScore / 100) * 180 - 90;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-bold text-xl">Trust Intelligence Score</h2>
        <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-full border border-cyan-200">
          <Sparkles className="w-3 h-3 text-cyan-600" />
          <span className="text-xs font-semibold text-cyan-700">Reputa Analysis</span>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row items-center gap-8">
        {/* Gauge Visual */}
        <div className="relative w-64 h-32 flex-shrink-0">
          {/* Background Arc */}
          <svg viewBox="0 0 200 100" className="w-full h-full">
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="25%" stopColor="#f97316" />
                <stop offset="50%" stopColor="#eab308" />
                <stop offset="75%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
            
            {/* Background track */}
            <path
              d="M 20 80 A 80 80 0 0 1 180 80"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="12"
              strokeLinecap="round"
            />
            
            {/* Colored arc */}
            <motion.path
              d="M 20 80 A 80 80 0 0 1 180 80"
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth="12"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: animatedScore / 1000 }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />

            {/* Needle */}
            <motion.line
              x1="100"
              y1="80"
              x2="100"
              y2="20"
              stroke={gaugeColor}
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ rotate: -90 }}
              animate={{ rotate: rotation }}
              transition={{ duration: 1, ease: 'easeOut' }}
              style={{ transformOrigin: '100px 80px' }}
            />
            
            {/* Center dot */}
            <circle cx="100" cy="80" r="6" fill={gaugeColor} />
          </svg>

          {/* Score Display */}
          <div className="absolute inset-x-0 bottom-0 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
              className="inline-flex flex-col items-center"
            >
              <span className="font-bold text-3xl" style={{ color: gaugeColor }}>
                {displayScore}
              </span>
              <span className="text-xs text-gray-500">out of 1000</span>
            </motion.div>
          </div>
        </div>

        {/* Description */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${gaugeColor}20`, color: gaugeColor }}
            >
              {getIcon()}
            </div>
            <div>
              <h3 className="font-bold text-lg">
                {trustLevel === 'Elite' ? 'Elite Wallet' : trustLevel === 'High' ? 'Trusted Wallet' : trustLevel === 'Medium' ? 'Moderate Risk' : 'High Risk'}
              </h3>
              <p className="text-sm text-gray-500">
                Based on {trustLevel === 'Elite' ? 'exceptional' : trustLevel === 'High' ? 'positive' : trustLevel === 'Medium' ? 'mixed' : 'limited'} signals
              </p>
            </div>
          </div>

          <p className="text-gray-700 mb-4">{getDescription()}</p>

          {/* Score Breakdown */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Balance Weight:</span>
              <span className="font-semibold">30%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Account Age:</span>
              <span className="font-semibold">40%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Activity Level:</span>
              <span className="font-semibold">30%</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}