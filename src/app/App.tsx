import { useState, useEffect } from 'react';
import { WalletChecker } from './components/WalletChecker';
import { WalletAnalysis } from './components/WalletAnalysis';
import { AccessUpgradeModal } from './components/AccessUpgradeModal';
import { ReputaDashboard } from './components/ReputaDashboard';
import { fetchWalletData, initializePi } from './protocol'; 
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
            setHasProAccess(isVIPUser(user.uid));
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
    setIsLoading(true);
    try {
      let realData;
      if (isPiBrowser) {
        // جلب البيانات الحقيقية من Testnet عبر المحرك الجديد في wallet.ts
        realData = await fetchWalletData(address);
      } else {
        // بيانات تجريبية للمتصفح العادي
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
        // دمج نتائج البلوكشين مع نقاط بروتوكول الثقة (Trust Score)
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

  const handleAccessUpgrade = () => {
    setHasProAccess(true);
    setIsUpgradeModalOpen(false);
    if (currentWalletAddress) handleWalletCheck(currentWalletAddress);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-yellow-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center">
                <img src={logoImage} alt="Reputa Analytics" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="font-bold text-xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Reputa Score
                </h1>
                <p className="text-[10px] text-gray-400 font-semibold tracking-wide uppercase">
                   {isPiBrowser ? '● Live Testnet' : '○ Demo Mode'}: {userName}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* تحسين شكل خانة الأبلود وتوضيح دورها */}
              <div className="hidden md:flex flex-col items-end mr-4 border-l pl-4 border-purple-100">
                <label className="group cursor-pointer">
                  <span className="text-[10px] font-black text-purple-600 group-hover:text-blue-600 transition-colors flex items-center gap-1">
                    VERIFY SENIORITY <span className="text-xs">↑</span>
                  </span>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={(e) => e.target.files && updateMiningDays(e.target.files[0])}
                  />
                </label>
                <span className="text-[8px] text-gray-400 italic">Upload mining stats to boost score</span>
                {miningDays > 0 && <span className="text-[9px] text-green-600 font-bold mt-1 animate-pulse tracking-tighter">✓ Seniority Verified!</span>}
              </div>

              {hasProAccess && (
                <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-md border border-white/50">
                  <span className="text-[10px] font-black text-white uppercase italic tracking-widest">VIP PRO</span>
                </div>
              )}
              {walletData && (
                 <button onClick={() => setShowDashboard(true)} className="text-xs font-black text-blue-600 hover:text-blue-800 border-b-2 border-blue-600 pb-0.5">
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
            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-purple-700 font-bold tracking-widest animate-pulse text-xs uppercase">Connecting to Blockchain...</p>
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
        <div className="container mx-auto px-4 py-6 text-center text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
          © 2026 Reputa Analytics • Pi Network Protocol Integrated
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

