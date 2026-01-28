import { ReputationScore } from '@/types';
import { useLanguage } from '@/hooks/useLanguage';

interface ProgressCardProps {
  score: ReputationScore;
}

export function ProgressCard({ score }: ProgressCardProps) {
  const { t } = useLanguage();

  const items = [
    { 
      label: t('score.accountAge'), 
      value: score.breakdown.accountAge,
      max: 20,
      color: '#3fb185'
    },
    { 
      label: t('score.transactions'), 
      value: score.breakdown.transactionCount,
      max: 15,
      color: '#06b6d4'
    },
    { 
      label: t('score.volume'), 
      value: score.breakdown.transactionVolume,
      max: 15,
      color: '#8b5cf6'
    },
  ];

  return (
    <div className="bg-[#111] rounded-[15px] p-8 relative overflow-hidden shadow-[0px_0px_80px_0px_rgba(0,0,0,0.08)]">
      {/* Glow Effect */}
      <div className="absolute left-1/2 -translate-x-1/2 -top-8 size-[52px]">
        <div className="absolute inset-[-230.77%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 292 292">
            <defs>
              <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="292" id="glow2" width="292" x="0" y="0">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
                <feGaussianBlur result="effect1_foregroundBlur" stdDeviation="60" />
              </filter>
            </defs>
            <circle cx="146" cy="146" fill="#FAC515" r="26" filter="url(#glow2)" />
          </svg>
        </div>
      </div>

      <div className="relative">
        <h3 className="font-['Roboto',sans-serif] font-semibold text-[20px] text-white mb-2" style={{ fontVariationSettings: "'wdth' 100" }}>
          Progress
        </h3>
        <p className="font-['Inter',sans-serif] text-[#a9a9a9] text-[14px] mb-8">
          Track your reputation score
        </p>

        {/* Circular Progress Indicators */}
        <div className="flex items-center justify-center gap-6 mb-8">
          {items.map((item, index) => {
            const percentage = (item.value / item.max) * 100;
            const size = index === 0 ? 99 : 76;
            const radius = index === 0 ? 42 : 32;
            const circumference = 2 * Math.PI * radius;
            const offset = circumference - (percentage / 100) * circumference;

            return (
              <div key={index} className="relative flex items-center justify-center" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="transform -rotate-90">
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={index === 0 ? '#000' : index === 1 ? '#0F0F10' : '#19191A'}
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={item.color}
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                  />
                </svg>
                <span className="absolute font-['Roboto',sans-serif] font-semibold text-[16px] text-white" style={{ fontVariationSettings: "'wdth' 100" }}>
                  {item.value}
                </span>
              </div>
            );
          })}
        </div>

        {/* Progress Bars */}
        <div className="space-y-6">
          {items.slice(0, 2).map((item, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-2">
                <p className="font-['Inter_Tight',sans-serif] text-[16px] text-white tracking-[-0.32px]">
                  {item.label}
                </p>
                <div className="flex items-center gap-2">
                  <div className="bg-[rgba(63,177,133,0.1)] rounded-[24px] border border-[rgba(255,255,255,0.1)] px-3 py-1">
                    <p className="font-['Inter_Tight',sans-serif] text-[#3fb185] text-[14px] tracking-[-0.28px]">
                      {((item.value / item.max) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <p className="font-['Inter_Tight',sans-serif] text-[14px] text-white tracking-[-0.28px]">
                    {item.value}/{item.max}
                  </p>
                </div>
              </div>
              <div className="h-[8px] bg-[#d9d9d9] rounded-[3px] overflow-hidden">
                <div
                  className="h-full rounded-[3px] transition-all duration-500"
                  style={{
                    width: `${(item.value / item.max) * 100}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
