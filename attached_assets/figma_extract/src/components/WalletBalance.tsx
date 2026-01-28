import { WalletData } from '@/types';
import { useLanguage } from '@/hooks/useLanguage';
import { TrendingUp, TrendingDown, Wallet, Calendar, Activity } from 'lucide-react';

interface WalletBalanceProps {
  wallet: WalletData;
}

export function WalletBalance({ wallet }: WalletBalanceProps) {
  const { t } = useLanguage();

  // Calculate 24h change (mock)
  const change = 0.2;
  const isPositive = change > 0;
  
  // Calculate account age in days
  const accountAgeDays = Math.floor((Date.now() - new Date(wallet.createdAt).getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate last active
  const lastActiveDays = Math.floor((Date.now() - new Date(wallet.lastActive).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="bg-[#111] rounded-[15px] p-8 relative overflow-hidden h-full">
      {/* Glow Effect */}
      <div className="absolute right-8 top-8 size-16 opacity-30">
        <div className="absolute inset-0 bg-[#FAC515] rounded-full blur-3xl" />
      </div>

      <div className="relative h-full flex flex-col">
        {/* Header with Icon */}
        <div className="flex items-center gap-3 mb-6">
          <div className="size-12 rounded-full bg-gradient-to-br from-[#FAC515] to-[#f59e0b] flex items-center justify-center">
            <Wallet className="size-6 text-black" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gray-400 text-sm">{t('dashboard.balance')}</p>
            <p className="font-['Roboto',sans-serif] text-xs text-gray-500 truncate" style={{ fontVariationSettings: "'wdth' 100" }}>
              {wallet.address}
            </p>
          </div>
        </div>

        {/* Main Balance Display */}
        <div className="mb-6">
          <div className="flex items-baseline gap-2 mb-2">
            <p className="font-['Roboto',sans-serif] font-bold text-5xl text-white leading-none" style={{ fontVariationSettings: "'wdth' 100" }}>
              {wallet.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[#FAC515] text-xl font-medium">{t('dashboard.pi')}</p>
          </div>

          {/* 24h Change Badge */}
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full ${isPositive ? 'bg-[rgba(63,177,133,0.1)]' : 'bg-[rgba(239,68,68,0.1)]'}`}>
              {isPositive ? (
                <TrendingUp className="size-4 text-[#3fb185]" />
              ) : (
                <TrendingDown className="size-4 text-[#ef4444]" />
              )}
              <span className={`text-sm font-medium ${isPositive ? 'text-[#3fb185]' : 'text-[#ef4444]'}`}>
                {isPositive ? '+' : ''}{change}%
              </span>
            </div>
            <p className="text-gray-500 text-sm">24h change</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#222] mt-auto">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Activity className="size-3.5 text-[#3fb185]" />
              <p className="text-gray-500 text-xs">Transactions</p>
            </div>
            <p className="font-['Roboto',sans-serif] font-semibold text-lg text-white" style={{ fontVariationSettings: "'wdth' 100" }}>
              {wallet.transactions.length}
            </p>
          </div>
          
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar className="size-3.5 text-[#06b6d4]" />
              <p className="text-gray-500 text-xs">Account Age</p>
            </div>
            <p className="font-['Roboto',sans-serif] font-semibold text-lg text-white" style={{ fontVariationSettings: "'wdth' 100" }}>
              {accountAgeDays}d
            </p>
          </div>
          
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="size-3.5 text-[#8b5cf6]" />
              <p className="text-gray-500 text-xs">Last Active</p>
            </div>
            <p className="font-['Roboto',sans-serif] font-semibold text-lg text-white" style={{ fontVariationSettings: "'wdth' 100" }}>
              {lastActiveDays === 0 ? 'Today' : `${lastActiveDays}d ago`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}