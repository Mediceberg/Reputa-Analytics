import { useState, useEffect } from 'react';   
import { Analytics } from '@vercel/analytics/react';
import { Send, MessageSquare, Lock, CheckCircle2, ShieldCheck } from 'lucide-react';
import { WalletChecker } from './components/WalletChecker';
import { WalletAnalysis } from './components/WalletAnalysis';
import { AccessUpgradeModal } from './components/AccessUpgradeModal';
import { TrustProvider, useTrust } from './protocol/TrustProvider';
import { fetchWalletData } from './protocol/wallet';
import { initializePiSDK, authenticateUser, isPiBrowser } from './services/piSdk';
import logoImage from '../assets/logo.png';

// --- مكون FeedbackSection ---
function FeedbackSection({ username }: { username: string }) {
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState('');

  const submitFeedback = async () => {
    if (!feedback.trim()) return;
    setStatus('SENDING...');
    try {
      const res = await fetch('/api/save-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          text: feedback,
          timestamp: new Date().toISOString()
        }),
      });
      if (res.ok) {
        setFeedback('');
        setStatus('✅ THANK YOU!');
        setTimeout(() => setStatus(''), 3000);
      }
    } catch (e) {
      setStatus('❌ ERROR');
      setTimeout(() => setStatus(''), 2000);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-6 rounded-3xl border border-dashed border-purple-200 bg-purple-50/30">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-4 h-4 text-purple-600" />
        <h3 className="text-[10px] font-black text-purple-700 uppercase tracking-widest">Pioneer Feedback</h3>
      </div>
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Help us improve Reputa Score..."
        className="w-full p-4 text-[11px] bg-white rounded-2xl border-none shadow-inner focus:ring-2 focus:ring-purple-400 min-h-[100px] transition-all"
      />
      <button 
        onClick={submitFeedback}
        className="mt-3 w-full py-3 bg-white border border-purple-100 text-purple-600 text-[9px] font-black uppercase rounded-xl active:scale-95 transition-all shadow-sm hover:bg-purple-600 hover:text-white"
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
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isVip, setIsVip] = useState(false);
  const [paymentCount, setPaymentCount] = useState(0);

  const piBrowser = isPiBrowser();
  const { refreshWallet } = useTrust();

  useEffect(() => {
    const initApp = async () => {
      if (!piBrowser) {
        setCurrentUser({ username: "Guest_Explorer", uid: "demo" });
        setIsInitializing(false);
        return;
      }
      try {
        await initializePiSDK();
        const user = await authenticateUser(['username', 'wallet_address', 'payments']).catch(() => null);
        if (user) {
          setCurrentUser(user);
          const res = await fetch(`/api/check-vip?uid=${user.uid}`).then(r => r.json()).catch(() => ({isVip: false, count: 0}));
          setIsVip(res.isVip);
          setPaymentCount(res.count || 0);
        }
      } catch (e) { 
        console.warn("Pi SDK failed"); 
      } finally { 
        setIsInitializing(false); 
      }
    };
    initApp();
  }, [piBrowser]);

  const handleWalletCheck = async (address: string) => {
    if (address.toLowerCase().trim() === 'demo') {
      setIsLoading(true);
      setTimeout(() => {
        setWalletData({
          address: "GDU22WEH7M3O...DEMO",
          username: "Demo_Pioneer",
          reputaScore: 632,
          trustLevel: "Elite",
          transactions: []
        });
        setIsLoading(false);
      }, 800);
      return;
    }

    if (!address) return;
    setIsLoading(true);
    try {
      const data = await fetchWalletData(address);
      if (data) {
        setWalletData({
          ...data,
          trustLevel: data.reputaScore >= 600 ? 'Elite' : 'Verified'
        });
        refreshWallet(address).catch(() => null);
      }
    } catch (error) {
      alert("Blockchain sync error.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitializing && piBrowser) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-purple-600 font-black animate-pulse uppercase tracking-widest text-xs">Initialising Reputa...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <header className="border-b p-4 bg-white/95 backdrop-blur-md sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <img src={logoImage} alt="logo" className="w-8 h-8" />
          <div className="leading-tight">
            <h1 className="font-black text-purple-700 text-lg tracking-tighter uppercase">Reputa Score</h1>
            <p className="text-[10px] text-gray-400 font-black uppercase">
                Welcome, {currentUser?.username || 'Guest'} {isVip && "⭐ VIP"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a href="https://t.me/+zxYP2x_4IWljOGM0" target="_blank" rel="noopener noreferrer" className="p-2 text-[#229ED9] bg-blue-50 rounded-full">
            <Send className="w-4 h-4" />
          </a>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center py-24">
            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] mt-6 font-black text-purple-600 tracking-[0.3em] uppercase">Syncing Protocol...</p>
          </div>
        ) : !walletData ? (
          <div className="max-w-md mx-auto py-6">
            <WalletChecker onCheck={handleWalletCheck} />
            <FeedbackSection username={currentUser?.username || 'Guest'} />
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
             
             {/* --- الجزء المعدل: قفل التقرير الأصلي فقط --- */}
             <div className="relative max-w-2xl mx-auto">
                <WalletAnalysis 
                  walletData={walletData} 
                  isProUser={(isVip || paymentCount >= 1 || walletData.username === "Demo_Pioneer")} 
                  onReset={() => setWalletData(null)} 
                  onUpgradePrompt={() => setIsUpgradeModalOpen(true)} 
                />

                {/* طبقة القفل تظهر فقط إذا لم تتحقق شروط الفتح */}
                {(!isVip && paymentCount < 1 && walletData.username !== "Demo_Pioneer") && (
                  <div className="absolute inset-x-0 bottom-0 h-[60%] z-20 backdrop-blur-xl bg-white/60 flex flex-col items-center justify-center p-8 text-center rounded-b-[40px] border-t border-purple-100">
                    <div className="w-14 h-14 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-4 border border-purple-100">
                      <Lock className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Audit Report Locked</h3>
                    <p className="text-[9px] text-gray-500 mt-2 max-w-[220px] leading-relaxed font-bold uppercase">
                      Complete <span className="text-purple-600">1 Testnet transaction</span> to reveal your professional behavioral audit.
                    </p>
                    <button 
                      onClick={() => setIsUpgradeModalOpen(true)}
                      className="mt-6 px-10 py-3 bg-purple-600 text-white text-[10px] font-black uppercase rounded-xl shadow-lg active:scale-95 transition-all"
                    >
                      Unlock Now
                    </button>
                    <p className="mt-4 text-[7px] text-orange-500 font-black uppercase tracking-tighter">⚠️ Note: Testnet Payment Required</p>
                  </div>
                )}
             </div>
             {/* --- نهاية الجزء المعدل --- */}

             <FeedbackSection username={currentUser?.username || 'Guest'} />
          </div>
        )}
      </main>

      <footer className="p-6 text-center border-t">
        <div className="text-[9px] text-gray-300 font-black tracking-[0.4em] uppercase">Reputa Score v4.2 Stable</div>
      </footer>

      <AccessUpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setIsUpgradeModalOpen(false)} 
        currentUser={currentUser}
        onUpgrade={() => {
          setIsVip(true); 
          setIsUpgradeModalOpen(false);
          alert("✅ VIP Access Granted!");
        }} 
      />
      <Analytics />
    </div>
  );
}

export default function App() { 
  return (<TrustProvider><ReputaAppContent /></TrustProvider>); 
}
