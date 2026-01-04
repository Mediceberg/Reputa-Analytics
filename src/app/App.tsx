import { useState, useEffect } from 'react';
import { WalletChecker } from './components/WalletChecker';
import { WalletAnalysis } from './components/WalletAnalysis';
import { AccessUpgradeModal } from './components/AccessUpgradeModal';
import { ReputaDashboard } from './components/ReputaDashboard';
import { fetchWalletData, initializePi, createVIPPayment } from './protocol'; 
import { isVIPUser } from './services/piPayments'; 
import { getCurrentUser } from './services/piSdk';
import logoImage from '../assets/logo.svg';

// --- إضافات البروتوكول الجديد ---
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

  useEffect(() => {
    const setup = async () => {
      if (isPiBrowser) {
        try {
          // تعديل: التأكد من نجاح التهيئة قبل طلب المستخدم
          await initializePi();
          const user = await getCurrentUser();
          if (user) {
            setUserName(user.username);
            // جلب حالة الـ VIP الحقيقية
            const vipStatus = await isVIPUser(user.uid);
            setHasProAccess(!!vipStatus);
          }
        } catch (error) {
          console.error("SDK Init Error:", error);
        }
      } else {
        setUserName("Demo User");
      }
    };
    setup();
  }, [isPiBrowser]);

  const handleWalletCheck = async (address: string) => {
    if (!address) return;
    setIsLoading(true);
    try {
      let realData;
      if (isPiBrowser) {
        // جلب البيانات من Testnet
        realData = await fetchWalletData(address);
      } else {
        realData = {
          balance: 100,
          scores: { totalScore: 650, miningScore: 75 },
          trustLevel: 'Medium',
          riskLevel: 'Low'
        };
      }

      const mappedData = {
        ...realData,
        reputaScore: trustScore > 0 ? trustScore * 10 : (realData as any).scores?.totalScore || 500,
        trustLevel: (realData as any).trustLevel || 'Medium',
        consistencyScore: miningDays > 0 ? miningDays : (realData as any).scores?.miningScore || 70,
        networkTrust: 85,
        riskLevel: (realData as any).riskLevel || 'Low'
      };
      setWalletData(mappedData);
      setCurrentWalletAddress(address);
    } catch (error) {
      // إظهار تنبيه واضح للخطأ التقني
      alert("Blockchain Sync Error: Check your connection or Wallet Address.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setWalletData(null);
    setShowDashboard(false);
  };

  const handleUpgradePrompt = () => setIsUpgradeModalOpen(true);

  // تعديل: تفعيل زر الدفع الحقيقي لشبكة باي
  const handleAccessUpgrade = async () => {
    if (isPiBrowser) {
      try {
        const payment = await createVIPPayment();
        if (payment) {
          setHasProAccess(true);
          setIsUpgradeModalOpen(false);
          if (currentWalletAddress) handleWalletCheck(currentWalletAddress);
        }
      } catch (err) {
        alert("Payment was not completed.");
      }
    } else {
      setHasProAccess(true);
      setIsUpgradeModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-yellow-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center">
                <img src={logoImage} alt="Reputa Analytics" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="font-bold text-xl bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                  Reputa Score
                </h1>
                <p className="text-[10px] text-gray-400">Welcome, {userName}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden md:block text-right mr-4 border-l pl-4 border-purple-100">
                <label className="group flex flex-col cursor-pointer">
                  <span className="text-[10px] font-black text-purple-600 group-hover:text-blue-600 transition-colors">
                    BOOST SCORE (IMAGE) ↑
                  </span>
                  <span className="text-[8px] text-gray-400">Upload mining stats to verify seniority</span>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        updateMiningDays(e.target.files[0]);
                      }
                    }}
                  />
                </label>
                {miningDays > 0 && <span className="text-[9px] text-green-600 font-bold">✓ Seniority Verified!</span>}
              </div>

              {hasProAccess && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-md">
                  <span className="text-[10px] font-bold text-white">VIP Pro</span>
                </div>
              )}
              {walletData && (
                 <button onClick={() => setShowDashboard(true)} className="text-sm font-bold text-blue-600">
                    Dashboard
                 </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-medium tracking-widest">Syncing Protocol...</p>
          </div>
        ) : !walletData ? (
          <WalletChecker onCheck={handleWalletCheck} />
        ) : (
          <WalletAnalysis
            walletData={walletData}
            isProUser={hasProAccess}
            onReset={handleReset}
            onUpgradePrompt={handleUpgradePrompt}
          />
        )}
      </main>

      <footer className="border-t bg-white/50 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-500">
          © 2026 Reputa Analytics. Protocol Integrated.
        </div>
      </footer>

      <AccessUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onUpgrade={handleAccessUpgrade}
      />

      {showDashboard && currentWalletAddress && (
        <ReputaDashboard
          walletAddress={currentWalletAddress}
          onClose={() => setShowDashboard(false)}
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

