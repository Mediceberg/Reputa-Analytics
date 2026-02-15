import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';  
import { useLanguage } from '../hooks/useLanguage';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { SideDrawer } from '../components/SideDrawer';
import { TopBar } from '../components/TopBar';
import { MainCard } from '../components/MainCard';
import { FutureTasksPage } from './FutureTasksPage';
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
const ActivityHub = React.lazy(async () => ({ default: (await import('./ActivityHub')).ActivityHub }));
import { PendingRewardsCounter } from '../components/PendingRewardsCounter';
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
import { useReputationEngine } from '../hooks/useReputationEngine';
import { 
  LayoutDashboard, PieChart, Activity, LineChart, Settings, MessageSquare, HelpCircle,
  ArrowLeft, User, Wallet, Shield, Globe, Sparkles, Award, AlertCircle,
  RefreshCw, Network, Zap, FileText, Copy, ExternalLink, Bell, Moon, Sun,
  Trophy, Info, BarChart3, TrendingUp, TestTube, ChevronDown, BookOpen
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { FUTURE_TASKS_CONFIG } from '../protocol/futureTasks';
import { fetchWalletData } from '../protocol/wallet';
import { walletDataService } from '../services/walletDataService';

interface UnifiedDashboardProps {
  walletData: WalletData;
  isProUser: boolean;
  onReset: () => void;
  onUpgradePrompt: () => void;
  username?: string;
}

type ActiveSection =
  | 'overview'
  | 'analytics'
  | 'transactions'
  | 'audit'
  | 'portfolio'
  | 'wallet'
  | 'network'
  | 'rank'
  | 'earn-points'
  | 'profile'
  | 'settings'
  | 'feedback'
  | 'help'
  | 'activity-hub'
  | 'how-it-works';
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
  // Live wallet data — starts from prop, re-fetched on network switch
  const [liveWalletData, setLiveWalletData] = useState<WalletData>(walletData);
  const [networkLoading, setNetworkLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<ActiveSection>('overview');
  const sectionPaths: Record<ActiveSection, string> = {
    'overview': '/',
    'analytics': '/analytics',
    'transactions': '/activity',
    'audit': '/audit',
    'portfolio': '/portfolio',
    'wallet': '/wallet',
    'network': '/network',
    'rank': '/rank',
    'earn-points': '/earn-points',
    'profile': '/profile',
    'settings': '/settings',
    'feedback': '/feedback',
    'help': '/help',
    'how-it-works': '/how-it-works',
  };

  const activeSectionLabel = useMemo(() => {
    const sectionLabels: Record<string, string> = {
      'overview': 'Reputa Score',
      'analytics': 'Analytics',
      'transactions': 'Activity',
      'audit': 'Audit Report',
      'portfolio': 'Portfolio',
      'wallet': 'Wallet',
      'network': 'Network',
      'rank': 'Leaderboard',
      'earn-points': 'Earn Points',
      'settings': 'Settings'
    };
    return sectionLabels[activeSection] || activeSection;
  }, [activeSection]);
  const [networkSubPage, setNetworkSubPage] = useState<NetworkSubPage>(null);
  const [isSideDrawerOpen, setIsSideDrawerOpen] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [unifiedScoreData, setUnifiedScoreData] = useState<UnifiedScoreData | null>(null);
  const [reputationUid, setReputationUid] = useState<string>('demo');
  const reputationEngine = useReputationEngine(reputationUid);
  const [pendingRewards, setPendingRewards] = useState(() => reputationService.getPendingRewards());
  const [userPoints, setUserPoints] = useState({
    total: 0,
    checkIn: 0,
    transactions: 0,
    activity: 0,
    streak: 0,
  });
  const weeklyDaysRemaining = Math.max(0, 7 - userPoints.activity);
  
  useEffect(() => {
    async function loadUnifiedScore() {
      const isDemo = mode.mode === 'demo' || !username || username === 'Guest_Explorer';
      const uid = isDemo ? 'demo' : (localStorage.getItem('piUserId') || `user_${Date.now()}`);
      setReputationUid(uid);
      
      if (isDemo) {
        reputationService.setDemoMode(true);
      }

      // load cached value first to avoid UI flicker
      const cached = reputationService.getCachedUnifiedScore(uid);
      if (cached) {
        setUnifiedScoreData(cached);
        setUserPoints({
          total: cached.appEngageScore || cached.dailyCheckInPoints || 0,
          checkIn: cached.dailyCheckInPoints || 0,
          transactions: cached.totalCheckInDays || 0,
          activity: cached.totalCheckInDays || 0,
          streak: cached.streak || 0,
        });
      }

      await reputationService.loadUserReputation(uid);
      const unified = reputationService.getUnifiedScore();
      setUnifiedScoreData(unified);
      setUserPoints({
        total: unified.appEngageScore || unified.dailyCheckInPoints || 0,
        checkIn: unified.dailyCheckInPoints || 0,
        transactions: unified.totalCheckInDays || 0,
        activity: unified.totalCheckInDays || 0,
        streak: unified.streak || 0,
      });
    }
    loadUnifiedScore();
  }, [mode.mode, username]);

  useEffect(() => {
    const unsubscribe = reputationService.subscribeUnifiedScore((score) => {
      if (score.uid && score.uid !== reputationUid) return;
      setUnifiedScoreData(score);
      setUserPoints({
        total: score.appEngageScore || score.dailyCheckInPoints || 0,
        checkIn: score.dailyCheckInPoints || 0,
        transactions: score.totalCheckInDays || 0,
        activity: score.totalCheckInDays || 0,
        streak: score.streak || 0,
      });
      setPendingRewards(reputationService.getPendingRewards());
    });

    return unsubscribe;
  }, [reputationUid]);

  useEffect(() => {
    setPendingRewards(reputationService.getPendingRewards());
  }, [unifiedScoreData]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeSection, networkSubPage]);

  useEffect(() => {
    const path = window.location.pathname;
    const matchedSection = (Object.entries(sectionPaths).find(([, value]) => value === path) || [])[0] as ActiveSection | undefined;
    if (matchedSection && matchedSection !== activeSection) {
      setActiveSection(matchedSection);
    }
  }, []);

  const handlePointsEarned = async (points: number, type: 'checkin' | 'ad' | 'merge') => {
    const unified = reputationService.getUnifiedScore();
    setUnifiedScoreData(unified);
    setUserPoints({
      total: unified.appEngageScore || unified.dailyCheckInPoints || 0,
      checkIn: unified.dailyCheckInPoints || 0,
      transactions: unified.totalCheckInDays || 0,
      activity: unified.totalCheckInDays || 0,
      streak: unified.streak || 0,
    });
    setPendingRewards(reputationService.getPendingRewards());
  };

  const handleWeeklyClaim = async () => {
    try {
      await reputationService.claimRewards();
      const unified = reputationService.getUnifiedScore();
      setUnifiedScoreData(unified);
      setUserPoints({
        total: unified.appEngageScore || unified.dailyCheckInPoints || 0,
        checkIn: unified.dailyCheckInPoints || 0,
        transactions: unified.totalCheckInDays || 0,
        activity: unified.totalCheckInDays || 0,
        streak: unified.streak || 0,
      });
      setPendingRewards(reputationService.getPendingRewards());
    } catch (error) {
      console.error('Weekly claim failed:', error);
    }
  };

  const profilePageData = useMemo(() => ({
    walletData: liveWalletData,
    username: username || 'Pioneer',
    isProUser,
    mode,
    userPoints,
    onPointsEarned: handlePointsEarned,
    onBack: () => setActiveSection('overview')
  }), [liveWalletData, username, isProUser, mode, userPoints]);
  
  const [timelineData, setTimelineData] = useState<{ internal: ChartDataPoint[]; external: ChartDataPoint[] }>({ internal: [], external: [] });
  const [breakdownData, setBreakdownData] = useState<ChartDataPoint[]>([]);
  const [riskData, setRiskData] = useState<ChartDataPoint[]>([]);
  const [portfolioData, setPortfolioData] = useState<ChartDataPoint[]>([]);
  const [score, setScore] = useState<ChartReputationScore | null>(null);
  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [pointsModalOpen, setPointsModalOpen] = useState(false);

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
    const activityData = generateDemoActivityData();
    activityData.accountAgeDays = liveWalletData.accountAge || 180;
    
    // Use real wallet data for transaction counts
    const txCount = liveWalletData.transactions?.length || 0;
    const receivedTx = liveWalletData.transactions?.filter((t: any) => t.type === 'internal').length || 0;
    const sentTx = liveWalletData.transactions?.filter((t: any) => t.type === 'external').length || 0;
    
    activityData.internalTxCount = receivedTx;
    activityData.appInteractions = sentTx;
    activityData.mainnetTxCount = liveWalletData.mainnetTxCount ?? txCount;
    activityData.testnetTxCount = liveWalletData.testnetTxCount ?? txCount;
    activityData.totalVolume = liveWalletData.balance || 0;
    activityData.uniqueContacts = Math.min(Math.floor(txCount / 3), 30);
    activityData.regularActivityWeeks = Math.min(Math.floor((liveWalletData.accountAge || 0) / 7), 52);
    
    // App engagement from reputation service
    if (unifiedScoreData) {
      activityData.dailyCheckins = unifiedScoreData.totalCheckInDays || 0;
      activityData.adBonuses = 0;
      activityData.reportViews = 0;
      activityData.toolUsage = 0;
    } else {
      activityData.dailyCheckins = 0;
      activityData.adBonuses = 0;
      activityData.reportViews = 0;
      activityData.toolUsage = 0;
    }
    
    activityData.sdkPayments = 0;
    activityData.normalTrades = 0;
    activityData.stakingDays = 0;
    
    return calculateAtomicReputation(activityData);
  }, [liveWalletData.accountAge, liveWalletData.transactions?.length, liveWalletData.balance, unifiedScoreData]);

  const levelProgress = useMemo(() => {
    return getLevelProgress(atomicResult.adjustedScore);
  }, [atomicResult.adjustedScore]);

  const defaultColors = { text: '#00D9FF', bg: 'rgba(0, 217, 255, 0.1)', border: 'rgba(0, 217, 255, 0.3)' };
  const trustColors = TRUST_LEVEL_COLORS[levelProgress.currentLevel] || defaultColors;

  const handleModeChange = useCallback(async (newMode: NetworkMode) => {
    if (newMode === 'demo') {
      setMode({ mode: 'demo', connected: false });
      localStorage.setItem('reputaNetworkMode', 'demo');
      return;
    }

    // 1. Sync ALL localStorage keys so every service reads the same value
    localStorage.setItem('reputaNetworkMode', newMode);
    localStorage.setItem('PI_NETWORK', newMode);

    // 2. Update WalletDataService singleton at runtime
    walletDataService.setNetwork(newMode);

    // 3. Update React state
    setMode({ mode: newMode, connected: true, walletAddress: liveWalletData.address });

    // 4. Re-fetch wallet data from the new network
    const address = liveWalletData.address;
    if (!address || address.includes('DEMO')) return;

    setNetworkLoading(true);
    try {
      const freshData = await fetchWalletData(address);
      setLiveWalletData(freshData);
      console.log(`[Network Switch] Fetched ${newMode} data for ${address.slice(0, 8)}...`, {
        balance: freshData.balance,
        txCount: freshData.transactions?.length,
      });
    } catch (error) {
      console.warn(`[Network Switch] Failed to fetch ${newMode} data, keeping current:`, error);
    } finally {
      setNetworkLoading(false);
    }
  }, [liveWalletData.address]);

  const handleModeToggle = () => {
    const modes: NetworkMode[] = ['testnet', 'mainnet', 'demo'];
    const currentIndex = modes.indexOf(mode.mode);
    const nextIndex = (currentIndex + 1) % modes.length;
    handleModeChange(modes[nextIndex]);
  };

  const handleFastNetworkToggle = () => {
    const newMode = mode.mode === 'mainnet' ? 'testnet' : 'mainnet';
    handleModeChange(newMode);
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
      'earn-points': 'earn-points',
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
    ...(FUTURE_TASKS_CONFIG.enabled
      ? [{ id: 'earn-points' as ActiveSection, icon: Sparkles, label: 'Earn Points' }]
      : []),
  ];

  return (
    <div className="w-full min-h-screen futuristic-bg flex flex-col">
      <div className="absolute inset-0 grid-pattern pointer-events-none" />
      
      {/* Mobile Top Bar with Menu */}
      <TopBar 
        onMenuClick={() => setIsSideDrawerOpen(true)}
        balance={liveWalletData.balance}
        username={username}
        networkMode={mode.mode}
        onNetworkToggle={handleFastNetworkToggle}
        networkLoading={networkLoading}
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
        {/* Network Switch Loading Overlay */}
        {networkLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full animate-pulse" style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)', filter: 'blur(20px)', transform: 'scale(2)' }} />
                <div className="relative w-12 h-12 rounded-full animate-spin border-3 border-indigo-500/20 border-t-indigo-500" style={{ borderWidth: '3px' }} />
              </div>
              <p className="text-sm font-bold uppercase tracking-wider text-indigo-400 animate-pulse">
                Switching Network...
              </p>
              <p className="text-[10px] text-gray-500 text-center max-w-xs">
                Re-fetching wallet data from {mode.mode === 'mainnet' ? 'Mainnet' : 'Testnet'}
              </p>
            </div>
          </div>
        )}
        
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
               activeSection === 'earn-points' ? 'Earn Points' :
               activeSection === 'activity-hub' ? 'Activity Hub' :
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
            walletAddress={liveWalletData.address}
            balance={liveWalletData.balance}
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
              consistencyScore={liveWalletData.consistencyScore ?? 85}
              networkTrust={liveWalletData.networkTrust ?? 90}
              mainnetPoints={atomicResult.mainnetScore}
              testnetPoints={atomicResult.testnetScore}
              appEngagementPoints={atomicResult.appEngageScore}
            />

            {/* ═══ Unified 6-Card Action Grid ═══ */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { id: 'transactions' as ActiveSection, label: 'TOTAL TX', sub: `${liveWalletData?.totalTransactions || 0} Transactions`, icon: Activity, gradient: 'from-purple-500/20 to-violet-500/20', border: 'rgba(139, 92, 246, 0.25)', text: 'text-purple-400', glow: 'hover:shadow-[0_0_20px_rgba(139,92,246,0.15)]' },
                { id: 'how-it-works' as ActiveSection, label: 'HOW IT WORKS', sub: 'Learn & Guide', icon: BookOpen, gradient: 'from-cyan-500/20 to-blue-500/20', border: 'rgba(0, 217, 255, 0.25)', text: 'text-cyan-400', glow: 'hover:shadow-[0_0_20px_rgba(0,217,255,0.15)]' },
                { id: 'portfolio' as ActiveSection, label: 'PORTFOLIO', sub: `${tokens.length} Tokens`, icon: PieChart, gradient: 'from-emerald-500/20 to-teal-500/20', border: 'rgba(16, 185, 129, 0.25)', text: 'text-emerald-400', glow: 'hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]' },
                { id: 'audit' as ActiveSection, label: 'FULL REPORT', sub: 'Audit & Trust', icon: FileText, gradient: 'from-amber-500/20 to-orange-500/20', border: 'rgba(245, 158, 11, 0.25)', text: 'text-amber-400', glow: 'hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]' },
                { id: 'rank' as ActiveSection, label: 'RANK', sub: 'Leaderboard', icon: Trophy, gradient: 'from-rose-500/20 to-pink-500/20', border: 'rgba(244, 63, 94, 0.25)', text: 'text-rose-400', glow: 'hover:shadow-[0_0_20px_rgba(244,63,94,0.15)]' },
                { id: 'activity-hub' as ActiveSection, label: 'ACTIVITY HUB', sub: 'Claim & Monitor', icon: Zap, gradient: 'from-indigo-500/20 to-purple-500/20', border: 'rgba(99, 102, 241, 0.25)', text: 'text-indigo-400', glow: 'hover:shadow-[0_0_20px_rgba(99,102,241,0.15)]' },
              ].map((card) => (
                <button
                  key={card.id}
                  onClick={() => setActiveSection(card.id)}
                  className={`group relative p-4 rounded-xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] ${card.glow}`}
                  style={{
                    background: 'linear-gradient(145deg, rgba(15, 17, 23, 0.8) 0%, rgba(20, 24, 32, 0.6) 100%)',
                    border: `1px solid ${card.border}`,
                  }}
                >
                  <div className="flex flex-col items-center text-center space-y-2.5">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center border border-white/10 group-hover:border-white/20 transition-all`}>
                      <card.icon className={`w-5 h-5 ${card.text} group-hover:brightness-125 transition-all`} />
                    </div>
                    <div>
                      <p className={`text-[11px] font-black uppercase tracking-wider ${card.text} group-hover:brightness-125 transition-all`}>{card.label}</p>
                      <p className="text-[9px] text-gray-500 mt-0.5">{card.sub}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <Suspense fallback={null}>
              <PointsExplainer
                controlledOpen={pointsModalOpen}
                setControlledOpen={setPointsModalOpen}
                currentPoints={userPoints.total}
                mainnetPoints={atomicResult.mainnetScore}
                testnetPoints={atomicResult.testnetScore}
                appEngagementPoints={atomicResult.appEngageScore}
              />
            </Suspense>

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

                <div className="mt-4 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-amber-400/80">App Points (Weekly Claim)</p>
                      <p className="text-[10px] text-white/40">App + Daily Check-in points are collected here until weekly claim.</p>
                    </div>
                  </div>
                  <PendingRewardsCounter
                    rewards={pendingRewards.rewards}
                    totalPoints={pendingRewards.totalPoints}
                    recurringPoints={pendingRewards.recurringPoints}
                    appPoints={pendingRewards.appPoints}
                    onClaim={handleWeeklyClaim}
                    isClaimable={userPoints.activity >= 7}
                    daysRemaining={weeklyDaysRemaining}
                  />
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
                transactions={liveWalletData?.transactions?.slice(0, 4) || []} 
                walletAddress={liveWalletData?.address || ''} 
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
                  transactions={liveWalletData?.transactions || []} 
                  walletAddress={liveWalletData?.address || ''} 
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
                  ...liveWalletData,
                  transactions: liveWalletData?.transactions || []
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
                    <Shield className="w-6 h-6" style={{ color: '#8B5CF6' }} />
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
                    walletAddress={liveWalletData.address}
                    balance={liveWalletData.balance}
                    totalSent={liveWalletData.transactions?.filter(tx => tx.type === 'sent').reduce((sum, tx) => sum + tx.amount, 0) || 0}
                    totalReceived={liveWalletData.transactions?.filter(tx => tx.type === 'received').reduce((sum, tx) => sum + tx.amount, 0) || 0}
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
                    <p className="font-mono text-sm text-white break-all">{liveWalletData.address}</p>
                  </div>
                  
                  <div className="p-4 rounded-xl" style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-2">Available Balance</p>
                    <p className="text-2xl font-black neon-text-purple">{(liveWalletData.balance ?? 0).toFixed(4)} <span className="text-purple-400">π</span></p>
                  </div>
                  
                  <div className="p-4 rounded-xl" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-2">Account Age</p>
                    <p className="text-xl font-black text-emerald-400">{liveWalletData.accountAge ?? 0} days</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 rounded-xl" style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-2">Atomic Score</p>
                    <p className="text-2xl font-black neon-text-purple">{atomicResult.adjustedScore.toLocaleString()} <span className="text-gray-500 text-sm">/ {getBackendScoreCap().toLocaleString()}</span></p>
                  </div>

                  <div className="p-4 rounded-xl" style={{ background: 'rgba(0, 217, 255, 0.05)', border: '1px solid rgba(0, 217, 255, 0.15)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 mb-3">Atomic Breakdown</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center">
                        <p className="text-lg font-black text-purple-300">{atomicResult.mainnetScore.toLocaleString()}</p>
                        <p className="text-[8px] font-bold uppercase text-gray-500">Mainnet</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-black text-cyan-300">{atomicResult.testnetScore.toLocaleString()}</p>
                        <p className="text-[8px] font-bold uppercase text-gray-500">Testnet</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-black text-emerald-300">{atomicResult.appEngageScore.toLocaleString()}</p>
                        <p className="text-[8px] font-bold uppercase text-gray-500">App Engage</p>
                      </div>
                    </div>
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
              consistencyScore={liveWalletData.consistencyScore ?? 85}
              networkTrust={liveWalletData.networkTrust ?? 90}
              mainnetPoints={atomicResult.mainnetScore}
              testnetPoints={atomicResult.testnetScore}
              appEngagementPoints={atomicResult.appEngageScore}
            />
          </div>
        )}

        {activeSection === 'rank' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <Suspense fallback={<div className="py-12 text-center">Loading leaderboard...</div>}>
              <TopWalletsWidget 
                username={username} 
                initialLimit={50}
                language={language}
                showFullLeaderboard={true}
              />
            </Suspense>
          </div>
        )}

        {activeSection === 'network' && (
          <>
            {networkSubPage === 'network-info' ? (
              <NetworkInfoPage onBack={() => setNetworkSubPage(null)} />
            ) : networkSubPage === 'top-wallets' ? (
              <TopWalletsPage onBack={() => setNetworkSubPage(null)} />
            ) : networkSubPage === 'reputation' ? (
              <ReputationPage onBack={() => setNetworkSubPage(null)} walletAddress={liveWalletData.address} sharedAtomicResult={atomicResult} />
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

        {activeSection === 'earn-points' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <FutureTasksPage />
          </div>
        )}

        {activeSection === 'activity-hub' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <Suspense fallback={<div className="py-12 text-center text-gray-400">Loading Activity Hub...</div>}>
              <ActivityHub
                walletAddress={liveWalletData.address}
                walletData={liveWalletData}
                atomicResult={atomicResult}
                isMainnet={mode.mode !== 'testnet'}
                onScoreUpdate={() => {
                  const unified = reputationService.getUnifiedScore();
                  setUnifiedScoreData(unified);
                }}
                onBack={() => setActiveSection('overview')}
              />
            </Suspense>
          </div>
        )}

        {activeSection === 'profile' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <ProfileSection 
              walletData={liveWalletData}
              username={username || 'Pioneer'}
              isProUser={isProUser}
              mode={mode}
              userPoints={userPoints}
              onPointsEarned={handlePointsEarned}
              sharedAtomicResult={atomicResult}
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

        {activeSection === 'how-it-works' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header Card */}
            <div className="glass-card p-6" style={{ border: '1px solid rgba(0, 217, 255, 0.2)', background: 'linear-gradient(135deg, rgba(0, 217, 255, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0, 217, 255, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)', border: '1px solid rgba(0, 217, 255, 0.3)' }}>
                  <BookOpen className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-wide text-white">كيف يعمل النظام | How It Works</h2>
                  <p className="text-xs text-cyan-400">بروتوكول Reputa v3.0 - المرجع الشامل</p>
                </div>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed" dir="rtl">
                دليلك الكامل لفهم نظام السمعة في Reputa. يشرح هذا القسم بالتفصيل كيفية حساب النقاط، مستويات الثقة، المهام، والمكافآت.
              </p>
            </div>

            {/* Protocol Overview */}
            <details open className="group glass-card border border-cyan-500/30 rounded-xl overflow-hidden">
              <summary className="p-5 cursor-pointer flex items-center justify-between font-bold text-sm text-white uppercase tracking-wide bg-cyan-500/10 hover:bg-cyan-500/20 transition-all">
                <span className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-cyan-400" />
                  نظرة عامة على البروتوكول | Protocol Overview
                </span>
                <ChevronDown className="w-5 h-5 group-open:rotate-180 transition-transform text-cyan-400" />
              </summary>
              <div className="p-5 space-y-4 text-sm text-gray-300 leading-relaxed">
                <div className="p-4 rounded-lg" style={{ background: 'rgba(0, 217, 255, 0.05)', border: '1px solid rgba(0, 217, 255, 0.2)' }}>
                  <h4 className="font-bold text-cyan-400 mb-2" dir="rtl">ما هو Reputa Score؟</h4>
                  <p dir="rtl">Reputa Score هو نظام سمعة متقدم يقيّم نشاطك على شبكة Pi Network. يجمع النظام بين نشاط المحفظة (80%) والتفاعل مع التطبيق (20%) لإنشاء درجة سمعة شاملة وعادلة.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-4 rounded-lg text-center" style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                    <p className="text-2xl font-black text-purple-400">20</p>
                    <p className="text-xs text-gray-400 mt-1">مستوى | Levels</p>
                  </div>
                  <div className="p-4 rounded-lg text-center" style={{ background: 'rgba(0, 217, 255, 0.1)', border: '1px solid rgba(0, 217, 255, 0.3)' }}>
                    <p className="text-2xl font-black text-cyan-400">100,000</p>
                    <p className="text-xs text-gray-400 mt-1">نقطة قصوى | Max Points</p>
                  </div>
                  <div className="p-4 rounded-lg text-center" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                    <p className="text-2xl font-black text-amber-400">v3.0</p>
                    <p className="text-xs text-gray-400 mt-1">إصدار البروتوكول | Version</p>
                  </div>
                </div>

                <div className="p-4 rounded-lg" style={{ background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                  <h4 className="font-bold text-purple-400 mb-2">Formula | الصيغة الحسابية</h4>
                  <code className="block p-3 rounded bg-black/40 text-cyan-300 text-xs font-mono" dir="ltr">
                    Total Score = (Mainnet × 60% + Testnet × 20%) × 80% + App Points × 20%
                  </code>
                  <p className="text-xs text-gray-400 mt-2" dir="rtl">النتيجة النهائية = (Mainnet × 60% + Testnet × 20%) × 80% + نقاط التطبيق × 20%</p>
                </div>
              </div>
            </details>

            {/* Detailed Scoring System */}
            <details open className="group glass-card border border-purple-500/30 rounded-xl overflow-hidden">
              <summary className="p-5 cursor-pointer flex items-center justify-between font-bold text-sm text-white uppercase tracking-wide bg-purple-500/10 hover:bg-purple-500/20 transition-all">
                <span className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-400" />
                  نظام النقاط التفصيلي | Detailed Scoring System
                </span>
                <ChevronDown className="w-5 h-5 group-open:rotate-180 transition-transform text-purple-400" />
              </summary>
              <div className="p-5 space-y-4">
                {/* Daily Check-in */}
                <div className="p-4 rounded-lg" style={{ background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                  <h4 className="font-bold text-purple-400 mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    <span dir="rtl">تسجيل الدخول اليومي | Daily Check-in</span>
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center p-2 rounded bg-white/5">
                      <span className="text-gray-300" dir="rtl">نقاط أساسية | Base Points</span>
                      <span className="font-bold text-purple-400">+10 نقاط</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-white/5">
                      <span className="text-gray-300" dir="rtl">مكافأة 3 أيام متتالية | 3-Day Streak</span>
                      <span className="font-bold text-cyan-400">+5 نقاط إضافية</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-white/5">
                      <span className="text-gray-300" dir="rtl">مكافأة 7 أيام متتالية | 7-Day Streak</span>
                      <span className="font-bold text-emerald-400">+10 نقاط إضافية</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-white/5">
                      <span className="text-gray-300" dir="rtl">مكافأة 14 يوم متتالي | 14-Day Streak</span>
                      <span className="font-bold text-amber-400">+15 نقطة إضافية</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-white/5">
                      <span className="text-gray-300" dir="rtl">مكافأة 30 يوم متتالي | 30-Day Streak</span>
                      <span className="font-bold text-orange-400">+25 نقطة إضافية</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-3 p-2 rounded bg-amber-500/10" dir="rtl">
                      ⏰ يجب الانتظار 24 ساعة بين كل تسجيل دخول
                    </p>
                  </div>
                </div>

                {/* Wallet Activity */}
                <div className="p-4 rounded-lg" style={{ background: 'rgba(0, 217, 255, 0.05)', border: '1px solid rgba(0, 217, 255, 0.2)' }}>
                  <h4 className="font-bold text-cyan-400 mb-3 flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    <span dir="rtl">نشاط المحفظة | Wallet Activity</span>
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center p-2 rounded bg-white/5">
                      <span className="text-gray-300" dir="rtl">معاملة جديدة | New Transaction</span>
                      <span className="font-bold text-cyan-400">+50 نقطة</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-white/5">
                      <span className="text-gray-300" dir="rtl">زيادة الرصيد | Balance Increase</span>
                      <span className="font-bold text-emerald-400">+0.01 نقطة لكل Pi</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-white/5">
                      <span className="text-gray-300" dir="rtl">مكافأة Staking | Staking Bonus</span>
                      <span className="font-bold text-purple-400">+5 نقاط لكل 100 Pi</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-white/5">
                      <span className="text-gray-300" dir="rtl">عمر الحساب | Account Age</span>
                      <span className="font-bold text-amber-400">+1 نقطة لكل 30 يوم</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-white/5">
                      <span className="text-gray-300" dir="rtl">جهة اتصال جديدة | New Contact</span>
                      <span className="font-bold text-cyan-400">+2 نقطة (حد أقصى 20)</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-3 p-2 rounded bg-cyan-500/10" dir="rtl">
                      🔄 يتم فحص المحفظة تلقائياً كل 15 دقيقة
                    </p>
                  </div>
                </div>

                {/* Network Weights */}
                <div className="p-4 rounded-lg" style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                  <h4 className="font-bold text-amber-400 mb-3 flex items-center gap-2">
                    <Network className="w-4 h-4" />
                    <span dir="rtl">أوزان الشبكات | Network Weights</span>
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center p-2 rounded bg-white/5">
                      <span className="text-gray-300">Mainnet Activity</span>
                      <span className="font-bold text-emerald-400">60% وزن</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-white/5">
                      <span className="text-gray-300">Testnet Activity</span>
                      <span className="font-bold text-amber-400">20% وزن</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-white/5">
                      <span className="text-gray-300" dir="rtl">مجموع نشاط المحفظة | Total Wallet</span>
                      <span className="font-bold text-cyan-400">80% من النتيجة</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-white/5">
                      <span className="text-gray-300" dir="rtl">التفاعل مع التطبيق | App Engagement</span>
                      <span className="font-bold text-purple-400">20% من النتيجة</span>
                    </div>
                  </div>
                </div>

                {/* Ad Bonus */}
                <div className="p-4 rounded-lg" style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <h4 className="font-bold text-emerald-400 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    <span dir="rtl">مكافآت الإعلانات | Ad Bonus</span>
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center p-2 rounded bg-white/5">
                      <span className="text-gray-300" dir="rtl">نقاط لكل إعلان | Per Ad</span>
                      <span className="font-bold text-emerald-400">+5 نقاط</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-white/5">
                      <span className="text-gray-300" dir="rtl">حد أقصى يومي | Daily Max</span>
                      <span className="font-bold text-amber-400">3 إعلانات (15 نقطة)</span>
                    </div>
                  </div>
                </div>

                {/* Referral System */}
                <div className="p-4 rounded-lg" style={{ background: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                  <h4 className="font-bold text-rose-400 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span dir="rtl">نظام الإحالة | Referral System</span>
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center p-2 rounded bg-white/5">
                      <span className="text-gray-300" dir="rtl">إحالة ناجحة | Valid Referral</span>
                      <span className="font-bold text-rose-400">+500 نقطة</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-white/5">
                      <span className="text-gray-300" dir="rtl">مكافأة 5 إحالات | 5 Referrals Bonus</span>
                      <span className="font-bold text-amber-400">+250 نقطة إضافية</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-white/5">
                      <span className="text-gray-300" dir="rtl">مكافأة 10 إحالات | 10 Referrals Bonus</span>
                      <span className="font-bold text-orange-400">+500 نقطة إضافية</span>
                    </div>
                  </div>
                </div>
              </div>
            </details>

            {/* Level System */}
            <details open className="group glass-card border border-amber-500/30 rounded-xl overflow-hidden">
              <summary className="p-5 cursor-pointer flex items-center justify-between font-bold text-sm text-white uppercase tracking-wide bg-amber-500/10 hover:bg-amber-500/20 transition-all">
                <span className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  نظام المستويات | Level System
                </span>
                <ChevronDown className="w-5 h-5 group-open:rotate-180 transition-transform text-amber-400" />
              </summary>
              <div className="p-5 space-y-3">
                <p className="text-sm text-gray-300 mb-4" dir="rtl">
                  يحتوي النظام على 20 مستوى، كل مستوى يتطلب 5,000 نقطة للوصول إلى المستوى التالي.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {[
                    { level: 1, name: 'Newcomer | وافد جديد', points: '0-5K', color: 'text-gray-400' },
                    { level: 2, name: 'Active | نشط', points: '5K-10K', color: 'text-blue-400' },
                    { level: 3, name: 'Trusted | موثوق', points: '10K-15K', color: 'text-cyan-400' },
                    { level: 4, name: 'Engaged | متفاعل', points: '15K-20K', color: 'text-emerald-400' },
                    { level: 5, name: 'Reliable | موثوق به', points: '20K-25K', color: 'text-green-400' },
                    { level: 6, name: 'Notable | بارز', points: '25K-30K', color: 'text-lime-400' },
                    { level: 7, name: 'Established | راسخ', points: '30K-35K', color: 'text-yellow-400' },
                    { level: 8, name: 'Loyal | مخلص', points: '35K-40K', color: 'text-amber-400' },
                    { level: 9, name: 'Contributor | مساهم', points: '40K-45K', color: 'text-orange-400' },
                    { level: 10, name: 'Pioneer | رائد', points: '45K-50K', color: 'text-red-400' },
                    { level: 11, name: 'Expert | خبير', points: '50K-55K', color: 'text-pink-400' },
                    { level: 12, name: 'Master | محترف', points: '55K-60K', color: 'text-rose-400' },
                    { level: 13, name: 'Legend | أسطورة', points: '60K-65K', color: 'text-fuchsia-400' },
                    { level: 14, name: 'Luminary | مضيء', points: '65K-70K', color: 'text-purple-400' },
                    { level: 15, name: 'Titan | عملاق', points: '70K-75K', color: 'text-violet-400' },
                    { level: 16, name: 'Elite | نخبة', points: '75K-80K', color: 'text-indigo-400' },
                    { level: 17, name: 'Sage | حكيم', points: '80K-85K', color: 'text-blue-300' },
                    { level: 18, name: 'Oracle | عراف', points: '85K-90K', color: 'text-cyan-300' },
                    { level: 19, name: 'Visionary | صاحب رؤية', points: '90K-95K', color: 'text-teal-300' },
                    { level: 20, name: 'Supreme | أعلى', points: '95K-100K', color: 'text-emerald-300' },
                  ].map((item) => (
                    <div key={item.level} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white w-6">{item.level}</span>
                        <span className={`font-semibold ${item.color}`}>{item.name}</span>
                      </div>
                      <span className="text-gray-400 font-mono">{item.points}</span>
                    </div>
                  ))}
                </div>
              </div>
            </details>

            {/* Penalties & Erosion */}
            <details className="group glass-card border border-red-500/30 rounded-xl overflow-hidden">
              <summary className="p-5 cursor-pointer flex items-center justify-between font-bold text-sm text-white uppercase tracking-wide bg-red-500/10 hover:bg-red-500/20 transition-all">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  العقوبات والتآكل | Penalties & Erosion
                </span>
                <ChevronDown className="w-5 h-5 group-open:rotate-180 transition-transform text-red-400" />
              </summary>
              <div className="p-5 space-y-4 text-sm">
                <div className="p-4 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <h4 className="font-bold text-red-400 mb-3" dir="rtl">تآكل عدم النشاط | Inactivity Erosion</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 rounded bg-white/5">
                      <span className="text-gray-300" dir="rtl">عقوبة أسبوعية | Weekly Penalty</span>
                      <span className="font-bold text-red-400">-10 نقاط</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-white/5">
                      <span className="text-gray-300" dir="rtl">حد أقصى للتآكل | Max Erosion/Week</span>
                      <span className="font-bold text-orange-400">-50 نقطة</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-3 p-2 rounded bg-red-500/10" dir="rtl">
                      ⚠️ يتم تطبيق التآكل بعد أسبوع من عدم النشاط (أقل من 3 أيام نشطة)
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-lg" style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                  <h4 className="font-bold text-amber-400 mb-3" dir="rtl">كيفية تجنب التآكل | How to Avoid Erosion</h4>
                  <ul className="space-y-2 text-gray-300" dir="rtl">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-1">✓</span>
                      <span>سجل دخولك يومياً للحفاظ على النشاط</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-1">✓</span>
                      <span>قم بإجراء معاملات على الشبكة بانتظام</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-1">✓</span>
                      <span>تفاعل مع التطبيق على الأقل 3 أيام في الأسبوع</span>
                    </li>
                  </ul>
                </div>
              </div>
            </details>

            {/* Weekly Claims */}
            <details className="group glass-card border border-emerald-500/30 rounded-xl overflow-hidden">
              <summary className="p-5 cursor-pointer flex items-center justify-between font-bold text-sm text-white uppercase tracking-wide bg-emerald-500/10 hover:bg-emerald-500/20 transition-all">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  المطالبة الأسبوعية | Weekly Claims
                </span>
                <ChevronDown className="w-5 h-5 group-open:rotate-180 transition-transform text-emerald-400" />
              </summary>
              <div className="p-5 space-y-4 text-sm">
                <p className="text-gray-300 leading-relaxed" dir="rtl">
                  نقاط التفاعل مع التطبيق (Daily Check-in + Ad Bonus) يتم تجميعها أسبوعياً. أكمل 7 أيام من النشاط للمطالبة بجميع النقاط المتراكمة.
                </p>
                <div className="p-4 rounded-lg" style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <h4 className="font-bold text-emerald-400 mb-3" dir="rtl">شروط المطالبة | Claim Requirements</h4>
                  <ul className="space-y-2 text-gray-300" dir="rtl">
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-400">✓</span>
                      <span>أكمل 7 أيام من النشاط في الأسبوع</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-400">✓</span>
                      <span>يتم دمج النقاط تلقائياً في نتيجتك الإجمالية</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-400">✓</span>
                      <span>النقاط غير المطالب بها تبقى معلقة حتى الأسبوع التالي</span>
                    </li>
                  </ul>
                </div>
              </div>
            </details>

            {/* Tips & Best Practices */}
            <details className="group glass-card border border-indigo-500/30 rounded-xl overflow-hidden">
              <summary className="p-5 cursor-pointer flex items-center justify-between font-bold text-sm text-white uppercase tracking-wide bg-indigo-500/10 hover:bg-indigo-500/20 transition-all">
                <span className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-indigo-400" />
                  نصائح وأفضل الممارسات | Tips & Best Practices
                </span>
                <ChevronDown className="w-5 h-5 group-open:rotate-180 transition-transform text-indigo-400" />
              </summary>
              <div className="p-5 space-y-4 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg" style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                    <h4 className="font-bold text-indigo-400 mb-2" dir="rtl">🎯 لتحقيق أقصى نقاط</h4>
                    <ul className="space-y-1.5 text-gray-300 text-xs" dir="rtl">
                      <li>• سجل دخولك يومياً للحفاظ على السلسلة</li>
                      <li>• قم بمعاملات منتظمة على Mainnet</li>
                      <li>• استخدم Testnet للتجربة الآمنة</li>
                      <li>• أكمل 7 أيام نشاط للمطالبة الأسبوعية</li>
                      <li>• قم بدعوة أصدقائك للحصول على مكافآت الإحالة</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg" style={{ background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                    <h4 className="font-bold text-purple-400 mb-2" dir="rtl">⚡ نصائح سريعة</h4>
                    <ul className="space-y-1.5 text-gray-300 text-xs" dir="rtl">
                      <li>• النشاط الحديث له وزن أعلى</li>
                      <li>• Mainnet يعطي 3× نقاط Testnet</li>
                      <li>• السلاسل الطويلة تعطي مكافآت أكبر</li>
                      <li>• تجنب فترات الخمول الطويلة</li>
                      <li>• راقب نقاطك المعلقة بانتظام</li>
                    </ul>
                  </div>
                </div>
              </div>
            </details>
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
                    Reputa Score is generated by the unified ReputationAtomic engine. Every widget reads from the same score object to keep values perfectly consistent.
                  </div>
                </details>
                <details className="group glass-card border border-white/10 rounded-xl overflow-hidden">
                  <summary className="p-4 cursor-pointer flex items-center justify-between font-bold text-sm text-white uppercase tracking-wide bg-white/5 hover:bg-white/10 transition-all">
                    How is my score calculated?
                    <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="p-4 text-xs text-gray-400 leading-relaxed">
                    Exact formula: Total Score = Mainnet_Points + Testnet_Points + App_Engagement_Points (with protocol cap). Any Mainnet update is pushed immediately to all score cards.
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
        onMenuClick={() => setActiveSection('profile')}
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
        walletAddress={liveWalletData.address}
        balance={liveWalletData.balance}
        onLogout={onReset}
      />

      {/* Share Card Modal */}
      {showShareCard && (
        <ShareReputaCard
          username={username || 'Pioneer'}
          score={mode.mode === 'demo' ? 0 : (unifiedScoreData?.totalScore ?? levelProgress.displayScore)}
          level={levelProgress.levelIndex + 1}
          trustRank={unifiedScoreData?.atomicTrustLevel ?? levelProgress.currentLevel}
          walletAddress={liveWalletData.address}
          onClose={() => setShowShareCard(false)}
        />
      )}
    </div>
  );
}
