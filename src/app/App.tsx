import { useState, useEffect } from 'react';
import { WalletChecker } from './components/WalletChecker';
import { WalletAnalysis } from './components/WalletAnalysis';
import { AccessUpgradeModal } from './components/AccessUpgradeModal';
import { Settings, X, Zap, ShieldCheck } from 'lucide-react'; 
import logoImage from '../assets/logo.svg';

// --- Interfaces ---
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

  // --- حالات لوحة التحكم اليدوية ---
  const [isAdminOpen, setIsAdminOpen] = useState(false); 
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

  // --- دالة الإرسال اليدوي (App-to-User) ---
  const handleManualTestnetTx = async () => {
    if (!manualAddress.startsWith('G') || manualAddress.length !== 56) {
      alert("الرجاء إدخال عنوان محفظة صحيح يبدأ بـ G");
      return;
    }

    if (!(window as any).Pi) return;

    try {
      await (window as any).Pi.createPayment({
        amount: 0.1,
        memo: `Dev Verification #${txCount + 1}`,
        metadata: { 
          targetAddress: manualAddress, 
          type: "APP_TO_USER_TX" 
        }
      }, {
        onReadyForServerApproval: async (paymentId: string) => {
          await fetch('/api/approve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId, isAppToUser: true })
          });
        },
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          await fetch('/api/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId, txid })
          });
          setTxCount(prev => prev + 1);
          setManualAddress(''); 
          alert(`✅ App-to-User Sent! [${txCount}/10]`);
        },
        onCancel: () => {},
        onError: () => alert("Transaction failed. Check App Wallet Seed.")
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white pb-24 relative overflow-hidden text-slate-900">
      
      {/* --- زر لوحة التحكم المحسن (مرئي الآن بوضوح في أسفل اليسار) --- */}
      <button 
        onClick={() => setIsAdminOpen(true)}
        className="fixed bottom-6 left-6 w-12 h-12 bg-purple-600 border border-purple-400 rounded-full flex items-center justify-center z-[999] shadow-2xl transition-all active:scale-90 animate-bounce hover:animate-none"
      >
        <Settings size={24} className="text-white" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-ping"></span>
      </button>

      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoImage} alt="Logo" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="font-bold text-xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Reputa Score
              </h1>
              <p className="text-[10px] text-gray-400 font-mono tracking-widest uppercase">
                {piUser ? `@${piUser.username}` : 'Blockchain Intel'}
              </p>
            </div>
          </div>
          {hasProAccess && (
            <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-lg border border-yellow-300">
              <Zap size={14} className="text-white fill-current" />
              <span className="text-[10px] font-black text-white uppercase tracking-tighter">Pro Access</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-32 flex flex-col items-center gap-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-purple-100 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <p className="text-slate-400 font-mono text-xs animate-pulse">Syncing with Mainnet-Beta Node...</p>
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

      <footer className="mt-auto py-8 text-center border-t border-slate-100 text-[10px] font-mono text-slate-400 uppercase tracking-[0.2em]">
        © 2024-2026 Reputa Analytics • Secured by Pi Network
      </footer>

      {/* --- الواجهة الأساسية للمطور --- */}
      {isAdminOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-slate-900 w-full max-w-lg rounded-3xl border border-purple-500/30 shadow-2xl overflow-hidden relative">
            
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-purple-600/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Developer Console</h3>
                  <p className="text-[10px] text-purple-400 font-mono tracking-tighter">APP-TO-USER PROTOCOL v2</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAdminOpen(false)} 
                className="bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white p-2 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/40 p-5 rounded-2xl border border-white/5">
                  <p className="text-[10px] text-gray-500 uppercase font-bold mb-2 tracking-widest">Mainnet Progress</p>
                  <p className="text-2xl font-black text-emerald-400">{txCount >= 10 ? 'COMPLETE' : `${txCount}/10`}</p>
                </div>
                <div className="bg-black/40 p-5 rounded-2xl border border-white/5">
                  <p className="text-[10px] text-gray-500 uppercase font-bold mb-2 tracking-widest">Current Mode</p>
                  <p className="text-2xl font-black text-purple-400 italic">TESTNET</p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs text-gray-400 font-bold ml-1 flex justify-between">
                  <span>RECIPIENT WALLET ADDRESS</span>
                  <span className="text-[10px] text-purple-500">G-ADDRESS ONLY</span>
                </label>
                <input 
                  type="text"
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value.toUpperCase().trim())}
                  placeholder="Paste G-Address here..."
                  className="w-full bg-black/60 border border-purple-500/20 rounded-2xl px-5 py-4 text-sm font-mono text-purple-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-inner placeholder:text-gray-700"
                />
              </div>

              <button 
                onClick={handleManualTestnetTx}
                className="w-full py-5 bg-gradient-to-br from-purple-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white font-black text-lg rounded-2xl shadow-xl shadow-purple-900/40 transition-all active:scale-[0.97] flex items-center justify-center gap-3 border-t border-white/20"
              >
                EXECUTE PAYMENT (0.1 PI)
              </button>

              <div className="bg-blue-500/5 p-4 rounded-2xl border border-blue-500/10">
                <p className="text-[11px] text-blue-400/80 leading-relaxed text-center">
                  This transaction will be signed by <strong>App Wallet Seed</strong> on the server.
                  No user wallet approval is required.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
