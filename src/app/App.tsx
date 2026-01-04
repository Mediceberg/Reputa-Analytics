import { useState, useEffect, useCallback } from 'react';
import { WalletChecker } from './components/WalletChecker';
import { WalletAnalysis } from './components/WalletAnalysis';
import { AccessUpgradeModal } from './components/AccessUpgradeModal';
import { TrustProvider, useTrust } from './protocol/TrustProvider';
import { fetchWalletData } from './protocol/wallet';
import { createVIPPayment, checkVIPStatus } from './protocol/piPayment';
import { initializePiSDK, authenticateUser, isPiBrowser } from './services/piSdk'; // تأكد من المسار
import logoImage from '../assets/logo.svg';

function ReputaAppContent() {
  const [walletData, setWalletData] = useState<any | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [hasProAccess, setHasProAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const { updateMiningDays, miningDays, trustScore, refreshWallet } = useTrust();
  const piBrowserActive = isPiBrowser();

  // 1. إصلاح الربط: استخدام دالة initializePiSDK التي أنشأتها لضمان التزامن
  useEffect(() => {
    const init = async () => {
      if (piBrowserActive) {
        try {
          await initializePiSDK();
          const user = await authenticateUser(['username', 'payments']);
          if (user) {
            setCurrentUser(user);
            const vip = checkVIPStatus(user.uid);
            setHasProAccess(vip);
          }
        } catch (error) {
          console.error("Auth Flow Failed:", error);
        }
      }
    };
    init();
  }, [piBrowserActive]);

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

  // 2. إصلاح الدفع: ربط مباشر مع createVIPPayment وضمان استجابة السيرفر
  const handleAccessUpgrade = async () => {
    if (!piBrowserActive) {
      alert('Please use Pi Browser');
      return;
    }

    try {
      const userId = currentUser?.uid;
      if (!userId) {
        await authenticateUser(); // إعادة المحاولة إذا فقدنا المستخدم
      }
      
      // استدعاء وظيفة الدفع التي تستخدم السيرفر (Vercel) للـ Approval
      await createVIPPayment(userId);
      
      // تحسين: فحص الحالة فوراً بدلاً من الانتظار الطويل
      setTimeout(() => {
        const vip = checkVIPStatus(userId);
        if (vip) {
          setHasProAccess(true);
          setIsUpgradeModalOpen(false);
        }
      }, 5000);

    } catch (error) {
      alert('Payment Expired or Denied.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-yellow-50 overflow-x-hidden">
      <header className="border-b bg-white/95 backdrop-blur-md sticky top-0 z-[100] shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <img src={logoImage} alt="logo" className="w-10 h-10 flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="font-bold text-lg text-purple-700 truncate">Reputa Score</h1>
                <p className="text-[10px] text-gray-400 font-bold uppercase truncate">
                  {piBrowserActive ? '● Live' : '○ Demo'} • {currentUser?.username || 'Connecting...'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* 3. إصلاح أيقونة الرفع: جعلها واضحة وقابلة للنقر في الجوال */}
              <label className="flex flex-col items-center bg-purple-50 px-3 py-1 rounded-lg border border-purple-200 cursor-pointer hover:bg-purple-100 active:scale-95 transition-all">
                <span className="text-[10px] font-black text-purple-600">BOOST ↑</span>
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
                <div className="px-3 py-1 bg-yellow-400 text-white text-[10px] font-black rounded-full shadow-sm italic uppercase">VIP</div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-blue-600">
            <div className="w-12 h-12 border-4 border-current border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-[10px] font-bold tracking-widest uppercase">Fetching Testnet Data...</p>
          </div>
        ) : !walletData ? (
          <WalletChecker onCheck={handleWalletCheck} />
        ) : (
          <div className="max-w-full">
            <WalletAnalysis
              walletData={walletData}
              isProUser={hasProAccess}
              onReset={() => setWalletData(null)}
              onUpgradePrompt={() => setIsUpgradeModalOpen(true)}
            />
          </div>
        )}
      </main>

      <footer className="border-t bg-white/50 py-6 text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
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
