import { useState, useEffect } from 'react';    
import { Analytics } from '@vercel/analytics/react';
import { Send, MessageSquare, Lock, ShieldCheck, Beaker } from 'lucide-react';
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
        body: JSON.stringify({ username, text: feedback, timestamp: new Date().toISOString() }),
      });
      if (res.ok) { setFeedback(''); setStatus('✅ THANK YOU!'); setTimeout(() => setStatus(''), 3000); }
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
      <button onClick={submitFeedback} className="mt-3 w-full py-3 bg-white border border-purple-100 text-purple-600 text-[9px] font-black uppercase rounded-xl active:scale-95 transition-all shadow-sm hover:bg-purple-600 hover:text-white">
        {status || 'Send Suggestion'}
      </button>
    </div>
  );
}

function ReputaAppContent() {
  const [walletData, setWalletData] = useState<any | null>(null);
  const [pendingAddress, setPendingAddress] = useState<string | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isVip, setIsVip] = useState(false);
  const [paymentCount, setPaymentCount] = useState(0);

  const piBrowser = isPiBrowser();
  const { refreshWallet } = useTrust();

  // تحسين الربط مع Admin Console لضمان تسجيل كل حركة (دخول أو دفع)
  const syncToAdmin = async (uname: string, statusType: string) => {
    try {
      await fetch('/api/save-pioneer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: uname, 
          status: statusType, // إرسال الحالة (Active / Paid)
          uid: currentUser?.uid,
          timestamp: new Date().toISOString() 
        }),
      });
    } catch (e) { console.warn("Admin sync failed"); }
  };

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
          // مزامنة الدخول الأولي
          syncToAdmin(user.username, "APP_OPENED");
          
          const res = await fetch(`/api/check-vip?uid=${user.uid}`).then(r => r.json()).catch(() => ({isVip: false, count: 0}));
          setIsVip(res.isVip);
          setPaymentCount(res.count || 0);
        }
      } catch (e) { console.warn("Pi SDK failed"); } finally { setIsInitializing(false); }
    };
    initApp();
  }, [piBrowser]);

  const executeCheck = async (address: string) => {
    const isDemo = address.toLowerCase().trim() === 'demo';
    setIsLoading(true);

    if (isDemo) {
      setWalletData({
        address: "GDU22WEH7M3O...DEMO",
        username: "Demo_Pioneer",
        reputaScore: 632,
        trustLevel: "Elite",
        recentActivity: [{ id: "tx_8", type: "Testnet Swap", subType: "Ecosystem", amount: "3.14", status: "Success", exactTime: "02:45 PM", dateLabel: "Today" }]
      });
      setIsLoading(false);
      return;
    }

    try {
      const data = await fetchWalletData(address);
      if (data) {
        setWalletData({ ...data, trustLevel: data.reputaScore >= 600 ? 'Elite' : 'Verified' });
        // مزامنة عند كل عملية فحص ناجحة لزيادة عداد النشاط في Admin
        syncToAdmin(currentUser?.username || 'Guest', `CHECK_WALLET: ${address.substring(0,6)}`);
        refreshWallet(address).catch(() => null);
      }
    } catch (error) { alert("Blockchain sync error."); } finally { setIsLoading(false); }
  };

  const handleWalletCheck = (address: string) => {
    if (!isVip && paymentCount < 1) {
      const confirmMsg = "Unlock detailed Audit Report via Pi Testnet transaction? \n\n(This is a secure Testnet process to verify your identity)";
      if (window.confirm(confirmMsg)) {
        setPendingAddress(address);
        setIsUpgradeModalOpen(true);
      }
      return;
    }
    executeCheck(address);
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
            <p className="text-[10px] mt-6 font-black text-purple-600 tracking-[0.3em] uppercase">Checking Testnet Ledger...</p>
          </div>
        ) : !walletData ? (
          <div className="max-w-md mx-auto py-6">
            <div className="mb-8 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-full mb-4">
                    <ShieldCheck className="w-3 h-3" />
                    <span className="text-[9px] font-black uppercase tracking-tighter">Testnet Protocol v4.2 Secured</span>
                </div>
                <h2 className="text-2xl font-black text-gray-900 leading-tight uppercase tracking-tighter">Scan Any Wallet<br/><span className="text-purple-600">On Testnet</span></h2>
            </div>
            
            <WalletChecker onCheck={handleWalletCheck} />
            
            <div className="mt-8 p-4 bg-gray-50 rounded-2xl border border-gray-100">
               <p className="text-[9px] text-gray-400 font-bold uppercase text-center leading-relaxed">
                 * All audits require 1 Pi Testnet verification to unlock the full reputation data.
               </p>
            </div>

            <FeedbackSection username={currentUser?.username || 'Guest'} />
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
             <div className="relative overflow-hidden rounded-[40px]">
                <WalletAnalysis 
                  walletData={walletData} 
                  isProUser={true} 
                  onReset={() => setWalletData(null)} 
                  onUpgradePrompt={() => setIsUpgradeModalOpen(true)} 
                />
             </div>
             <FeedbackSection username={currentUser?.username || 'Guest'} />
          </div>
        )}
      </main>

      <footer className="p-6 text-center border-t border-gray-50 flex flex-col items-center gap-4">
        <a href="https://t.me/+zxYP2x_4IWljOGM0" target="_blank" className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-[#229ED9] rounded-full transition-all active:scale-95">
          <Send className="w-3 h-3" />
          <span className="text-[9px] font-black uppercase tracking-widest">Join Telegram Community</span>
        </a>
        <div className="text-[8px] text-gray-300 font-black uppercase tracking-[0.3em]">Pi Network Testnet Audit Tool</div>
      </footer>

      <AccessUpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setIsUpgradeModalOpen(false)} 
        currentUser={currentUser}
        onUpgrade={async () => { 
          // تم إضافة async/await هنا لضمان مزامنة البيانات قبل تغيير الواجهة
          setIsVip(true); 
          setPaymentCount(1); 
          setIsUpgradeModalOpen(false); 
          
          // إرسال إشارة الدفع لـ Admin Console لزيادة العداد
          await syncToAdmin(currentUser?.username, "PAID_TESTNET_VIP");
          
          if (pendingAddress) {
            executeCheck(pendingAddress);
            setPendingAddress(null);
          }
        }} 
      />
      <Analytics />
    </div>
  );
}

export default function App() { 
  return (<TrustProvider><ReputaAppContent /></TrustProvider>); 
}
