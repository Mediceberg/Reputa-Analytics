import { useState, useEffect } from 'react'; 
import { Analytics } from '@vercel/analytics/react';
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
  const [hasProAccess, setHasProAccess] = useState(false);

  const piBrowserActive = isPiBrowser();
  const { refreshWallet } = useTrust();

  useEffect(() => {
    const initApp = async () => {
      try {
        if (piBrowserActive) {
          await initializePiSDK();
          const user = await authenticateUser(['username', 'payments']);
          if (user) {
            setCurrentUser(user);
            const isVIP = await checkVIPStatus(user.uid);
            setHasProAccess(isVIP);
          }
        } else {
          // ✅ وضع الديمو: اسم مستخدم وهمي وفتح صلاحيات الـ VIP تلقائياً للمعاينة
          setCurrentUser({ username: "Demo_Preview", uid: "demo123" });
          setHasProAccess(true); 
        }
      } catch (e) {
        console.error("Initialization error:", e);
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
      
      setWalletData({
        ...data,
        reputaScore: 850,
        trustScore: 85,
        consistencyScore: 95,
        networkTrust: 88,
        trustLevel: 'Elite'
      });
    } catch (error) {
      alert('Sync Error: Please check wallet address');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccessUpgrade = async () => {
    // في وضع الديمو (خارج متصفح باي) الزر لن يفعل شيئاً لأن الصلاحيات مفتوحة أصلاً
    if (!piBrowserActive) {
      setIsUpgradeModalOpen(false);
      return;
    }

    if (!currentUser) {
      alert("Wait for Pi authentication...");
      return;
    }

    try {
      const paymentResult = await createVIPPayment(currentUser.uid);
      if (paymentResult) {
        setHasProAccess(true);
        setIsUpgradeModalOpen(false);
      }
    } catch (e) {
      alert("Payment failed");
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b p-4 bg-white sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src={logoImage} alt="logo" className="w-8 h-8" />
            <div>
              <h1 className="font-bold text-purple-700">Reputa Score</h1>
              <p className="text-[10px] text-gray-500 font-medium">
                {currentUser?.username ? `👤 ${currentUser.username}` : 'Connecting...'}
                {!piBrowserActive && <span className="ml-2 text-orange-500">[DEMO MODE]</span>}
              </p>
            </div>
          </div>
          
          <div>
            {hasProAccess ? (
              <div className="flex items-center gap-2">
                 <span className="bg-yellow-400 text-black text-[10px] font-bold px-3 py-1 rounded-full shadow-sm">
                  👑 VIP UNLOCKED
                </span>
              </div>
            ) : (
              <button 
                onClick={() => setIsUpgradeModalOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-bold px-4 py-1.5 rounded-full shadow-lg"
              >
                UPGRADE
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-purple-700">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-current mb-4"></div>
            <p>Generating VIP Report...</p>
          </div>
        ) : !walletData ? (
          <WalletChecker onCheck={handleWalletCheck} />
        ) : (
          <WalletAnalysis
            walletData={walletData}
            isProUser={hasProAccess} // ستكون true دائماً في المتصفح العادي (Demo)
            onReset={() => setWalletData(null)}
            onUpgradePrompt={() => setIsUpgradeModalOpen(true)}
          />
        )}
      </main>

      <footer className="p-4 text-center text-[9px] text-gray-400 border-t bg-gray-50">
        {piBrowserActive ? '● LIVE PI NETWORK' : '○ DEMO MODE - PREVIEWING VIP FEATURES'}
      </footer>

      <AccessUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onUpgrade={handleAccessUpgrade}
      />
      
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
