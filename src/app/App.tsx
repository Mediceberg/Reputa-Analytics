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
      } catch (e) { console.warn("Fallback Mode"); }
      finally { setIsInitializing(false); }
    };
    initApp();
  }, [piBrowser]);

  const handleWalletCheck = async (address: string) => {
    if (!address) return;
    setIsLoading(true);
    setWalletData(null); // مسح البيانات القديمة لتجنب التضارب
    try {
      const data = await fetchWalletData(address);
      if (data && data.balance !== undefined) {
        setWalletData({
          ...data,
          // ✅ السكور الآن ديناميكي تماماً من البروتوكول
          reputaScore: data.reputaScore || 100, 
          // ✅ الحالة تتغير بناءً على السكور الفعلي
          trustLevel: (data.reputaScore || 0) > 600 ? 'Elite Wallet' : 'Verified User'
        });
        setTimeout(() => refreshWallet(address).catch(() => null), 100);
      } else {
        throw new Error("Invalid Data");
      }
    } catch (error) {
      alert("Blockchain Sync Error: Wallet not found or inactive.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualLink = async () => {
    if (!piBrowser) return;
    try {
      const user = await authenticateUser(['username', 'payments']);
      if (user) setCurrentUser(user);
    } catch (e) { alert("Link Cancelled"); }
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
              <span className="text-purple-400">Pioneer:</span> {currentUser?.username || 'Guest'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {piBrowser && !currentUser?.uid && (
            <button onClick={handleManualLink} className="p-2 bg-purple-50 text-purple-600 rounded-lg border border-purple-100 flex items-center gap-2 hover:bg-purple-100 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
              </svg>
              <span className="text-[9px] font-black uppercase tracking-tighter">Link Account</span>
            </button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center py-24">
            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] mt-6 font-black text-purple-600 tracking-[0.3em] uppercase">Syncing Pi Protocol...</p>
          </div>
        ) : !walletData ? (
          <div className="max-w-md mx-auto py-6">
            <WalletChecker onCheck={handleWalletCheck} />
          </div>
        ) : (
          <WalletAnalysis
            walletData={walletData}
            isProUser={true} // الحفاظ على ميزة الديمو المفتوح للعامة
            onReset={() => setWalletData(null)}
            onUpgradePrompt={() => setIsUpgradeModalOpen(true)}
          />
        )}
      </main>

      <footer className="p-6 text-center text-[9px] text-gray-300 border-t bg-gray-50/30 font-black tracking-[0.4em] uppercase">
        Reputa Explorer v4.0.1
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
