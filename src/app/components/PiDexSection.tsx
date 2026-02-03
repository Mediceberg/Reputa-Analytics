import { useLanguage } from '../hooks/useLanguage';
import { Wallet, ArrowUpRight, ArrowDownLeft, RefreshCw, ExternalLink, Coins } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

interface PiDexSectionProps { 
  walletAddress?: string;
  balance?: number;
  totalSent?: number;
  totalReceived?: number;
  isMainnet?: boolean;
}

interface TokenAsset {
  asset_type: 'native' | 'credit_alphanum4' | 'credit_alphanum12';
  asset_code?: string;
  asset_issuer?: string;
  balance: number;
}

const PI_TESTNET_API = 'https://api.testnet.minepi.com';
const PI_MAINNET_API = 'https://api.mainnet.minepi.com';

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
  const [tokens, setTokens] = useState<TokenAsset[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchTokens = useCallback(async () => {
    if (!walletAddress) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const apiBase = isMainnet ? PI_MAINNET_API : PI_TESTNET_API;
      const response = await fetch(`${apiBase}/accounts/${walletAddress}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setTokens([{ asset_type: 'native', balance: 0 }]);
          setError('Wallet not found on blockchain');
        } else {
          throw new Error(`API error: ${response.status}`);
        }
        return;
      }
      
      const data = await response.json();
      const balances: TokenAsset[] = (data.balances || []).map((b: any) => ({
        asset_type: b.asset_type,
        asset_code: b.asset_code,
        asset_issuer: b.asset_issuer,
        balance: parseFloat(b.balance) || 0,
      }));
      
      setTokens(balances.length > 0 ? balances : [{ asset_type: 'native', balance: 0 }]);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('[PiDexSection] Fetch error:', err);
      setError('Failed to fetch wallet data');
      setTokens([{ asset_type: 'native', balance: balance }]);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, isMainnet, balance]);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  const handleRefresh = () => {
    fetchTokens();
  };

  const openExplorer = () => {
    if (walletAddress) {
      const explorerUrl = isMainnet 
        ? `https://blockexplorer.minepi.com/accounts/${walletAddress}`
        : `https://pi-blockchain.net/accounts/${walletAddress}`;
      window.open(explorerUrl, '_blank');
    }
  };

  const getTokenName = (token: TokenAsset): string => {
    if (token.asset_type === 'native') return 'Pi Network';
    return token.asset_code || 'Unknown Token';
  };

  const getTokenSymbol = (token: TokenAsset): string => {
    if (token.asset_type === 'native') return 'PI';
    return token.asset_code || '???';
  };

  const getTokenColor = (token: TokenAsset, index: number): { bg: string; border: string; text: string } => {
    if (token.asset_type === 'native') {
      return { bg: 'rgba(139, 92, 246, 0.15)', border: 'rgba(139, 92, 246, 0.3)', text: '#8B5CF6' };
    }
    const colors = [
      { bg: 'rgba(0, 217, 255, 0.15)', border: 'rgba(0, 217, 255, 0.3)', text: '#00D9FF' },
      { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)', text: '#10B981' },
      { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)', text: '#F59E0B' },
      { bg: 'rgba(236, 72, 153, 0.15)', border: 'rgba(236, 72, 153, 0.3)', text: '#EC4899' },
    ];
    return colors[index % colors.length];
  };

  const totalValue = tokens.reduce((sum, t) => sum + t.balance, 0);
  const nativeToken = tokens.find(t => t.asset_type === 'native');
  const otherTokens = tokens.filter(t => t.asset_type !== 'native');

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
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">Wallet Assets</h3>
            <p className="text-[10px] text-white/40">
              {tokens.length} {tokens.length === 1 ? 'asset' : 'assets'} • {isMainnet ? 'Mainnet' : 'Testnet'}
            </p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="p-2 rounded-lg transition-all hover:bg-white/5"
          aria-label="Refresh data"
        >
          <RefreshCw className={`w-4 h-4 text-white/40 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
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
          {(nativeToken?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
          <span className="text-lg text-purple-400 ml-1">π</span>
        </p>
        {error && (
          <p className="text-[10px] text-amber-400 mt-2">{error}</p>
        )}
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

      <div className="space-y-2 min-h-[200px] overflow-y-auto custom-scrollbar">
        <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold mb-2">Token Details</p>
        
        {nativeToken && (
          <div 
            className="p-3 rounded-xl flex items-center justify-between"
            style={{
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.25)',
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
                <p className="text-xs font-bold text-white">PI</p>
                <p className="text-[10px] text-white/40">Pi Network (Native)</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-white">
                {nativeToken.balance.toLocaleString('en-US', { maximumFractionDigits: 7 })}
              </p>
              <p className="text-[10px] text-purple-400">Native Asset</p>
            </div>
          </div>
        )}

        {otherTokens.map((token, index) => {
          const colors = getTokenColor(token, index);
          return (
            <div 
              key={`${token.asset_code}-${token.asset_issuer}`}
              className="p-3 rounded-xl flex items-center justify-between"
              style={{
                background: colors.bg,
                border: `1px solid ${colors.border}`,
              }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
                >
                  <Coins className="w-4 h-4" style={{ color: colors.text }} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{getTokenSymbol(token)}</p>
                  <p className="text-[10px] text-white/40 truncate max-w-[100px]">
                    {token.asset_issuer ? `${token.asset_issuer.slice(0, 8)}...` : 'Custom Token'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-white">
                  {token.balance.toLocaleString('en-US', { maximumFractionDigits: 7 })}
                </p>
                <p className="text-[10px]" style={{ color: colors.text }}>
                  {token.asset_type === 'credit_alphanum4' ? 'Token' : 'Asset'}
                </p>
              </div>
            </div>
          );
        })}

        {tokens.length === 0 && !isLoading && (
          <div className="py-8 text-center">
            <Coins className="w-8 h-8 text-white/20 mx-auto mb-2" />
            <p className="text-xs text-white/40">No assets found</p>
          </div>
        )}

        {isLoading && tokens.length === 0 && (
          <div className="py-8 text-center">
            <RefreshCw className="w-6 h-6 text-purple-400 mx-auto mb-2 animate-spin" />
            <p className="text-xs text-white/40">Loading assets...</p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${error ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
          <span className="text-[9px] text-white/40">
            {lastUpdated.toLocaleTimeString()}
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
