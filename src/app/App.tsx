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
  const [isInitializing, setIsInitializing] = useState(true);

  const piBrowser = isPiBrowser();
  const { refreshWallet } = useTrust();

  useEffect(() => {
    const initApp = async () => {
      if (!piBrowser) {
        setCurrentUser({ username: "Guest", uid: "demo" });
        setIsInitializing(false);
        return;
      }
      try {
        await Promise.race([
          initializePiSDK(),
          new Promise((_, reject) => setTimeout(() => reject(), 3000))
        ]);
        // محاولة التعرف على المستخدم إذا كان قد سجل سابقاً (بدون إظهار نافذة)
        const user = await authenticateUser(['username']).catch(() => null);
        if (user) {
          setCurrentUser(user);
          const isVIP = await checkVIPStatus(user.uid);
          setHasProAccess(isVIP);
        }
      } catch (e) {
        console.log("SDK Ready");
      } finally {
        setIsInitializing(false);
      }
    };
    initApp();
  }, [piBrowser]);

  const handleManualLogin = async () => {
    if (!piBrowser) return;
    try {
      const user = await authenticateUser(['username', 'payments']);
      if (user) {
        setCurrentUser(user);
        const isVIP = await checkVIPStatus(user.uid);
        setHasProAccess(isVIP);
      }
    } catch (e) {
      alert("Login cancelled");
    }
  };

  const handleWalletCheck = async (address: string) => {
    if (!address) return;
    setIsLoading(true);
    try {
      // ✅ جلب البيانات الحقيقية فوراً للجميع (بدون قيود)
      const data = await fetchWalletData(address);
      if (data) {
        await refreshWallet(address);
        setWalletData({
          ...data,
          reputaScore: 314, // السكور يظهر للجميع
          trustLevel: 'Verified'
        });
      }
    } catch (error) {
      alert("Wallet not found on Blockchain");
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitializing && piBrowser) return <div className="min-h-screen bg-white" />;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b p-4 bg-white sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <img src={logoImage} alt="logo" className="w-8 h-8" />
          <div className="leading-tight">
            <h1 className="font-bold text-purple-700">Reputa Score</h1>
            <p className="text-[11px] text-gray-500 font-medium">
              <span className="text-purple-400">Welcome,</span> {currentUser?.username || 'Guest'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {piBrowser && !currentUser?.uid && (
            <button onClick={handleManualLogin} className="text-[10px] border border-purple-200 text-purple-600 px-3 py-1 rounded-full font-bold">
              Link Account
            </button>
          )}
          {hasProAccess && (
            <span className="text-[9px] bg-yellow-400 text-white px-2 py-0.5 rounded-full font-black">VIP</span>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center py-20 animate-pulse text-purple-600 font-bold uppercase text-[10px]">
            Syncing Blockchain...
          </div>
        ) : !walletData ? (
          <div className="max-w-md mx-auto">
            <WalletChecker onCheck={handleWalletCheck} />
          </div>
        ) : (
          <WalletAnalysis
            walletData={walletData}
            // ✅ المفتاح هنا: نمرر true دائماً لخانة الـ ProUser 
            // لكي يفتح الديمو (المجاني) في جميع الحالات وبدون استثناء
            isProUser={true} 
            onReset={() => setWalletData(null)}
            onUpgradePrompt={() => setIsUpgradeModalOpen(true)}
          />
        )}
      </main>

      <footer className="p-4 text-center text-[9px] text-gray-300 border-t bg-gray-50/50 font-bold uppercase tracking-widest">
        Free Blockchain Protocol v3.0
      </footer>

      <AccessUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onUpgrade={async () => { /* الدفع يبقى خياراً إضافياً للمستخدم */ }}
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
