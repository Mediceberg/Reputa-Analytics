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
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // ✅ التغيير الجذري: تحديد حالة الـ VIP بناءً على المتصفح مباشرة
  const piBrowserActive = isPiBrowser();
  const [hasProAccess, setHasProAccess] = useState(!piBrowserActive); // true فوراً إذا لم يكن متصفح باي

  const { updateMiningDays, miningDays, trustScore, refreshWallet } = useTrust();

  // تحديث البيانات عند فتح التطبيق
  useEffect(() => {
    const initApp = async () => {
      if (piBrowserActive) {
        try {
          await initializePiSDK();
          const user = await authenticateUser(['username', 'payments']);
          if (user) {
            setCurrentUser(user);
            setHasProAccess(checkVIPStatus(user.uid));
          }
        } catch (e) { console.error(e); }
      } else {
        // وضع الديمو الإجباري
        setCurrentUser({ username: "Demo_User", uid: "demo123" });
        setHasProAccess(true);
      }
    };
    initApp();
  }, [piBrowserActive]);

  const handleWalletCheck = async (address: string) => {
    if (!address) return;
    setIsLoading(true);
    try {
      const data = await fetchWalletData(address);
      await refreshWallet(address);
      
      // حساب سكورد تجريبي مرتفع للديمو
      const score = 850; 

      setWalletData({
        ...data,
        reputaScore: score,
        trustScore: score / 10,
        consistencyScore: 95,
        networkTrust: 88,
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
    // منطق الدفع الحقيقي في متصفح باي
    try {
      if (currentUser?.uid) await createVIPPayment(currentUser.uid);
    } catch (e) { alert("Payment Error"); }
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden flex flex-col">
      <header className="border-b p-4 bg-white sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src={logoImage} alt="logo" className="w-8 h-8" />
            <div>
              <h1 className="font-bold text-purple-700">Reputa Score</h1>
              <p className="text-[10px] text-gray-500 uppercase">
                {piBrowserActive ? '● Live Network' : 'PRO DEMO MODE'}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {hasProAccess && (
              <span className="bg-yellow-400 text-black text-[10px] font-bold px-2 py-1 rounded animate-bounce">
                VIP UNLOCKED
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        {isLoading ? (
          <div className="text-center py-20">Loading VIP Analysis...</div>
        ) : !walletData ? (
          <WalletChecker onCheck={handleWalletCheck} />
        ) : (
          <WalletAnalysis
            walletData={walletData}
            isProUser={true} // فرضه كـ VIP دائماً في هذا الكود للتجربة
            onReset={() => setWalletData(null)}
            onUpgradePrompt={() => setIsUpgradeModalOpen(true)}
          />
        )}
      </main>

      <footer className="p-4 text-center text-[10px] text-gray-400 border-t">
        DEMO MODE v2.1 - ALL FEATURES UNLOCKED
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
