import { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { ChartDataPoint } from '@/types';
import { ChevronDown } from 'lucide-react';

interface ProductsReportProps {
  data: ChartDataPoint[];
}

export function ProductsReport({ data }: ProductsReportProps) {
  const { t } = useLanguage();
  const [selectedPeriod, setSelectedPeriod] = useState('This month');

  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="bg-[#111] rounded-[15px] p-8 relative overflow-hidden">
      {/* Glow Effect */}
      <div className="absolute left-1/2 -translate-x-1/2 top-1/3 size-[52px]">
        <div className="absolute inset-[-230.77%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 292 292">
            <defs>
              <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="292" id="glow3" width="292" x="0" y="0">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
                <feGaussianBlur result="effect1_foregroundBlur" stdDeviation="60" />
              </filter>
            </defs>
            <circle cx="146" cy="146" fill="#FAC515" r="26" filter="url(#glow3)" />
          </svg>
        </div>
      </div>

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="font-['Inter',sans-serif] font-semibold text-[23px] text-white mb-1">
              {t('charts.timeline')}
            </h3>
            <p className="font-['Inter',sans-serif] text-[#8c8484] text-[14px]">
              Track your transaction patterns
            </p>
          </div>
          
          <button className="flex items-center gap-2 text-white hover:text-[#FAC515] transition-colors">
            <span className="font-['Inter',sans-serif] text-[14px]">{selectedPeriod}</span>
            <ChevronDown className="size-4" />
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mb-6">
          <div className="flex items-center gap-2">
            <div className="size-3 rounded-full bg-[#A28080]" />
            <p className="font-['Inter',sans-serif] text-[12px] text-white">
              {t('charts.transactions.internal')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-3 rounded-full bg-[#09D52F]" />
            <p className="font-['Inter',sans-serif] text-[12px] text-white">
              {t('charts.transactions.external')}
            </p>
          </div>
        </div>

        {/* Chart Area */}
        <div className="relative h-[240px]">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-right pr-4">
            {[40, 30, 20, 10, 0].map((val, idx) => (
              <span key={idx} className="font-['Inter',sans-serif] text-[#afaeae] text-[12px]">
                {val}K
              </span>
            ))}
          </div>

          {/* Bar Chart */}
          <div className="absolute left-16 right-0 top-0 bottom-8 flex items-end justify-between gap-2">
            {data.slice(0, 7).map((item, index) => {
              const height = (item.value / maxValue) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex gap-1 items-end" style={{ height: '100%' }}>
                    <div
                      className="flex-1 bg-[#1a1a1a] rounded-t-[20px] transition-all duration-300 hover:bg-[#222]"
                      style={{ height: `${height}%` }}
                    />
                    <div
                      className="flex-1 bg-black rounded-t-[20px] transition-all duration-300 hover:bg-[#111]"
                      style={{ height: `${height * 0.8}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* X-axis labels */}
          <div className="absolute left-16 right-0 bottom-0 flex justify-between">
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'].map((month, idx) => (
              <span key={idx} className="font-['Inter',sans-serif] text-[#efefef] text-[12px] flex-1 text-center">
                {month}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
