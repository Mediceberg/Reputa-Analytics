import { useState, useEffect } from 'react';  
import { Analytics } from '@vercel/analytics/react';
import { Send, MessageSquare, LogIn, Share2, Mail } from 'lucide-react'; 
import { WalletChecker } from './components/WalletChecker';
import { AccessUpgradeModal } from './components/AccessUpgradeModal';
import React, { Suspense } from 'react';

// Lazy-load heavy pages to improve initial bundle size
const UnifiedDashboard = React.lazy(async () => {
  const mod = await import('./pages/UnifiedDashboard');
  return { default: mod.UnifiedDashboard } as any;
});

const AdminConsole = React.lazy(async () => {
  const mod = await import('./pages/admin/AdminConsole');
  // AdminConsole is default export in file
  return { default: mod.default || mod } as any;
});
import { ShareReputaCard } from './components/ShareReputaCard';
import { TrustProvider, useTrust } from './protocol/TrustProvider';
import { fetchWalletData } from './protocol/wallet';
import { initializePiSDK, authenticateUser, isPiBrowser, loginWithPi, PiUser } from './services/piSdk';
import { initializeUnifiedReputationOnLogin, getCachedReputation } from './services/reputationInitializer';
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
  // --- Define ALL hooks unconditionally at the top level ---
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [walletData, setWalletData] = useState<any | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<PiUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isVip, setIsVip] = useState(false);
  const [paymentCount, setPaymentCount] = useState(0);
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [manualWallet, setManualWallet] = useState('');
  const [isPayoutLoading, setIsPayoutLoading] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const [piBrowser, setPiBrowser] = useState(false);
  
  const { refreshWallet } = useTrust();

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

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
        localStorage.setItem('piUserId', user.uid);
        localStorage.setItem('piUsername', user.username);
        if (user.wallet_address) localStorage.setItem('piWalletAddress', user.wallet_address);
        
        // Initialize unified reputation system
        try {
          await initializeUnifiedReputationOnLogin(
            user.uid,
            user.wallet_address || 'pending',
            user.username
          );
          console.log('✅ Unified reputation system initialized');
        } catch (error) {
          console.error('Failed to initialize reputation system:', error);
          // Continue anyway - reputation will be initialized later
        }
        
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
      if (typeof window !== 'undefined' && (window as any).Pi) {
        try {
          const incompletePayments = await (window as any).Pi.getIncompleteServerPayments();
          if (incompletePayments && incompletePayments.length > 0) {
            for (const payment of incompletePayments) {
              await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'cancel', paymentId: payment.identifier }),
              });
            }
          }
        } catch (sdkErr) { console.warn('SDK incomplete check failed', sdkErr); }
      }

      const statusCheck = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check_status', uid: currentUser.uid }),
      }).then(r => r.json()).catch(() => null);
      
      if (statusCheck?.hasPending) {
        const clearPending = confirm("You have a pending payout. Would you like to clear it?");
        if (clearPending) {
          await fetch('/api/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'clear_pending', uid: currentUser.uid }),
          });
        } else { setIsPayoutLoading(false); return; }
      }

      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'payout', address: targetAddress, amount: 0.01, uid: currentUser.uid, memo: "Reward" }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        alert(`✅ Payout Completed!`);
        setManualWallet('');
      } else {
        alert(`❌ Payout Failed: ${result.error || "Error"}`);
      }
    } catch (e) {
      alert("Network error.");
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
      const checkPiBrowser = async () => {
        if (typeof window === 'undefined') return false;
        const ua = navigator.userAgent.toLowerCase();
        return ua.includes('pibrowser') || ua.includes('pi browser') || ua.includes('pinet') || ua.includes('pi network') || ua.includes('pi_browser');
      };
      
      const detectedPiBrowser = await checkPiBrowser();
      setPiBrowser(detectedPiBrowser);
      
      // Check for existing session in localStorage
      const savedUserId = localStorage.getItem('piUserId');
      const savedUsername = localStorage.getItem('piUsername');
      const savedWallet = localStorage.getItem('piWalletAddress');

      if (savedUserId && savedUsername && savedUserId !== 'demo') {
        const user = { uid: savedUserId, username: savedUsername, wallet_address: savedWallet || undefined };
        setCurrentUser(user);
        
        // Load VIP status for returning user
        fetch(`/api/check-vip?uid=${user.uid}`)
          .then(r => r.json())
          .then(res => {
            setIsVip(res.isVip);
            setPaymentCount(res.count || 0);
          })
          .catch(() => null);
          
        // If we have a wallet, trigger check automatically
        if (savedWallet) {
          handleWalletCheck(savedWallet).catch(() => null);
        }
      }

      if (!detectedPiBrowser) {
        if (!savedUserId) {
          setCurrentUser({ username: "Guest_Explorer", uid: "demo", wallet_address: "GDU22WEH7M3O...DEMO" });
        }
        setIsInitializing(false);
        return;
      }
      
      try {
        const initialized = await initializePiSDK();
        if (initialized) {
          // If no saved user or we want to ensure fresh session
          if (!savedUserId || savedUserId === 'demo') {
            const user = await authenticateUser(['username', 'wallet_address', 'payments']);
            if (user && user.uid) {
              setCurrentUser(user);
              localStorage.setItem('piUserId', user.uid);
              localStorage.setItem('piUsername', user.username);
              if (user.wallet_address) localStorage.setItem('piWalletAddress', user.wallet_address);
              
              syncToAdmin(user.username, user.wallet_address || "Pending...");
              const res = await fetch(`/api/check-vip?uid=${user.uid}`).then(r => r.json()).catch(() => ({isVip: false, count: 0}));
              setIsVip(res.isVip);
              setPaymentCount(res.count || 0);
            }
          }
        }
      } catch (e: any) { console.error('Auth failed', e); } finally { setIsInitializing(false); }
    };
    initApp();
  }, []);

  const handleWalletCheck = async (address: string) => {
    const isDemo = address.toLowerCase().trim() === 'demo';
    setIsLoading(true);
    if (isDemo) {
      setTimeout(() => {
        setWalletData({ address: "GDU22WEH7M3O...DEMO", username: "Demo_Pioneer", reputaScore: 632, trustLevel: "Elite", recentActivity: [] });
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
    } catch (error) { alert("Blockchain sync error."); } finally { setIsLoading(false); }
  };

  // --- Logic for rendering based on path and data ---
  if (currentPath === '/admin-console') {
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading admin...</div>}>
        <AdminConsole />
      </Suspense>
    );
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen futuristic-bg flex flex-col items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full animate-pulse" style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)', filter: 'blur(20px)', transform: 'scale(2)' }} />
          <div className="relative w-14 h-14 rounded-full animate-spin mb-6" style={{ border: '3px solid rgba(139, 92, 246, 0.2)', borderTopColor: '#8B5CF6' }} />
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
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading dashboard...</div>}>
          <UnifiedDashboard 
            walletData={walletData}
            isProUser={isUnlocked}
            onReset={() => setWalletData(null)}
            onUpgradePrompt={() => setIsUpgradeModalOpen(true)}
            username={currentUser?.username}
          />
        </Suspense>
        <AccessUpgradeModal 
          isOpen={isUpgradeModalOpen} 
          onClose={() => setIsUpgradeModalOpen(false)} 
          currentUser={currentUser}
          onUpgrade={() => { setIsVip(true); setPaymentCount(1); setIsUpgradeModalOpen(false); syncToAdmin(currentUser?.username || 'Guest', "UPGRADED_TO_VIP"); }} 
        />
        <Analytics />
      </>
    );
  }

  return (
    <div className="w-full min-h-screen futuristic-bg flex flex-col font-sans relative">
      <div className="absolute inset-0 grid-pattern pointer-events-none" />
      <header className="px-3 py-3 sm:p-4 backdrop-blur-xl sticky top-0 z-50 flex justify-between items-center safe-area-top" style={{ background: 'rgba(10, 11, 15, 0.9)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl cursor-pointer active:scale-95 transition-transform" style={{ background: 'linear-gradient(145deg, rgba(15, 17, 23, 0.95) 0%, rgba(20, 22, 30, 0.9) 100%)', boxShadow: '0 0 20px rgba(0, 217, 255, 0.2)' }} onClick={() => setLogoClickCount(prev => prev + 1)}>
            <img src={logoImage} alt="logo" className="w-6 h-6 sm:w-7 sm:h-7 object-contain" style={{ filter: 'drop-shadow(0 0 6px rgba(0, 217, 255, 0.5))', mixBlendMode: 'screen' }} />
          </div>
          <div className="leading-tight">
            <h1 className="font-bold text-sm sm:text-base tracking-tight" style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-display)', textShadow: '0 0 20px rgba(0, 217, 255, 0.4)' }}>Reputa Score</h1>
            <p className="text-[8px] sm:text-[9px] font-medium uppercase tracking-widest truncate" style={{ color: 'rgba(160, 164, 184, 0.6)' }}>Welcome, {currentUser?.username || 'Guest'} {isVip && "⭐ VIP"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {logoClickCount >= 5 && piBrowser && currentUser && currentUser.uid !== 'demo' && (
            <div className="flex items-center gap-1 sm:gap-2 p-1.5 rounded-xl border border-red-500/30 bg-red-500/10">
              <input type="text" placeholder="Wallet (G...)" value={manualWallet} onChange={(e) => setManualWallet(e.target.value)} className="text-[8px] p-1.5 rounded-lg w-20 bg-black/40 border border-white/10 text-white outline-none" />
              <button onClick={handleRewardPayout} disabled={isPayoutLoading} className="px-2 py-1.5 text-white text-[7px] font-black rounded-lg uppercase bg-red-500/80">{isPayoutLoading ? '...' : 'A2U'}</button>
            </div>
          )}
          {isGuest && (
            <button onClick={handlePiLogin} disabled={isLoggingIn} className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all active:scale-95 border border-amber-500/40 bg-amber-500/20">
              <LogIn className="w-4 h-4 text-amber-500" />
              <span className="text-[9px] font-black uppercase text-amber-500">{isLoggingIn ? '...' : 'Login'}</span>
            </button>
          )}
          <a href="https://t.me/+zxYP2x_4IWljOGM0" target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl border border-blue-500/30 bg-blue-500/15"><Send className="w-4 h-4 text-blue-400" /></a>
          <a href="mailto:reputa.score@gmail.com" className="p-2 rounded-xl border border-red-500/30 bg-red-500/15"><Mail className="w-4 h-4 text-red-400" /></a>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-3 py-6 relative z-10 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center py-24">
            <div className="relative">
              <div className="absolute inset-0 rounded-full animate-pulse" style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)', filter: 'blur(20px)', transform: 'scale(2)' }} />
              <div className="relative w-16 h-16 rounded-full animate-spin" style={{ border: '3px solid rgba(139, 92, 246, 0.2)', borderTopColor: '#8B5CF6' }} />
            </div>
            <p className="text-[10px] mt-8 font-black tracking-[0.3em] uppercase text-purple-400">Syncing Protocol...</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto py-6">
            <WalletChecker onCheck={handleWalletCheck} />
            <FeedbackSection username={currentUser?.username || 'Guest'} />
          </div>
        )}
      </main>
    </div>
  );
}

export function App() {
  return (
    <TrustProvider>
      <ReputaAppContent />
    </TrustProvider>
  );
}

export default App;
