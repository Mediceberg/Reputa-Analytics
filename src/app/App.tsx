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
  // نجعلها true افتراضياً لضمان فتح الميزات للجميع (ديمو دائم)
  const [hasProAccess, setHasProAccess] = useState(true); 
  const [isInitializing, setIsInitializing] = useState(true);

  const piBrowser = isPiBrowser();
  const { refreshWallet } = useTrust();

  useEffect(() => {
    const initApp = async () => {
      if (!piBrowser) {
        setCurrentUser({ username: "Explorer_Guest", uid: "demo" });
        setIsInitializing(false);
        return;
      }
      try {
        await initializePiSDK();
        const user = await authenticateUser(['username']).catch(() => null);
        if (user) {
          setCurrentUser(user);
          // حتى لو لم يكن VIP، سنتركه يستمتع بميزات الديمو المجانية
          const isVIP = await checkVIPStatus(user.uid);
          if (isVIP) setHasProAccess(true);
        }
      } catch (e) {
        console.log("SDK Bypass");
      } finally {
        setIsInitializing(false);
      }
    };
    initApp();
  }, [piBrowser]);

  const handleWalletCheck = async (address: string) => {
    if (!address) return;
    setIsLoading(true);
    try {
      // ✅ جلب البيانات الحقيقية من البروتوكول
      const data = await fetchWalletData(address);
      if (data) {
        await refreshWallet(address);
        // تحديث البيانات الحقيقية في الحالة
        setWalletData({
          ...data,
          reputaScore: data.balance > 0 ? 314 : 100, // قيمة رمزية تعبر عن البروتوكول
          trustLevel: 'Verified'
        });
      }
    } catch (error) {
      alert("Blockchain Error: Connection failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualLink = async () => {
    if (!piBrowser) return;
    try {
      const user = await authenticateUser(['username', 'payments']);
      if (user) setCurrentUser(user);
    } catch (e) {
      alert("Auth Cancelled");
    }
  };

  if (isInitializing && piBrowser) return <div className="min-h-screen bg-white" />;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b p-4 bg-white flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <img src={logoImage} alt="logo" className="w-8 h-8" />
          <div>
            <h1 className="font-bold text-purple-700">Reputa Score</h1>
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">
              Welcome, {currentUser?.username || 'Guest'}
            </p>
          </div>
        </div>

        {/* زر الربط الأنيق والمتوسط */}
        {piBrowser && !currentUser?.uid && (
          <button onClick={handleManualLink} className="text-[10px] bg-purple-50 text-purple-600 px-3 py-1.5 rounded-full border border-purple-100 font-bold">
            Link Account
          </button>
        )}
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center py-20 animate-pulse text-purple-600 font-black text-[10px]">
            SYNCING WITH BLOCKCHAIN...
          </div>
        ) : !walletData ? (
          <div className="max-w-md mx-auto">
            <WalletChecker onCheck={handleWalletCheck} />
          </div>
        ) : (
          <WalletAnalysis
            walletData={walletData}
            // ✅ الفرض البرمجي: نرسل true دائماً لقتل أي عائق دفع في جميع المكونات
            isProUser={true} 
            onReset={() => setWalletData(null)}
            onUpgradePrompt={() => setIsUpgradeModalOpen(true)}
          />
        )}
      </main>

      <footer className="p-4 text-center text-[9px] text-gray-300 border-t font-black uppercase tracking-[0.3em]">
        Protocol Active - Demo Unlocked
      </footer>

      {/* المودال يبقى موجوداً لكنه لا يعيق المستخدم عن رؤية الميزات */}
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
