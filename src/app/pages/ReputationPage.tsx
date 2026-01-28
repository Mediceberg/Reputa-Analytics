import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Shield, Star, Activity, Clock, TrendingUp, CheckCircle, AlertCircle, Zap, Award, Target, BarChart3 } from 'lucide-react';
import { fetchReputationData, ReputationData } from '../services/piNetworkData';
import { 
  calculateAtomicReputation, 
  generateDemoActivityData,
  AtomicReputationResult,
  TRUST_LEVEL_COLORS 
} from '../protocol/atomicScoring';
import { AtomicScoreBreakdown } from '../components/AtomicScoreBreakdown';

interface ReputationPageProps {
  onBack: () => void;
  walletAddress?: string;
}

export function ReputationPage({ onBack, walletAddress }: ReputationPageProps) {
  const [reputation, setReputation] = useState<ReputationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState(walletAddress || '');
  const [isMainnet, setIsMainnet] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'atomic'>('overview');
  
  const atomicResult = useMemo<AtomicReputationResult>(() => {
    if (reputation?.activityData) {
      return calculateAtomicReputation(reputation.activityData);
    }
    return calculateAtomicReputation(generateDemoActivityData());
  }, [reputation]);

  const loadReputation = async (addr: string) => {
    if (!addr) return;
    setLoading(true);
    try {
      const data = await fetchReputationData(addr, isMainnet);
      setReputation(data);
    } catch (error) {
      console.error('Failed to load reputation:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (address) {
      loadReputation(address);
    } else {
      loadReputation('SAMPLE_WALLET');
    }
  }, [isMainnet]);

  const getTrustLevelColor = (level: string) => {
    switch (level) {
      case 'Elite': return { primary: '#FFD700', secondary: '#FFA500' };
      case 'High': return { primary: '#10B981', secondary: '#059669' };
      case 'Medium': return { primary: '#F59E0B', secondary: '#D97706' };
      default: return { primary: '#EF4444', secondary: '#DC2626' };
    }
  };

  const getScoreRing = (score: number) => {
    const maxScore = 850;
    const percentage = Math.min(100, (score / maxScore) * 100);
    const circumference = 2 * Math.PI * 80;
    const offset = circumference - (percentage / 100) * circumference;
    return { percentage, circumference, offset };
  };

  const scoreBreakdown = reputation ? [
    { label: 'Transaction History', value: Math.min(100, reputation.transactionCount * 2), max: 100, icon: Activity, color: '#00D9FF' },
    { label: 'Account Age', value: Math.min(100, reputation.accountAge / 3.65), max: 100, icon: Clock, color: '#8B5CF6' },
    { label: 'Network Activity', value: reputation.networkActivity, max: 100, icon: TrendingUp, color: '#10B981' },
    { label: 'Verification Status', value: reputation.onChainVerified ? 100 : 0, max: 100, icon: CheckCircle, color: '#F59E0B' },
  ] : [];

  const trustBenefits = [
    { level: 'Elite', minScore: 700, benefits: ['Priority transaction processing', 'Reduced fees', 'VIP support access', 'Early feature access'] },
    { level: 'High', minScore: 500, benefits: ['Lower transaction limits', 'Enhanced security features', 'Community badges'] },
    { level: 'Medium', minScore: 250, benefits: ['Standard transaction limits', 'Basic features access'] },
    { level: 'Low', minScore: 0, benefits: ['Limited features', 'Higher verification requirements'] },
  ];

  const colors = reputation ? getTrustLevelColor(reputation.trustLevel) : { primary: '#6B7280', secondary: '#4B5563' };
  const ring = reputation ? getScoreRing(reputation.score) : { percentage: 0, circumference: 0, offset: 0 };

  return (
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(180deg, #0A0B0F 0%, #0F1117 100%)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            aria-label="Go back to Network Explorer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            <ArrowLeft className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-400">Back</span>
          </button>

          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
            <button
              onClick={() => setIsMainnet(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isMainnet ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-gray-500 hover:text-gray-400'
              }`}
            >
              Mainnet
            </button>
            <button
              onClick={() => setIsMainnet(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                !isMainnet ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-gray-500 hover:text-gray-400'
              }`}
            >
              Testnet
            </button>
          </div>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4"
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(0, 217, 255, 0.2) 100%)',
              boxShadow: '0 0 40px rgba(16, 185, 129, 0.3)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          >
            <Shield className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Reputation Score
          </h1>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Comprehensive trust analysis based on on-chain wallet behavior
          </p>
        </div>

        <div className="mb-8">
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              placeholder="Enter wallet address to analyze..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-all font-mono text-sm"
            />
            <button
              onClick={() => loadReputation(address)}
              disabled={loading || !address}
              aria-label="Analyze wallet reputation"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold transition-all hover:opacity-90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              Analyze
            </button>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'overview' 
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                  : 'text-gray-500 hover:text-gray-400 hover:bg-white/5'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('atomic')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'atomic' 
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                  : 'text-gray-500 hover:text-gray-400 hover:bg-white/5'
              }`}
            >
              Atomic Protocol
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
              <span className="text-gray-400 text-sm">Analyzing wallet reputation...</span>
            </div>
          </div>
        ) : activeTab === 'atomic' ? (
          <AtomicScoreBreakdown result={atomicResult} language="en" />
        ) : reputation && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="p-8 rounded-2xl text-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(30, 33, 40, 0.6) 0%, rgba(20, 22, 28, 0.8) 100%)',
                  border: `1px solid ${colors.primary}30`,
                  boxShadow: `0 0 40px ${colors.primary}10`,
                }}
              >
                <div className="relative w-48 h-48 mx-auto mb-6">
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      fill="none"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="12"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      fill="none"
                      stroke={`url(#gradient-${reputation.trustLevel})`}
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={ring.circumference}
                      strokeDashoffset={ring.offset}
                      className="transition-all duration-1000"
                    />
                    <defs>
                      <linearGradient id={`gradient-${reputation.trustLevel}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={colors.primary} />
                        <stop offset="100%" stopColor={colors.secondary} />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-black text-white" style={{ fontFamily: 'var(--font-mono)' }}>
                      {reputation.score}
                    </span>
                    <span className="text-xs text-gray-500 uppercase tracking-wider">/ 850</span>
                  </div>
                </div>

                <div 
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl mb-4"
                  style={{ background: `${colors.primary}20`, border: `1px solid ${colors.primary}40` }}
                >
                  <Award className="w-5 h-5" style={{ color: colors.primary }} />
                  <span className="text-lg font-bold" style={{ color: colors.primary }}>
                    {reputation.trustLevel} Trust
                  </span>
                </div>

                <div className="flex items-center justify-center gap-2 mt-4">
                  {reputation.onChainVerified ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs text-emerald-400 font-medium">On-Chain Verified</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                      <span className="text-xs text-amber-400 font-medium">Estimated Score</span>
                    </>
                  )}
                </div>

                {reputation.isEstimated && (
                  <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <p className="text-xs text-amber-400">
                      Connect your wallet for accurate on-chain analysis
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="p-6 rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(30, 33, 40, 0.6) 0%, rgba(20, 22, 28, 0.8) 100%)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                }}
              >
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  Score Breakdown
                </h3>

                <div className="space-y-5">
                  {scoreBreakdown.map((item, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <item.icon className="w-4 h-4" style={{ color: item.color }} />
                          <span className="text-sm text-gray-300">{item.label}</span>
                        </div>
                        <span className="text-sm font-bold" style={{ color: item.color }}>
                          {Math.round(item.value)}%
                        </span>
                      </div>
                      <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000"
                          style={{
                            width: `${item.value}%`,
                            background: `linear-gradient(90deg, ${item.color}80, ${item.color})`,
                            boxShadow: `0 0 10px ${item.color}50`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    <span className="text-xs text-gray-500 uppercase">Transactions</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{reputation.transactionCount}</p>
                </div>
                <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="w-5 h-5 text-purple-400" />
                    <span className="text-xs text-gray-500 uppercase">Account Age</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{reputation.accountAge} days</p>
                </div>
                <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <Zap className="w-5 h-5 text-amber-400" />
                    <span className="text-xs text-gray-500 uppercase">Activity Level</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{reputation.networkActivity}%</p>
                </div>
                <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <Target className="w-5 h-5 text-emerald-400" />
                    <span className="text-xs text-gray-500 uppercase">Trust Percentile</span>
                  </div>
                  <p className="text-2xl font-bold text-white">Top {Math.max(5, 100 - Math.round(reputation.score / 8.5))}%</p>
                </div>
              </div>

              <div className="p-6 rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(30, 33, 40, 0.6) 0%, rgba(20, 22, 28, 0.8) 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                }}
              >
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400" />
                  Trust Level Benefits
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  {trustBenefits.map((tier, index) => {
                    const isCurrentTier = tier.level === reputation.trustLevel;
                    const tierColors = getTrustLevelColor(tier.level);
                    return (
                      <div
                        key={index}
                        className={`p-4 rounded-xl transition-all ${
                          isCurrentTier ? 'ring-2' : 'opacity-60'
                        }`}
                        style={{
                          background: isCurrentTier ? `${tierColors.primary}10` : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${isCurrentTier ? tierColors.primary + '40' : 'rgba(255,255,255,0.1)'}`,
                        }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold" style={{ color: tierColors.primary }}>{tier.level}</span>
                          <span className="text-xs text-gray-500">({tier.minScore}+ pts)</span>
                        </div>
                        <ul className="space-y-1">
                          {tier.benefits.map((benefit, i) => (
                            <li key={i} className="text-xs text-gray-400 flex items-center gap-1">
                              <div className="w-1 h-1 rounded-full" style={{ background: tierColors.primary }} />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
