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
  const { refreshWallet, updateMiningDays } = useTrust();

  // 1. تهيئة الـ SDK بصمت تام عند التشغيل
  useEffect(() => {
    const initApp = async () => {
      if (!piBrowser) {
        // وضع الديمو (خارج متصفح باي)
        setCurrentUser({ username: "Explorer", uid: "demo_mode" });
        setHasProAccess(true);
        setIsDemoActive(true);
        setIsInitializing(false);
      } else {
        // داخل متصفح باي: نشغل الـ SDK فقط دون طلب تسجيل دخول (Auth)
        try {
          await initializePiSDK();
          // نفحص إذا كان المستخدم مسجلاً مسبقاً (صمت)
          const user = await authenticateUser(['username']).catch(() => null);
          if (user) {
            setCurrentUser(user);
            setHasProAccess(checkVIPStatus(user.uid));
          }
        } catch (e) {
          console.log("Silent init");
        } finally {
          setIsInitializing(false);
        }
      }
    };
    initApp();
  }, [piBrowser]);

  // 2. معالجة إدخال المحفظة - بيانات حقيقية 100%
  const handleWalletCheck = async (address: string) => {
    if (!address) return;
    setIsLoading(true);
    try {
      // جلب البيانات الفعلية من البلوكشين
      const data = await fetchWalletData(address);
      await refreshWallet(address);

      setWalletData({
        ...data,
        // حساب السكور بناءً على البيانات الحقيقية المستلمة
        reputaScore: data.balance > 0 ? Math.min(950, 550 + (data.balance * 3)) : 450,
        trustLevel: data.balance > 100 ? 'Elite' : 'Verified'
      });
    } catch (error) {
      alert('Error fetching blockchain data. Please check the address.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. منطق الدفع - يطلب الربط فقط عند الضغط على الزر
  const handlePayment = async () => {
    if (!piBrowser) {
      setHasProAccess(true);
      setIsUpgradeModalOpen(false);
      return;
    }

    try {
      // إذا لم يكن الحساب مربوطاً، نربطه الآن فقط
      let user = currentUser;
      if (!user) {
        user = await authenticateUser(['username', 'payments']);
        setCurrentUser(user);
      }

      if (user?.uid) {
        const success = await createVIPPayment(user.uid);
        if (success) {
          setHasProAccess(true);
          setIsUpgradeModalOpen(false);
        }
      }
    } catch (e) {
      alert("Action required: Please sign in to complete payment.");
    }
  };

  if (isInitializing) return <div className="min-h-screen bg-white" />;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b p-4 bg-white sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <img src={logoImage} alt="logo" className="w-9 h-9" />
          <div className="leading-tight">
            <h1 className="font-extrabold text-purple-700 text-lg tracking-tight">Reputa Score</h1>
            <p className="text-[11px] text-gray-400 font-bold">
              <span className="text-purple-300">Welcome,</span> {currentUser?.username || 'Explorer'}
            </p>
          </div>
        </div>
        
        {/* إخفاء أيقونات VIP تماماً في وضع الديمو ليكون Explorer نظيف */}
        <div className="flex gap-2">
           {hasProAccess && !isDemoActive && (
             <span className="bg-yellow-400 text-white text-[8px] px-2 py-0.5 rounded-full font-black animate-pulse">PRO</span>
           )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[10px] font-black text-purple-700 tracking-[0.2em] uppercase">Syncing Blockchain...</p>
          </div>
        ) : !walletData ? (
          <WalletChecker onCheck={handleWalletCheck} />
        ) : (
          <WalletAnalysis
            walletData={walletData}
            isProUser={true} // مفتوح دائماً لعرض البيانات الحقيقية
            onReset={() => setWalletData(null)}
            onUpgradePrompt={() => setIsUpgradeModalOpen(true)}
          />
        )}
      </main>

      <footer className="p-4 text-center text-[9px] text-gray-300 border-t font-bold uppercase tracking-widest bg-gray-50/30">
        {isDemoActive ? 'Public Explorer Mode' : 'Pi Network Protocol'}
      </footer>

      {/* المودال يظهر في اللايف فقط لمن يريد الترقية الحقيقية */}
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
