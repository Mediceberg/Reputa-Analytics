import { useState, useEffect } from 'react';
import { WalletChecker } from './components/WalletChecker';
import { WalletAnalysis } from './components/WalletAnalysis';
import { AccessUpgradeModal } from './components/AccessUpgradeModal';
import { TrustProvider, useTrust } from './protocol/TrustProvider';
import { fetchWalletData } from './protocol/wallet';
import { createVIPPayment, checkVIPStatus } from './protocol/piPayment';
import logoImage from '../assets/logo.svg';

function ReputaAppContent() {
  const [walletData, setWalletData] = useState<any | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [hasProAccess, setHasProAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const { updateMiningDays, miningDays, trustScore, refreshWallet } = useTrust();
  const isPiBrowser = typeof (window as any).Pi !== 'undefined';

  // Initialize Pi SDK and authenticate
  useEffect(() => {
    const initPi = async () => {
      if (isPiBrowser) {
        try {
          const Pi = (window as any).Pi;
          await Pi.init({ version: '2.0', sandbox: true });
          
          const auth = await Pi.authenticate(['username', 'payments'], (payment: any) => {
            console.log("Payment callback:", payment);
          });
          
          if (auth?.user) {
            setCurrentUser(auth.user);
            const vip = checkVIPStatus(auth.user.uid);
            setHasProAccess(vip);
          }
        } catch (error) {
          console.error("Pi initialization failed:", error);
        }
      }
    };
    initPi();
  }, [isPiBrowser]);

  // Handle wallet check
  const handleWalletCheck = async (address: string) => {
    setIsLoading(true);
    try {
      // Fetch real blockchain data
      const data = await fetchWalletData(address);
      
      // Update trust context
      await refreshWallet(address);
      
      // Calculate enhanced score with mining bonus
      const enhancedScore = trustScore > 0 
        ? Math.min(1000, data.totalTransactions * 10 + (miningDays > 0 ? miningDays / 10 : 0))
        : 650;

      setWalletData({
        ...data,
        reputaScore: enhancedScore,
        trustScore: enhancedScore / 10,
        consistencyScore: miningDays > 0 ? Math.min(100, miningDays / 10) : 75,
        networkTrust: Math.min(100, data.totalTransactions),
        trustLevel: enhancedScore >= 800 ? 'Elite' : enhancedScore >= 600 ? 'High' : enhancedScore >= 400 ? 'Medium' : 'Low'
      });
    } catch (error) {
      console.error('Wallet check failed:', error);
      alert('Failed to fetch wallet data. Please check the address and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle VIP upgrade
  const handleAccessUpgrade = async () => {
    if (!isPiBrowser) {
      alert('Please use Pi Browser to access payment features');
      return;
    }

    try {
      const userId = currentUser?.uid || 'demo_user';
      await createVIPPayment(userId);
      
      // Poll for payment completion
      const checkPayment = setInterval(() => {
        const vipStatus = checkVIPStatus(userId);
        if (vipStatus) {
          setHasProAccess(true);
          setIsUpgradeModalOpen(false);
          clearInterval(checkPayment);
          alert('VIP Access Activated! 🎉');
        }
      }, 2000);

      // Stop polling after 5 minutes
      setTimeout(() => clearInterval(checkPayment), 300000);
    } catch (error) {
      console.error('VIP upgrade failed:', error);
      alert('Payment initialization failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-yellow-50">
      {/* Header */}
      <header className="border-b bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={logoImage} alt="Reputa Score" className="w-10 h-10" />
              <div>
                <h1 className="font-bold text-xl text-purple-700">Reputa Score</h1>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                  {isPiBrowser ? '● LIVE' : '○ DEMO'} • {currentUser?.username || 'Guest'}
                </p>
              </div>
            </div>

            {/* Mining Upload */}
            <div className="flex items-center gap-4">
              <label className="cursor-pointer group">
                <div className="flex flex-col items-end border-l pl-4 border-purple-100">
                  <span className="text-xs font-bold text-purple-600 group-hover:text-blue-600 transition">
                    📈 BOOST SCORE
                  </span>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) updateMiningDays(file);
                    }}
                  />
                  <p className="text-xs text-gray-400">Upload Stats</p>
                </div>
              </label>

              {hasProAccess && (
                <div className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-black rounded-full shadow-sm">
                  VIP
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-sm font-bold text-blue-600">Connecting to Pi Testnet...</p>
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

      {/* Footer */}
      <footer className="border-t bg-white/50 py-6 text-center text-xs text-gray-400 font-semibold">
        © 2026 Reputa Analytics • Powered by Pi Network Testnet
      </footer>

      {/* Modals */}
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
