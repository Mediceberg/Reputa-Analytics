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
import { ArrowLeft, Globe, User, Wallet, Shield, TrendingUp } from 'lucide-react';

interface AnalyticsDashboardProps {
  onBack: () => void;
  walletBalance?: number;
  username?: string;
  walletAddress?: string;
  reputaScore?: number;
}

export function AnalyticsDashboard({ 
  onBack, 
  walletBalance = 0, 
  username,
  walletAddress = "GDU22...DEMO",
  reputaScore = 632
}: AnalyticsDashboardProps) {
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

  const formatAddress = (address: string) => {
    if (address.length > 16) {
      return `${address.slice(0, 8)}...${address.slice(-8)}`;
    }
    return address;
  };

  const getTrustLevel = (score: number) => {
    if (score >= 600) return { label: 'Elite', color: 'text-emerald-400', bg: 'bg-emerald-500/20' };
    if (score >= 400) return { label: 'Trusted', color: 'text-cyan-400', bg: 'bg-cyan-500/20' };
    if (score >= 200) return { label: 'Moderate', color: 'text-amber-400', bg: 'bg-amber-500/20' };
    return { label: 'Limited', color: 'text-red-400', bg: 'bg-red-500/20' };
  };

  const trustLevel = getTrustLevel(reputaScore);

  return (
    <div className="min-h-screen futuristic-bg flex">
      <div className="absolute inset-0 grid-pattern pointer-events-none" />
      
      <DashboardSidebar 
        mode={mode} 
        onModeToggle={handleModeToggle}
        activeItem={activeItem}
        onItemClick={setActiveItem}
      />

      <main className="flex-1 p-8 overflow-auto relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-3 rounded-xl transition-all active:scale-95 glass-card hover:border-purple-500/40"
              style={{ border: '1px solid rgba(139, 92, 246, 0.3)' }}
            >
              <ArrowLeft className="w-5 h-5 text-purple-400" />
            </button>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-wide neon-text-purple">{t('dashboard.title')}</h1>
              {username && (
                <p className="text-sm" style={{ color: 'rgba(160, 164, 184, 0.8)' }}>{t('dashboard.welcome')}, {username}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 glass-card px-4 py-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                    language === lang.code
                      ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-card p-6 mb-8" style={{ border: '1px solid rgba(0, 217, 255, 0.2)' }}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(0, 217, 255, 0.3) 100%)',
                  border: '1px solid rgba(139, 92, 246, 0.4)',
                  boxShadow: '0 0 30px rgba(139, 92, 246, 0.2)',
                }}
              >
                <User className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-black uppercase tracking-wide" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                  {username || 'Pioneer'}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <Wallet className="w-3 h-3 text-cyan-400" />
                  <span className="font-mono text-sm" style={{ color: 'rgba(0, 217, 255, 0.9)' }}>
                    {formatAddress(walletAddress)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-center px-6 py-3 rounded-xl" style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                <div className="flex items-center gap-2 justify-center mb-1">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Reputa Score</span>
                </div>
                <p className="text-2xl font-black neon-text-purple">{reputaScore}<span className="text-gray-500 text-sm">/1000</span></p>
              </div>

              <div className="text-center px-6 py-3 rounded-xl" style={{ background: 'rgba(0, 217, 255, 0.1)', border: '1px solid rgba(0, 217, 255, 0.3)' }}>
                <div className="flex items-center gap-2 justify-center mb-1">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">{t('dashboard.balance')}</span>
                </div>
                <p className="text-2xl font-black neon-text-cyan">
                  {walletBalance.toFixed(2)} <span className="text-cyan-400">π</span>
                </p>
              </div>

              <div className={`text-center px-6 py-3 rounded-xl ${trustLevel.bg}`} style={{ border: '1px solid currentColor' }}>
                <span className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: 'rgba(160, 164, 184, 0.8)' }}>Status</span>
                <p className={`text-lg font-black uppercase ${trustLevel.color}`}>{trustLevel.label}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="glass-card p-6" style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }}>
            <TransactionTimeline 
              internal={timelineData.internal}
              external={timelineData.external}
              onFilterChange={handlePeriodChange}
            />
          </div>
          <div className="glass-card p-6" style={{ border: '1px solid rgba(0, 217, 255, 0.2)' }}>
            <PointsBreakdown data={breakdownData} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="glass-card p-6" style={{ border: '1px solid rgba(236, 72, 153, 0.2)' }}>
            <RiskActivity data={riskData} />
          </div>
          <div className="glass-card p-6" style={{ border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <TokenPortfolio data={portfolioData} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6" style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }}>
            {score && <ScoreBreakdownChart score={score} />}
          </div>
          <div className="glass-card p-6" style={{ border: '1px solid rgba(0, 217, 255, 0.2)' }}>
            <PiDexSection {...({ tokens } as any)} />
          </div>
        </div>
      </main>
    </div>
  );
}
