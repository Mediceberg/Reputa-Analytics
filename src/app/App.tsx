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
  
  // ✅ تحديد البيئة فوراً عند التحميل
  const piBrowserActive = isPiBrowser();
  
  // ✅ في وضع Demo، نفترض وجود مستخدم وهمي وصلاحيات VIP كاملة منذ البداية
  const [currentUser, setCurrentUser] = useState<any>(!piBrowserActive ? { username: "Explorer_User", uid: "demo-uid" } : null);
  const [hasProAccess, setHasProAccess] = useState(!piBrowserActive);

  const { updateMiningDays, miningDays, trustScore, refreshWallet } = useTrust();

  useEffect(() => {
    let isMounted = true;
    const initApp = async () => {
      if (piBrowserActive) {
        try {
          await initializePiSDK();
          const user = await authenticateUser(['username', 'payments']);
          if (user && isMounted) {
            setCurrentUser(user);
            setHasProAccess(checkVIPStatus(user.uid));
          }
        } catch (e) {
          console.error("Auth error:", e);
        }
      }
    };
    initApp();
    return () => { isMounted = false; };
  }, [piBrowserActive]);

  const handleWalletCheck = async (address: string) => {
    if (!address) return;
    setIsLoading(true);
    try {
      const data = await fetchWalletData(address);
      await refreshWallet(address);
      
      // ✅ تخصيص بيانات "فخمة" لوضع الـ Demo لإظهار جمالية التقارير
      const score = !piBrowserActive ? 942 : 720; 

      setWalletData({
        ...data,
        reputaScore: score,
        trustScore: score / 10,
        consistencyScore: !piBrowserActive ? 99 : 75,
        networkTrust: !piBrowserActive ? 95 : 60,
        trustLevel: score >= 800 ? 'Elite' : 'High'
      });
    } catch (error) {
      alert('Sync Error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccessUpgrade = async () => {
    // في وضع اللايف، يتم تفعيل الدفع
    if (piBrowserActive && currentUser?.uid) {
      try {
        await createVIPPayment(currentUser.uid);
      } catch (e) {
        alert("Payment process failed.");
      }
    } else {
      // في وضع الديمو، نغلق النافذة فقط لأن الصلاحية موجودة مسبقاً
      setIsUpgradeModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden flex flex-col">
      <header className="border-b bg-white/95 backdrop-blur-md sticky top-0 z-[100] shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoImage} alt="logo" className="w-9 h-9" />
            <div className="min-w-0">
              <h1 className="font-bold text-base text-purple-700 truncate leading-tight">Reputa Score</h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase truncate">
                {!piBrowserActive ? '○ VIP DEMO ACTIVE' : '● PI NETWORK LIVE'} • {currentUser?.username || 'Syncing...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* ✅ أيقونة VIP تظهر الآن فوراً في وضع الديمو */}
            {hasProAccess && (
              <div className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-[9px] font-black rounded-full italic shadow-lg animate-pulse">
                VIP UNLOCKED
              </div>
            )}
            <label className="bg-purple-600 px-3 py-1 rounded-md cursor-pointer active:scale-95 transition-all shadow-md">
              <span className="text-[9px] font-black text-white uppercase tracking-tighter">Boost ↑</span>
              <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) updateMiningDays(file);
              }} />
            </label>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-purple-600">
            <div className="w-12 h-12 border-4 border-current border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-[10px] font-bold uppercase tracking-widest italic">Generating VIP Analytics...</p>
          </div>
        ) : !walletData ? (
          <WalletChecker onCheck={handleWalletCheck} />
        ) : (
          <div className="w-full">
            {/* ✅ تمرير hasProAccess التي تكون true دائماً في الديمو لفتح التقرير فوراً */}
            <WalletAnalysis
              walletData={walletData}
              isProUser={hasProAccess} 
              onReset={() => setWalletData(null)}
              onUpgradePrompt={() => setIsUpgradeModalOpen(true)}
            />
          </div>
        )}
      </main>

      <footer className="border-t bg-gray-50 py-4 text-center text-[9px] text-gray-400 font-bold uppercase tracking-[0.3em]">
        Reputa Analytics • VIP Preview Mode
      </footer>

      {/* المودال سيظهر فقط إذا لم يكن المستخدم VIP (وهذا لن يحدث في الديمو) */}
      {!hasProAccess && (
        <AccessUpgradeModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
          onUpgrade={handleAccessUpgrade}
        />
      )}
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

