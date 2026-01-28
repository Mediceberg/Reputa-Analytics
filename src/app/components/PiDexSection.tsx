import { TokenBalance } from '../protocol/types';
import { useLanguage } from '../hooks/useLanguage';
import { TrendingUp, Coins, Search, ArrowUpRight, Filter } from 'lucide-react';
import { useState } from 'react';

interface PiDexSectionProps {
  tokens: TokenBalance[];
}

export function PiDexSection({ tokens }: PiDexSectionProps) {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTokens = tokens.filter(token => 
    token.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    token.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalValue = tokens.reduce((sum, token) => sum + token.value, 0);

  return (
    <div className="glass-card p-6 flex flex-col h-[500px] border border-white/10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center border border-purple-500/30">
            <Coins className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-black text-sm text-white uppercase tracking-widest">
              {t('dex.title')}
            </h3>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{tokens.length} {t('dex.tokens')}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5">
          <div className="text-right">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-0.5">{t('dex.value')}</p>
            <p className="font-black text-lg neon-text-cyan leading-none">
              {totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-xs text-cyan-400">π</span>
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="relative mb-4 group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
        <input 
          type="text" 
          placeholder="Search tokens..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-xs font-bold text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all"
        />
      </div>

      {/* Token List with Scroll */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
        {filteredTokens.length > 0 ? (
          filteredTokens.map((token, index) => {
            const percentage = (token.value / totalValue) * 100;
            return (
              <div 
                key={index} 
                className="group p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/[0.08] hover:border-cyan-500/20 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/10 group-hover:border-cyan-500/30 transition-colors relative">
                      <span className="text-lg">{token.logo}</span>
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-black text-xs text-white uppercase tracking-wide">
                          {token.symbol}
                        </p>
                        <ArrowUpRight className="w-2.5 h-2.5 text-gray-600 group-hover:text-cyan-400 transition-colors" />
                      </div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{token.name}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-black text-xs text-white">
                      {token.balance.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] font-bold text-cyan-400/80">
                      ≈ {token.value.toFixed(2)} π
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(0,217,255,0.3)]"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-bold">
                    <span>{percentage.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center py-12 opacity-40">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center mb-4">
              <Coins className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t('dex.no_tokens')}</p>
          </div>
        )}
      </div>

      {/* Footer / Stats */}
      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between opacity-60">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Network Live</span>
        </div>
        <button className="text-[9px] font-black text-cyan-400 uppercase tracking-widest hover:text-cyan-300 transition-colors">
          Manage Assets →
        </button>
      </div>
    </div>
  );
}
