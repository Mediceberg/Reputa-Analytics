import { useState, useEffect } from 'react';   
import { Analytics } from '@vercel/analytics/react';
import { Send, MessageSquare, Lock } from 'lucide-react';
import { WalletChecker } from './components/WalletChecker';
import { WalletAnalysis } from './components/WalletAnalysis';
import { AccessUpgradeModal } from './components/AccessUpgradeModal';
import { TrustProvider, useTrust } from './protocol/TrustProvider';
import { fetchWalletData } from './protocol/wallet';
import { initializePiSDK, authenticateUser, isPiBrowser } from './services/piSdk';
import logoImage from '../assets/logo.png';

// --- مكون FeedbackSection: يرسل إلى save-feedback.ts ---
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
          username: username || 'Anonymous', 
          text: feedback, 
          timestamp: new Date().toISOString() 
        }),
      });
      if (res.ok) { 
        setFeedback(''); 
        setStatus('✅ THANK YOU!'); 
        setTimeout(() => setStatus(''), 3000); 
      }
    } catch (e) { setStatus('❌ ERROR'); setTimeout(() => setStatus(''), 2000); }
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
      <button onClick={submitFeedback} className="mt-3 w-full py-3 bg-white border border-purple-100 text-purple-600 text-[9px] font-black uppercase rounded-xl active:scale-95 transition-all shadow-sm">
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

  // --- تتبع المستخدم لضمان ظهوره في صفحة view.ts ---
  useEffect(() => {
    const initApp = async () => {
      let userObj = { username: "Anonymous", wallet: "" };
      
      if (!piBrowser) {
        setCurrentUser({ username: "Anonymous", uid: "demo" });
        saveToRedis("Anonymous", ""); // تسجيل دخول متصفح خارجي
        setIsInitializing(false);
        return;
      }
      try {
        await initializePiSDK();
        const user = await authenticateUser(['username', 'wallet_address']).catch(() => null);
        if (user) {
          setCurrentUser(user);
          userObj = { username: user.username, wallet: user.wallet_address || "" };
          saveToRedis(userObj.username, userObj.wallet); // تسجيل دخول بيونير
          
          const res = await fetch(`/api/checkVip?uid=${user.uid}`).then(r => r.json()).catch(() => ({isVip: false, count: 0}));
          setIsVip(res.isVip);
          setPaymentCount(res.count || 0);
        }
      } catch (e) { console.warn("Pi SDK error"); } finally { setIsInitializing(false); }
    };
    initApp();
  }, [piBrowser]);

  // الدالة التي ترسل البيانات إلى save-pioneer.ts ليقرأها view.ts
  const saveToRedis = async (username: string, wallet: string) => {
    try {
      await fetch('/api/save-pioneer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, wallet, timestamp: new Date().toISOString() })
      });
    } catch (e) { console.error("Redis Save Error"); }
  };

  const handleWalletCheck = async (address: string) => {
    setIsLoading(true);
    if (address.toLowerCase().trim() === 'demo') {
      setTimeout(() => {
        setWalletData({ address: "GDU22WEH...DEMO", username: "Demo_Pioneer", reputaScore: 632, trustLevel: "Elite" });
        setIsLoading(false);
      }, 400); 
      return;
    }

    try {
      const data = await fetchWalletData(address);
      if (data) {
        setWalletData({ ...data, trustLevel: data.reputaScore >= 600 ? 'Elite' : 'Verified' });
        // تحديث البيانات في Redis لتظهر المحفظة المفحوصة في صفحة view
        saveToRedis(currentUser?.username || 'Guest', address);
        refreshWallet(address).catch(() => null);
      }
    } catch (error) { alert("Sync error."); } finally { setIsLoading(false); }
  };

  const isUnlocked = isVip || paymentCount >= 1 || walletData?.username === "Demo_Pioneer";

  if (isInitializing && piBrowser) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-purple-600 font-black animate-pulse uppercase tracking-widest text-xs">Syncing Reputa...</p>
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
            <p className="text-[10px] text-gray-400 font-black uppercase">Welcome, {currentUser?.username || 'Guest'}</p>
          </div>
        </div>
        <a href="https://t.me/+zxYP2x_4IWljOGM0" target="_blank" className="p-2 text-[#229ED9] bg-blue-50 rounded-full"><Send className="w-4 h-4" /></a>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center py-24">
            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] mt-6 font-black text-purple-600 uppercase tracking-widest">Loading...</p>
          </div>
        ) : !walletData ? (
          <div className="max-w-md mx-auto py-6">
            <WalletChecker onCheck={handleWalletCheck} />
            <FeedbackSection username={currentUser?.username || 'Guest'} />
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
             <div className="relative overflow-hidden rounded-[40px] border border-gray-50">
                <WalletAnalysis walletData={walletData} isProUser={isUnlocked} onReset={() => setWalletData(null)} onUpgradePrompt={() => setIsUpgradeModalOpen(true)} />
                {!isUnlocked && (
                  <div className="absolute inset-x-0 bottom-0 h-[42%] z-20 flex flex-col items-center justify-end">
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/95 to-transparent backdrop-blur-[6px]" />
                    <div className="relative pb-8 px-6 text-center w-full">
                      <div className="inline-flex items-center justify-center w-10 h-10 bg-white rounded-xl shadow-md border border-purple-50 mb-3"><Lock className="w-4 h-4 text-purple-600" /></div>
                      <h3 className="text-[9px] font-black text-gray-900 uppercase tracking-widest mb-1">Detailed Audit Locked</h3>
                      <button onClick={() => setIsUpgradeModalOpen(true)} className="w-full max-w-[180px] py-3 bg-purple-600 text-white text-[8px] font-black uppercase rounded-xl shadow-lg active:scale-95 transition-all">Unlock Now</button>
                    </div>
                  </div>
                )}
             </div>
             <FeedbackSection username={currentUser?.username || 'Guest'} />
          </div>
        )}
      </main>
      <footer className="p-6 text-center border-t border-gray-50"><div className="text-[9px] text-gray-300 font-black tracking-[0.4em] uppercase">Reputa Score v4.2 Stable</div></footer>
      <AccessUpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} currentUser={currentUser} onUpgrade={() => { setIsVip(true); setPaymentCount(1); setIsUpgradeModalOpen(false); }} />
      <Analytics />
    </div>
  );
}

export default function App() { return (<TrustProvider><ReputaAppContent /></TrustProvider>); }
