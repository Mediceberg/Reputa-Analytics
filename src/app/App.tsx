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
  const [isDemoActive, setIsDemoActive] = useState(false); 
  const [isInitializing, setIsInitializing] = useState(true);

  const piBrowser = isPiBrowser();
  const { refreshWallet } = useTrust();

  useEffect(() => {
    const initApp = async () => {
      if (!piBrowser) {
        // وضع الديمو (خارج باي) - حرية كاملة
        setCurrentUser({ username: "Guest Explorer", uid: "demo" });
        setHasProAccess(true); // لفتح الميزات
        setIsDemoActive(true);
        setIsInitializing(false);
        return;
      }
      try {
        await initializePiSDK();
      } catch (e) {
        setIsDemoActive(true);
      } finally {
        setIsInitializing(false);
      }
    };
    initApp();
  }, [piBrowser]);

  const handleManualLogin = async () => {
    try {
      const user = await authenticateUser(['username', 'payments']);
      if (user) {
        setCurrentUser(user);
        const isVIP = await checkVIPStatus(user.uid);
        setHasProAccess(isVIP);
      }
    } catch (e) {
      alert("Authentication failed");
    }
  };

  const handleWalletCheck = async (address: string) => {
    if (!address) return;
    setIsLoading(true);
    try {
      const data = await fetchWalletData(address);
      await refreshWallet(address);
      setWalletData({
        ...data,
        reputaScore: data.balance > 0 ? 314 : 100,
        trustLevel: 'Elite'
      });
    } catch (error) {
      alert('Network Sync Error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitializing && piBrowser) {
    return <div className="min-h-screen flex items-center justify-center bg-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <header className="border-b p-4 flex justify-between items-center bg-white sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <img src={logoImage} alt="logo" className="w-8 h-8" />
          <h1 className="font-bold text-purple-700">Reputa Score</h1>
        </div>
        {currentUser?.username && (
          <p className="text-[10px] text-gray-500 font-bold">
            <span className="text-purple-400">Welcome,</span> {currentUser.username}
          </p>
        )}
      </header>

      <main className="container mx-auto px-4 py-8 flex-1 flex flex-col justify-center">
        {/* ✅ أيقونة الربط: واضحة، جذابة، وفي المنتصف */}
        {piBrowser && !currentUser?.uid && !walletData && (
          <div className="mb-10 p-6 border-2 border-dashed border-purple-200 rounded-2xl text-center bg-purple-50/50">
            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </div>
            <h2 className="text-purple-800 font-bold text-lg">Connect Pi Account</h2>
            <p className="text-gray-500 text-xs mb-4">Link your account to save your scores and access VIP features</p>
            <button 
              onClick={handleManualLogin}
              className="bg-purple-600 text-white px-8 py-3 rounded-full font-bold shadow-md hover:scale-105 transition-transform"
            >
              Connect Now
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-20 animate-pulse text-purple-600 font-bold uppercase tracking-tighter">Analyzing Blockchain...</div>
        ) : !walletData ? (
          <WalletChecker onCheck={handleWalletCheck} />
        ) : (
          <WalletAnalysis
            walletData={walletData}
            // ✅ الديمو يفتح التقرير فوراً دون حواجز
            isProUser={isDemoActive ? true : hasProAccess} 
            onReset={() => setWalletData(null)}
            onUpgradePrompt={() => setIsUpgradeModalOpen(true)}
          />
        )}
      </main>

      <footer className="p-4 text-center text-[9px] text-gray-300 font-bold uppercase tracking-widest">
        {isDemoActive ? 'Preview Environment' : 'Secure Protocol Live'}
      </footer>

      {/* المودال يظهر فقط للمستخدمين الحقيقيين وليس في الديمو */}
      {!isDemoActive && (
        <AccessUpgradeModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
          onUpgrade={async () => {
             // منطق الدفع الحقيقي
          }}
        />
      )}
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
