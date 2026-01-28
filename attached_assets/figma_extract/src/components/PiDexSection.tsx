import { TokenBalance } from '@/types';
import { useLanguage } from '@/hooks/useLanguage';
import { TrendingUp, Coins } from 'lucide-react';

interface PiDexSectionProps {
  tokens: TokenBalance[];
}

export function PiDexSection({ tokens }: PiDexSectionProps) {
  const { t } = useLanguage();

  const totalValue = tokens.reduce((sum, token) => sum + token.value, 0);

  return (
    <div className="bg-[#111] rounded-[15px] p-8 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#ec4899] flex items-center justify-center">
            <Coins className="size-6 text-white" />
          </div>
          <div>
            <h3 className="font-['Roboto',sans-serif] font-semibold text-[20px] text-white" style={{ fontVariationSettings: "'wdth' 100" }}>
              {t('dex.title')}
            </h3>
            <p className="text-gray-400 text-sm">{t('dex.tokens')}</p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-gray-400 text-sm mb-1">{t('dex.value')}</p>
          <p className="font-['Roboto',sans-serif] font-bold text-2xl text-white" style={{ fontVariationSettings: "'wdth' 100" }}>
            {totalValue.toFixed(2)} <span className="text-[#FAC515]">π</span>
          </p>
        </div>
      </div>

      {/* Tokens List */}
      {tokens.length > 0 ? (
        <div className="space-y-3">
          {tokens.map((token, index) => {
            const percentage = (token.value / totalValue) * 100;
            return (
              <div key={index} className="bg-[#0a0a0a] rounded-lg p-4 hover:bg-[#151515] transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-gradient-to-br from-[#FAC515] to-[#f59e0b] flex items-center justify-center text-2xl">
                      {token.logo}
                    </div>
                    <div>
                      <p className="font-['Roboto',sans-serif] font-semibold text-white" style={{ fontVariationSettings: "'wdth' 100" }}>
                        {token.symbol}
                      </p>
                      <p className="text-gray-500 text-sm">{token.name}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-['Roboto',sans-serif] font-semibold text-white" style={{ fontVariationSettings: "'wdth' 100" }}>
                      {token.balance.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {token.value.toFixed(2)} π
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#FAC515] to-[#f59e0b] rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-1 text-[#3fb185] text-sm">
                    <TrendingUp className="size-3" />
                    <span>{percentage.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Coins className="size-16 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500">{t('dex.no_tokens')}</p>
        </div>
      )}
    </div>
  );
}
