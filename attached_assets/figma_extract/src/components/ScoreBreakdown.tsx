import { ReputationScore } from '@/types';
import { useLanguage } from '@/hooks/useLanguage';
import { BarChart3 } from 'lucide-react';

interface ScoreBreakdownProps {
  score: ReputationScore;
}

export function ScoreBreakdown({ score }: ScoreBreakdownProps) {
  const { t } = useLanguage();

  const items = [
    { key: 'accountAge', value: score.breakdown.accountAge, max: 20, color: '#10b981' },
    { key: 'transactions', value: score.breakdown.transactionCount, max: 15, color: '#3fb185' },
    { key: 'volume', value: score.breakdown.transactionVolume, max: 15, color: '#06b6d4' },
    { key: 'staking', value: score.breakdown.stakingBonus, max: 15, color: '#8b5cf6' },
    { key: 'mining', value: score.breakdown.miningDaysBonus, max: 20, color: '#FAC515' },
    { key: 'activity', value: score.breakdown.activityScore, max: 15, color: '#ec4899' },
  ];

  return (
    <div className="bg-[#111] rounded-[15px] p-8 h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="size-12 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#ec4899] flex items-center justify-center">
          <BarChart3 className="size-6 text-white" />
        </div>
        <div>
          <h3 className="font-['Roboto',sans-serif] font-semibold text-[20px] text-white" style={{ fontVariationSettings: "'wdth' 100" }}>
            {t('score.breakdown')}
          </h3>
          <p className="text-gray-400 text-sm">Detailed score factors</p>
        </div>
      </div>
      
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.key}>
            <div className="flex justify-between items-center mb-2">
              <span className="font-['Inter',sans-serif] text-sm text-gray-300">{t(`score.${item.key}`)}</span>
              <div className="flex items-center gap-2">
                <span className="font-['Roboto',sans-serif] font-medium text-sm text-white" style={{ fontVariationSettings: "'wdth' 100" }}>
                  {item.value}
                </span>
                <span className="text-gray-500 text-xs">/ {item.max}</span>
              </div>
            </div>
            <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${(item.value / item.max) * 100}%`,
                  backgroundColor: item.color
                }}
              />
            </div>
          </div>
        ))}
        
        {score.breakdown.spamPenalty > 0 && (
          <div className="pt-4 border-t border-[#222]">
            <div className="flex justify-between items-center mb-2">
              <span className="font-['Inter',sans-serif] text-sm text-gray-300">{t('score.spam')}</span>
              <span className="font-['Roboto',sans-serif] font-medium text-sm text-red-400" style={{ fontVariationSettings: "'wdth' 100" }}>
                -{score.breakdown.spamPenalty}
              </span>
            </div>
            <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full"
                style={{ width: `${Math.min(score.breakdown.spamPenalty, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}