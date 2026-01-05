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

  // ✅ تعديل الجزء المطلوب: دالة التزامن الموحدة لمنع التضارب
  const syncUser = useCallback(async () => {
    if (!piBrowserActive) return null;
    
    try {
      await initializePiSDK();
      // طلب المصادقة مرة واحدة فقط بصلاحيات كاملة
      const user = await authenticateUser(['username', 'payments']);
      
      if (user) {
        setCurrentUser(user);
        // التحقق من حالة الـ VIP فوراً عند تسجيل الدخول
        const vip = checkVIPStatus(user.uid);
        setHasProAccess(vip);
        return user;
      }
    } catch (error) {
      console.error("Auth Synchronization Failed:", error);
    }
    return null;
  }, [piBrowserActive]);

  // تشغيل التزامن لمرة واحدة عند الفتح
  useEffect(() => {
    syncUser();
  }, [syncUser]);

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
      alert('Blockchain Sync Error. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccessUpgrade = async () => {
    if (!piBrowserActive) {
      alert('Please use Pi Browser');
      return;
    }
    try {
      // استخدام المستخدم الحالي أو إعادة المزامنة سريعاً
      const user = currentUser || await syncUser();
      const userId = user?.uid;
      
      if (!userId) {
        alert("Authentication required. Please refresh.");
        return;
      }

      await createVIPPayment(userId);
      
      // فحص الحالة بعد وقت قصير من محاولة الدفع
      setTimeout(() => {
        const vip = checkVIPStatus(userId);
        if (vip) {
          setHasProAccess(true);
          setIsUpgradeModalOpen(false);
        }
      }, 5000);
    } catch (error) {
      console.error("Payment Error:", error);
      alert('Payment initialization failed. Please try again.');
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
                <h1 className="font-bold text-base text-purple-700 truncate leading-tight">Reputa Score</h1>
                <p className="text-[9px] text-gray-400 font-bold uppercase truncate">
                  {piBrowserActive ? '● Live' : '○ Demo'} • {currentUser?.username || 'Connecting...'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <label className="flex flex-col items-center bg-purple-600 px-3 py-1 rounded-md cursor-pointer hover:bg-purple-700 active:scale-95 transition-all shadow-sm">
                <span className="text-[9px] font-black text-white uppercase">Boost ↑</span>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) updateMiningDays(file);
                  }}
                />
              </label>

              {hasProAccess && (
                <div className="px-2 py-1 bg-yellow-400 text-white text-[8px] font-black rounded-full shadow-sm italic uppercase">VIP</div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 flex-1 w-full max-w-full break-all">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-purple-600">
            <div className="w-10 h-10 border-4 border-current border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-[9px] font-bold tracking-widest uppercase">Syncing Blockchain...</p>
          </div>
        ) : !walletData ? (
          <WalletChecker onCheck={handleWalletCheck} />
        ) : (
          <div className="w-full overflow-hidden">
            <WalletAnalysis
              walletData={walletData}
              isProUser={hasProAccess}
              onReset={() => setWalletData(null)}
              onUpgradePrompt={() => setIsUpgradeModalOpen(true)}
            />
          </div>
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
