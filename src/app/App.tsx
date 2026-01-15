import { useState, useEffect } from 'react'; 
import { Analytics } from '@vercel/analytics/react';
import { WalletChecker } from './components/WalletChecker';
import { WalletAnalysis } from './components/WalletAnalysis';
import { AccessUpgradeModal } from './components/AccessUpgradeModal';
import { TrustProvider, useTrust } from './protocol/TrustProvider';
import { fetchWalletData } from './protocol/wallet';
import { checkVIPStatus, createVIPPayment } from './protocol/piPayment';
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

  // ✅ 1. تسجيل الدخول لمرة واحدة فقط عند بداية تشغيل التطبيق
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
        } catch (e) { console.error("Pi Auth Failed", e); }
      } else {
        // وضع الديمو للمتصفح العادي
        setCurrentUser({ username: "Demo_User", uid: "demo_123" });
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
      setWalletData({ ...data, reputaScore: 850, trustLevel: 'Elite' });
    } catch (error) {
      alert('Sync Error');
    } finally { setIsLoading(false); }
  };

  const handleAccessUpgrade = async () => {
    if (!piBrowserActive) { setHasProAccess(true); setIsUpgradeModalOpen(false); return; }
    try {
      if (currentUser?.uid) {
        const success = await createVIPPayment(currentUser.uid);
        if (success) { setHasProAccess(true); setIsUpgradeModalOpen(false); }
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
              {/* عرض اسم المستخدم المسجل لمرة واحدة فقط هنا */}
              <p className="text-[10px] text-gray-500 font-mono">
                {currentUser ? `👤 ${currentUser.username}` : 'Connecting...'}
              </p>
            </div>
          </div>
          
          {/* ✅ تم إزالة جميع الأزرار من هنا (الـ Header) لمنع التكرار مع المكونات الأصلية */}
          <div className="flex gap-2">
             {hasProAccess && (
               <span className="text-[10px] font-bold text-yellow-500">VIP ACTIVE</span>
             )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        {!walletData ? (
          <WalletChecker 
            onCheck={handleWalletCheck} 
            // نمرر المستخدم الحالي للمكون الداخلي لكي لا يطلب التسجيل مرة ثانية
            currentUser={currentUser} 
          />
        ) : (
          <WalletAnalysis
            walletData={walletData}
            isProUser={hasProAccess} 
            onReset={() => setWalletData(null)}
            // نستخدم المودال الموجود في App.tsx عند ضغط زر VIP الداخلي
            onUpgradePrompt={() => setIsUpgradeModalOpen(true)}
          />
        )}
      </main>

      <footer className="p-3 text-center text-[9px] text-gray-400 border-t bg-gray-50">
        LOGGED IN AS: {currentUser?.username || 'GUEST'}
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
