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
  const [hasProAccess, setHasProAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const { updateMiningDays, miningDays, trustScore, refreshWallet } = useTrust();
  const piBrowserActive = isPiBrowser();

  // 1. وظيفة الربط الموحدة: تستدعى فقط عند الحاجة لمنع التكرار
  const syncUser = useCallback(async (forceAuth = false) => {
    if (!piBrowserActive) return null;
    
    try {
      await initializePiSDK();
      
      // إذا كان المستخدم موجوداً ولا نطلب "ربط إجباري"، نكتفي بالبيانات الحالية
      if (currentUser && !forceAuth) return currentUser;

      const user = await authenticateUser(['username', 'payments']);
      if (user) {
        setCurrentUser(user);
        const vip = checkVIPStatus(user.uid);
        setHasProAccess(vip);
        return user;
      }
    } catch (error) {
      console.error("Auth Error:", error);
    }
    return null;
  }, [piBrowserActive, currentUser]);

  // تشغيل الربط مرة واحدة فقط عند فتح التطبيق (المرة الأولى)
  useEffect(() => {
    syncUser();
  }, []); // مصفوفة فارغة لضمان التشغيل مرة واحدة فقط

  const handleWalletCheck = async (address: string) => {
    if (!address) return;
    setIsLoading(true);
    try {
      const data = await fetchWalletData(address);
      await refreshWallet(address);
      
      const enhancedScore = trustScore > 0 
        ? Math.min(1000, (data.totalTransactions || 0) * 10 + (miningDays / 10))
        : 650;

      setWalletData({
        ...data,
        reputaScore: enhancedScore,
        trustScore: enhancedScore / 10,
        consistencyScore: miningDays > 0 ? Math.min(100, miningDays / 10) : 75,
        networkTrust: Math.min(100, data.totalTransactions || 0),
        trustLevel: enhancedScore >= 800 ? 'Elite' : enhancedScore >= 600 ? 'High' : 'Medium'
      });
    } catch (error) {
      alert('Blockchain Sync Error.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. معالج الدفع المحسن: يربط العمليات ببعضها دون تكرار النوافذ
  const handleAccessUpgrade = async () => {
    if (!piBrowserActive) {
      alert('Please use Pi Browser');
      return;
    }

    try {
      // استخدام الهوية الموجودة فعلياً لمنع طلب الربط للمرة الثانية أو الثالثة
      let user = currentUser;
      if (!user) {
        user = await syncUser(true);
      }

      if (!user?.uid) {
        alert("Authentication failed. Please restart the app.");
        return;
      }

      // استدعاء الدفع
      await createVIPPayment(user.uid);
      
      // مراقبة النجاح
      const checkInterval = setInterval(() => {
        const vip = checkVIPStatus(user.uid);
        if (vip) {
          setHasProAccess(true);
          setIsUpgradeModalOpen(false);
          clearInterval(checkInterval);
        }
      }, 3000);
      
      setTimeout(() => clearInterval(checkInterval), 60000);

    } catch (error) {
      // في حال ظهرت رسالة "المطور لم يوافق"، السبب يكون في مسار /api/approve بالسيرفر
      console.error("Payment failed:", error);
      alert('Payment process interrupted. Check your Pi Wallet.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-yellow-50 overflow-x-hidden flex flex-col">
      <header className="border-b bg-white/95 backdrop-blur-md sticky top-0 z-[100] shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <img src={logoImage} alt="logo" className="w-9 h-9 flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="font-bold text-base text-purple-700 truncate">Reputa Score</h1>
                <p className="text-[9px] text-gray-400 font-bold uppercase truncate">
                  {piBrowserActive ? '● Live' : '○ Demo'} • {currentUser?.username || 'Guest'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <label className="flex flex-col items-center bg-purple-600 px-3 py-1 rounded-md cursor-pointer active:scale-95 transition-all">
                <span className="text-[9px] font-black text-white">BOOST ↑</span>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) updateMiningDays(file);
                }} />
              </label>
              {hasProAccess && <div className="px-2 py-1 bg-yellow-400 text-white text-[8px] font-black rounded-full italic">VIP</div>}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 flex-1 w-full max-w-full">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-purple-600">
            <div className="w-10 h-10 border-4 border-current border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-[9px] font-bold uppercase tracking-widest">Syncing...</p>
          </div>
        ) : !walletData ? (
          <WalletChecker onCheck={handleWalletCheck} />
        ) : (
          <WalletAnalysis
            walletData={walletData}
            isProUser={hasProAccess}
            onReset={() => setWalletData(null)}
            onUpgradePrompt={() => setIsUpgradeModalOpen(true)}
          />
        )}
      </main>

      <footer className="border-t bg-white/50 py-4 text-center text-[9px] text-gray-400 font-bold uppercase tracking-widest">
        © 2026 Reputa Analytics • Protocol v2.0
      </footer>

      <AccessUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onUpgrade={handleAccessUpgrade}
      />
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
