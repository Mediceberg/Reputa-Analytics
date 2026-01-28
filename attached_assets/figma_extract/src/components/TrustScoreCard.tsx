import { ReputationScore } from '@/types';
import { useLanguage } from '@/hooks/useLanguage';
import { Shield, TrendingUp, AlertTriangle } from 'lucide-react';

interface TrustScoreCardProps {
  score: ReputationScore;
}

export function TrustScoreCard({ score }: TrustScoreCardProps) {
  const { t } = useLanguage();
  
  const getColorByLevel = (level: ReputationScore['trustLevel']) => {
    switch (level) {
      case 'Excellent': return '#10b981';
      case 'High': return '#3fb185';
      case 'Medium': return '#f59e0b';
      case 'Low': return '#ef4444';
    }
  };

  const percentage = score.total;
  const color = getColorByLevel(score.trustLevel);
  const circumference = 2 * Math.PI * 70;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-[#111] rounded-[15px] p-8 relative overflow-hidden h-full">
      {/* Glow Effect */}
      <div className="absolute left-1/2 -translate-x-1/2 -top-8 size-[52px]">
        <div className="absolute inset-[-230.77%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 292 292">
            <defs>
              <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="292" id="glow" width="292" x="0" y="0">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
                <feGaussianBlur result="effect1_foregroundBlur" stdDeviation="60" />
              </filter>
            </defs>
            <circle cx="146" cy="146" fill="#FAC515" r="26" filter="url(#glow)" />
          </svg>
        </div>
      </div>

      <div className="relative h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="size-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
            <Shield className="size-6" style={{ color }} />
          </div>
          <div>
            <h3 className="font-['Roboto',sans-serif] font-semibold text-[20px] text-white" style={{ fontVariationSettings: "'wdth' 100" }}>
              {t('score.trust')}
            </h3>
            <p className="text-gray-400 text-sm">Reputation Analysis</p>
          </div>
        </div>

        {/* Circular Progress */}
        <div className="flex items-center justify-center mb-6 flex-1">
          <div className="relative">
            <svg width="180" height="180" className="transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="90"
                cy="90"
                r="70"
                stroke="#1a1a1a"
                strokeWidth="12"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="90"
                cy="90"
                r="70"
                stroke={color}
                strokeWidth="12"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
              />
            </svg>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-['Roboto',sans-serif] font-bold text-5xl text-white" style={{ fontVariationSettings: "'wdth' 100" }}>
                {score.total}
              </span>
              <span className="text-gray-400 text-sm mt-1">/ 100</span>
            </div>
          </div>
        </div>

        {/* Trust Level Badge */}
        <div className="text-center mb-6">
          <div 
            className="inline-block px-6 py-2.5 rounded-full text-sm font-semibold"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {t(`score.level.${score.trustLevel.toLowerCase()}`)}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#222]">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="size-3.5 text-[#10b981]" />
              <p className="text-gray-500 text-xs">{t('score.activity')}</p>
            </div>
            <p className="font-['Roboto',sans-serif] font-semibold text-lg text-white" style={{ fontVariationSettings: "'wdth' 100" }}>
              {score.activityLevel}%
            </p>
          </div>
          
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle className="size-3.5 text-[#ef4444]" />
              <p className="text-gray-500 text-xs">{t('score.risk')}</p>
            </div>
            <p className="font-['Roboto',sans-serif] font-semibold text-lg text-white" style={{ fontVariationSettings: "'wdth' 100" }}>
              {score.riskScore}%
            </p>
          </div>
          
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Shield className="size-3.5 text-[#3fb185]" />
              <p className="text-gray-500 text-xs">Rank</p>
            </div>
            <p className="font-['Roboto',sans-serif] font-semibold text-lg text-white" style={{ fontVariationSettings: "'wdth' 100" }}>
              {score.trustLevel}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}