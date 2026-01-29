import { useLanguage } from '../hooks/useLanguage';
import { Coins, Wallet, ArrowUpRight, ArrowDownLeft, RefreshCw, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';

interface PiDexSectionProps {
  walletAddress?: string;
  balance?: number;
  totalSent?: number;
  totalReceived?: number;
  isMainnet?: boolean;
}

interface WalletAsset {
  symbol: string;
  name: string;
  balance: number;
  value: number;
  type: 'native' | 'locked' | 'available';
}

export function PiDexSection({ 
  walletAddress = '',
  balance = 0,
  totalSent = 0,
  totalReceived = 0,
  isMainnet = false
}: PiDexSectionProps) {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const assets: WalletAsset[] = [
    {
      symbol: 'PI',
      name: 'Pi Network',
      balance: balance,
      value: balance,
      type: 'native',
    },
  ];

  const totalValue = balance;

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLastUpdated(new Date());
    setIsLoading(false);
  };

  const openExplorer = () => {
    if (walletAddress) {
      const explorerUrl = isMainnet 
        ? `https://blockexplorer.minepi.com/accounts/${walletAddress}`
        : `https://pi-blockchain.net/accounts/${walletAddress}`;
      window.open(explorerUrl, '_blank');
    }
  };

  return (
    <div 
      className="rounded-2xl p-5 h-full"
      style={{
        background: 'rgba(20, 22, 30, 0.8)',
        border: '1px solid rgba(139, 92, 246, 0.2)',
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(0, 217, 255, 0.15) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
            }}
          >
            <Wallet className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">Portfolio</h3>
            <p className="text-[10px] text-white/40">Real blockchain data</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 rounded-lg transition-all hover:bg-white/5"
            aria-label="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 text-white/40 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div 
        className="p-4 rounded-xl mb-4"
        style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(0, 217, 255, 0.1) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.25)',
        }}
      >
        <p className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Total Balance</p>
        <p className="text-3xl font-black text-white">
          {totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
          <span className="text-lg text-purple-400 ml-1">π</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div 
          className="p-3 rounded-xl"
          style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[9px] text-emerald-400 uppercase font-bold">Received</span>
          </div>
          <p className="text-base font-bold text-white">
            {totalReceived.toLocaleString('en-US', { maximumFractionDigits: 2 })} π
          </p>
        </div>

        <div 
          className="p-3 rounded-xl"
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-red-400" />
            <span className="text-[9px] text-red-400 uppercase font-bold">Sent</span>
          </div>
          <p className="text-base font-bold text-white">
            {totalSent.toLocaleString('en-US', { maximumFractionDigits: 2 })} π
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {assets.map((asset, index) => (
          <div 
            key={index}
            className="p-3 rounded-xl flex items-center justify-between"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #00D9FF 100%)',
                }}
              >
                <span className="text-white font-bold text-sm">π</span>
              </div>
              <div>
                <p className="text-xs font-bold text-white">{asset.symbol}</p>
                <p className="text-[10px] text-white/40">{asset.name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-white">
                {asset.balance.toLocaleString('en-US', { maximumFractionDigits: 4 })}
              </p>
              <p className="text-[10px] text-purple-400">Native</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[9px] text-white/40">
            {isMainnet ? 'Mainnet' : 'Testnet'} • {lastUpdated.toLocaleTimeString()}
          </span>
        </div>
        {walletAddress && (
          <button 
            onClick={openExplorer}
            className="flex items-center gap-1 text-[10px] font-bold text-purple-400 hover:text-purple-300 transition-colors"
          >
            View on Explorer
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
