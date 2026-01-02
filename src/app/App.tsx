import { useState, useEffect } from 'react';
import { WalletChecker } from './components/WalletChecker';
import { WalletAnalysis } from './components/WalletAnalysis';
import { AccessUpgradeModal } from './components/AccessUpgradeModal';
import { ReputaDashboard } from './components/ReputaDashboard';
import { fetchWalletData, initializePi } from './protocol'; 
import { isVIPUser } from './services/piPayments'; // استيراد التحقق من VIP
import { getCurrentUser } from './services/piSdk';
import logoImage from '../assets/logo.svg';

export default function App() {
  const [walletData, setWalletData] = useState<any | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [hasProAccess, setHasProAccess] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [currentWalletAddress, setCurrentWalletAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // 1. تهيئة SDK والتحقق من حالة VIP الحالية للمستخدم
  useEffect(() => {
    const setup = async () => {
      await initializePi();
      const user = await getCurrentUser();
      if (user) {
        setHasProAccess(isVIPUser(user.uid));
      }
    };
    setup().catch(console.error);
  }, []);

  const handleWalletCheck = async (address: string) => {
    setIsLoading(true);
    try {
      const realData = await fetchWalletData(address);
      
      // مطابقة البيانات مع الهيكل المتوقع
      const mappedData = {
        ...realData,
        reputaScore: (realData as any).scores?.totalScore || 500,
        trustLevel: (realData as any).trustLevel || 'Medium',
        consistencyScore: (realData as any).scores?.miningScore || 70,
        networkTrust: 85,
        riskLevel: (realData as any).riskLevel || 'Low'
      };

      setWalletData(mappedData);
      setCurrentWalletAddress(address);
    } catch (error) {
      console.error("Testnet Connection Error:", error);
      alert("Error: Could not fetch data from Pi Testnet.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setWalletData(null);
    setShowDashboard(false);
  };

  const handleUpgradePrompt = () => {
    setIsUpgradeModalOpen(true);
  };

  const handleAccessUpgrade = () => {
    setHasProAccess(true);
    setIsUpgradeModalOpen(false);
    // تحديث البيانات فور الترقية لإظهار المميزات الجديدة
    if (currentWalletAddress) handleWalletCheck(currentWalletAddress);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-yellow-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
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
                <p className="text-xs text-gray-500">v2.5 • Pi Testnet Live</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {hasProAccess && (
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full shadow-lg">
                  <span className="text-sm font-semibold text-white">Pro Member</span>
                </div>
              )}
              {walletData && (
                 <button 
                  onClick={() => setShowDashboard(true)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                 >
                   Open Dashboard
                 </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-medium animate-pulse">Scanning Pi Blockchain...</p>
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

      {/* Footer */}
      <footer className="border-t bg-white/50 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-500">
          © 2026 Reputa Analytics. Connected to Pi Network Testnet.
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
