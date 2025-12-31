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

  // 2. معالجة البحث عن المحفظة (جلب بيانات حقيقية من السيرفر)
  const handleWalletCheck = async (address: string) => {
    setLoading(true);
    const cleanAddress = address.trim();
    
    try {
      // الاتصال بـ API الوسيط الذي قمنا بإنشائه (get-wallet.js)
      const response = await fetch(`/api/get-wallet?address=${cleanAddress}`);
      const data = await response.json();

      if (!response.ok || data.error) {
        alert("تنبيه: المحفظة غير موجودة في شبكة التست نت أو لم يتم تفعيلها بعد.");
        throw new Error("Wallet Not Found");
      }

      // استخراج الرصيد الحقيقي من استجابة Horizon API
      const nativeBalance = data.balances?.find((b: any) => b.asset_type === 'native');
      const realBalance = nativeBalance ? parseFloat(nativeBalance.balance) : 0;

      // دمج البيانات الحقيقية مع الهيكل المحاكي للتطبيق
      setWalletData({
        ...generateMockWalletData(cleanAddress), // لتوليد المعاملات الشكلية والبيانات التكميلية
        balance: realBalance,
        totalTransactions: parseInt(data.sequence) || 0,
        reputaScore: Math.min(Math.round((realBalance / 2) + 70), 100) * 10,
        trustLevel: realBalance > 100 ? 'High' : 'Medium'
      });

      alert(`✅ تم العثور على المحفظة بنجاح! الرصيد الحالي: ${realBalance} Pi`);

    } catch (err) {
      console.error("Blockchain Fetch Error:", err);
      // في حال الفشل التام، نعرض بيانات محاكة (Fallback) لكي لا يتوقف التطبيق
      setWalletData(generateMockWalletData(cleanAddress));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => setWalletData(null);
  const handleUpgradePrompt = () => setIsUpgradeModalOpen(true);

  // 3. منطق الدفع الاحترافي (Approve -> Payment -> Complete)
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
        // الخطوة الأولى: الموافقة من السيرفر الخاص بنا
        onReadyForServerApproval: async (paymentId: string) => {
          await fetch('/api/approve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId })
          });
        },
        // الخطوة الثانية: إكمال المعاملة بعد قيام المستخدم بالدفع
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          await fetch('/api/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId, txid })
          });
          
          setHasProAccess(true);
          setIsUpgradeModalOpen(false);
          alert("🎉 تهانينا! تم تفعيل حساب Pro بنجاح.");
        },
        onCancel: (paymentId: string) => console.log("Payment Cancelled:", paymentId),
        onError: (err: any) => {
          console.error("Payment Error:", err);
          alert("حدث خطأ أثناء عملية الدفع. حاول مرة أخرى.");
        }
      });
    } catch (err) {
      console.error("Payment Initiation Failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-yellow-50">
      {/* Header */}
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
                <p className="text-xs text-gray-500">{piUser ? `@${piUser.username}` : 'v2.6 • Pi Network'}</p>
              </div>
            </div>
            {hasProAccess && (
              <div className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full shadow-lg animate-bounce">
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
            <p className="animate-pulse text-purple-600 font-medium">Accessing Pi Testnet Blockchain...</p>
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
        © 2024-2026 Reputa Analytics. Powered by Pi Network Blockchain.
      </footer>

      {/* Modal */}
      <AccessUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onUpgrade={handleAccessUpgrade}
      />
    </div>
  );
}

// --- Helper Functions (توليد البيانات المحاكة التكميلية) ---
function generateMockWalletData(address: string): WalletData {
  const seed = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = (min: number, max: number) => {
    const x = Math.sin(seed) * 10000;
    return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
  };

  const transactions: Transaction[] = Array.from({ length: 10 }, (_, i) => ({
      id: `tx_${seed}_${i}`,
      type: random(0, 1) === 1 ? 'received' : 'sent',
      amount: random(1, 50),
      from: generateRandomAddress(seed + i),
      to: generateRandomAddress(seed + i + 1),
      timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
  }));

  return {
    address,
    balance: 0, 
    accountAge: random(45, 800),
    transactions,
    totalTransactions: 0,
    reputaScore: 650,
    trustLevel: 'Medium',
    consistencyScore: random(70, 95),
    networkTrust: random(65, 98),
    riskLevel: 'Low'
  };
}

function generateRandomAddress(seed: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let addr = 'G';
  for (let i = 0; i < 55; i++) addr += chars[Math.floor(Math.abs(Math.sin(seed + i) * 10000) % chars.length)];
  return addr;
}
