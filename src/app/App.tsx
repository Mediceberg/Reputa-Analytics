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
  const [isInitializing, setIsInitializing] = useState(true);

  const piBrowser = isPiBrowser();
  const { refreshWallet } = useTrust();

  // 1. تهيئة النظام: دخول صامت وسريع
  useEffect(() => {
    const initApp = async () => {
      if (!piBrowser) {
        setCurrentUser({ username: "Guest_Explorer", uid: "demo" });
        setIsInitializing(false);
        return;
      }
      try {
        await initializePiSDK();
        // محاولة التعرف على المستخدم المسجل مسبقاً دون إزعاج
        const user = await authenticateUser(['username']).catch(() => null);
        if (user) setCurrentUser(user);
      } catch (e) {
        console.warn("SDK Initialized in fallback mode");
      } finally {
        setIsInitializing(false);
      }
    };
    initApp();
  }, [piBrowser]);

  // 2. معالجة المحفظة: منع التعليق عبر التحديث الفوري
  const handleWalletCheck = async (address: string) => {
    if (!address) return;
    setIsLoading(true);
    try {
      // جلب البيانات الحقيقية من البلوكشين
      const data = await fetchWalletData(address);
      if (data) {
        // تحديث الواجهة فوراً بالبيانات الحقيقية
        setWalletData({
          ...data,
          reputaScore: 314, // سكور البروتوكول الافتراضي
          trustLevel: 'Elite'
        });
        // تحديث البروتوكول يتم في الخلفية لكي لا يعلق التحميل
        setTimeout(() => refreshWallet(address).catch(() => null), 100);
      }
    } catch (error) {
      alert("Blockchain Error: Address not found");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. أيقونة الربط: تصميم جذاب ومتوسط
  const handleManualLink = async () => {
    if (!piBrowser) return;
    try {
      const user = await authenticateUser(['username', 'payments']);
      if (user) setCurrentUser(user);
    } catch (e) {
      alert("Sign-in cancelled");
    }
  };

  if (isInitializing && piBrowser) {
    return <div className="min-h-screen bg-white flex items-center justify-center text-purple-600 font-bold uppercase tracking-widest animate-pulse">Initializing...</div>;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b p-4 bg-white/90 backdrop-blur-md sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <img src={logoImage} alt="logo" className="w-8 h-8" />
          <div className="leading-tight">
            <h1 className="font-black text-purple-700 text-lg tracking-tighter uppercase">Reputa</h1>
            <p className="text-[10px] text-gray-400 font-bold">
              <span className="text-purple-400">Welcome,</span> {currentUser?.username || 'Guest'}
            </p>
          </div>
        </div>

        {/* أيقونة الربط: متوسطة الحجم وواضحة جداً */}
        <div className="flex items-center gap-3">
          {piBrowser && !currentUser?.uid && (
            <button 
              onClick={handleManualLink}
              className="p-2 bg-purple-50 text-purple-600 rounded-lg border border-purple-100 hover:bg-purple-100 transition-all flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span className="text-[10px] font-black uppercase tracking-wider">Link Account</span>
            </button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center py-20">
            <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] mt-4 font-black text-purple-600 tracking-[0.2em]">SYNCING PROTOCOL...</p>
          </div>
        ) : !walletData ? (
          <div className="max-w-md mx-auto py-10">
            <WalletChecker onCheck={handleWalletCheck} />
          </div>
        ) : (
          <WalletAnalysis
            walletData={walletData}
            // ✅ الفرض البرمجي النهائي: فتح كل الميزات بدون استثناء
            isProUser={true} 
            onReset={() => setWalletData(null)}
            onUpgradePrompt={() => setIsUpgradeModalOpen(true)}
          />
        )}
      </main>

      <footer className="p-4 text-center text-[9px] text-gray-300 border-t bg-gray-50/50 font-black tracking-[0.3em] uppercase">
        Standalone Explorer v3.2
      </footer>

      <AccessUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onUpgrade={() => {}}
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
