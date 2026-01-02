import { useState } from 'react';
import { WalletChecker } from './components/WalletChecker';
import { WalletAnalysis } from './components/WalletAnalysis';
import { AccessUpgradeModal } from './components/AccessUpgradeModal';
import { ReputaDashboard } from './components/ReputaDashboard';
import logoImage from '../assets/logo.svg';

// Mock wallet data for demonstration
export interface Transaction {
  id: string;
  type: 'sent' | 'received';
  amount: number;
  from: string;
  to: string;
  timestamp: Date;
  memo?: string;
}

export type TrustLevel = 'Low' | 'Medium' | 'High' | 'Elite';

export interface WalletData {
  address: string;
  balance: number;
  accountAge: number; // in days
  transactions: Transaction[];
  totalTransactions: number;
  reputaScore: number; // 0-1000
  trustLevel: TrustLevel;
  consistencyScore: number; // 0-100
  networkTrust: number; // 0-100
  riskLevel: 'Low' | 'Medium' | 'High';
}

export default function App() {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [hasProAccess, setHasProAccess] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [currentWalletAddress, setCurrentWalletAddress] = useState<string>('');

  const handleWalletCheck = (address: string) => {
    // Mock data generation based on wallet address
    const mockData = generateMockWalletData(address);
    setWalletData(mockData);
    setCurrentWalletAddress(address);
  };

  const handleReset = () => {
    setWalletData(null);
    setShowDashboard(false);
  };

  const handleUpgradePrompt = () => {
    setIsUpgradeModalOpen(true);
  };

  const handleAccessUpgrade = () => {
    // In real app, this would integrate with Pi SDK
    setHasProAccess(true);
    setIsUpgradeModalOpen(false);
  };

  const handleOpenDashboard = () => {
    setShowDashboard(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-yellow-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center">
                <img 
                  src={logoImage} 
                  alt="Reputa Analytics" 
                  className="w-full h-full object-contain"
                  style={{ mixBlendMode: 'multiply' }}
                />
              </div>
              <div>
                <h1 className="font-bold text-xl bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                  Reputa Score
                </h1>
                <p className="text-xs text-gray-500">v2.5 • Pi Network</p>
              </div>
            </div>
            {hasProAccess && (
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full shadow-lg">
                <span className="text-sm font-semibold text-white">Pro Member</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {!walletData ? (
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
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-gray-500">
            © 2024 Reputa Analytics. Powered by Pi Network Blockchain.
          </p>
        </div>
      </footer>

      {/* Upgrade Modal */}
      <AccessUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onUpgrade={handleAccessUpgrade}
      />

      {/* Reputa Dashboard */}
      {showDashboard && currentWalletAddress && (
        <ReputaDashboard
          walletAddress={currentWalletAddress}
          onClose={() => setShowDashboard(false)}
        />
      )}
    </div>
  );
}

// Helper function to generate mock wallet data
function generateMockWalletData(address: string): WalletData {
  // Generate deterministic data based on address
  const seed = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = (min: number, max: number) => {
    const x = Math.sin(seed) * 10000;
    return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
  };

  const balance = random(100, 10000) + random(0, 99) / 100;
  const accountAge = random(30, 730); // 30 days to 2 years
  const totalTransactions = random(10, 500);

  // Generate last 10 non-zero transactions
  const transactions: Transaction[] = Array.from({ length: 10 }, (_, i) => {
    const isReceived = random(0, 1) === 1;
    const amount = random(1, 100) + random(0, 99) / 100;
    const daysAgo = i * random(1, 5);

    return {
      id: `tx_${seed}_${i}`,
      type: isReceived ? 'received' : 'sent',
      amount,
      from: isReceived ? generateRandomAddress(seed + i) : address,
      to: isReceived ? address : generateRandomAddress(seed + i + 1),
      timestamp: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      memo: i % 3 === 0 ? 'Payment' : undefined,
    };
  });

  // Calculate trust score based on factors
  const balanceScore = Math.min((balance / 1000) * 30, 30);
  const ageScore = Math.min((accountAge / 365) * 40, 40);
  const activityScore = Math.min((totalTransactions / 100) * 30, 30);
  const trustScore = Math.round(balanceScore + ageScore + activityScore);

  // Determine trust level
  let trustLevel: TrustLevel;
  if (trustScore >= 90) {
    trustLevel = 'Elite';
  } else if (trustScore >= 70) {
    trustLevel = 'High';
  } else if (trustScore >= 50) {
    trustLevel = 'Medium';
  } else {
    trustLevel = 'Low';
  }

  // Calculate consistency score
  const consistencyScore = random(0, 100);

  // Calculate network trust
  const networkTrust = random(0, 100);

  // Determine risk level
  let riskLevel: 'Low' | 'Medium' | 'High';
  if (networkTrust < 30) {
    riskLevel = 'High';
  } else if (networkTrust < 60) {
    riskLevel = 'Medium';
  } else {
    riskLevel = 'Low';
  }

  return {
    address,
    balance,
    accountAge,
    transactions,
    totalTransactions,
    reputaScore: trustScore * 10,
    trustLevel,
    consistencyScore,
    networkTrust,
    riskLevel,
  };
}

function generateRandomAddress(seed: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let address = 'G';
  for (let i = 0; i < 55; i++) {
    const index = Math.floor(Math.abs(Math.sin(seed + i) * 10000) % chars.length);
    address += chars[index];
  }
  return address;
}