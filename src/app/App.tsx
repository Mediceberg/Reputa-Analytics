// ... (الإبقاء على الاستيرادات كما هي دون تغيير)

function ReputaAppContent() {
  const [walletData, setWalletData] = useState<any | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [hasProAccess, setHasProAccess] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [currentWalletAddress, setCurrentWalletAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  // إضافة حالة لاسم المستخدم
  const [userName, setUserName] = useState<string>('Guest');

  const { updateMiningDays, miningDays, trustScore } = useTrust();

  // التحقق من البيئة: هل نحن داخل متصفح باي؟
  const isPiBrowser = typeof (window as any).Pi !== 'undefined';

  useEffect(() => {
    const setup = async () => {
      if (isPiBrowser) {
        try {
          await initializePi();
          const user = await getCurrentUser();
          if (user) {
            setUserName(user.username); // جلب الاسم الحقيقي
            setHasProAccess(isVIPUser(user.uid));
          }
        } catch (error) {
          console.error("SDK Init Error:", error);
        }
      } else {
        setUserName("Demo User"); // وضع الديمو للمتصفح العادي
      }
    };
    setup();
  }, [isPiBrowser]);

  const handleWalletCheck = async (address: string) => {
    setIsLoading(true);
    try {
      let realData;
      if (isPiBrowser) {
        // جلب بيانات حقيقية من التست نيت
        realData = await fetchWalletData(address);
      } else {
        // بيانات تجريبية (Mock Data) لمنع خطأ 'Something went wrong'
        realData = {
          balance: 100,
          scores: { totalScore: 650, miningScore: 75 },
          trustLevel: 'Medium',
          riskLevel: 'Low'
        };
      }

      const mappedData = {
        ...realData,
        reputaScore: trustScore > 0 ? trustScore * 10 : (realData as any).scores?.totalScore || 500,
        trustLevel: (realData as any).trustLevel || 'Medium',
        consistencyScore: miningDays > 0 ? miningDays : (realData as any).scores?.miningScore || 70,
        networkTrust: 85,
        riskLevel: (realData as any).riskLevel || 'Low'
      };
      setWalletData(mappedData);
      setCurrentWalletAddress(address);
    } catch (error) {
      console.error("Connection Error:", error);
      alert("Error: Connection failed. Mode: " + (isPiBrowser ? "Real" : "Demo"));
    } finally {
      setIsLoading(false);
    }
  };

  // ... (الإبقاء على handleReset و handleUpgradePrompt و handleAccessUpgrade كما هي)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-yellow-50">
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
                <p className="text-[10px] text-gray-400">Welcome, {userName}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* تحسين منطقة الأبلود بصرياً مع تفسير الدور */}
              <div className="hidden md:block text-right mr-4 border-l pl-4 border-purple-100">
                <label className="group flex flex-col cursor-pointer">
                  <span className="text-[10px] font-black text-purple-600 group-hover:text-blue-600 transition-colors">
                    BOOST SCORE (IMAGE) ↑
                  </span>
                  <span className="text-[8px] text-gray-400">Upload mining stats to verify seniority</span>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={(e) => e.target.files && updateMiningDays(e.target.files[0])}
                  />
                </label>
                {miningDays > 0 && <span className="text-[9px] text-green-600 font-bold">✓ Seniority Verified!</span>}
              </div>

              {hasProAccess && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-md animate-pulse">
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">VIP Pro</span>
                </div>
              )}
              {walletData && (
                 <button onClick={() => setShowDashboard(true)} className="text-sm font-bold text-blue-600 hover:scale-105 transition-transform">
                    Dashboard
                 </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ... (باقي الكود في Main و Footer والـ Modals يبقى كما هو تماماً دون تغيير) */}
