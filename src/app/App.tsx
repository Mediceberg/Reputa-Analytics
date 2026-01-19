import { useState, useEffect } from 'react';  
import { Analytics } from '@vercel/analytics/react';
import { Send } from 'lucide-react'; 
import { WalletChecker } from './components/WalletChecker';
import { WalletAnalysis } from './components/WalletAnalysis';
import { AccessUpgradeModal } from './components/AccessUpgradeModal';
import { TrustProvider, useTrust } from './protocol/TrustProvider';
import { fetchWalletData } from './protocol/wallet';
import { initializePiSDK, authenticateUser, isPiBrowser } from './services/piSdk';
import logoImage from '../assets/logo.png';

function ReputaAppContent() {
  const [walletData, setWalletData] = useState<any | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  // ✅ إضافة حالة الـ VIP لفتح الميزات بعد الدفع
  const [isVip, setIsVip] = useState(false);

  const piBrowser = isPiBrowser();
  const { refreshWallet } = useTrust();

  const savePioneerToDatabase = async (user: any, manualAddress?: string) => {
    try {
      if (!user || user.uid === "demo") return;
      
      const finalWallet = manualAddress || user.wallet_address || user.uid;
      
      await fetch('/api/save-pioneer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          wallet: finalWallet,
          timestamp: new Date().toISOString()
        }),
      });
      console.log("Pioneer data synced to Upstash:", finalWallet);
    } catch (error) {
      console.error("Failed to sync pioneer data:", error);
    }
  };

  useEffect(() => {
    const initApp = async () => {
      if (!piBrowser) {
        setCurrentUser({ username: "Guest_Explorer", uid: "demo" });
        setIsInitializing(false);
        return;
      }
      try {
        const sdkTimeout = setTimeout(() => setIsInitializing(false), 5000);
        
        await initializePiSDK();
        const user = await authenticateUser(['username', 'wallet_address']).catch(() => null);
        
        if (user) {
          setCurrentUser(user);
          savePioneerToDatabase(user);
        }
        
        clearTimeout(sdkTimeout);
      } catch (e) { 
        console.warn("Fallback Mode Active"); 
      } finally { 
        setIsInitializing(false); 
      }
    };
    initApp();
  }, [piBrowser]);

  const handleTryDemo = () => {
    setIsLoading(true);
    setWalletData(null); 
    setTimeout(() => {
      const demoData = {
        address: "GDU72WEH7M3O...MWPDYFBT",
        username: "Demo_Pioneer",
        balance: 82.27,
        reputaScore: 632,
        accountAge: 1751,
        createdAt: new Date('2019-03-14'),
        totalTransactions: 142,
        transactions: Array(15).fill(null).map((_, i) => ({
          id: `tx-demo-${i}`,
          amount: Math.random() * 20,
          type: i % 2 === 0 ? 'internal' : 'external',
          timestamp: new Date(),
          from: "GDX_SOURCE",
          to: "GDU_DEST",
          memo: "Demo Tx"
        })),
        trustLevel: "Elite",
        consistencyScore: 88,
        networkTrust: 92
      };
      setWalletData(demoData);
      setIsLoading(false);
    }, 800);
  };

  const handleWalletCheck = async (address: string) => {
    if (address === 'demo') {
      handleTryDemo();
      return;
    }

    if (!address) return;
    setIsLoading(true);
    setWalletData(null); 
    
    try {
      const data = await fetchWalletData(address);
      if (data && typeof data.reputaScore === 'number') {
        setWalletData({
          ...data,
          totalTransactions: data.totalTransactions || data.transactions?.length || 0,
          trustLevel: data.reputaScore >= 600 ? 'Elite' : 'Verified'
        });

        if (currentUser && currentUser.uid !== "demo") {
           savePioneerToDatabase(currentUser, address);
        }

        setTimeout(() => refreshWallet(address).catch(() => null), 200);
      } else {
        alert("Data format error. Please try again.");
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      alert("Network Error: Could not connect to Pi Blockchain.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitializing && piBrowser) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-purple-600 font-black animate-pulse uppercase tracking-widest text-xs">Initialising Reputa...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <header className="border-b p-4 bg-white/95 backdrop-blur-md sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <img src={logoImage} alt="logo" className="w-8 h-8" />
          <div className="leading-tight">
            <h1 className="font-black text-purple-700 text-lg tracking-tighter uppercase">Reputa Score</h1>
            <p className="text-[10px] text-gray-400 font-black uppercase">
               Welcome, {currentUser?.username || 'Guest'} {isVip && "⭐ VIP"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a href="https://t.me/+zxYP2x_4IWljOGM0" target="_blank" rel="noopener noreferrer" className="p-2 text-[#229ED9] bg-blue-50 rounded-full hover:bg-blue-100 transition-colors">
            <Send className="w-4 h-4" />
          </a>

          {piBrowser && !currentUser?.uid && (
            <button onClick={() => authenticateUser(['username', 'wallet_address']).then((user) => { setCurrentUser(user); savePioneerToDatabase(user); })} className="p-2 bg-purple-50 text-purple-600 rounded-lg text-[9px] font-black uppercase border border-purple-100">
              Link Account
            </button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center py-24">
            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] mt-6 font-black text-purple-600 tracking-[0.3em] uppercase text-center">Syncing Protocol...</p>
          </div>
        ) : !walletData ? (
          <div className="max-w-md mx-auto py-6">
            <WalletChecker onCheck={handleWalletCheck} />
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             {/* ✅ تم ربط isProUser بحالة isVip الحقيقية */}
             <WalletAnalysis walletData={walletData} isProUser={isVip} onReset={() => setWalletData(null)} onUpgradePrompt={() => setIsUpgradeModalOpen(true)} />
          </div>
        )}
      </main>

      <footer className="p-6 text-center border-t flex flex-col items-center gap-4">
        <a href="https://t.me/+zxYP2x_4IWljOGM0" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#229ED9] text-white rounded-full text-[10px] font-black uppercase shadow-sm hover:shadow-md transition-all active:scale-95">
          <Send className="w-3 h-3" /> Join Telegram
        </a>
        <div className="text-[9px] text-gray-300 font-black tracking-[0.4em] uppercase">Reputa Score v4.2 Stable</div>
      </footer>

      {/* ✅ التعديل الرئيسي: تمرير currentUser و onUpgrade للمودال */}
      <AccessUpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setIsUpgradeModalOpen(false)} 
        currentUser={currentUser}
        onUpgrade={() => {
          setIsVip(true); // تفعيل الـ VIP عند نجاح الدفع
          setIsUpgradeModalOpen(false);
        }} 
      />
      <Analytics />
    </div>
  );
}

export default function App() { return (<TrustProvider><ReputaAppContent /></TrustProvider>); }
