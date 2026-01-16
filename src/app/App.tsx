import { useState, useEffect } from 'react'; 
import { Analytics } from '@vercel/analytics/react';
import { WalletChecker } from './components/WalletChecker';
import { WalletAnalysis } from './components/WalletAnalysis';
import { AccessUpgradeModal } from './components/AccessUpgradeModal';
import { TrustProvider, useTrust } from './protocol/TrustProvider';
import { fetchWalletData } from './protocol/wallet';
import { initializePiSDK, authenticateUser, isPiBrowser } from './services/piSdk';
import logoImage from '../assets/logo.svg';

function ReputaAppContent() {
  const [walletData, setWalletData] = useState<any | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);

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
        const user = await authenticateUser(['username']).catch(() => null);
        if (user) setCurrentUser(user);
      } catch (e) { console.warn("Fallback Mode Active"); }
      finally { setIsInitializing(false); }
    };
    initApp();
  }, [piBrowser]);

  const handleWalletCheck = async (address: string) => {
    if (!address) return;
    setIsLoading(true);
    // ✅ خطوة حاسمة: تصفير البيانات القديمة تماماً لمنع تداخل الأرقام المليونية
    setWalletData(null); 
    
    try {
      const data = await fetchWalletData(address);
      
      // ✅ التحقق من سلامة البيانات قبل إرسالها للمكون
      if (data && typeof data.reputaScore === 'number') {
        setWalletData({
          ...data,
          // التأكد من أن حالة الثقة تتبع السكور الحقيقي وليست ثابتة
          trustLevel: data.reputaScore >= 600 ? 'Elite' : 'Verified'
        });
        setTimeout(() => refreshWallet(address).catch(() => null), 200);
      } else {
        alert("Data format error. Please try again.");
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      alert("Network Error: Could not connect to Pi Blockchain.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitializing && piBrowser) {
    return <div className="min-h-screen bg-white flex items-center justify-center text-purple-600 font-bold animate-pulse uppercase tracking-widest">Initialising...</div>;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <header className="border-b p-4 bg-white/95 backdrop-blur-md sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <img src={logoImage} alt="logo" className="w-8 h-8" />
          <div className="leading-tight">
            <h1 className="font-black text-purple-700 text-lg tracking-tighter uppercase">Reputa</h1>
            <p className="text-[10px] text-gray-400 font-black uppercase">
               {currentUser?.username || 'Guest'}
            </p>
          </div>
        </div>

        {piBrowser && !currentUser?.uid && (
          <button onClick={() => authenticateUser(['username']).then(setCurrentUser)} className="p-2 bg-purple-50 text-purple-600 rounded-lg text-[9px] font-black uppercase border border-purple-100">
            Link Account
          </button>
        )}
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center py-24">
            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] mt-6 font-black text-purple-600 tracking-[0.3em] uppercase">Decoding Ledger...</p>
          </div>
        ) : !walletData ? (
          <div className="max-w-md mx-auto py-6">
            <WalletChecker onCheck={handleWalletCheck} />
          </div>
        ) : (
          // ✅ تغليف المكون بحماية إضافية
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <WalletAnalysis
              walletData={walletData}
              isProUser={true} 
              onReset={() => setWalletData(null)}
              onUpgradePrompt={() => setIsUpgradeModalOpen(true)}
            />
          </div>
        )}
      </main>

      <footer className="p-6 text-center text-[9px] text-gray-300 border-t font-black tracking-[0.4em] uppercase">
        Reputa Explorer v4.2 Stable
      </footer>

      <AccessUpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} onUpgrade={() => {}} />
      <Analytics />
    </div>
  );
}

export default function App() {
  return (
    <TrustProvider>
      <ReputaAppContent />
    </TrustProvider>
  );
}
