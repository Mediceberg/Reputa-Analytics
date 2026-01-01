import { useState, useEffect } from 'react';
import { WalletChecker } from './components/WalletChecker';
import { WalletAnalysis } from './components/WalletAnalysis';
import { AccessUpgradeModal } from './components/AccessUpgradeModal';
import logoImage from '../assets/logo.svg';

// --- Interfaces (الهياكل البيانية) ---
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

  // --- حالات جديدة للتحكم اليدوي في العمليات العشر ---
  const [manualAddress, setManualAddress] = useState('');
  const [txCount, setTxCount] = useState(0);

  // 1. تسجيل الدخول عبر Pi Network
  useEffect(() => {
    const initPi = async () => {
      try {
        if ((window as any).Pi) {
          const auth = await (window as any).Pi.authenticate(
            ['username', 'payments', 'wallet_address'], 
            (payment: any) => {
              console.log("Incomplete payment detected:", payment);
            }
          );
          setPiUser(auth.user);
        }
      } catch (err) {
        console.error("Pi Auth failed:", err);
      }
    };
    initPi();
  }, []);

  // 2. معالجة البحث عن المحفظة
  const handleWalletCheck = async (address: string) => {
    setLoading(true);
    const cleanAddress = address.trim();
    
    try {
      const response = await fetch(`/api/get-wallet?address=${cleanAddress}`);
      const data = await response.json();

      if (!response.ok || data.error) {
        alert("تنبيه: المحفظة غير موجودة في شبكة التست نت.");
        throw new Error("Wallet Not Found");
      }

      const nativeBalance = data.account.balances?.find((b: any) => b.asset_type === 'native');
      const realBalance = nativeBalance ? parseFloat(nativeBalance.balance) : 0;

      const realTransactions: Transaction[] = data.operations.map((op: any) => ({
        id: op.id,
        type: op.to === cleanAddress ? 'received' : 'sent',
        amount: parseFloat(op.amount || 0),
        from: op.from || op.funder || 'System',
        to: op.to || cleanAddress,
        timestamp: new Date(op.created_at),
        memo: op.type.replace('_', ' ')
      }));

      setWalletData({
        address: cleanAddress,
        balance: realBalance,
        accountAge: realTransactions.length > 0 ? 
          Math.floor((Date.now() - realTransactions[realTransactions.length - 1].timestamp.getTime()) / (1000 * 60 * 60 * 24)) : 0,
        transactions: realTransactions,
        totalTransactions: parseInt(data.account.sequence) || realTransactions.length,
        reputaScore: Math.min(Math.round((realBalance * 5) + (realTransactions.length * 10)), 1000),
        trustLevel: realBalance > 50 ? 'High' : 'Medium',
        consistencyScore: Math.min(70 + realTransactions.length, 98),
        networkTrust: 85,
        riskLevel: 'Low'
      });

    } catch (err) {
      console.error("Blockchain Fetch Error:", err);
      alert("تعذر جلب البيانات الحقيقية.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => setWalletData(null);
  const handleUpgradePrompt = () => setIsUpgradeModalOpen(true);

  // 3. منطق الدفع الاحترافي (VIP)
  const handleAccessUpgrade = async () => {
    if (!(window as any).Pi) {
      alert("الرجاء فتح التطبيق من داخل متصفح Pi");
      return;
    }

    try {
      await (window as any).Pi.createPayment({
        amount: 1,
        memo: "VIP Membership - Reputa Analytics Pro",
        metadata: { userId: piUser?.uid }
      }, {
        onReadyForServerApproval: async (paymentId: string) => {
          await fetch('/api/approve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId })
          });
        },
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          await fetch('/api/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId, txid })
          });
          
          setHasProAccess(true);
          setIsUpgradeModalOpen(false);
          alert("🎉 تم تفعيل Pro.");
        },
        onCancel: (paymentId: string) => console.log("Cancelled"),
        onError: (err: any) => alert("خطأ في الدفع")
      });
    } catch (err) {
      console.error(err);
    }
  };

  // --- دالة الإرسال اليدوي لتجاوز قيود الـ Mainnet (تعديل App-to-User) ---
  const handleManualTestnetTx = async () => {
    if (!manualAddress.startsWith('G') || manualAddress.length !== 56) {
      alert("الرجاء إدخال عنوان محفظة صحيح يبدأ بـ G (56 حرف)");
      return;
    }

    if (!(window as any).Pi) return;

    try {
      // تعديل الطلب ليكون App-to-User: يتم خصم الرصيد من محفظة التطبيق وإرساله للمستخدم
      await (window as any).Pi.createPayment({
        amount: 0.1,
        memo: `Verification Tx #${txCount + 1}`,
        metadata: { 
          targetAddress: manualAddress, 
          type: "APP_TO_USER_TX" // تعريف النوع للسيرفر
        }
      }, {
        onReadyForServerApproval: async (paymentId: string) => {
          // السيرفر يستخدم المفتاح السري (Secret Key) هنا للموافقة
          await fetch('/api/approve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId })
          });
        },
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          // السيرفر يؤكد العملية على البلوكشين
          await fetch('/api/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId, txid })
          });
          
          setTxCount(prev => prev + 1);
          setManualAddress(''); 
          alert(`✅ Success! [${txCount + 1}/10] App-to-User payment sent.`);
        },
        onCancel: () => console.log("User cancelled"),
        onError: (err: any) => {
           console.error(err);
           alert("Transaction failed. Make sure your App Wallet has Test-Pi.");
        }
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-yellow-50 pb-24">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={logoImage} alt="Logo" className="w-10 h-10 object-contain" />
              <div>
                <h1 className="font-bold text-xl bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                  Reputa Score
                </h1>
                <p className="text-xs text-gray-500">{piUser ? `@${piUser.username}` : 'v2.6'}</p>
              </div>
            </div>
            {hasProAccess && (
              <div className="px-4 py-2 bg-yellow-400 rounded-full shadow-lg">
                <span className="text-sm font-semibold text-white">Pro Member</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-20 flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-purple-600 font-medium font-mono text-sm tracking-tighter">Querying Pi Blockchain Ledger...</p>
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
      <footer className="border-t bg-white/50 backdrop-blur-sm mt-16 py-6 text-center text-sm text-gray-500">
        © 2024-2026 Reputa Analytics.
      </footer>

      {/* --- لوحة التحكم اليدوية لتجاوز مرحلة الـ 10 عمليات --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 z-[9999] border-t-4 border-purple-600 shadow-2xl">
        <div className="container mx-auto flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-shrink-0 text-center sm:text-left">
            <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Mainnet Readiness Flow</p>
            <p className="text-lg font-black">{txCount} <span className="text-gray-500 text-xs">/ 10 Unique Wallets</span></p>
          </div>
          
          <input 
            type="text"
            value={manualAddress}
            onChange={(e) => setManualAddress(e.target.value.toUpperCase().trim())}
            placeholder="Recipient Address (G...)"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm font-mono focus:outline-none focus:border-purple-500 w-full"
          />
          
          <button 
            onClick={handleManualTestnetTx}
            className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 px-6 py-2 rounded-lg font-bold transition-all active:scale-95 shadow-lg shadow-purple-500/20"
          >
            Send 0.1 Pi from App
          </button>
        </div>
      </div>

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
  return {
    address, balance: 0, accountAge: random(45, 800),
    transactions: [], totalTransactions: 0, reputaScore: 650,
    trustLevel: 'Medium', consistencyScore: 80, networkTrust: 80, riskLevel: 'Low'
  };
}

function generateRandomAddress(seed: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let addr = 'G';
  for (let i = 0; i < 55; i++) addr += chars[Math.floor(Math.abs(Math.sin(seed + i) * 10000) % chars.length)];
  return addr;
}
