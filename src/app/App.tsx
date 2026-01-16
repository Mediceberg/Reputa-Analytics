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

  // 1. التحقق من البيئة فقط عند التحميل الأول دون إجبار المستخدم على الربط
  useEffect(() => {
    const initApp = async () => {
      if (!piBrowser) {
        setCurrentUser({ username: "Explorer", uid: "demo_mode" });
        setIsDemoActive(true);
        setHasProAccess(true);
        setIsInitializing(false);
        return;
      }

      try {
        await initializePiSDK();
        // لا نقوم باستدعاء authenticateUser هنا لكي لا يظهر شعار الربط فوراً
        setIsInitializing(false);
      } catch (e) {
        setIsDemoActive(true); 
        setIsInitializing(false);
      }
    };
    initApp();
  }, [piBrowser]);

  // 2. جلب البيانات الحقيقية فوراً دون أي قيود أو شعارات ربط
  const handleWalletCheck = async (address: string) => {
    if (!address) return;
    setIsLoading(true);
    try {
      // جلب البيانات من البلوكشين مباشرة
      const data = await fetchWalletData(address);
      await refreshWallet(address);

      setWalletData({
        ...data,
        reputaScore: data.balance > 0 ? Math.min(950, 500 + (data.balance * 5)) : 420,
        trustLevel: data.balance > 50 ? 'Elite' : 'Verified'
      });
    } catch (error) {
      alert('Blockchain Sync Error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    // إذا لم يكن هناك مستخدم مربوط، نطلبه فقط عند لحظة الدفع الفعلية
    if (piBrowser && !currentUser) {
       const user = await authenticateUser(['username', 'payments']);
       if (user) setCurrentUser(user);
       else return;
    }

    if (!piBrowser) {
      setHasProAccess(true);
      setIsUpgradeModalOpen(false);
      return;
    }

    try {
      if (currentUser?.uid) {
        const success = await createVIPPayment(currentUser.uid);
        if (success) {
          setHasProAccess(true);
          setIsUpgradeModalOpen(false);
        }
      }
    } catch (e) {
      alert("Payment failed");
    }
  };

  if (isInitializing) return <div className="min-h-screen bg-white" />;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b p-4 bg-white sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src={logoImage} alt="logo" className="w-9 h-9" />
          <div className="leading-tight">
            <h1 className="font-black text-purple-700 text-lg">Reputa Score</h1>
            <p className="text-[11px] text-gray-500 font-medium">
              <span className="text-purple-400">Welcome,</span> {currentUser?.username || 'Guest'}
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center py-20">
             <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4" />
             <p className="text-[10px] font-bold text-purple-600">LOADING DATA...</p>
          </div>
        ) : !walletData ? (
          <WalletChecker onCheck={handleWalletCheck} />
        ) : (
          <WalletAnalysis
            walletData={walletData}
            isProUser={true} // دائماً true لإظهار البيانات الحقيقية دون عوائق
            onReset={() => setWalletData(null)}
            onUpgradePrompt={() => setIsUpgradeModalOpen(true)}
          />
        )}
      </main>

      {/* منع ظهور المودال في الديمو تماماً */}
      {!isDemoActive && (
        <AccessUpgradeModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
          onUpgrade={handlePayment}
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
