import { ReputationScore } from '@/types';
import { useLanguage } from '@/hooks/useLanguage';

interface TrustScoreGaugeProps {
  score: ReputationScore;
}

export function TrustScoreGauge({ score }: TrustScoreGaugeProps) {
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
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const color = getColorByLevel(score.trustLevel);

  return (
    <div className="relative flex flex-col items-center justify-center p-8">
      <svg className="transform -rotate-90" width="200" height="200">
        {/* Background circle */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          stroke="#1a1a1a"
          strokeWidth="20"
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          stroke={color}
          strokeWidth="20"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
        />
      </svg>
      
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-bold text-white">{score.total}%</span>
        <span className="text-sm text-gray-400 mt-1">{t('score.trust')}</span>
        <span className="text-lg font-semibold mt-2" style={{ color }}>
          {t(`score.level.${score.trustLevel.toLowerCase()}`)}
        </span>
      </div>
    </div>
  );
}
