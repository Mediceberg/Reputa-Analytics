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
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [hasProAccess, setHasProAccess] = useState(false);

  const { updateMiningDays, miningDays, trustScore, refreshWallet } = useTrust();
  const piBrowserActive = isPiBrowser();

  // 1. منطق العزل الاحترافي
  useEffect(() => {
    if (!piBrowserActive) {
      // ✅ وضع الديمو المعزول تماماً
      setCurrentUser({ username: "Demo_Explorer", uid: "demo-mode" });
      setHasProAccess(true); // تفعيل الـ VIP إجبارياً في الديمو
    } else {
      // ✅ وضع الـ Live (داخل متصفح باي فقط)
      const initPi = async () => {
        try {
          await initializePiSDK();
          const user = await authenticateUser(['username', 'payments']);
          if (user) {
            setCurrentUser(user);
            setHasProAccess(checkVIPStatus(user.uid));
          }
        } catch (e) {
          console.error("Pi Auth Failed", e);
        }
      };
      initPi();
    }
  }, [piBrowserActive]);

  const handleWalletCheck = async (address: string) => {
    if (!address) return;
    setIsLoading(true);
    try {
      const data = await fetchWalletData(address);
      await refreshWallet(address);
      
      // في الديمو نعطي نتائج مبهرة دائماً، في اللايف نعتمد الحساب الحقيقي
      const finalScore = !piBrowserActive ? 885 : (trustScore > 0 ? Math.min(1000, (data.totalTransactions || 0) * 10 + (miningDays / 10)) : 650);

      setWalletData({
        ...data,
        reputaScore: finalScore,
        trustScore: finalScore / 10,
        consistencyScore: !piBrowserActive ? 98 : (miningDays > 0 ? Math.min(100, miningDays / 10) : 75),
        networkTrust: !piBrowserActive ? 92 : Math.min(100, data.totalTransactions || 0),
        trustLevel: finalScore >= 800 ? 'Elite' : 'High'
      });
    } catch (error) {
      alert('Sync Error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccessUpgrade = async () => {
    // هذا الزر لا يظهر أصلاً في الديمو، ولكن كحماية:
    if (!piBrowserActive) return;

    try {
      if (currentUser?.uid) {
        await createVIPPayment(currentUser.uid);
        // فحص التفعيل بعد الدفع
        setTimeout(() => setHasProAccess(checkVIPStatus(currentUser.uid)), 5000);
      }
    } catch (e) {
      alert('Payment failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white overflow-x-hidden flex flex-col">
      <header className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-[100] shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoImage} alt="logo" className="w-9 h-9" />
            <div>
              <h1 className="font-extrabold text-purple-700 text-lg leading-none">Reputa</h1>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                {piBrowserActive ? '● Pi Mainnet' : '○ Preview Mode'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* في الديمو تظهر أيقونة VIP ثابتة، في اللايف تظهر فقط إذا دفع */}
            {hasProAccess && (
              <div className="bg-yellow-400 text-white text-[9px] font-black px-2 py-1 rounded-full shadow-inner animate-pulse">
                VIP MEMBER
              </div>
            )}
            
            {/* زر الـ Boost متاح للجميع */}
            <label className="bg-purple-600 p-2 rounded-lg cursor-pointer hover:bg-purple-700 transition-colors">
              <span className="text-white text-[10px] font-bold">BOOST</span>
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
          <div className="flex flex-col items-center justify-center py-20 text-purple-600 italic">
            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-xs font-bold uppercase tracking-widest">Analyzing VIP Data...</p>
          </div>
        ) : !walletData ? (
          <WalletChecker onCheck={handleWalletCheck} />
        ) : (
          <WalletAnalysis
            walletData={walletData}
            isProUser={hasProAccess} // ستكون True دائماً في الديمو
            onReset={() => setWalletData(null)}
            onUpgradePrompt={() => setIsUpgradeModalOpen(true)}
          />
        )}
      </main>

      <footer className="py-6 text-center border-t bg-gray-50">
        <p className="text-[9px] font-bold text-gray-400 tracking-[0.2em] uppercase">
          {piBrowserActive ? 'Reputa Secure Protocol v2.0' : 'Reputa Interactive Demo - v2.0'}
        </p>
      </footer>

      {/* المودال يظهر فقط إذا لم يكن المستخدم VIP (يعني في وضع اللايف فقط) */}
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
