import { useState, useEffect } from 'react';
import { WalletChecker } from './components/WalletChecker';
import { WalletAnalysis } from './components/WalletAnalysis';
import { AccessUpgradeModal } from './components/AccessUpgradeModal';
import { ReputaDashboard } from './components/ReputaDashboard';
import { fetchWalletData, initializePi, createVIPPayment } from './protocol'; 
import { isVIPUser } from './services/piPayments'; 
import { getCurrentUser } from './services/piSdk';
import logoImage from '../assets/logo.svg';

// --- البروتوكول الجديد ---
import { TrustProvider, useTrust } from './protocol/TrustProvider'; 

function ReputaAppContent() {
  const [walletData, setWalletData] = useState<any | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [hasProAccess, setHasProAccess] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [currentWalletAddress, setCurrentWalletAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState<string>('Guest');

  const { updateMiningDays, miningDays, trustScore } = useTrust();
  const isPiBrowser = typeof (window as any).Pi !== 'undefined';

  // 1. إصلاح ربط الحساب والمصادقة (Authentication Fix)
  useEffect(() => {
    const startAuth = async () => {
      if (isPiBrowser) {
        try {
          // تهيئة الـ SDK قبل أي عملية أخرى
          await initializePi();
          // طلب المصادقة فوراً لحل مشكلة "Please authenticate first"
          const user = await (window as any).Pi.authenticate(['username', 'payments'], 
            (payment: any) => console.log("Payment ongoing", payment)
          );
          
          if (user) {
            setUserName(user.user.username);
            const vip = await isVIPUser(user.user.uid);
            setHasProAccess(!!vip);
          }
        } catch (error) {
          console.error("Auth Error:", error);
        }
      }
    };
    startAuth();
  }, [isPiBrowser]);

  const handleWalletCheck = async (address: string) => {
    if (!address) return;
    setIsLoading(true);
    try {
      let realData;
      if (isPiBrowser) {
        realData = await fetchWalletData(address);
      } else {
        realData = { balance: 100, scores: { totalScore: 650, miningScore: 75 }, trustLevel: 'Medium' };
      }

      setWalletData({
        ...realData,
        // معالجة الأرقام الطويلة لتجنب كسر التصميم
        reputaScore: trustScore > 0 ? trustScore * 10 : (realData as any).scores?.totalScore || 500,
        consistencyScore: miningDays > 0 ? miningDays : (realData as any).scores?.miningScore || 70,
      });
      setCurrentWalletAddress(address);
    } catch (error) {
      alert("Blockchain Error: Make sure the address is correct.");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. إصلاح زر الدفع (Payment Fix)
  const handleAccessUpgrade = async () => {
    if (isPiBrowser) {
      try {
        const paymentSuccess = await createVIPPayment();
        if (paymentSuccess) {
          setHasProAccess(true);
          setIsUpgradeModalOpen(false);
          alert("Payment Successful! VIP Unlocked.");
        }
      } catch (err) {
        alert("Payment Failed. Please ensure you have enough Pi.");
      }
    } else {
      setHasProAccess(true);
      setIsUpgradeModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-yellow-50 overflow-x-hidden">
      <header className="border-b bg-white/90 backdrop-blur-md sticky top-0 z-[100] shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <img src={logoImage} alt="logo" className="w-9 h-9 flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="font-bold text-lg text-purple-700 truncate">Reputa Score</h1>
                <p className="text-[10px] text-gray-500 font-bold truncate">@{userName}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* إصلاح أيقونة الرفع (Upload Icon Fix) */}
              <label className="flex flex-col items-center justify-center p-2 bg-purple-100 rounded-lg cursor-pointer hover:bg-purple-200 transition-all border border-purple-200">
                <span className="text-[10px] font-black text-purple-700">BOOST ↑</span>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={(e) => e.target.files?.[0] && updateMiningDays(e.target.files[0])} 
                />
              </label>

              {hasProAccess && (
                <div className="px-3 py-1 bg-yellow-400 text-white text-[10px] font-black rounded-full shadow-sm italic">PRO</div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Processing...</p>
          </div>
        ) : !walletData ? (
          <WalletChecker onCheck={handleWalletCheck} />
        ) : (
          <div className="max-w-full overflow-hidden">
            <WalletAnalysis
              walletData={walletData}
              isProUser={hasProAccess}
              onReset={() => setWalletData(null)}
              onUpgradePrompt={() => setIsUpgradeModalOpen(true)}
            />
          </div>
        )}
      </main>

      <AccessUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onUpgrade={handleAccessUpgrade}
      />

      {showDashboard && currentWalletAddress && (
        <ReputaDashboard walletAddress={currentWalletAddress} onClose={() => setShowDashboard(false)} />
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

