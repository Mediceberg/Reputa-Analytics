import { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { TransactionTimeline } from '../components/charts/TransactionTimeline';
import { PointsBreakdown } from '../components/charts/PointsBreakdown';
import { RiskActivity } from '../components/charts/RiskActivity';
import { TokenPortfolio } from '../components/charts/TokenPortfolio';
import { ScoreBreakdownChart } from '../components/ScoreBreakdownChart';
import { PiDexSection } from '../components/PiDexSection';
import { 
  processTransactionTimeline, 
  processScoreBreakdown, 
  processRiskActivity, 
  processTokenPortfolio,
  generateMockChartData 
} from '../services/chartDataProcessor';
import { AppMode, ChartDataPoint, ChartReputationScore, TokenBalance, Language } from '../protocol/types';
import { ArrowLeft, Globe } from 'lucide-react';

interface AnalyticsDashboardProps {
  onBack: () => void;
  walletBalance?: number;
  username?: string;
}

export function AnalyticsDashboard({ onBack, walletBalance = 0, username }: AnalyticsDashboardProps) {
  const { t, language, changeLanguage } = useLanguage();
  const [mode, setMode] = useState<AppMode>({ mode: 'demo', connected: false });
  const [activeItem, setActiveItem] = useState('dashboard');
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');
  
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

  const handleModeToggle = () => {
    setMode(prev => ({
      mode: prev.mode === 'demo' ? 'testnet' : 'demo',
      connected: prev.mode === 'demo' ? true : false,
    }));
  };

  const handlePeriodChange = (newPeriod: 'day' | 'week' | 'month') => {
    setPeriod(newPeriod);
  };

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'EN' },
    { code: 'ar', label: 'AR' },
    { code: 'fr', label: 'FR' },
    { code: 'zh', label: 'ZH' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <DashboardSidebar 
        mode={mode} 
        onModeToggle={handleModeToggle}
        activeItem={activeItem}
        onItemClick={setActiveItem}
      />

      <main className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 rounded-lg bg-[#111] hover:bg-[#1a1a1a] border border-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">{t('dashboard.title')}</h1>
              {username && (
                <p className="text-gray-400">{t('dashboard.welcome')}, {username}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-[#111] rounded-lg p-2 border border-white/10">
              <Globe className="w-4 h-4 text-gray-400" />
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    language === lang.code
                      ? 'bg-[#FAC515] text-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            <div className="bg-[#111] rounded-lg px-4 py-2 border border-white/10">
              <p className="text-xs text-gray-400">{t('dashboard.balance')}</p>
              <p className="text-lg font-bold text-white">
                {walletBalance.toFixed(2)} <span className="text-[#FAC515]">π</span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <TransactionTimeline 
            internal={timelineData.internal}
            external={timelineData.external}
            onFilterChange={handlePeriodChange}
          />
          <PointsBreakdown data={breakdownData} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <RiskActivity data={riskData} />
          <TokenPortfolio data={portfolioData} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {score && <ScoreBreakdownChart score={score} />}
          <PiDexSection tokens={tokens} />
        </div>
      </main>
    </div>
  );
}
