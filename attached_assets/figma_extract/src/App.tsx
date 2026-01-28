import { useState, useEffect } from 'react';
import { useLanguage } from './hooks/useLanguage';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { TrustScoreCard } from './components/TrustScoreCard';
import { WalletBalance } from './components/WalletBalance';
import { ProgressCard } from './components/ProgressCard';
import { ProductsReport } from './components/ProductsReport';
import { ScoreBreakdown } from './components/ScoreBreakdown';
import { Recommendations } from './components/Recommendations';
import { PiDexSection } from './components/PiDexSection';
import { TransactionTimeline } from './components/charts/TransactionTimeline';
import { PointsBreakdown } from './components/charts/PointsBreakdown';
import { RiskActivity } from './components/charts/RiskActivity';
import { TokenPortfolio } from './components/charts/TokenPortfolio';
import { piSdk } from './services/piSdk';
import { getDemoWalletData, getMockMiningDays, DEMO_USERNAME } from './services/mockData';
import { calculateReputationScore } from './services/reputationProtocol';
import {
  processTransactionTimeline,
  processScoreBreakdown,
  processRiskActivity,
  processTokenPortfolio,
} from './services/chartDataProcessor';
import { AppMode, User, WalletData, ReputationScore, ChartDataPoint, TimeFilter } from './types';

export default function App() {
  const { isRTL } = useLanguage();
  const [mode, setMode] = useState<AppMode>({ mode: 'demo', connected: false });
  const [user, setUser] = useState<User | null>(null);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [reputationScore, setReputationScore] = useState<ReputationScore | null>(null);
  const [timelinePeriod, setTimelinePeriod] = useState<TimeFilter['period']>('week');
  const [chartData, setChartData] = useState<{
    timeline: { internal: ChartDataPoint[]; external: ChartDataPoint[] };
    breakdown: ChartDataPoint[];
    riskActivity: ChartDataPoint[];
    portfolio: ChartDataPoint[];
  } | null>(null);

  useEffect(() => {
    piSdk.init();
    loadDemoData();
  }, []);

  useEffect(() => {
    if (walletData) {
      const miningDays = mode.mode === 'demo' ? getMockMiningDays() : 0;
      const score = calculateReputationScore(walletData, miningDays);
      setReputationScore(score);

      const timeline = processTransactionTimeline(walletData.transactions, timelinePeriod);
      const breakdown = processScoreBreakdown(score);
      const riskActivity = processRiskActivity(walletData.transactions, score);
      const portfolio = processTokenPortfolio(walletData.tokenBalances || []);

      setChartData({ timeline, breakdown, riskActivity, portfolio });
    }
  }, [walletData, mode.mode, timelinePeriod]);

  const loadDemoData = () => {
    const demoData = getDemoWalletData();
    setWalletData(demoData);
    setUser({ uid: 'demo', username: DEMO_USERNAME, accessToken: 'demo_token' });
    setMode({ mode: 'demo', connected: true });
  };

  const handleModeToggle = async () => {
    if (mode.mode === 'demo') {
      try {
        const authUser = await piSdk.authenticate();
        if (authUser) {
          setUser(authUser);
          setMode({ mode: 'testnet', connected: true });
          loadDemoData();
        }
      } catch (error) {
        console.error('Failed to authenticate:', error);
      }
    } else {
      loadDemoData();
    }
  };

  const handleTimelineFilterChange = (period: TimeFilter['period']) => {
    setTimelinePeriod(period);
  };

  if (!walletData || !reputationScore || !chartData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="size-16 border-4 border-[#FAC515] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-xl font-['Roboto',sans-serif]" style={{ fontVariationSettings: "'wdth' 100" }}>
            Loading Reputa Score...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-black ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="flex min-h-screen">
        {/* Sidebar - Fixed Width */}
        <div className="shrink-0">
          <Sidebar mode={mode} onModeToggle={handleModeToggle} />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Header */}
          <Header user={user} mode={mode} />

          {/* Scrollable Content */}
          <main className="flex-1 p-8 overflow-auto">
            <div className="max-w-[1200px] mx-auto space-y-8">
              {/* Row 1: Wallet Balance & Trust Score (2 columns equal width) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <WalletBalance wallet={walletData} />
                <TrustScoreCard score={reputationScore} />
              </div>

              {/* Row 2: Progress & Score Breakdown (2 columns equal width) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ProgressCard score={reputationScore} />
                <ScoreBreakdown score={reputationScore} />
              </div>

              {/* Row 3: Products Report (Full Width) */}
              <ProductsReport data={chartData.timeline.internal} />

              {/* Row 4: Transaction Timeline & Points Breakdown (2 columns) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <TransactionTimeline
                  internal={chartData.timeline.internal}
                  external={chartData.timeline.external}
                  onFilterChange={handleTimelineFilterChange}
                />
                <PointsBreakdown data={chartData.breakdown} />
              </div>

              {/* Row 5: Risk Activity & Token Portfolio (2 columns) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <RiskActivity data={chartData.riskActivity} />
                <TokenPortfolio data={chartData.portfolio} />
              </div>

              {/* Row 6: Pi DEX Section (Full Width) */}
              <PiDexSection tokens={walletData.tokenBalances || []} />

              {/* Row 7: Recommendations (Full Width) */}
              <Recommendations score={reputationScore} />

              {/* Bottom Spacing */}
              <div className="h-8" />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
