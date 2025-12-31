import { useState, useEffect } from 'react';
import { WalletChecker } from './components/WalletChecker';
import { WalletAnalysis } from './components/WalletAnalysis';
import { AccessUpgradeModal } from './components/AccessUpgradeModal';
import logoImage from '../assets/logo.svg';

// Interfaces
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
  accountAge: number;
  transactions: Transaction[];
  totalTransactions: number;
  reputaScore: number;
  trustLevel: TrustLevel;
  consistencyScore: number;
  networkTrust: number;
  riskLevel: 'Low' | 'Medium' | 'High';
}

export default function App() {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [hasProAccess, setHasProAccess] = useState(false);
  const [piUser, setPiUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 1. Pi Login
  useEffect(() => {
    const initPi = async () => {
      try {
        if ((window as any).Pi) {
          const auth = await (window as any).Pi.authenticate(['username', 'payments', 'wallet_address'], (payment: any) => {
             console.log("Incomplete payment", payment);
          });
          setPiUser(auth.user);
        }
      } catch (err) {
        console.error("Pi Auth failed", err);
      }
    };
    initPi();
  }, []);

  // 2. Fetching REAL Testnet Data
  const handleWalletCheck = async (address: string) => {
  setLoading(true);
  try {
    // تنظيف العنوان من أي مسافات زائدة
    const cleanAddress = address.trim();
    
    // الطلب الآن يذهب للسيرفر الخاص بك وليس للبلوكشين مباشرة لتجنب حظر المتصفح
    const response = await fetch(`/api/get-wallet?address=${cleanAddress}`);
    
    if (!response.ok) throw new Error("Wallet not found");

    const data = await response.json();

    // استخراج البيانات الحقيقية
    const realBalance = data.balances.find((b: any) => b.asset_type === 'native')?.balance || "0";
    const realSequence = parseInt(data.sequence) || 0;

    setWalletData({
      ...generateMockWalletData(cleanAddress),
      balance: parseFloat(realBalance),
      totalTransactions: realSequence,
      reputaScore: Math.min(Math.round((parseFloat(realBalance) / 5) + 65), 100) * 10
    });

  } catch (err) {
    console.warn("Could not fetch real data, showing demo:", err);
    // إبقاء الديمو فقط في حال فشل كل شيء لكي لا يتوقف التطبيق
    setWalletData(generateMockWalletData(address));
  } finally {
    setLoading(false);
  }
};

  const handleReset = () => setWalletData(null);
  const handleUpgradePrompt = () => setIsUpgradeModalOpen(true);

  // 3. Payment Logic with Server Integration
  const handleAccessUpgrade = async () => {
    if (!(window as any).Pi) return;
    try {
      await (window as any).Pi.createPayment({
        amount: 1,
        memo: "VIP Membership - Reputa Score",
        metadata: { userId: piUser?.uid }
      }, {
        onReadyForServerApproval: async (paymentId: string) => {
          // استدعاء ملف الموافقة
          await fetch('/api/approve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId })
          });
        },
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          // خطوة إضافية لضمان إغلاق المعاملة بنجاح
          await fetch('/api/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId, txid })
          });
          setHasProAccess(true);
          setIsUpgradeModalOpen(false);
        },
        onCancel: (paymentId: string) => console.log("Cancelled", paymentId),
        onError: (err: any) => console.error("Payment Error", err)
      });
    } catch (err) {
      console.error("Payment failed", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-yellow-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center">
                <img src={logoImage} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="font-bold text-xl bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                  Reputa Score
                </h1>
                <p className="text-xs text-gray-500">{piUser ? `@${piUser.username}` : 'v2.5 • Pi Network'}</p>
              </div>
            </div>
            {hasProAccess && (
              <div className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full shadow-lg">
                <span className="text-sm font-semibold text-white">Pro Member</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-20 animate-pulse text-purple-600 font-medium">
            Accessing Pi Testnet Blockchain...
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

      <footer className="border-t bg-white/50 backdrop-blur-sm mt-16 py-6 text-center text-sm text-gray-500">
        © 2024 Reputa Analytics. Powered by Pi Network.
      </footer>

      <AccessUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onUpgrade={handleAccessUpgrade}
      />
    </div>
  );
}

// --- Helper Functions ---
function generateMockWalletData(address: string): WalletData {
  const seed = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = (min: number, max: number) => {
    const x = Math.sin(seed) * 10000;
    return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
  };

  const balance = random(10, 500);
  const accountAge = random(30, 730);
  
  const transactions: Transaction[] = Array.from({ length: 10 }, (_, i) => ({
      id: `tx_${seed}_${i}`,
      type: random(0, 1) === 1 ? 'received' : 'sent',
      amount: random(1, 50),
      from: generateRandomAddress(seed + i),
      to: generateRandomAddress(seed + i + 1),
      timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
  }));

  return {
    address, balance, accountAge, transactions, totalTransactions: random(5, 50),
    reputaScore: 750, trustLevel: 'Medium', consistencyScore: random(60, 90),
    networkTrust: random(70, 95), riskLevel: 'Low'
  };
}

function generateRandomAddress(seed: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let addr = 'G';
  for (let i = 0; i < 55; i++) addr += chars[Math.floor(Math.abs(Math.sin(seed + i) * 10000) % chars.length)];
  return addr;
}
