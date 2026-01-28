import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { TransactionTimeline } from '../components/charts/TransactionTimeline';
import { PointsBreakdown } from '../components/charts/PointsBreakdown';
import { RiskActivity } from '../components/charts/RiskActivity';
import { TokenPortfolio } from '../components/charts/TokenPortfolio';
import { ScoreBreakdownChart } from '../components/ScoreBreakdownChart';
import { PiDexSection } from '../components/PiDexSection';
import { TrustGauge } from '../components/TrustGauge';
import { TransactionList } from '../components/TransactionList';
import { AuditReport } from '../components/AuditReport';
import { NetworkInfoWidget, TopWalletsWidget, ReputationWidget } from '../components/widgets';
import { NetworkInfoPage } from './NetworkInfoPage';
import { TopWalletsPage } from './TopWalletsPage';
import { ReputationPage } from './ReputationPage';
import { DailyCheckIn } from '../components/DailyCheckIn';
import { PointsExplainer } from '../components/PointsExplainer';
import { MiningDaysWidget } from '../components/MiningDaysWidget';
import { ProfileSection } from '../components/ProfileSection';
import { 
  processTransactionTimeline, 
  processScoreBreakdown, 
  processRiskActivity, 
  processTokenPortfolio,
  generateMockChartData 
} from '../services/chartDataProcessor';
import { AppMode, ChartDataPoint, ChartReputationScore, TokenBalance, Language, WalletData, TrustLevel, AtomicTrustLevel } from '../protocol/types';
import { 
  calculateAtomicReputation, 
  generateDemoActivityData, 
  getLevelProgress,
  TRUST_LEVEL_COLORS,
  getBackendScoreCap,
  mapAtomicToTrustLevel
} from '../protocol/atomicScoring';
import { 
  ArrowLeft, Globe, User, Wallet, Shield, TrendingUp, 
  Activity, Clock, Zap, Sparkles, BarChart3, FileText,
  PieChart, LineChart, AlertTriangle, Coins, RefreshCw, Lock,
  Languages, ChevronDown, Calendar, CheckCircle, Award, Star,
  Settings, MessageSquare, HelpCircle, FileText as FileTextIcon
} from 'lucide-react';
import { Button } from '../components/ui/button';

interface UnifiedDashboardProps {
  walletData: WalletData;
  isProUser: boolean;
  onReset: () => void;
  onUpgradePrompt: () => void;
  username?: string;
}

type ActiveSection = 'overview' | 'analytics' | 'transactions' | 'audit' | 'portfolio' | 'wallet' | 'network' | 'profile' | 'settings' | 'feedback' | 'help' | 'privacy' | 'terms';
type NetworkSubPage = null | 'network-info' | 'top-wallets' | 'reputation';

export function UnifiedDashboard({ 
  walletData,
  isProUser,
  onReset,
  onUpgradePrompt,
  username
}: UnifiedDashboardProps) {
  const { t, language, changeLanguage } = useLanguage();
  const [mode, setMode] = useState<AppMode>({ mode: 'demo', connected: false });
  const [activeSection, setActiveSection] = useState<ActiveSection>('overview');
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [networkSubPage, setNetworkSubPage] = useState<NetworkSubPage>(null);
  const [userPoints, setUserPoints] = useState(() => {
    const defaultPoints = {
      total: walletData.reputaScore || 0,
      checkIn: 0,
      transactions: 0,
      activity: 0,
      streak: 0,
    };
    
    const validatePoints = (pts: Record<string, unknown>) => ({
      total: typeof pts.total === 'number' && !isNaN(pts.total) ? pts.total : defaultPoints.total,
      checkIn: typeof pts.checkIn === 'number' && !isNaN(pts.checkIn) ? pts.checkIn : 0,
      transactions: typeof pts.transactions === 'number' && !isNaN(pts.transactions) ? pts.transactions : 0,
      activity: typeof pts.activity === 'number' && !isNaN(pts.activity) ? pts.activity : 0,
      streak: typeof pts.streak === 'number' && !isNaN(pts.streak) ? pts.streak : 0,
    });
    
    const savedPoints = localStorage.getItem('userPointsState');
    if (savedPoints) {
      try {
        const parsed = JSON.parse(savedPoints);
        return validatePoints(parsed);
      } catch {
        return defaultPoints;
      }
    }
    const checkInData = localStorage.getItem('dailyCheckInState');
    if (checkInData) {
      try {
        const parsed = JSON.parse(checkInData);
        const checkInPts = Number(parsed.totalPointsFromCheckIn) || 0;
        const adPts = Number(parsed.totalPointsFromAds) || 0;
        const streakPts = Number(parsed.streakBonusPoints) || 0;
        return {
          total: (walletData.reputaScore || 0) + checkInPts + adPts + streakPts,
          checkIn: checkInPts,
          transactions: 0,
          activity: adPts,
          streak: streakPts,
        };
      } catch {
        return defaultPoints;
      }
    }
    return {
      total: walletData.reputaScore || 0,
      checkIn: 0,
      transactions: 0,
      activity: 0,
      streak: 0,
    };
  });

  const handlePointsEarned = (points: number, type: 'checkin' | 'ad') => {
    setUserPoints((prev: typeof userPoints) => {
      const newState = {
        ...prev,
        total: prev.total + points,
        checkIn: type === 'checkin' ? prev.checkIn + points : prev.checkIn,
        activity: type === 'ad' ? prev.activity + points : prev.activity,
      };
      if (mode.mode !== 'demo') {
        localStorage.setItem('userPointsState', JSON.stringify(newState));
      }
      return newState;
    });
  };
  
  const [timelineData, setTimelineData] = useState<{ internal: ChartDataPoint[]; external: ChartDataPoint[] }>({ internal: [], external: [] });
  const [breakdownData, setBreakdownData] = useState<ChartDataPoint[]>([]);
  const [riskData, setRiskData] = useState<ChartDataPoint[]>([]);
  const [portfolioData, setPortfolioData] = useState<ChartDataPoint[]>([]);
  const [score, setScore] = useState<ChartReputationScore | null>(null);
  const [tokens, setTokens] = useState<TokenBalance[]>([]);

  useEffect(() => {
    const { transactions, score: mockScore, tokens: mockTokens } = generateMockChartData();
    
    setTimelineData(processTransactionTimeline(transactions, period));
    setBreakdownData(processScoreBreakdown(mockScore));
    setRiskData(processRiskActivity(transactions, mockScore));
    setPortfolioData(processTokenPortfolio(mockTokens));
    setScore(mockScore);
    setTokens(mockTokens);
  }, [period]);

  const atomicResult = useMemo(() => {
    const demoData = generateDemoActivityData();
    demoData.accountAgeDays = walletData.accountAge || 180;
    demoData.internalTxCount = walletData.transactions?.length || 25;
    demoData.dailyCheckins = 0;
    demoData.adBonuses = 0;
    return calculateAtomicReputation(demoData);
  }, [walletData.accountAge, walletData.transactions?.length]);

  const levelProgress = useMemo(() => {
    const earnedPoints = userPoints.checkIn + userPoints.activity + userPoints.streak;
    return getLevelProgress(atomicResult.adjustedScore + earnedPoints);
  }, [atomicResult.adjustedScore, userPoints.checkIn, userPoints.activity, userPoints.streak]);

  const defaultColors = { text: '#00D9FF', bg: 'rgba(0, 217, 255, 0.1)', border: 'rgba(0, 217, 255, 0.3)' };
  const trustColors = TRUST_LEVEL_COLORS[levelProgress.currentLevel] || defaultColors;

  const handleModeToggle = () => {
    setMode(prev => ({
      mode: prev.mode === 'demo' ? 'testnet' : 'demo',
      connected: prev.mode === 'demo' ? true : false,
    }));
  };

  const handlePeriodChange = (newPeriod: 'day' | 'week' | 'month') => {
    setPeriod(newPeriod);
  };

  const handleSidebarNavigation = (itemId: string) => {
    const sectionMap: Record<string, ActiveSection> = {
      'dashboard': 'overview',
      'analytics': 'analytics',
      'transactions': 'transactions',
      'audit': 'audit',
      'portfolio': 'portfolio',
      'wallet': 'wallet',
      'network': 'network',
      'profile': 'profile',
      'settings': 'settings',
      'feedback': 'feedback',
      'help': 'help',
      'privacy': 'privacy',
      'terms': 'terms',
    };
    setActiveSection(sectionMap[itemId] || 'overview');
  };

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'EN' },
    { code: 'ar', label: 'AR' },
    { code: 'fr', label: 'FR' },
    { code: 'zh', label: 'ZH' },
  ];

  const formatAddress = (address: string) => {
    if (address.length > 16) {
      return `${address.slice(0, 8)}...${address.slice(-8)}`;
    }
    return address;
  };

  const gaugeLevel = mapAtomicToTrustLevel(levelProgress.currentLevel);

  const sectionButtons: { id: ActiveSection; icon: React.ElementType; label: string }[] = [
    { id: 'overview', icon: BarChart3, label: t('sidebar.dashboard') },
    { id: 'analytics', icon: LineChart, label: t('sidebar.analytics') },
    { id: 'transactions', icon: Activity, label: t('sidebar.transactions') },
    { id: 'audit', icon: FileText, label: t('sidebar.audit') },
    { id: 'portfolio', icon: PieChart, label: t('sidebar.portfolio') },
    { id: 'wallet', icon: Wallet, label: t('sidebar.wallet') },
    { id: 'network', icon: Globe, label: 'Network' },
  ];

  return (
    <div className="min-h-screen futuristic-bg flex">
      <div className="absolute inset-0 grid-pattern pointer-events-none" />
      
      <DashboardSidebar 
        mode={mode} 
        onModeToggle={handleModeToggle}
        activeItem={activeSection === 'overview' ? 'dashboard' : activeSection}
        onItemClick={handleSidebarNavigation}
      />

      <main className="flex-1 p-6 overflow-auto relative z-10">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={onReset}
              className="p-3 rounded-xl transition-all active:scale-95 glass-card hover:border-purple-500/40 group"
              style={{ border: '1px solid rgba(139, 92, 246, 0.3)' }}
            >
              <ArrowLeft className="w-5 h-5 text-purple-400 group-hover:text-purple-300" />
            </button>
            <div>
              <h1 className="text-xl font-black uppercase tracking-wide neon-text-purple">{t('dashboard.title')}</h1>
              {username && (
                <p className="text-sm" style={{ color: 'rgba(160, 164, 184, 0.8)' }}>{t('dashboard.welcome')}, {username}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              onClick={onUpgradePrompt} 
              className="gap-2 bg-gradient-to-r from-purple-600 via-purple-700 to-cyan-600 text-white font-bold text-xs uppercase shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 transition-all border border-purple-400/30"
            >
              <Sparkles className="w-4 h-4" />
              {isProUser ? 'Pro Active' : 'Upgrade'}
            </Button>
            
            <button
              onClick={() => window.location.reload()}
              className="p-3 rounded-xl transition-all active:scale-95 glass-card hover:border-cyan-500/40"
              style={{ border: '1px solid rgba(0, 217, 255, 0.3)' }}
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4 text-cyan-400" />
            </button>

            <div className="relative group">
              <button
                className="flex items-center gap-2 glass-card px-4 py-2.5 hover:border-cyan-500/40 transition-all"
                style={{ border: '1px solid rgba(0, 217, 255, 0.3)' }}
              >
                <Languages className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white uppercase">{language}</span>
                <ChevronDown className="w-3 h-3 text-cyan-400" />
              </button>
              
              <div 
                className="absolute right-0 top-full mt-2 py-2 rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 min-w-[120px] z-50"
                style={{
                  background: 'rgba(15, 17, 23, 0.98)',
                  border: '1px solid rgba(0, 217, 255, 0.3)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
                }}
              >
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`w-full px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-3 ${
                      language === lang.code
                        ? 'text-cyan-400 bg-cyan-500/10'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {language === lang.code && <CheckCircle className="w-3 h-3" />}
                    <span className={language === lang.code ? '' : 'ml-6'}>{t(`language.${lang.code}`)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Pioneer Profile Card with Level Progress */}
        <div 
          className="glass-card p-5 mb-6" 
          style={{ 
            border: `1px solid ${trustColors.border}`,
            boxShadow: `0 0 30px ${trustColors.bg}`,
          }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${trustColors.bg} 0%, rgba(0, 217, 255, 0.2) 100%)`,
                  border: `2px solid ${trustColors.border}`,
                  boxShadow: `0 0 25px ${trustColors.bg}`,
                }}
              >
                <User className="w-7 h-7" style={{ color: trustColors.text }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black uppercase tracking-wide" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                    {username || 'Pioneer'}
                  </h2>
                  <span 
                    className="px-2 py-0.5 rounded text-[9px] font-black uppercase"
                    style={{ 
                      background: trustColors.bg, 
                      border: `1px solid ${trustColors.border}`,
                      color: trustColors.text,
                    }}
                  >
                    Lv.{levelProgress.levelIndex + 1}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Wallet className="w-3 h-3 text-cyan-400" />
                  <span className="font-mono text-sm" style={{ color: 'rgba(0, 217, 255, 0.9)' }}>
                    {formatAddress(walletData.address)}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="text-center px-4 py-3 rounded-xl" style={{ background: trustColors.bg, border: `1px solid ${trustColors.border}` }}>
                <div className="flex items-center gap-1.5 justify-center mb-1">
                  <TrendingUp className="w-3.5 h-3.5" style={{ color: trustColors.text }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: trustColors.text }}>Reputa</span>
                </div>
                <p className="text-2xl font-black" style={{ color: trustColors.text }}>{levelProgress.displayScore.toLocaleString()}</p>
              </div>

              <div className="text-center px-4 py-3 rounded-xl" style={{ background: 'rgba(0, 217, 255, 0.1)', border: '1px solid rgba(0, 217, 255, 0.3)' }}>
                <div className="flex items-center gap-1.5 justify-center mb-1">
                  <Coins className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">{t('dashboard.balance')}</span>
                </div>
                <p className="text-2xl font-black neon-text-cyan">
                  {(walletData?.balance || 0).toFixed(2)} <span className="text-cyan-400 text-sm">π</span>
                </p>
              </div>

              <div className="text-center px-4 py-3 rounded-xl" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <div className="flex items-center gap-1.5 justify-center mb-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Age</span>
                </div>
                <p className="text-2xl font-black text-emerald-400">{walletData?.accountAge || 0} <span className="text-gray-500 text-sm">days</span></p>
              </div>

              <div 
                className="text-center px-4 py-3 rounded-xl"
                style={{ background: trustColors.bg, border: `1px solid ${trustColors.border}` }}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: 'rgba(160, 164, 184, 0.8)' }}>Level</span>
                <p className="text-lg font-black uppercase" style={{ color: trustColors.text }}>{levelProgress.currentLevel}</p>
              </div>
            </div>
          </div>

          {/* Level Progress Bar */}
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase" style={{ color: 'rgba(160, 164, 184, 0.6)' }}>
                Level {levelProgress.levelIndex + 1}/7
              </span>
              {levelProgress.nextLevel && (
                <span className="text-[10px] font-medium" style={{ color: trustColors.text }}>
                  {levelProgress.pointsToNextLevel.toLocaleString()} pts to {levelProgress.nextLevel}
                </span>
              )}
            </div>
            <div className="relative">
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.08)' }}>
                <div 
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ 
                    width: `${levelProgress.progressInLevel}%`,
                    background: `linear-gradient(90deg, ${trustColors.text} 0%, ${trustColors.border} 100%)`,
                    boxShadow: `0 0 10px ${trustColors.text}`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {sectionButtons.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap ${
                activeSection === section.id
                  ? 'bg-gradient-to-r from-purple-500/30 to-cyan-500/30 text-white border border-purple-500/50'
                  : 'glass-card text-gray-400 hover:text-white hover:border-purple-500/30'
              }`}
              style={activeSection !== section.id ? { border: '1px solid rgba(255, 255, 255, 0.1)' } : {}}
            >
              <section.icon className={`w-4 h-4 ${activeSection === section.id ? 'text-purple-400' : ''}`} />
              {section.label}
            </button>
          ))}
        </div>

        {/* Content Sections */}
        {activeSection === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Trust Gauge */}
            <TrustGauge 
              score={levelProgress.displayScore} 
              trustLevel={gaugeLevel}
              consistencyScore={walletData.consistencyScore ?? 85}
              networkTrust={walletData.networkTrust ?? 90}
            />

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-card p-4 hover:border-purple-500/40 transition-all cursor-pointer" style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }} onClick={() => setActiveSection('transactions')}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase">Total Tx</p>
                    <p className="font-bold text-white">{walletData?.totalTransactions || 0}</p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-4 hover:border-cyan-500/40 transition-all cursor-pointer" style={{ border: '1px solid rgba(0, 217, 255, 0.2)' }} onClick={() => setActiveSection('analytics')}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
                    <LineChart className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase">Analytics</p>
                    <p className="font-bold text-white">View Charts</p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-4 hover:border-emerald-500/40 transition-all cursor-pointer" style={{ border: '1px solid rgba(16, 185, 129, 0.2)' }} onClick={() => setActiveSection('portfolio')}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                    <PieChart className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase">Portfolio</p>
                    <p className="font-bold text-white">{tokens.length} Tokens</p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-4 hover:border-amber-500/40 transition-all cursor-pointer" style={{ border: '1px solid rgba(245, 158, 11, 0.2)' }} onClick={() => setActiveSection('audit')}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase">Audit</p>
                    <p className="font-bold text-white">Full Report</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Check-in & Points Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <DailyCheckIn 
                onPointsEarned={handlePointsEarned}
                isDemo={mode.mode === 'demo'}
              />
              
              <div className="glass-card p-5" style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(0, 217, 255, 0.15) 100%)',
                        border: '1px solid rgba(139, 92, 246, 0.4)',
                      }}
                    >
                      <Award className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Total Points</p>
                      <p className="text-2xl font-black text-white">{userPoints.total.toLocaleString()}</p>
                    </div>
                  </div>
                  <PointsExplainer 
                    currentPoints={userPoints.total}
                    checkInPoints={userPoints.checkIn}
                    transactionPoints={userPoints.transactions}
                    activityPoints={userPoints.activity}
                    streakBonus={userPoints.streak}
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="p-2.5 rounded-lg text-center" style={{ background: 'rgba(0, 217, 255, 0.1)', border: '1px solid rgba(0, 217, 255, 0.2)' }}>
                    <p className="text-[9px] font-bold uppercase text-cyan-400">Check-in</p>
                    <p className="text-sm font-black text-cyan-400">{userPoints.checkIn}</p>
                  </div>
                  <div className="p-2.5 rounded-lg text-center" style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                    <p className="text-[9px] font-bold uppercase text-purple-400">Activity</p>
                    <p className="text-sm font-black text-purple-400">{userPoints.activity}</p>
                  </div>
                  <div className="p-2.5 rounded-lg text-center" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                    <p className="text-[9px] font-bold uppercase text-amber-400">Streak</p>
                    <p className="text-sm font-black text-amber-400">{userPoints.streak}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Transactions Preview */}
            <div className="glass-card p-5" style={{ border: '1px solid rgba(0, 217, 255, 0.2)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wide" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                  Recent Transactions
                </h3>
                <button 
                  onClick={() => setActiveSection('transactions')}
                  className="text-[10px] font-bold uppercase text-cyan-400 hover:text-cyan-300 transition-all"
                >
                  View All →
                </button>
              </div>
              <TransactionList 
              transactions={walletData?.transactions?.slice(0, 4) || []} 
              walletAddress={walletData?.address || ''} 
            />
            </div>
          </div>
        )}

        {activeSection === 'analytics' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-card p-5" style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                <TransactionTimeline 
                  internal={timelineData.internal}
                  external={timelineData.external}
                  onFilterChange={handlePeriodChange}
                />
              </div>
              <div className="glass-card p-5" style={{ border: '1px solid rgba(0, 217, 255, 0.2)' }}>
                <PointsBreakdown data={breakdownData} />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-card p-5" style={{ border: '1px solid rgba(236, 72, 153, 0.2)' }}>
                <RiskActivity data={riskData} />
              </div>
              <div className="glass-card p-5" style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                {score && <ScoreBreakdownChart score={score} />}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'transactions' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="glass-card p-5" style={{ border: '1px solid rgba(0, 217, 255, 0.2)' }}>
              <TransactionList 
              transactions={walletData?.transactions || []} 
              walletAddress={walletData?.address || ''} 
            />
            </div>
          </div>
        )}

        {activeSection === 'audit' && (
          <div className="space-y-6 animate-in fade-in duration-300 relative">
            <AuditReport 
              walletData={{
                ...walletData,
                transactions: walletData?.transactions || []
              }} 
              isProUser={isProUser} 
              onUpgradePrompt={onUpgradePrompt}
            />
            
            {!isProUser && (
              <div className="absolute inset-x-0 bottom-0 h-[50%] z-20 flex flex-col items-center justify-end pointer-events-auto">
                <div 
                  className="absolute inset-0 backdrop-blur-md"
                  style={{ background: 'linear-gradient(to top, rgba(10, 11, 15, 0.98) 0%, rgba(10, 11, 15, 0.9) 50%, transparent 100%)' }}
                />
                <div className="relative pb-10 px-6 text-center w-full">
                  <div 
                    className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 animate-bounce"
                    style={{
                      background: 'rgba(139, 92, 246, 0.2)',
                      border: '1px solid rgba(139, 92, 246, 0.4)',
                      boxShadow: '0 0 30px rgba(139, 92, 246, 0.3)',
                    }}
                  >
                    <Lock className="w-6 h-6" style={{ color: '#8B5CF6' }} />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-widest mb-2" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                    Detailed Audit Locked
                  </h3>
                  <p className="text-xs font-bold uppercase mb-5" style={{ color: 'rgba(160, 164, 184, 0.7)' }}>
                    Requires 1 Pi Transaction
                  </p>
                  <button 
                    onClick={onUpgradePrompt}
                    className="futuristic-button px-8 py-4 text-sm font-black uppercase tracking-wide"
                  >
                    Unlock Full Report
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeSection === 'portfolio' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-card p-5" style={{ border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <TokenPortfolio data={portfolioData} />
              </div>
              <div className="glass-card p-5" style={{ border: '1px solid rgba(0, 217, 255, 0.2)' }}>
                <PiDexSection tokens={tokens} />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'wallet' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="glass-card p-6" style={{ border: '1px solid rgba(0, 217, 255, 0.2)' }}>
              <div className="flex items-center gap-3 mb-6">
                <Wallet className="w-6 h-6 text-cyan-400" />
                <h2 className="text-lg font-black uppercase tracking-wide" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                  Wallet Information
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 rounded-xl" style={{ background: 'rgba(0, 217, 255, 0.1)', border: '1px solid rgba(0, 217, 255, 0.2)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 mb-2">Wallet Address</p>
                    <p className="font-mono text-sm text-white break-all">{walletData.address}</p>
                  </div>
                  
                  <div className="p-4 rounded-xl" style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-2">Available Balance</p>
                    <p className="text-2xl font-black neon-text-purple">{walletData.balance.toFixed(4)} <span className="text-purple-400">π</span></p>
                  </div>
                  
                  <div className="p-4 rounded-xl" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-2">Account Age</p>
                    <p className="text-xl font-black text-emerald-400">{walletData.accountAge} days</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 rounded-xl" style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-2">Reputa Score</p>
                    <p className="text-2xl font-black neon-text-purple">{walletData.reputaScore} <span className="text-gray-500 text-sm">/ 1000</span></p>
                  </div>
                  
                  <div className="p-4 rounded-xl" style={{ background: 'rgba(0, 217, 255, 0.1)', border: '1px solid rgba(0, 217, 255, 0.2)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 mb-2">Total Transactions</p>
                    <p className="text-xl font-black text-cyan-400">{walletData.totalTransactions || walletData.transactions.length}</p>
                  </div>
                  
                  <div className="p-4 rounded-xl" style={{ background: trustColors.bg, border: `1px solid ${trustColors.border}` }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(160, 164, 184, 0.8)' }}>Trust Level</p>
                    <p className="text-lg font-black uppercase" style={{ color: trustColors.text }}>{levelProgress.currentLevel}</p>
                  </div>
                </div>
              </div>
            </div>

            <TrustGauge 
              score={levelProgress.displayScore} 
              trustLevel={gaugeLevel}
              consistencyScore={walletData.consistencyScore ?? 85}
              networkTrust={walletData.networkTrust ?? 90}
            />
          </div>
        )}

        {activeSection === 'network' && (
          <>
            {networkSubPage === 'network-info' ? (
              <NetworkInfoPage onBack={() => setNetworkSubPage(null)} />
            ) : networkSubPage === 'top-wallets' ? (
              <TopWalletsPage onBack={() => setNetworkSubPage(null)} />
            ) : networkSubPage === 'reputation' ? (
              <ReputationPage onBack={() => setNetworkSubPage(null)} walletAddress={walletData.address} />
            ) : (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Network Info Header */}
                <div className="glass-card p-6" style={{ border: '1px solid rgba(0, 217, 255, 0.2)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center border border-cyan-500/30">
                      <Globe className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black uppercase tracking-wide text-white">Pi Network Explorer</h2>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                        Real-time blockchain data from {mode.mode === 'testnet' ? 'Testnet' : 'Mainnet'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Navigation Icons */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <button
                    onClick={() => setNetworkSubPage('network-info')}
                    aria-label="View detailed network metrics"
                    className="group p-8 rounded-2xl text-center transition-all hover:scale-[1.02] cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    style={{
                      background: 'linear-gradient(135deg, rgba(30, 33, 40, 0.6) 0%, rgba(20, 22, 28, 0.8) 100%)',
                      border: '1px solid rgba(0, 217, 255, 0.2)',
                      boxShadow: '0 4px 20px rgba(0, 217, 255, 0.1)',
                    }}
                  >
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110"
                      style={{
                        background: 'linear-gradient(135deg, rgba(0, 217, 255, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
                        border: '1px solid rgba(0, 217, 255, 0.3)',
                        boxShadow: '0 0 30px rgba(0, 217, 255, 0.2)',
                      }}
                    >
                      <Globe className="w-10 h-10 text-cyan-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Network Metrics</h3>
                    <p className="text-sm text-gray-400 mb-4">
                      Circulating supply, mining rewards, active wallets
                    </p>
                    <span className="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                      View Details
                      <TrendingUp className="w-4 h-4" />
                    </span>
                  </button>

                  <button
                    onClick={() => setNetworkSubPage('top-wallets')}
                    aria-label="View top 100 wallets list"
                    className="group p-8 rounded-2xl text-center transition-all hover:scale-[1.02] cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    style={{
                      background: 'linear-gradient(135deg, rgba(30, 33, 40, 0.6) 0%, rgba(20, 22, 28, 0.8) 100%)',
                      border: '1px solid rgba(139, 92, 246, 0.2)',
                      boxShadow: '0 4px 20px rgba(139, 92, 246, 0.1)',
                    }}
                  >
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110"
                      style={{
                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        boxShadow: '0 0 30px rgba(139, 92, 246, 0.2)',
                      }}
                    >
                      <Wallet className="w-10 h-10 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Top 100 Wallets</h3>
                    <p className="text-sm text-gray-400 mb-4">
                      Highest balance wallets, activity scores, rankings
                    </p>
                    <span className="inline-flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider">
                      Explore List
                      <TrendingUp className="w-4 h-4" />
                    </span>
                  </button>

                  <button
                    onClick={() => setNetworkSubPage('reputation')}
                    aria-label="Check wallet reputation score"
                    className="group p-8 rounded-2xl text-center transition-all hover:scale-[1.02] cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    style={{
                      background: 'linear-gradient(135deg, rgba(30, 33, 40, 0.6) 0%, rgba(20, 22, 28, 0.8) 100%)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      boxShadow: '0 4px 20px rgba(16, 185, 129, 0.1)',
                    }}
                  >
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110"
                      style={{
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(0, 217, 255, 0.2) 100%)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        boxShadow: '0 0 30px rgba(16, 185, 129, 0.2)',
                      }}
                    >
                      <Shield className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Reputation Score</h3>
                    <p className="text-sm text-gray-400 mb-4">
                      Trust analysis, on-chain verification, score breakdown
                    </p>
                    <span className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      Check Score
                      <TrendingUp className="w-4 h-4" />
                    </span>
                  </button>
                </div>

                {/* Quick Preview Widgets */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <NetworkInfoWidget isMainnet={mode.mode !== 'testnet'} />
                  <ReputationWidget 
                    walletAddress={walletData.address} 
                    isMainnet={mode.mode !== 'testnet'} 
                  />
                  <TopWalletsWidget isMainnet={mode.mode !== 'testnet'} />
                </div>
              </div>
            )}
          </>
        )}

        {activeSection === 'profile' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <ProfileSection 
              walletData={walletData}
              username={username || 'Pioneer'}
              isProUser={isProUser}
              mode={mode}
              userPoints={userPoints}
              onPointsEarned={handlePointsEarned}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={() => setActiveSection('privacy')}
                className="p-4 rounded-xl glass-card border border-white/5 hover:border-purple-500/40 transition-all flex flex-col items-center gap-2 group"
              >
                <div className="p-3 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-all">
                  <Lock className="w-5 h-5 text-purple-400" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-white">Privacy Policy</span>
              </button>
              <button 
                onClick={() => setActiveSection('terms')}
                className="p-4 rounded-xl glass-card border border-white/5 hover:border-cyan-500/40 transition-all flex flex-col items-center gap-2 group"
              >
                <div className="p-3 rounded-lg bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-all">
                  <FileText className="w-5 h-5 text-cyan-400" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-white">Terms of Service</span>
              </button>
              <button 
                onClick={() => setActiveSection('help')}
                className="p-4 rounded-xl glass-card border border-white/5 hover:border-emerald-500/40 transition-all flex flex-col items-center gap-2 group"
              >
                <div className="p-3 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-all">
                  <HelpCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-white">Help Center</span>
              </button>
            </div>
          </div>
        )}

        {activeSection === 'settings' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="glass-card p-6" style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }}>
              <div className="flex items-center gap-3 mb-6">
                <Settings className="w-6 h-6 text-purple-400" />
                <h2 className="text-lg font-black uppercase tracking-wide text-white">Settings</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                  <div>
                    <p className="text-sm font-bold text-white uppercase tracking-wide">Dark Mode</p>
                    <p className="text-[10px] text-gray-400">System preference enabled</p>
                  </div>
                  <div className="w-12 h-6 bg-purple-600 rounded-full relative">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                  <div>
                    <p className="text-sm font-bold text-white uppercase tracking-wide">Push Notifications</p>
                    <p className="text-[10px] text-gray-400">Receive alerts for important activity</p>
                  </div>
                  <div className="w-12 h-6 bg-gray-700 rounded-full relative">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'feedback' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="glass-card p-6" style={{ border: '1px solid rgba(0, 217, 255, 0.2)' }}>
              <div className="flex items-center gap-3 mb-6">
                <MessageSquare className="w-6 h-6 text-cyan-400" />
                <h2 className="text-lg font-black uppercase tracking-wide text-white">Feedback</h2>
              </div>
              <p className="text-sm text-gray-400 mb-6">Your feedback helps us improve Reputa Score. Tell us what you think!</p>
              <textarea 
                className="w-full h-32 p-4 rounded-xl bg-black/40 border border-white/10 text-white text-sm outline-none focus:border-cyan-500/50 transition-all mb-4"
                placeholder="Share your thoughts or report an issue..."
              />
              <button className="futuristic-button w-full py-3 text-xs font-bold uppercase tracking-widest">Submit Feedback</button>
            </div>
          </div>
        )}

        {activeSection === 'help' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="glass-card p-6" style={{ border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div className="flex items-center gap-3 mb-6">
                <HelpCircle className="w-6 h-6 text-emerald-400" />
                <h2 className="text-lg font-black uppercase tracking-wide text-white">Help Center</h2>
              </div>
              <div className="space-y-4">
                <details className="group glass-card border border-white/10 rounded-xl overflow-hidden">
                  <summary className="p-4 cursor-pointer flex items-center justify-between font-bold text-sm text-white uppercase tracking-wide bg-white/5 hover:bg-white/10 transition-all">
                    What is Reputa Score?
                    <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="p-4 text-xs text-gray-400 leading-relaxed">
                    Reputa Score is an advanced AI-powered reputation protocol for the Pi Network. It analyzes on-chain behavior to determine wallet trustworthiness.
                  </div>
                </details>
                <details className="group glass-card border border-white/10 rounded-xl overflow-hidden">
                  <summary className="p-4 cursor-pointer flex items-center justify-between font-bold text-sm text-white uppercase tracking-wide bg-white/5 hover:bg-white/10 transition-all">
                    How is my score calculated?
                    <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="p-4 text-xs text-gray-400 leading-relaxed">
                    The score is based on transaction volume, account age, consistency of activity, and network trust factors. Higher scores indicate greater reliability.
                  </div>
                </details>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'privacy' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="glass-card p-6" style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }}>
              <div className="flex items-center gap-3 mb-6">
                <Lock className="w-6 h-6 text-purple-400" />
                <h2 className="text-lg font-black uppercase tracking-wide text-white">Privacy Policy</h2>
              </div>
              <div className="prose prose-invert max-w-none text-[11px] text-gray-400 space-y-4 font-sans leading-relaxed">
                <p className="font-bold text-white mb-2">Last Updated: January 26, 2026</p>
                <p>Reputa Score Protocol ("the Protocol", "we", or "us") is committed to protecting the privacy and security of our users. This Privacy Policy outlines our practices regarding the collection, use, and safeguarding of data within the Pi Network ecosystem.</p>
                
                <h3 className="text-sm font-black uppercase text-purple-400 mt-6 mb-2">1. Data Collection and Scope</h3>
                <p>We operate on the principle of data minimization. The Protocol analyzes publicly available blockchain data to provide reputation scoring. The data processed includes Public Wallet Addresses, User Identifiers (UID), and Technical Metadata.</p>

                <h3 className="text-sm font-black uppercase text-purple-400 mt-6 mb-2">2. Data Protection and Security</h3>
                <p>The Protocol employs industry-standard encryption and security measures. We maintain a non-custodial architecture, meaning we never request, store, or have access to your private keys or passphrases.</p>

                <h3 className="text-sm font-black uppercase text-purple-400 mt-6 mb-2">3. Third-Party Disclosure</h3>
                <p>Reputa Score Protocol maintains a strict no-sale policy. We do not sell, trade, or rent user data to third parties. Data remains within the secure infrastructure of the Protocol.</p>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'terms' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="glass-card p-6" style={{ border: '1px solid rgba(0, 217, 255, 0.2)' }}>
              <div className="flex items-center gap-3 mb-6">
                <FileTextIcon className="w-6 h-6 text-cyan-400" />
                <h2 className="text-lg font-black uppercase tracking-wide text-white">Terms of Service</h2>
              </div>
              <div className="prose prose-invert max-w-none text-[11px] text-gray-400 space-y-4 font-sans leading-relaxed">
                <p className="font-bold text-white mb-2">Last Updated: January 26, 2026</p>
                <p>By accessing or using the Reputa Score Protocol ("the Protocol"), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.</p>

                <h3 className="text-sm font-black uppercase text-cyan-400 mt-6 mb-2">1. Nature of Service</h3>
                <p>Reputa Score Protocol is an analytical tool designed to evaluate the reliability of digital wallets within the Pi Network based on publicly available blockchain data.</p>

                <h3 className="text-sm font-black uppercase text-cyan-400 mt-6 mb-2">2. VIP Subscriptions</h3>
                <p>Advanced features, such as detailed audit reports, may require payment via the Pi Network. Payments for digital upgrades are final and non-refundable.</p>

                <h3 className="text-sm font-black uppercase text-cyan-400 mt-6 mb-2">3. Limitation of Liability</h3>
                <p>Reputa Score Protocol assumes no responsibility for financial losses resulting from trading decisions or transactions made based on our scoring metrics.</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
