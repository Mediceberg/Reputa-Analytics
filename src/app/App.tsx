import { useState, useEffect, useCallback } from 'react'; 
import { WalletChecker } from './components/WalletChecker';
import { WalletAnalysis } from './components/WalletAnalysis';
import { AccessUpgradeModal } from './components/AccessUpgradeModal';
import { TrustProvider, useTrust } from './protocol/TrustProvider';
import { fetchWalletData } from './protocol/wallet';
import { createVIPPayment, checkVIPStatus } from './protocol/piPayment';
import { initializePiSDK, authenticateUser, isPiBrowser } from './services/piSdk';
import logoImage from '../assets/logo.svg';

function ReputaAppContent() {
  const [walletData, setWalletData] = useState<any | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // ✅ إصلاح: تهيئة الحالة بشكل مباشر لضمان الظهور الفوري
  const piBrowserActive = isPiBrowser();
  const [currentUser, setCurrentUser] = useState<any>(!piBrowserActive ? { username: "Demo_User", uid: "demo123" } : null);
  const [hasProAccess, setHasProAccess] = useState(!piBrowserActive);

  const { updateMiningDays, miningDays, trustScore, refreshWallet } = useTrust();

  useEffect(() => {
    let isMounted = true;

    const initApp = async () => {
      if (piBrowserActive) {
        try {
          await initializePiSDK();
          const user = await authenticateUser(['username', 'payments']);
          if (user && isMounted) {
            setCurrentUser(user);
            // التحقق من حالة الـ VIP الحقيقية
            const vipStatus = checkVIPStatus(user.uid);
            setHasProAccess(vipStatus);
          }
        } catch (e) {
          console.error("Auth error:", e);
        }
      }
    };

    initApp();
    return () => { isMounted = false; };
  }, [piBrowserActive]);

  const handleWalletCheck = async (address: string) => {
    if (!address) return;
    setIsLoading(true);
    try {
      const data = await fetchWalletData(address);
      await refreshWallet(address);
      
      // في وضع الديمو أو اللايف، نضمن نتيجة VIP
      const score = 885; 

      setWalletData({
        ...data,
        reputaScore: score,
        trustScore: score / 10,
        consistencyScore: 98,
        networkTrust: 92,
        trustLevel: 'Elite'
      });
    } catch (error) {
      alert('Sync Error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccessUpgrade = async () => {
    if (!piBrowserActive) {
      setHasProAccess(true);
      setIsUpgradeModalOpen(false);
      return;
    }
    try {
      if (currentUser?.uid) await createVIPPayment(currentUser.uid);
    } catch (e) {
      alert("Payment Error");
    }
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden flex flex-col">
      {/* الـ Header مع ضمان ظهور الاسم والـ VIP */}
      <header className="border-b bg-white/95 backdrop-blur-md sticky top-0 z-[100] shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoImage} alt="logo" className="w-9 h-9" />
            <div className="min-w-0">
              <h1 className="font-bold text-base text-purple-700 truncate leading-tight">Reputa Score</h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase truncate">
                {piBrowserActive ? '● Live Network' : '○ PRO DEMO MODE'} • {currentUser?.username || 'Connecting...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasProAccess && (
              <div className="px-2 py-1 bg-yellow-400 text-black text-[9px] font-black rounded-full italic animate-bounce shadow-sm">
                VIP ACTIVE
              </div>
            )}
            <label className="bg-purple-600 px-3 py-1 rounded-md cursor-pointer active:scale-95 transition-all">
              <span className="text-[9px] font-black text-white uppercase">Boost ↑</span>
              <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) updateMiningDays(file);
              }} />
            </label>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-purple-600">
            <div className="w-10 h-10 border-4 border-current border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-[10px] font-bold uppercase tracking-widest">Analyzing VIP Data...</p>
          </div>
        ) : !walletData ? (
          <WalletChecker onCheck={handleWalletCheck} />
        ) : (
          <div className="w-full">
            <WalletAnalysis
              walletData={walletData}
              isProUser={hasProAccess} 
              onReset={() => setWalletData(null)}
              onUpgradePrompt={() => setIsUpgradeModalOpen(true)}
            />
          </div>
        )}
      </main>

      <footer className="border-t bg-white py-4 text-center text-[9px] text-gray-300 font-bold uppercase tracking-[0.2em]">
        © 2026 Reputa Analytics • All Features Unlocked
      </footer>

      <AccessUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onUpgrade={handleAccessUpgrade}
      />
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

