import { useState, useEffect } from 'react';  
import { Analytics } from '@vercel/analytics/react';
import { Send, MessageSquare, LogIn, Share2 } from 'lucide-react'; 
import { WalletChecker } from './components/WalletChecker';
import { AccessUpgradeModal } from './components/AccessUpgradeModal';
import { UnifiedDashboard } from './pages/UnifiedDashboard';
import { ShareReputaCard } from './components/ShareReputaCard';
import { TrustProvider, useTrust } from './protocol/TrustProvider';
import { fetchWalletData } from './protocol/wallet';
import { initializePiSDK, authenticateUser, isPiBrowser, loginWithPi, PiUser } from './services/piSdk';
import logoImage from '../assets/logo-new.png';

function FeedbackSection({ username }: { username: string }) {
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState('');

  const submitFeedback = async () => {
    if (!feedback.trim()) return;
    setStatus('SENDING...');
    try {
      const res = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'feedback', username, text: feedback, timestamp: new Date().toISOString() }),
      });
      if (res.ok) { setFeedback(''); setStatus('✅ THANK YOU!'); setTimeout(() => setStatus(''), 3000); }
    } catch (e) { setStatus('❌ ERROR'); setTimeout(() => setStatus(''), 2000); }
  };

  return (
    <div 
      className="max-w-md mx-auto mt-12 p-6 rounded-3xl glass-card"
      style={{
        background: 'rgba(30, 33, 40, 0.6)',
        border: '1px dashed rgba(139, 92, 246, 0.3)',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-4 h-4 text-purple-400" />
        <h3 className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(139, 92, 246, 0.9)' }}>Pioneer Feedback</h3>
      </div>
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Help us improve Reputa Score..."
        className="w-full p-4 text-[11px] rounded-2xl min-h-[100px] transition-all futuristic-input"
        style={{ 
          background: 'rgba(15, 17, 23, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: 'rgba(255, 255, 255, 0.9)',
        }}
      />
      <button 
        onClick={submitFeedback} 
        className="mt-3 w-full py-3 text-[9px] font-black uppercase rounded-xl active:scale-95 transition-all"
        style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(0, 217, 255, 0.2) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          color: 'rgba(139, 92, 246, 0.9)',
        }}
      >
        {status || 'Send Suggestion'}
      </button>
    </div>
  );
}

function ReputaAppContent() {
  const [walletData, setWalletData] = useState<any | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<PiUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isVip, setIsVip] = useState(false);
  const [paymentCount, setPaymentCount] = useState(0);
    
  // --- منطق المطور لعمليات App-to-User ---
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [manualWallet, setManualWallet] = useState('');
  const [isPayoutLoading, setIsPayoutLoading] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);

  const [piBrowser, setPiBrowser] = useState(false);
  const { refreshWallet } = useTrust();

  const handlePiLogin = async () => {
    if (!piBrowser && !isPiBrowser()) {
      alert("Please open this app in Pi Browser to login with your Pi account.");
      return;
    }
    
    setIsLoggingIn(true);
    try {
      const user = await loginWithPi();
      if (user && user.uid !== "demo") {
        setCurrentUser(user);
        syncToAdmin(user.username, user.wallet_address || "Pending...");
        const res = await fetch(`/api/check-vip?uid=${user.uid}`).then(r => r.json()).catch(() => ({isVip: false, count: 0}));
        setIsVip(res.isVip);
        setPaymentCount(res.count || 0);
      }
    } catch (error) {
      console.error('Login failed:', error);
      alert("Login failed. Please try again in Pi Browser.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const isGuest = !currentUser || currentUser.uid === "demo";

  // الوظيفة المسؤولة عن تحويل المال من التطبيق للمحفظة (App-to-User)
  const handleRewardPayout = async () => {
    if (!piBrowser) {
      alert("This feature only works inside Pi Browser");
      return;
    }

    const targetAddress = manualWallet.trim();
    
    if (!targetAddress || targetAddress.length < 20 || !targetAddress.startsWith('G')) {
      alert("Please enter a valid Pi Wallet address starting with G");
      return;
    }

    if (!currentUser?.uid || currentUser.uid === "demo") {
      alert("Error: Genuine Pi UID not found. Please log in via Pi Browser.");
      return;
    }

    setIsPayoutLoading(true);
    
    try {
      // 1. Solve incomplete payments locally using Pi SDK before trying to create a new one
      if (typeof window !== 'undefined' && (window as any).Pi) {
        try {
          console.log('[A2U] Checking for incomplete payments via SDK...');
          const incompletePayments = await (window as any).Pi.getIncompleteServerPayments();
          if (incompletePayments && incompletePayments.length > 0) {
            console.log(`[A2U] Found ${incompletePayments.length} incomplete payments. Resolving...`);
            for (const payment of incompletePayments) {
              await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'cancel', paymentId: payment.identifier }),
              });
            }
            alert("✅ Incomplete payments resolved. Retrying...");
          }
        } catch (sdkErr) {
          console.warn('SDK incomplete payment check failed', sdkErr);
        }
      }

      const statusCheck = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check_status', uid: currentUser.uid }),
      }).then(r => r.json()).catch(() => null);
      
      if (statusCheck?.hasPending) {
        const clearPending = confirm(
          "You have a pending payout. Would you like to clear it and try again?"
        );
        if (clearPending) {
          await fetch('/api/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'clear_pending', uid: currentUser.uid }),
          });
        } else {
          setIsPayoutLoading(false);
          return;
        }
      }

      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'payout',
          address: targetAddress,
          amount: 0.01,
          uid: currentUser.uid, 
          memo: "Reward for High Reputa Score"
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const networkLabel = result.network === 'mainnet' ? 'Mainnet' : 'Testnet';
        if (result.duplicate) {
          alert(`ℹ️ This payout was already processed.\nPayment ID: ${result.paymentId}\nTxID: ${result.txid || 'N/A'}`);
        } else if (result.warning) {
          alert(`⚠️ ${result.warning}\nPayment ID: ${result.paymentId}\nTxID: ${result.txid}`);
        } else {
          alert(`✅ Payout Completed on ${networkLabel}!\nPayment ID: ${result.paymentId}\nTxID: ${result.txid}\n\n${result.message}`);
        }
        setManualWallet('');
      } else if (response.status === 409 || (result.step === 'create' && result.error?.includes('ongoing payment'))) {
        const shouldClear = confirm("⚠️ There is an ongoing payment blocking this request. Would you like to clear it and try again?");
        if (shouldClear) {
          setIsPayoutLoading(true);
          await fetch('/api/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'clear_pending', uid: currentUser.uid }),
          });
          alert("Pending status cleared. Please try the payout again.");
        }
      } else {
        let errorDetail = typeof result.error === 'string' 
          ? result.error 
          : result.error?.error_message || result.details?.message || "Check App Wallet balance";
        
        if (result.rawError) {
          console.log('[A2U] Raw error from Pi API:', result.rawError);
        }
        
        if (result.step === 'approve' && errorDetail.includes('approval failed')) {
          errorDetail = 'Payment could not be approved. This may be due to:\n• App wallet insufficient balance\n• Network congestion\n• Please try again in a few seconds';
        }
        
        const stepInfo = result.step ? ` (Step: ${result.step})` : '';
        alert(`❌ Payout Failed${stepInfo}: ${errorDetail}`);
      }
    } catch (e) {
      alert("Network error. Please ensure your App Wallet is funded in the Developer Portal.");
    } finally {
      setIsPayoutLoading(false);
    }
  };

  const syncToAdmin = async (uname: string, waddr: string) => {
    try {
      await fetch('/api/save-pioneer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: uname, wallet: waddr, timestamp: new Date().toISOString() }),
      });
    } catch (e) { console.warn("Admin sync failed"); }
  };

  useEffect(() => {
    const initApp = async () => {
      console.log('[App] Starting initialization...');
      
      const checkPiBrowser = async () => {
        if (typeof window === 'undefined') return false;
        const ua = navigator.userAgent.toLowerCase();
        const isPiUA = ua.includes('pibrowser') || 
                       ua.includes('pi browser') || 
                       ua.includes('pinet') ||
                       ua.includes('pi network') ||
                       ua.includes('pi_browser');
        
        if (isPiUA) {
          console.log('[App] Pi Browser detected via UA');
          return true;
        }
        
        console.log('[App] Not Pi Browser - UA:', ua.substring(0, 100));
        return false;
      };
      
      const detectedPiBrowser = await checkPiBrowser();
      setPiBrowser(detectedPiBrowser);
      console.log('[App] Pi Browser detection result:', detectedPiBrowser);
      
      if (!detectedPiBrowser) {
        console.log('[App] Not in Pi Browser, setting guest/demo user');
        setCurrentUser({ username: "Guest_Explorer", uid: "demo", wallet_address: "GDU22WEH7M3O...DEMO" });
        setIsInitializing(false);
        return;
      }
      
      console.log('[App] In Pi Browser, initializing SDK...');
      
      const timeout = setTimeout(() => {
        console.warn('[App] SDK initialization timeout - showing login prompt');
        setIsInitializing(false);
      }, 8000);

      try {
        const initialized = await initializePiSDK();
        console.log('[App] SDK initialized:', initialized);
        
        if (initialized) {
          const user = await authenticateUser(['username', 'wallet_address', 'payments']);
          console.log('[App] Authentication result:', user?.username, user?.uid);
          
          if (user && user.uid) {
            setCurrentUser(user);
            syncToAdmin(user.username, user.wallet_address || "Pending...");
            const res = await fetch(`/api/check-vip?uid=${user.uid}`).then(r => r.json()).catch(() => ({isVip: false, count: 0}));
            setIsVip(res.isVip);
            setPaymentCount(res.count || 0);
          }
        } else {
          console.warn('[App] SDK not initialized - user can login manually');
        }
      } catch (e: any) { 
        console.error('[App] SDK/Auth failed:', e.message);
      } finally { 
        clearTimeout(timeout);
        setIsInitializing(false); 
      }
    };
    initApp();
  }, []);

  const handleWalletCheck = async (address: string) => {
    const isDemo = address.toLowerCase().trim() === 'demo';
    setIsLoading(true);

    if (isDemo) {
      setTimeout(() => {
        setWalletData({
          address: "GDU22WEH7M3O...DEMO",
          username: "Demo_Pioneer",
          reputaScore: 632,
          trustLevel: "Elite",
          recentActivity: [
              { id: "tx_8212", type: "Pi DEX Swap", subType: "Ecosystem Exchange", amount: "3.14", status: "Success", exactTime: "02:45 PM", dateLabel: "Today", to: "GDU2...DEMO" }
          ]
        });
        setIsLoading(false);
      }, 400); 
      return;
    }

    try {
      const data = await fetchWalletData(address);
      if (data) {
        setWalletData({ ...data, trustLevel: (data.reputaScore ?? 0) >= 600 ? 'Elite' : 'Verified' });
        syncToAdmin(currentUser?.username || 'Guest', address);
        refreshWallet(address).catch(() => null);
      }
    } catch (error) { 
      alert("Blockchain sync error."); 
    } finally { 
      setIsLoading(false); 
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen futuristic-bg flex flex-col items-center justify-center">
        <div className="relative">
          <div 
            className="absolute inset-0 rounded-full animate-pulse"
            style={{ 
              background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
              filter: 'blur(20px)',
              transform: 'scale(2)',
            }}
          />
          <div 
            className="relative w-14 h-14 rounded-full animate-spin mb-6"
            style={{ 
              border: '3px solid rgba(139, 92, 246, 0.2)',
              borderTopColor: '#8B5CF6',
            }}
          />
        </div>
        <p className="font-black animate-pulse uppercase tracking-[0.3em] text-xs" style={{ color: 'rgba(139, 92, 246, 0.9)' }}>
          {piBrowser ? 'Connecting Reputa...' : 'Initialising Reputa...'}
        </p>
      </div>
    );
  }

  const isUnlocked = isVip || paymentCount >= 1 || walletData?.username === "Demo_Pioneer";

  if (walletData) {
    return (
      <>
        <UnifiedDashboard 
          walletData={walletData}
          isProUser={isUnlocked}
          onReset={() => setWalletData(null)}
          onUpgradePrompt={() => setIsUpgradeModalOpen(true)}
          username={currentUser?.username}
        />
        <AccessUpgradeModal 
          isOpen={isUpgradeModalOpen} 
          onClose={() => setIsUpgradeModalOpen(false)} 
          currentUser={currentUser}
          onUpgrade={() => { 
            setIsVip(true); 
            setPaymentCount(1); 
            setIsUpgradeModalOpen(false); 
            syncToAdmin(currentUser?.username || 'Guest', "UPGRADED_TO_VIP");
          }} 
        />
        <Analytics />
      </>
    );
  }

  return (
    <div className="min-h-screen futuristic-bg flex flex-col font-sans relative">
      <div className="absolute inset-0 grid-pattern pointer-events-none" />
      
      <header 
        className="px-3 py-3 sm:p-4 backdrop-blur-xl sticky top-0 z-50 flex justify-between items-center safe-area-top"
        style={{
          background: 'rgba(10, 11, 15, 0.9)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div 
            className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl cursor-pointer active:scale-95 transition-transform"
            style={{
              background: 'linear-gradient(145deg, rgba(15, 17, 23, 0.95) 0%, rgba(20, 22, 30, 0.9) 100%)',
              boxShadow: logoClickCount > 0 && logoClickCount < 5 
                ? `0 0 ${10 + logoClickCount * 5}px rgba(239, 68, 68, ${0.2 + logoClickCount * 0.1})` 
                : '0 0 20px rgba(0, 217, 255, 0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
            }}
            onClick={() => setLogoClickCount(prev => prev + 1)}
          >
            <img 
              src={logoImage} 
              alt="logo" 
              className="w-6 h-6 sm:w-7 sm:h-7 object-contain" 
              style={{ filter: 'drop-shadow(0 0 6px rgba(0, 217, 255, 0.5))', mixBlendMode: 'screen' }}
            />
            {logoClickCount > 0 && logoClickCount < 5 && (
              <span 
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[8px] font-bold flex items-center justify-center"
                style={{ background: 'rgba(239, 68, 68, 0.9)', color: 'white' }}
              >
                {logoClickCount}
              </span>
            )}
          </div>
          <div className="leading-tight">
            <h1 
              className="font-bold text-sm sm:text-base tracking-tight"
              style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-display)', textShadow: '0 0 20px rgba(0, 217, 255, 0.4)' }}
            >
              Reputa Score
            </h1>
            <p 
              className="text-[8px] sm:text-[9px] font-medium uppercase tracking-widest truncate max-w-[120px] sm:max-w-none" 
              style={{ color: 'rgba(160, 164, 184, 0.6)', fontFamily: 'var(--font-sans)' }}
            >
              Welcome, {currentUser?.username || 'Guest'} {isVip && "⭐ VIP"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3">
          {logoClickCount >= 5 && piBrowser && currentUser && currentUser.uid !== 'demo' && (
            <div 
              className="flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2 rounded-xl animate-in zoom-in duration-300"
              style={{ 
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              <input 
                type="text"
                placeholder="Wallet (G...)"
                value={manualWallet}
                onChange={(e) => setManualWallet(e.target.value)}
                className="text-[8px] p-1.5 sm:p-2 rounded-lg w-20 sm:w-28 outline-none font-mono"
                style={{
                  background: 'rgba(15, 17, 23, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.9)',
                }}
              />
              <button 
                onClick={handleRewardPayout}
                disabled={isPayoutLoading}
                className="px-2 sm:px-3 py-1.5 sm:py-2 text-white text-[7px] sm:text-[8px] font-black rounded-lg uppercase active:scale-95 transition-all"
                style={{
                  background: isPayoutLoading ? 'rgba(100, 100, 100, 0.5)' : 'rgba(239, 68, 68, 0.8)',
                }}
              >
                {isPayoutLoading ? '...' : 'A2U'}
              </button>
            </div>
          )}
          {isGuest && (
            <button
              onClick={handlePiLogin}
              disabled={isLoggingIn}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all active:scale-95"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 186, 0, 0.2) 0%, rgba(255, 140, 0, 0.2) 100%)',
                border: '1px solid rgba(255, 186, 0, 0.4)',
              }}
            >
              <LogIn className="w-4 h-4" style={{ color: '#FFBA00' }} />
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider" style={{ color: '#FFBA00' }}>
                {isLoggingIn ? '...' : 'Login'}
              </span>
            </button>
          )}
          {walletData && (
            <button
              onClick={() => setShowShareCard(true)}
              className="p-2 sm:p-2.5 rounded-xl transition-all active:scale-95"
              style={{
                background: 'rgba(139, 92, 246, 0.15)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
              }}
              title="Share your score"
            >
              <Share2 className="w-4 h-4" style={{ color: '#8B5CF6' }} />
            </button>
          )}
          <a 
            href="https://t.me/+zxYP2x_4IWljOGM0" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="p-2 sm:p-2.5 rounded-xl transition-all"
            style={{
              background: 'rgba(34, 158, 217, 0.15)',
              border: '1px solid rgba(34, 158, 217, 0.3)',
            }}
          >
            <Send className="w-4 h-4" style={{ color: '#229ED9' }} />
          </a>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-12 flex-1 relative z-10">
        {isLoading ? (
          <div className="flex flex-col items-center py-24">
            <div className="relative">
              <div 
                className="absolute inset-0 rounded-full animate-pulse"
                style={{ 
                  background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
                  filter: 'blur(20px)',
                  transform: 'scale(2)',
                }}
              />
              <div 
                className="relative w-16 h-16 rounded-full animate-spin"
                style={{ 
                  border: '3px solid rgba(139, 92, 246, 0.2)',
                  borderTopColor: '#8B5CF6',
                }}
              />
            </div>
            <p className="text-[10px] mt-8 font-black tracking-[0.3em] uppercase" style={{ color: 'rgba(139, 92, 246, 0.9)' }}>
              Syncing Protocol...
            </p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto py-6">
            <WalletChecker onCheck={handleWalletCheck} />
            <FeedbackSection username={currentUser?.username || 'Guest'} />
          </div>
        )}
      </main>

      <footer 
        className="p-4 sm:p-8 text-center flex flex-col items-center gap-4 sm:gap-5 relative z-10"
        style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}
      >
        <a 
          href="https://t.me/+zxYP2x_4IWljOGM0" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full transition-all active:scale-95"
          style={{
            background: 'rgba(34, 158, 217, 0.1)',
            border: '1px solid rgba(34, 158, 217, 0.3)',
          }}
        >
          <Send className="w-4 h-4" style={{ color: '#229ED9' }} />
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(34, 158, 217, 0.9)' }}>
            Join Community
          </span>
        </a>
        <div className="text-[9px] sm:text-[10px] font-bold tracking-[0.3em] sm:tracking-[0.4em] uppercase" style={{ color: 'rgba(100, 105, 130, 0.5)' }}>
          Reputa Score v2
        </div>
      </footer>

      <AccessUpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setIsUpgradeModalOpen(false)} 
        currentUser={currentUser}
        onUpgrade={() => { 
          setIsVip(true); 
          setPaymentCount(1); 
          setIsUpgradeModalOpen(false); 
          syncToAdmin(currentUser?.username || 'Guest', "UPGRADED_TO_VIP");
        }} 
      />
      
      {showShareCard && walletData && (
        <ShareReputaCard
          username={walletData.username || currentUser?.username || 'Pioneer'}
          score={walletData.reputaScore || 0}
          level={walletData.level || 1}
          trustRank={walletData.trustRank || 'Standard'}
          walletAddress={walletData.wallet || currentUser?.wallet_address}
          onClose={() => setShowShareCard(false)}
        />
      )}
      
      <Analytics />
    </div>
  );
}

export default function App() { 
  return (<TrustProvider><ReputaAppContent /></TrustProvider>); 
}
