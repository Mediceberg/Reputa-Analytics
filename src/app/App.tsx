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
  const [isDemoMode, setIsDemoMode] = useState(false); // ✅ حالة جديدة للتحكم في الديمو

  const piBrowserActive = isPiBrowser();
  const { refreshWallet } = useTrust();

  useEffect(() => {
    const initApp = async () => {
      if (piBrowserActive) {
        try {
          await initializePiSDK();
          const user = await authenticateUser(['username', 'payments']);
          if (user) {
            setCurrentUser(user);
            const isVIP = await checkVIPStatus(user.uid);
            setHasProAccess(isVIP);
          }
        } catch (e) { 
          console.error(e);
          // إذا فشل الاتصال بـ Pi، نفعل الديمو تلقائياً لضمان عمل التطبيق
          setIsDemoMode(true);
        }
      } else {
        // خارج متصفح باي: ديمو إجباري
        setCurrentUser({ username: "Guest_Visitor", uid: "guest_id" });
        setIsDemoMode(true);
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
      setWalletData({
        ...data,
        reputaScore: 850,
        trustLevel: 'Elite'
      });
    } catch (error) {
      alert('Wallet Sync Error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccessUpgrade = async () => {
    if (isDemoMode && !piBrowserActive) {
      setHasProAccess(true);
      setIsUpgradeModalOpen(false);
      return;
    }
    
    try {
      if (currentUser?.uid) {
        const success = await createVIPPayment(currentUser.uid);
        if (success) {
          setHasProAccess(true);
          setIsDemoMode(false); // إيقاف وضع الديمو لأنه أصبح VIP حقيقي
          setIsUpgradeModalOpen(false);
        }
      }
    } catch (e) { alert("Payment Error"); }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b p-4 bg-white sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src={logoImage} alt="logo" className="w-8 h-8" />
            <div>
              <h1 className="font-bold text-purple-700">Reputa Score</h1>
              <p className="text-[10px] text-gray-500 font-mono">
                {currentUser ? `👤 ${currentUser.username}` : 'Connecting...'}
                {isDemoMode && <span className="ml-1 text-blue-500">[DEMO]</span>}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {/* زر الديمو داخل متصفح باي */}
            {piBrowserActive && !hasProAccess && !isDemoMode && (
              <button 
                onClick={() => setIsDemoMode(true)}
                className="text-[10px] border border-blue-500 text-blue-500 px-2 py-1 rounded-full"
              >
                Try Demo
              </button>
            )}

            {hasProAccess ? (
              <span className="bg-yellow-400 text-black text-[10px] font-bold px-3 py-1 rounded-full">👑 VIP</span>
            ) : (
              <button 
                onClick={() => setIsUpgradeModalOpen(true)}
                className="bg-purple-600 text-white text-[10px] px-3 py-1 rounded-full"
              >
                {isDemoMode ? 'Get Real VIP' : 'UPGRADE'}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        {!walletData ? (
          <WalletChecker onCheck={handleWalletCheck} />
        ) : (
          <WalletAnalysis
            walletData={walletData}
            isProUser={hasProAccess || isDemoMode} // السماح برؤية التقرير إذا كان ديمو
            onReset={() => setWalletData(null)}
            onUpgradePrompt={() => setIsUpgradeModalOpen(true)}
          />
        )}
      </main>

      <footer className="p-3 text-center text-[9px] text-gray-400 border-t bg-gray-50">
        {isDemoMode ? 'VIEWING DEMO REPORT' : 'SECURE PI NETWORK SESSION'}
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
