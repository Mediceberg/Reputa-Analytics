import { ReputationScore } from '@/types';
import { useLanguage } from '@/hooks/useLanguage';
import { Lightbulb, TrendingUp, Shield, Activity } from 'lucide-react';

interface RecommendationsProps {
  score: ReputationScore;
}

export function Recommendations({ score }: RecommendationsProps) {
  const { t } = useLanguage();

  const getIcon = (recommendation: string) => {
    if (recommendation.includes('transactions')) return <TrendingUp className="size-5" />;
    if (recommendation.includes('spam')) return <Shield className="size-5" />;
    if (recommendation.includes('activity')) return <Activity className="size-5" />;
    return <Lightbulb className="size-5" />;
  };

  const getColor = (recommendation: string) => {
    if (recommendation.includes('excellent')) return 'text-green-400 bg-green-400/10';
    if (recommendation.includes('spam')) return 'text-red-400 bg-red-400/10';
    return 'text-yellow-400 bg-yellow-400/10';
  };

  return (
    <div className="bg-[#111] rounded-2xl p-6">
      <h3 className="text-xl font-semibold text-white mb-4">{t('recommendations.title')}</h3>
      
      <div className="space-y-3">
        {score.recommendations.map((rec, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 p-4 rounded-lg ${getColor(rec)}`}
          >
            <div className="mt-0.5">{getIcon(rec)}</div>
            <p className="text-sm flex-1">{t(rec)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
