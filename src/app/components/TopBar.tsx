import { Menu, Wallet, Bell, Send, Globe, TestTube } from 'lucide-react'; 
import { useState } from 'react';
import { NetworkMode, MODE_IMPACTS } from '../protocol/types';

interface TopBarProps {
  onMenuClick: () => void;
  balance?: number;
  username?: string;
  networkMode?: NetworkMode;
  onNetworkToggle?: () => void;
}

export function TopBar({ onMenuClick, balance, username, networkMode = 'testnet', onNetworkToggle }: TopBarProps) {
  const [clickCount, setClickCount] = useState(0);
  const [showPayoutIcon, setShowPayoutIcon] = useState(false);

  const handleLogoClick = () => {
    const newCount = clickCount + 1;
    if (newCount >= 5) {
      setClickCount(0);
      setShowPayoutIcon(true);
      // Auto-hide after 10 seconds if not used
      setTimeout(() => setShowPayoutIcon(false), 10000);
    } else {
      setClickCount(newCount);
    }
  };

  const handleManualPayout = async () => {
    const userId = localStorage.getItem('piUserId');
    if (!userId) {
      alert("Please login first");
      return;
    }
    
    const amount = prompt("Enter amount to send to user (Pi):", "0.1");
    if (!amount || isNaN(parseFloat(amount))) return;

    try {
      const response = await fetch('/api/payments/app-to-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: userId, amount: parseFloat(amount) })
      });
      const data = await response.json();
      if (data.success) {
        alert(`Success! Payout initiated. Payment ID: ${data.txid}`);
        setShowPayoutIcon(false);
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-[100] lg:hidden safe-area-top w-full"
      style={{
        background: 'linear-gradient(180deg, rgba(10, 11, 15, 0.98) 0%, rgba(15, 17, 23, 0.95) 100%)',
        borderBottom: '1px solid rgba(139, 92, 246, 0.15)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        height: 'calc(60px + env(safe-area-inset-top, 0px))',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      <div className="flex items-center justify-between px-3 sm:px-4 h-15">
        <button
          onClick={onMenuClick}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all active:scale-95"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(0, 217, 255, 0.1) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.25)',
          }}
        >
          <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Network Switcher - Fast Toggle - محسن للهواتف */}
          {onNetworkToggle && (
            <button
              onClick={onNetworkToggle}
              className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 hover:scale-105 shadow-lg"
              style={{
                background: networkMode === 'mainnet' 
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0.15) 100%)'
                  : 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(245, 158, 11, 0.15) 100%)',
                border: networkMode === 'mainnet'
                  ? '1px solid rgba(16, 185, 129, 0.5)'
                  : '1px solid rgba(245, 158, 11, 0.5)',
                boxShadow: networkMode === 'mainnet'
                  ? '0 0 15px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
                  : '0 0 15px rgba(245, 158, 11, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
              }}
              title={`تبديل إلى ${networkMode === 'mainnet' ? 'Testnet' : 'Mainnet'}`}
            >
              {networkMode === 'mainnet' ? (
                <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
              ) : (
                <TestTube className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 flex-shrink-0" />
              )}
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider" style={{
                color: networkMode === 'mainnet' ? '#10B981' : '#F59E0B',
                textShadow: '0 0 8px rgba(0,0,0,0.3)'
              }}>
                {networkMode === 'mainnet' ? 'MAIN' : 'TEST'}
              </span>
            </button>
          )}

          {/* تمت إزالة أيقونة الرصيد من شريط القائمة العلوية بشكل كامل */}

          {showPayoutIcon && (
            <button
              onClick={handleManualPayout}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-purple-500 border-2 border-white flex items-center justify-center animate-bounce shadow-[0_0_20px_rgba(168,85,247,0.5)] active:scale-90 transition-all"
              style={{
                position: 'relative',
                zIndex: 100,
                marginLeft: '6px'
              }}
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
          )}
        </div>

        <button
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all active:scale-95"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
        </button>
      </div>
    </header>
  );
}
