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

  // التحقق من البيئة لمنع الانهيار وجلب بيانات حقيقية
  const isPiBrowser = typeof (window as any).Pi !== 'undefined';

  useEffect(() => {
    const setup = async () => {
      if (isPiBrowser) {
        try {
          await initializePi();
          const user = await getCurrentUser();
          if (user) {
            setUserName(user.username);
            // تأكدنا من انتظار نتيجة فحص الـ VIP
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
        realData = await fetchWalletData(address);
      } else {
        realData = {
          balance: 314.15,
          username: "demo_pioneer",
          scores: { totalScore: 710, miningScore: 80 },
          trustLevel: 'Verified',
          riskLevel: 'Low',
          transactions: []
        };
      }

      const mappedData = {
        ...realData,
        reputaScore: trustScore > 0 ? trustScore * 10 : (realData as any).scores?.totalScore || 500,
        trustLevel: (realData as any).trustLevel || 'Medium',
        consistencyScore: miningDays > 0 ? miningDays : (realData as any).scores?.miningScore || 70,
        networkTrust: 89,
        riskLevel: (realData as any).riskLevel || 'Low'
      };
      setWalletData(mappedData);
      setCurrentWalletAddress(address);
    } catch (error) {
      alert("Testnet Sync Failed. Mode: " + (isPiBrowser ? "Real" : "Demo"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setWalletData(null);
    setShowDashboard(false);
  };

  const handleUpgradePrompt = () => setIsUpgradeModalOpen(true);

  // تحديث دالة الدفع لتصبح حقيقية
  const handleAccessUpgrade = async () => {
    if (isPiBrowser) {
      try {
        const payment = await createVIPPayment();
        if (payment) {
          setHasProAccess(true);
          setIsUpgradeModalOpen(false);
        }
      } catch (err) {
        console.error("Payment failed", err);
      }
    } else {
      // وضع الديمو
      setHasProAccess(true);
      setIsUpgradeModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-yellow-50 overflow-x-hidden">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 flex-shrink-0">
                <img src={logoImage} alt="Reputa Analytics" className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-lg bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent truncate">
                  Reputa Score
                </h1>
                <p className="text-[9px] text-gray-400 font-semibold truncate">
                   {isPiBrowser ? '● Live' : '○ Demo'}: {userName}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="hidden sm:flex flex-col items-end mr-2 border-l pl-3 border-purple-100">
                <label className="group cursor-pointer">
                  <span className="text-[9px] font-black text-purple-600 group-hover:text-blue-600">
                    VERIFY ↑
                  </span>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={(e) => {
                      if (e.target.files?.[0]) updateMiningDays(e.target.files[0]);
                    }}
                  />
                </label>
                {miningDays > 0 && <span className="text-[8px] text-green-600 font-bold">Verified!</span>}
              </div>

              {hasProAccess && (
                <div className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-sm">
                  <span className="text-[9px] font-black text-white uppercase italic">VIP</span>
                </div>
              )}
              {walletData && (
                 <button onClick={() => setShowDashboard(true)} className="text-[11px] font-black text-blue-600 border-b-2 border-blue-600">
                    DASHBOARD
                 </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Syncing Blockchain...</p>
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
        <div className="container mx-auto px-4 py-6 text-center text-[9px] text-gray-400 font-bold uppercase tracking-widest">
          © 2026 Reputa Analytics • Protocol Integrated
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

