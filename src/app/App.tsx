import { useState, useEffect } from 'react';  
import { Analytics } from '@vercel/analytics/react';
import { Send } from 'lucide-react'; 
import { WalletChecker } from './components/WalletChecker';
import { WalletAnalysis } from './components/WalletAnalysis';
import { AccessUpgradeModal } from './components/AccessUpgradeModal';
import { TrustProvider, useTrust } from './protocol/TrustProvider';
import { fetchWalletData } from './protocol/wallet';
import { initializePiSDK, authenticateUser, isPiBrowser } from './services/piSdk';
import logoImage from '../assets/logo.png';

function ReputaAppContent() {
  const [walletData, setWalletData] = useState<any | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isVip, setIsVip] = useState(false);

  const piBrowser = isPiBrowser();
  const { refreshWallet } = useTrust();

  // مزامنة البيانات مع السيرفر أو قاعدة البيانات
  const savePioneerToDatabase = async (user: any, manualAddress?: string) => {
    try {
      if (!user || user.uid === "demo") return;
      const finalWallet = manualAddress || user.wallet_address || user.uid;
      
      await fetch('/api/save-pioneer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          uid: user.uid,
          wallet: finalWallet,
          timestamp: new Date().toISOString()
        }),
      });
    } catch (error) {
      console.error("Database sync error:", error);
    }
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
        // محاولة تسجيل الدخول الصامت عند فتح التطبيق
        const user = await authenticateUser(['username', 'wallet_address']).catch(() => null);
        if (user) {
          setCurrentUser(user);
          savePioneerToDatabase(user);
          
          // فحص حالة الـ VIP من السيرفر عند الدخول إذا لزم الأمر
          const res = await fetch(`/api/check-vip?uid=${user.uid}`).catch(() => null);
          if (res?.ok) {
            const data = await res.json();
            if (data.isVip) setIsVip(true);
          }
        }
      } catch (e) { 
        console.warn("Init Warning: Fallback enabled"); 
      } finally { 
        setIsInitializing(false); 
      }
    };
    initApp();
  }, [piBrowser]);

  const handleWalletCheck = async (address: string) => {
    if (address === 'demo') {
      setIsLoading(true);
      setTimeout(() => {
        // بيانات الديمو
        setWalletData({ 
          address: "GDU72WEH7M3O...MWPDYFBT",
          reputaScore: 632,
          trustLevel: 'Elite'
          // ... بقية البيانات
        });
        setIsLoading(false);
      }, 800);
      return;
    }

    if (!address) return;
    setIsLoading(true);
    setWalletData(null); 
    
    try {
      const data = await fetchWalletData(address);
      if (data && typeof data.reputaScore === 'number') {
        setWalletData({
          ...data,
          totalTransactions: data.totalTransactions || data.transactions?.length || 0,
          trustLevel: data.reputaScore >= 600 ? 'Elite' : 'Verified'
        });
        if (currentUser?.uid !== "demo") savePioneerToDatabase(currentUser, address);
        setTimeout(() => refreshWallet(address).catch(() => null), 200);
      }
    } catch (error) {
      alert("Blockchain sync failed. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitializing && piBrowser) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-purple-600 font-black animate-pulse uppercase tracking-widest text-[10px]">Syncing Reputa...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-purple-100">
      <header className="border-b p-4 bg-white/95 backdrop-blur-md sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <img src={logoImage} alt="logo" className="w-8 h-8 object-contain" />
          <div className="leading-tight">
            <h1 className="font-black text-purple-700 text-lg tracking-tighter uppercase">Reputa Score</h1>
            <p className="text-[9px] text-gray-400 font-bold uppercase flex items-center gap-1">
               Welcome, {currentUser?.username || 'Guest'} {isVip && <span className="text-amber-500 font-black">⭐ VIP</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a href="https://t.me/your_telegram" target="_blank" className="p-2 text-[#229ED9] bg-blue-50 rounded-full active:scale-90 transition-transform">
            <Send className="w-4 h-4" />
          </a>

          {piBrowser && !currentUser?.uid && (
            <button 
              onClick={async () => {
                const user = await authenticateUser(['username', 'wallet_address']);
                if(user) { setCurrentUser(user); savePioneerToDatabase(user); }
              }} 
              className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-[10px] font-black uppercase shadow-md active:scale-95 transition-all"
            >
              Link Account
            </button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center py-24">
            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] mt-6 font-black text-purple-600 tracking-[0.2em] uppercase">Analyzing Blockchain...</p>
          </div>
        ) : !walletData ? (
          <div className="max-w-md mx-auto">
            <WalletChecker onCheck={handleWalletCheck} />
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <WalletAnalysis 
              walletData={walletData} 
              isProUser={isVip} 
              onReset={() => setWalletData(null)} 
              onUpgradePrompt={() => setIsUpgradeModalOpen(true)} 
            />
          </div>
        )}
      </main>

      <footer className="p-6 text-center border-t bg-gray-50/50">
        <div className="text-[9px] text-gray-400 font-black tracking-widest uppercase mb-4">Reputa v4.2 Stable Engine</div>
        <a href="https://t.me/your_telegram" className="inline-flex items-center gap-2 px-6 py-2 bg-black text-white rounded-full text-[10px] font-black uppercase">
          <Send className="w-3 h-3" /> Community Support
        </a>
      </footer>

      <AccessUpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setIsUpgradeModalOpen(false)} 
        currentUser={currentUser}
        onUpgrade={() => {
          setIsVip(true); // تفعيل الـ VIP عند نجاح الدفع
          setIsUpgradeModalOpen(false);
        }} 
      />
      <Analytics />
    </div>
  );
}

export default function App() { return (<TrustProvider><ReputaAppContent /></TrustProvider>); }
