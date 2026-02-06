import React, { useState, useEffect, useMemo, Suspense } from 'react';  
import { useLanguage } from '../hooks/useLanguage';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { SideDrawer } from '../components/SideDrawer';
import { TopBar } from '../components/TopBar';
import { MainCard } from '../components/MainCard';
const TransactionTimeline = React.lazy(async () => ({ default: (await import('../components/charts/TransactionTimeline')).TransactionTimeline }));
const PointsBreakdown = React.lazy(async () => ({ default: (await import('../components/charts/PointsBreakdown')).PointsBreakdown }));
const RiskActivity = React.lazy(async () => ({ default: (await import('../components/charts/RiskActivity')).RiskActivity }));
const TokenPortfolio = React.lazy(async () => ({ default: (await import('../components/charts/TokenPortfolio')).TokenPortfolio }));
const ScoreBreakdownChart = React.lazy(async () => ({ default: (await import('../components/ScoreBreakdownChart')).ScoreBreakdownChart }));
const PiDexSection = React.lazy(async () => ({ default: (await import('../components/PiDexSection')).PiDexSection }));
const TrustGauge = React.lazy(async () => ({ default: (await import('../components/TrustGauge')).TrustGauge }));
const TransactionList = React.lazy(async () => ({ default: (await import('../components/TransactionList')).TransactionList }));
const AuditReport = React.lazy(async () => ({ default: (await import('../components/AuditReport')).AuditReport }));
const TopWalletsWidget = React.lazy(async () => ({ default: (await import('../components/widgets')).TopWalletsWidget }));
const NetworkInfoPage = React.lazy(async () => ({ default: (await import('./NetworkInfoPage')).NetworkInfoPage }));
const AtomicProtocolPage = React.lazy(async () => ({ default: (await import('./AtomicProtocolPage')).AtomicProtocolPage }));
const TopWalletsPage = React.lazy(async () => ({ default: (await import('./TopWalletsPage')).TopWalletsPage }));
const ReputationPage = React.lazy(async () => ({ default: (await import('./ReputationPage')).ReputationPage }));
const ProfilePage = React.lazy(async () => ({ default: (await import('./ProfilePage')).ProfilePage }));
const DailyCheckIn = React.lazy(async () => ({ default: (await import('../components/DailyCheckIn')).DailyCheckIn }));
const PointsExplainer = React.lazy(async () => ({ default: (await import('../components/PointsExplainer')).PointsExplainer }));
const ShareReputaCard = React.lazy(async () => ({ default: (await import('../components/ShareReputaCard')).ShareReputaCard }));
const MiningDaysWidget = React.lazy(async () => ({ default: (await import('../components/MiningDaysWidget')).MiningDaysWidget }));
const ProfileSection = React.lazy(async () => ({ default: (await import('../components/ProfileSection')).ProfileSection }));
import { 
  processTransactionTimeline, 
  processScoreBreakdown, 
  processRiskActivity, 
  processTokenPortfolio,
  generateMockChartData 
} from '../services/chartDataProcessor';
import { AppMode, ChartDataPoint, ChartReputationScore, TokenBalance, Language, WalletData, TrustLevel, AtomicTrustLevel, NetworkMode, MODE_IMPACTS } from '../protocol/types';
import { ModeIndicator, ModeStatusBadge } from '../components/ModeIndicator';
import { 
  calculateAtomicReputation, 
  generateDemoActivityData, 
  getLevelProgress,
  TRUST_LEVEL_COLORS,
  getBackendScoreCap,
  mapAtomicToTrustLevel
} from '../protocol/atomicScoring';
import { reputationService, UnifiedScoreData } from '../services/reputationService';
import { 
  ArrowLeft, Globe, User, Wallet, Shield, TrendingUp, 
  Activity, Clock, Zap, Sparkles, BarChart3, FileText,
  PieChart, LineChart, AlertTriangle, Coins, RefreshCw, Lock,
  Languages, ChevronDown, Calendar, CheckCircle, Award, Star,
  Settings, MessageSquare, HelpCircle, FileText as FileTextIcon, TestTube, AlertCircle
} from 'lucide-react';
import { Button } from '../components/ui/button';

interface UnifiedDashboardProps {
  walletData: WalletData;
  isProUser: boolean;
  onReset: () => void;
  onUpgradePrompt: () => void;
  username?: string;
}

type ActiveSection = 'overview' | 'analytics' | 'transactions' | 'audit' | 'portfolio' | 'wallet' | 'network' | 'profile' | 'settings' | 'feedback' | 'help';
type NetworkSubPage = null | 'network-info' | 'top-wallets' | 'reputation';

export function UnifiedDashboard({ 
  walletData,
  isProUser,
  onReset,
  onUpgradePrompt,
  username
}: UnifiedDashboardProps) {
  const { t, language, changeLanguage } = useLanguage();
  const [mode, setMode] = useState<AppMode>(() => {
    const savedMode = localStorage.getItem('reputaNetworkMode');
    if (savedMode === 'mainnet' || savedMode === 'testnet') {
      return { mode: savedMode as NetworkMode, connected: true };
    }
    return { mode: 'testnet', connected: true };
  });
  const [activeSection, setActiveSection] = useState<ActiveSection>('overview');
  const activeSectionLabel = useMemo(() => {
    const sectionLabels: Record<string, string> = {
      'overview': 'Reputa Score',
      'analytics': 'Analytics',
      'transactions': 'Activity',
      'audit': 'Audit Report',
      'portfolio': 'Portfolio',
      'wallet': 'Wallet',
      'network': 'Network',
      'settings': 'Settings'
    };
    return sectionLabels[activeSection] || activeSection;
  }, [activeSection]);
  const [networkSubPage, setNetworkSubPage] = useState<NetworkSubPage>(null);
  const [isSideDrawerOpen, setIsSideDrawerOpen] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [unifiedScoreData, setUnifiedScoreData] = useState<UnifiedScoreData | null>(null);
  const [userPoints, setUserPoints] = useState({
    total: walletData.reputaScore || 0,
    checkIn: 0,
    transactions: 0,
    activity: 0,
    streak: 0,
  });
  
  useEffect(() => {
    async function loadUnifiedScore() {
      const isDemo = mode.mode === 'demo' || !username || username === 'Guest_Explorer';
      const uid = isDemo ? 'demo' : (localStorage.getItem('piUserId') || `user_${Date.now()}`);
      
      if (isDemo) {
        reputationService.setDemoMode(true);
      }

      // load cached value first to avoid UI flicker
      const cached = reputationService.getCachedUnifiedScore(uid);
      if (cached) {
        setUnifiedScoreData(cached);
        setUserPoints({
          total: cached.totalScore,
          checkIn: cached.dailyCheckInPoints || 0,
          transactions: 0,
          activity: cached.blockchainScore || 0,
          streak: cached.streak || 0,
        });
      }

      await reputationService.loadUserReputation(uid);
      const unified = reputationService.getUnifiedScore();
      setUnifiedScoreData(unified);
      setUserPoints({
        total: unified.totalScore,
        checkIn: unified.dailyCheckInPoints || 0,
        transactions: 0,
        activity: unified.blockchainScore || 0,
        streak: unified.streak || 0,
      });
    }
    loadUnifiedScore();
  }, [mode.mode, username]);

  const handlePointsEarned = async (points: number, type: 'checkin' | 'ad' | 'merge') => {
    const unified = reputationService.getUnifiedScore();
    setUnifiedScoreData(unified);
    setUserPoints({
      total: unified.totalScore,
      checkIn: unified.dailyCheckInPoints || 0,
      transactions: 0,
      activity: unified.blockchainScore || 0,
      streak: unified.streak || 0,
    });
  };

  const profilePageData = useMemo(() => ({
    walletData,
    username: username || 'Pioneer',
    isProUser,
    mode,
    userPoints,
    onPointsEarned: handlePointsEarned,
    onBack: () => setActiveSection('overview')
  }), [walletData, username, isProUser, mode, userPoints]);
  
  const [timelineData, setTimelineData] = useState<{ internal: ChartDataPoint[]; external: ChartDataPoint[] }>({ internal: [], external: [] });
  const [breakdownData, setBreakdownData] = useState<ChartDataPoint[]>([]);
  const [riskData, setRiskData] = useState<ChartDataPoint[]>([]);
  const [portfolioData, setPortfolioData] = useState<ChartDataPoint[]>([]);
  const [score, setScore] = useState<ChartReputationScore | null>(null);
  const [tokens, setTokens] = useState<TokenBalance[]>([]);

  useEffect(() => {
    const { transactions, score: mockScore, tokens: mockTokens } = generateMockChartData();
    const mapPeriodToTimeline = (p: '7d' | '30d' | '90d' | 'all') => {
      switch (p) {
        case '7d': return 'day';
        case '30d': return 'week';
        case '90d': return 'month';
        case 'all': default: return 'month';
      }
    };

    setTimelineData(processTransactionTimeline(transactions, mapPeriodToTimeline(period)));
    setBreakdownData(processScoreBreakdown(mockScore));
    setRiskData(processRiskActivity(transactions, mockScore));
    setPortfolioData(processTokenPortfolio(mockTokens));
    setScore(mockScore);
    setTokens(mockTokens);
  }, [period]);

  const atomicResult = useMemo(() => {
    if (unifiedScoreData) {
      const demoData = generateDemoActivityData();
      demoData.accountAgeDays = walletData.accountAge || 180;
      demoData.internalTxCount = walletData.transactions?.length || 25;
      demoData.dailyCheckins = unifiedScoreData.totalCheckInDays;
      demoData.adBonuses = Math.floor((unifiedScoreData.dailyCheckInPoints || 0) / 5);
      const result = calculateAtomicReputation(demoData);
      result.interaction.dailyCheckins = unifiedScoreData.totalCheckInDays;
      result.interaction.totalPoints = unifiedScoreData.totalScore;
      result.adjustedScore = unifiedScoreData.totalScore;
      result.rawScore = (unifiedScoreData.blockchainScore || 0) + (unifiedScoreData.dailyCheckInPoints || 0);
      return result;
    }
    const demoData = generateDemoActivityData();
    demoData.accountAgeDays = walletData.accountAge || 180;
    demoData.internalTxCount = walletData.transactions?.length || 25;
    return calculateAtomicReputation(demoData);
  }, [walletData.accountAge, walletData.transactions?.length, unifiedScoreData]);

  const modeAdjustedScore = useMemo(() => {
    const baseScore = atomicResult.adjustedScore;
    const impact = MODE_IMPACTS[mode.mode];
    return Math.round(baseScore * (impact.impactPercentage / 100));
  }, [atomicResult.adjustedScore, mode.mode]);

  const levelProgress = useMemo(() => {
    return getLevelProgress(modeAdjustedScore);
  }, [modeAdjustedScore]);

  const defaultColors = { text: '#00D9FF', bg: 'rgba(0, 217, 255, 0.1)', border: 'rgba(0, 217, 255, 0.3)' };
  const trustColors = TRUST_LEVEL_COLORS[levelProgress.currentLevel] || defaultColors;

  const handleModeChange = (newMode: NetworkMode) => {
    if (newMode === 'demo') {
      setMode({ mode: 'demo', connected: false });
      localStorage.setItem('reputaNetworkMode', 'demo');
    } else {
      setMode({ 
        mode: newMode, 
        connected: true,
        walletAddress: walletData.address
      });
      localStorage.setItem('reputaNetworkMode', newMode);
    }
  };

  const handleModeToggle = () => {
    const modes: NetworkMode[] = ['testnet', 'mainnet', 'demo'];
    const currentIndex = modes.indexOf(mode.mode);
    const nextIndex = (currentIndex + 1) % modes.length;
    handleModeChange(modes[nextIndex]);
  };

  const getReputationWithModeImpact = (baseScore: number): number => {
    const impact = MODE_IMPACTS[mode.mode];
    return Math.round(baseScore * (impact.impactPercentage / 100));
  };

  const handlePeriodChange = (newPeriod: 'day' | 'week' | 'month') => {
    const mapToState = (p: 'day' | 'week' | 'month') => p === 'day' ? '7d' : p === 'week' ? '30d' : '90d';
    setPeriod(mapToState(newPeriod));
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
    <div className="w-full min-h-screen futuristic-bg flex flex-col">
      <div className="absolute inset-0 grid-pattern pointer-events-none" />
      
      {/* Mobile Top Bar with Menu */}
      <TopBar 
        onMenuClick={() => setIsSideDrawerOpen(true)}
        balance={walletData.balance}
        username={username}
      />
      
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="desktop-sidebar hidden lg:flex">
        <DashboardSidebar 
          mode={mode} 
          onModeToggle={handleModeToggle}
          activeItem={activeSection === 'overview' ? 'dashboard' : activeSection}
          onItemClick={handleSidebarNavigation}
        />
      </div>

      <main className="flex-1 p-3 lg:p-6 overflow-x-hidden overflow-y-auto relative z-10 mobile-main-content pt-16 lg:pt-3 pb-24 lg:pb-6 w-full">
        {/* Mobile Spacer for Fixed Header */}
        <div className="h-4 lg:hidden" />
        {/* Desktop Section Header - hidden on mobile */}
        <div className="hidden lg:flex items-center justify-between mb-4 sm:mb-5">
          <div className="flex items-center gap-2 sm:gap-3">
            <button 
              onClick={onReset}
              className="p-2 rounded-lg transition-all active:scale-95 hover:bg-white/5 touch-target"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
            </button>
            <h1 className="text-sm sm:text-lg font-bold uppercase tracking-wider text-white/90">
              {activeSection === 'overview' ? 'Reputa Score' : 
               activeSection === 'analytics' ? 'Analytics' :
               activeSection === 'transactions' ? 'Activity' :
               activeSection === 'audit' ? 'Audit Report' :
               activeSection === 'portfolio' ? 'Portfolio' :
               activeSection === 'wallet' ? 'Wallet' :
               activeSection === 'network' ? 'Network' :
               activeSection === 'profile' ? 'Profile' :
               activeSection === 'settings' ? 'Settings' :
               activeSection}
            </h1>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <ModeStatusBadge mode={mode.mode} compact />
            
            {!isProUser && (
              <Button 
                onClick={onUpgradePrompt} 
                className="bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold text-[10px] sm:text-xs uppercase px-2 sm:px-3 py-1.5 hover:opacity-90 transition-opacity"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Pro</span>
              </Button>
            )}
            
            <button
              onClick={() => window.location.reload()}
              className="p-2 rounded-lg transition-all active:scale-95 hover:bg-white/5 touch-target"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4 text-purple-400" />
            </button>
          </div>
        </div>

        {/* Main Profile Card - Always visible at top */}
        <div className="mb-5">
          <MainCard
            username={username || 'Pioneer'}
            walletAddress={walletData.address}
            balance={walletData.balance}
            reputaScore={mode.mode === 'demo' ? 0 : levelProgress.displayScore}
            level={levelProgress.levelIndex + 1}
            trustLevel={levelProgress.currentLevel}
            progressPercent={Math.round(levelProgress.progressInLevel)}
            pointsToNext={levelProgress.pointsToNextLevel}
            maxPoints={getBackendScoreCap()}
            isVip={isProUser}
            onShare={() => setShowShareCard(true)}
          />
        </div>

        {/* Section Navigation - Hidden on mobile (using bottom nav) */}
        <div className="hidden sm:flex items-center gap-2 mb-5 overflow-x-auto pb-1">
          {sectionButtons.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold uppercase tracking-wide transition-all whitespace-nowrap ${
                activeSection === section.id
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              }`}
            >
              <section.icon className={`w-3.5 h-3.5 ${activeSection === section.id ? 'text-purple-400' : ''}`} />
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
                    <div onClick={(e) => e.stopPropagation()}>
                      <PointsExplainer
                        currentPoints={userPoints.total}
                        checkInPoints={userPoints.checkIn}
                        transactionPoints={userPoints.transactions}
                        activityPoints={userPoints.activity}
                        streakBonus={userPoints.streak}
                      />
                    </div>
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
            <Suspense fallback={<div className="py-6 text-center">Loading transactions...</div>}>
              <TransactionList 
                transactions={walletData?.transactions?.slice(0, 4) || []} 
                walletAddress={walletData?.address || ''} 
              />
            </Suspense>
            </div>
          </div>
        )}

        {activeSection === 'analytics' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <Suspense fallback={<div className="py-12 text-center">Loading analytics...</div>}>
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
            </Suspense>
          </div>
        )}

        {activeSection === 'transactions' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <Suspense fallback={<div className="py-12 text-center">Loading transactions...</div>}>
              <div className="glass-card p-5" style={{ border: '1px solid rgba(0, 217, 255, 0.2)' }}>
                <TransactionList 
                  transactions={walletData?.transactions || []} 
                  walletAddress={walletData?.address || ''} 
                />
              </div>
            </Suspense>
          </div>
        )}

        {activeSection === 'audit' && (
          <div className="space-y-6 animate-in fade-in duration-300 relative">
            <Suspense fallback={<div className="py-12 text-center">Loading audit report...</div>}>
              <AuditReport 
                walletData={{
                  ...walletData,
                  transactions: walletData?.transactions || []
                }} 
                isProUser={isProUser} 
                onUpgradePrompt={onUpgradePrompt}
              />
            </Suspense>
            
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
            <Suspense fallback={<div className="py-12 text-center">Loading portfolio...</div>}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-5" style={{ border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <TokenPortfolio data={portfolioData} />
                </div>
                <div className="glass-card p-5" style={{ border: '1px solid rgba(0, 217, 255, 0.2)' }}>
                  <PiDexSection 
                    walletAddress={walletData.address}
                    balance={walletData.balance}
                    totalSent={walletData.transactions?.filter(tx => tx.type === 'sent').reduce((sum, tx) => sum + tx.amount, 0) || 0}
                    totalReceived={walletData.transactions?.filter(tx => tx.type === 'received').reduce((sum, tx) => sum + tx.amount, 0) || 0}
                    isMainnet={mode.mode !== 'testnet'}
                  />
                </div>
              </div>
            </Suspense>
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
                    <p className="text-2xl font-black neon-text-purple">{(walletData.balance ?? 0).toFixed(4)} <span className="text-purple-400">π</span></p>
                  </div>
                  
                  <div className="p-4 rounded-xl" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-2">Account Age</p>
                    <p className="text-xl font-black text-emerald-400">{walletData.accountAge ?? 0} days</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 rounded-xl" style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-2">Reputa Score</p>
                    <p className="text-2xl font-black neon-text-purple">{walletData.reputaScore ?? 0} <span className="text-gray-500 text-sm">/ 1000</span></p>
                  </div>
                  
                  <div className="p-4 rounded-xl" style={{ background: 'rgba(0, 217, 255, 0.1)', border: '1px solid rgba(0, 217, 255, 0.2)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 mb-2">Total Transactions</p>
                    <p className="text-xl font-black text-cyan-400">{walletData.totalTransactions || (walletData.transactions?.length ?? 0)}</p>
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
              <AtomicProtocolPage onBack={() => setNetworkSubPage(null)} />
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

                {/* Quick Preview Widget */}
                <div className="grid grid-cols-1 gap-6">
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

          </div>
        )}

        {activeSection === 'settings' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Network Mode Selection - Only Mainnet & Testnet */}
            <div className="glass-card p-6" style={{ border: '1px solid rgba(0, 217, 255, 0.2)' }}>
              <div className="flex items-center gap-3 mb-4">
                <Globe className="w-6 h-6 text-cyan-400" />
                <div>
                  <h2 className="text-lg font-black uppercase tracking-wide text-white">
                    {language === 'ar' ? 'وضع الشبكة' : 'Network Mode'}
                  </h2>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                    {language === 'ar' ? 'التبديل بين الشبكة الرئيسية و شبكة الاختبار' : 'Switch between Mainnet and Testnet'}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => handleModeChange('mainnet')}
                  className={`flex-1 p-4 rounded-xl transition-all duration-300 ${
                    mode.mode === 'mainnet'
                      ? 'border-2 border-green-500 bg-green-500/10'
                      : 'border-2 border-gray-600 bg-gray-800/20 hover:border-green-400'
                  }`}
                >
                  <Globe className={`w-5 h-5 mx-auto mb-2 ${mode.mode === 'mainnet' ? 'text-green-400' : 'text-gray-400'}`} />
                  <p className={`text-sm font-bold uppercase ${mode.mode === 'mainnet' ? 'text-green-400' : 'text-gray-400'}`}>
                    {language === 'ar' ? 'الشبكة الرئيسية' : 'Mainnet'}
                  </p>
                  <p className={`text-[10px] ${mode.mode === 'mainnet' ? 'text-green-300' : 'text-gray-500'}`}>
                    {language === 'ar' ? '100% تأثير' : '100% Impact'}
                  </p>
                </button>
                
                <button
                  onClick={() => handleModeChange('testnet')}
                  className={`flex-1 p-4 rounded-xl transition-all duration-300 ${
                    mode.mode === 'testnet'
                      ? 'border-2 border-amber-500 bg-amber-500/10'
                      : 'border-2 border-gray-600 bg-gray-800/20 hover:border-amber-400'
                  }`}
                >
                  <TestTube className={`w-5 h-5 mx-auto mb-2 ${mode.mode === 'testnet' ? 'text-amber-400' : 'text-gray-400'}`} />
                  <p className={`text-sm font-bold uppercase ${mode.mode === 'testnet' ? 'text-amber-400' : 'text-gray-400'}`}>
                    {language === 'ar' ? 'شبكة الاختبار' : 'Testnet'}
                  </p>
                  <p className={`text-[10px] ${mode.mode === 'testnet' ? 'text-amber-300' : 'text-gray-500'}`}>
                    {language === 'ar' ? '25% تأثير' : '25% Impact'}
                  </p>
                </button>
              </div>
              
              <div className="mt-4 p-3 rounded-lg" style={{ 
                background: MODE_IMPACTS[mode.mode].bgColor,
                border: `1px solid ${MODE_IMPACTS[mode.mode].borderColor}`
              }}>
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 mt-0.5" style={{ color: MODE_IMPACTS[mode.mode].color }} />
                  <div>
                    <p className="text-xs font-semibold" style={{ color: MODE_IMPACTS[mode.mode].color }}>
                      {language === 'ar' ? 'معلومات الوضع' : 'Mode Information'}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {mode.mode === 'mainnet' && (language === 'ar' 
                        ? 'سمعتك تُحسب بالكامل من بيانات الشبكة الرئيسية الحقيقية. هذا هو الوضع الفعلي والعامل.'
                        : 'Your reputation is fully calculated from real mainnet blockchain data. This is the live and operational mode.'
                      )}
                      {mode.mode === 'testnet' && (language === 'ar'
                        ? 'نشاط شبكة الاختبار يضيف فقط 25% كنقاط مكملة للتجربة والاختبار الآمن.'
                        : 'Testnet activity adds only 25% as supplementary points for safe testing and experimentation.'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* User Preferences Settings */}
            <div className="glass-card p-6" style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }}>
              <div className="flex items-center gap-3 mb-6">
                <Settings className="w-6 h-6 text-purple-400" />
                <h2 className="text-lg font-black uppercase tracking-wide text-white">
                  {language === 'ar' ? 'تفضيلات المستخدم' : 'User Preferences'}
                </h2>
              </div>
              <div className="space-y-4">
                {/* Dark Mode */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-colors">
                  <div>
                    <p className="text-sm font-bold text-white uppercase tracking-wide">
                      {language === 'ar' ? 'الوضع الداكن' : 'Dark Mode'}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {language === 'ar' ? 'مفعّل دائماً حسب إعدادات النظام' : 'Always enabled based on system settings'}
                    </p>
                  </div>
                  <div className="w-12 h-6 bg-purple-600 rounded-full relative shadow-lg shadow-purple-600/30">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full transition-all" />
                  </div>
                </div>

                {/* Push Notifications */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-colors">
                  <div>
                    <p className="text-sm font-bold text-white uppercase tracking-wide">
                      {language === 'ar' ? 'إشعارات النشاط' : 'Activity Notifications'}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {language === 'ar' ? 'استلام تنبيهات للنشاط المهم والتحديثات' : 'Get alerts for important activity and updates'}
                    </p>
                  </div>
                  <div className="w-12 h-6 bg-purple-600 rounded-full relative shadow-lg shadow-purple-600/30">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full transition-all" />
                  </div>
                </div>

                {/* Sound Notifications */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-colors">
                  <div>
                    <p className="text-sm font-bold text-white uppercase tracking-wide">
                      {language === 'ar' ? 'تنبيهات الصوت' : 'Sound Notifications'}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {language === 'ar' ? 'تشغيل صوت عند الإشعارات المهمة' : 'Play sound for important notifications'}
                    </p>
                  </div>
                  <div className="w-12 h-6 bg-gray-700 rounded-full relative shadow-lg shadow-gray-700/30">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all" />
                  </div>
                </div>

                {/* Email Notifications */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-colors">
                  <div>
                    <p className="text-sm font-bold text-white uppercase tracking-wide">
                      {language === 'ar' ? 'إشعارات البريد الإلكتروني' : 'Email Notifications'}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {language === 'ar' ? 'استقبال تقارير أسبوعية وملخصات السمعة' : 'Receive weekly reports and reputation summaries'}
                    </p>
                  </div>
                  <div className="w-12 h-6 bg-gray-700 rounded-full relative shadow-lg shadow-gray-700/30">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all" />
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy & Security Settings */}
            <div className="glass-card p-6" style={{ border: '1px solid rgba(255, 87, 34, 0.2)' }}>
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-6 h-6 text-orange-400" />
                <h2 className="text-lg font-black uppercase tracking-wide text-white">
                  {language === 'ar' ? 'الخصوصية والأمان' : 'Privacy & Security'}
                </h2>
              </div>
              <div className="space-y-4">
                {/* Show Wallet Address */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-orange-500/30 transition-colors">
                  <div>
                    <p className="text-sm font-bold text-white uppercase tracking-wide">
                      {language === 'ar' ? 'إظهار عنوان المحفظة' : 'Show Wallet Address'}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {language === 'ar' ? 'عرض عنوان المحفظة في الملف الشخصي العام' : 'Display wallet address on public profile'}
                    </p>
                  </div>
                  <div className="w-12 h-6 bg-purple-600 rounded-full relative shadow-lg shadow-purple-600/30">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full transition-all" />
                  </div>
                </div>

                {/* Profile Visibility */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-orange-500/30 transition-colors">
                  <div>
                    <p className="text-sm font-bold text-white uppercase tracking-wide">
                      {language === 'ar' ? 'ظهور الملف الشخصي' : 'Profile Visibility'}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {language === 'ar' ? 'السماح للآخرين برؤية ملفك الشخصي' : 'Allow others to view your profile'}
                    </p>
                  </div>
                  <div className="w-12 h-6 bg-purple-600 rounded-full relative shadow-lg shadow-purple-600/30">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full transition-all" />
                  </div>
                </div>

                {/* Two-Factor Authentication */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-orange-500/30 transition-colors">
                  <div>
                    <p className="text-sm font-bold text-white uppercase tracking-wide">
                      {language === 'ar' ? 'المصادقة الثنائية' : '2FA Security'}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {language === 'ar' ? 'تفعيل حماية إضافية لحسابك' : 'Add extra layer of security to your account'}
                    </p>
                  </div>
                  <div className="w-12 h-6 bg-gray-700 rounded-full relative shadow-lg shadow-gray-700/30">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all" />
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="glass-card p-6" style={{ border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <div className="flex items-center gap-3 mb-6">
                <Zap className="w-6 h-6 text-blue-400" />
                <h2 className="text-lg font-black uppercase tracking-wide text-white">
                  {language === 'ar' ? 'الإعدادات المتقدمة' : 'Advanced Settings'}
                </h2>
              </div>
              <div className="space-y-4">
                {/* Auto-Sync Blockchain */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition-colors">
                  <div>
                    <p className="text-sm font-bold text-white uppercase tracking-wide">
                      {language === 'ar' ? 'مزامنة تلقائية' : 'Auto-Sync Blockchain'}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {language === 'ar' ? 'مزامنة بيانات البلوكشين تلقائياً كل ساعة' : 'Automatically sync blockchain data hourly'}
                    </p>
                  </div>
                  <div className="w-12 h-6 bg-purple-600 rounded-full relative shadow-lg shadow-purple-600/30">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full transition-all" />
                  </div>
                </div>

                {/* Cache Data */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition-colors">
                  <div>
                    <p className="text-sm font-bold text-white uppercase tracking-wide">
                      {language === 'ar' ? 'تخزين مؤقت محلي' : 'Local Caching'}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {language === 'ar' ? 'تخزين البيانات محلياً لسرعة أكبر' : 'Cache data locally for faster loading'}
                    </p>
                  </div>
                  <div className="w-12 h-6 bg-purple-600 rounded-full relative shadow-lg shadow-purple-600/30">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full transition-all" />
                  </div>
                </div>

                {/* Analytics */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition-colors">
                  <div>
                    <p className="text-sm font-bold text-white uppercase tracking-wide">
                      {language === 'ar' ? 'تحليلات الاستخدام' : 'Usage Analytics'}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {language === 'ar' ? 'السماح بجمع بيانات التحليلات المجهولة' : 'Allow anonymous analytics data collection'}
                    </p>
                  </div>
                  <div className="w-12 h-6 bg-gray-700 rounded-full relative shadow-lg shadow-gray-700/30">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all" />
                  </div>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="glass-card p-6" style={{ border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <div className="flex items-center gap-3 mb-6">
                <AlertCircle className="w-6 h-6 text-red-400" />
                <h2 className="text-lg font-black uppercase tracking-wide text-white">
                  {language === 'ar' ? 'منطقة الخطر' : 'Danger Zone'}
                </h2>
              </div>
              <button className="w-full p-4 rounded-xl bg-red-600/20 border-2 border-red-600/50 hover:bg-red-600/30 hover:border-red-500 transition-all group">
                <p className="text-sm font-bold text-red-400 uppercase tracking-wide group-hover:text-red-300">
                  {language === 'ar' ? 'حذف حسابي' : 'Delete My Account'}
                </p>
                <p className="text-[10px] text-red-400/70 group-hover:text-red-300/70">
                  {language === 'ar' ? 'هذا الإجراء دائم ولا يمكن التراجع عنه' : 'This action is permanent and cannot be reversed'}
                </p>
              </button>
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
      </main>

      {/* Mobile Bottom Navigation - visible only on mobile */}
      <MobileBottomNav
        activeItem={activeSection === 'overview' ? 'dashboard' : activeSection}
        onItemClick={handleSidebarNavigation}
        onMenuClick={() => setIsSideDrawerOpen(true)}
      />

      {/* Side Drawer for mobile */}
      <SideDrawer
        isOpen={isSideDrawerOpen}
        onClose={() => setIsSideDrawerOpen(false)}
        activeItem={activeSection === 'overview' ? 'dashboard' : activeSection}
        onItemClick={(item) => {
          handleSidebarNavigation(item);
          setIsSideDrawerOpen(false);
        }}
        username={username}
        walletAddress={walletData.address}
        balance={walletData.balance}
        onLogout={onReset}
      />

      {/* Share Card Modal */}
      {showShareCard && (
        <ShareReputaCard
          username={username || 'Pioneer'}
          score={mode.mode === 'demo' ? 0 : (unifiedScoreData?.totalScore ?? levelProgress.displayScore)}
          level={levelProgress.levelIndex + 1}
          trustRank={unifiedScoreData?.atomicTrustLevel ?? levelProgress.currentLevel}
          walletAddress={walletData.address}
          onClose={() => setShowShareCard(false)}
        />
      )}
    </div>
  );
}
