import { useState, useEffect, useMemo } from 'react'; 
import { ArrowLeft, Shield, Info, BarChart3 } from 'lucide-react';
import { fetchReputationData, ReputationData } from '../services/piNetworkData';
import { 
  calculateAtomicReputation, 
  generateDemoActivityData,
  AtomicReputationResult
} from '../protocol/atomicScoring';
import { UnifiedReputaOverview } from '../components/UnifiedReputaOverview';
import { AtomicScoreBreakdown } from '../components/AtomicScoreBreakdown';

interface ReputationPageProps {
  onBack: () => void;
  walletAddress?: string;
  sharedAtomicResult?: AtomicReputationResult;
}

export function ReputationPage({ onBack, walletAddress, sharedAtomicResult }: ReputationPageProps) {
  const [reputation, setReputation] = useState<ReputationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState(walletAddress || '');
  const [isMainnet, setIsMainnet] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  
  const atomicResult = useMemo<AtomicReputationResult>(() => {
    // Use shared result from parent (single source of truth) if available
    if (sharedAtomicResult) return sharedAtomicResult;
    if (reputation?.activityData) {
      return calculateAtomicReputation(reputation.activityData);
    }
    return calculateAtomicReputation(generateDemoActivityData());
  }, [sharedAtomicResult, reputation]);

  const loadReputation = async (addr: string) => {
    if (!addr) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const data = await Promise.race([
        fetchReputationData(addr, isMainnet),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 15000)
        )
      ]);
      
      clearTimeout(timeoutId);
      setReputation(data);
    } catch (error) {
      console.error('Failed to load reputation:', error);
      setReputation({
        score: 350,
        trustLevel: 'Medium',
        transactionCount: 25,
        accountAge: 180,
        networkActivity: 45,
        onChainVerified: false,
        isEstimated: true,
        activityData: {
          accountAgeDays: 180,
          lastActivityDate: new Date(),
          dailyCheckins: 0, adBonuses: 0, reportViews: 0, toolUsage: 0,
          internalTxCount: 15, appInteractions: 5, sdkPayments: 2,
          normalTrades: 3, uniqueTokens: 2, regularActivityWeeks: 4,
          stakingDays: 0, smallExternalTransfers: 1, frequentExternalTransfers: 0,
          suddenExits: 0, continuousDrain: 0, spamCount: 0, farmingInstances: 0, suspiciousLinks: 0,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const targetAddress = address || walletAddress || '';
    if (targetAddress) {
      loadReputation(targetAddress);
    } else {
      setLoading(false);
      setReputation({
        score: 350,
        trustLevel: 'Medium',
        transactionCount: 25,
        accountAge: 180,
        networkActivity: 45,
        onChainVerified: false,
        isEstimated: true,
        activityData: {
          accountAgeDays: 180,
          lastActivityDate: new Date(),
          dailyCheckins: 0, adBonuses: 0, reportViews: 0, toolUsage: 0,
          internalTxCount: 15, appInteractions: 5, sdkPayments: 2,
          normalTrades: 3, uniqueTokens: 2, regularActivityWeeks: 4,
          stakingDays: 0, smallExternalTransfers: 1, frequentExternalTransfers: 0,
          suddenExits: 0, continuousDrain: 0, spamCount: 0, farmingInstances: 0, suspiciousLinks: 0,
        },
      });
    }
  }, [isMainnet, walletAddress]);

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
            Reputa Score
          </h1>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Atomic Protocol - Comprehensive trust analysis based on blockchain behavior
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
          
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <BarChart3 className="w-4 h-4" />
            {showDetails ? 'Hide Detailed Breakdown' : 'Show Detailed Breakdown'}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
              <span className="text-gray-400 text-sm">Analyzing wallet reputation...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <UnifiedReputaOverview 
              result={atomicResult} 
              isVerified={reputation?.onChainVerified || false}
              language="en"
            />
            
            {showDetails && (
              <div className="mt-8">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-cyan-400" />
                  Detailed Atomic Breakdown
                </h3>
                <AtomicScoreBreakdown result={atomicResult} language="en" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
