/**
 * Reputation Widget
 * Reads exclusively from reputation engine object (no local scoring logic).
 */

import { useEffect, useState } from 'react';
import { Shield, RefreshCw, Activity, Network } from 'lucide-react';
import { TRUST_LEVEL_COLORS } from '../../protocol/atomicScoring';
import { reputationService } from '../../services/reputationService';
import { useReputationEngine } from '../../hooks/useReputationEngine';

interface ReputationWidgetProps {
  walletAddress?: string;
  isMainnet?: boolean;
}

export function ReputationWidget({ walletAddress }: ReputationWidgetProps) {
  const [uid, setUid] = useState<string>('demo');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const engine = useReputationEngine(uid);
  const colors = TRUST_LEVEL_COLORS[engine.atomicTrustLevel];

  useEffect(() => {
    const resolvedUid = localStorage.getItem('piUserId') || 'demo';
    setUid(resolvedUid);

    (async () => {
      try {
        await reputationService.loadUserReputation(resolvedUid, walletAddress);
      } finally {
        setLoading(false);
      }
    })();
  }, [walletAddress]);

  const refresh = async () => {
    if (!walletAddress || syncing) return;
    setSyncing(true);
    try {
      await reputationService.syncBlockchainData(walletAddress);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return <div className="glass-card p-6 animate-pulse h-40" />;
  }

  return (
    <div className="glass-card p-6 border" style={{ borderColor: colors.border }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5" style={{ color: colors.text }} />
          <h3 className="text-sm font-black text-white uppercase">Reputation Score</h3>
        </div>
        <button
          onClick={refresh}
          disabled={syncing || !walletAddress}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-gray-300 ${syncing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-4 rounded-xl mb-3" style={{ background: colors.bg, border: `1px solid ${colors.border}` }}>
        <div className="text-4xl font-black" style={{ color: colors.text }}>{engine.totalScore}</div>
        <div className="text-xs text-gray-300 uppercase">{engine.atomicTrustLevel}</div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 rounded-lg bg-white/5 border border-white/10">
          <div className="text-[10px] text-gray-400 uppercase">Mainnet</div>
          <div className="font-black text-purple-300">{engine.Mainnet_Points}</div>
        </div>
        <div className="p-2 rounded-lg bg-white/5 border border-white/10">
          <div className="text-[10px] text-gray-400 uppercase">Testnet</div>
          <div className="font-black text-cyan-300">{engine.Testnet_Points}</div>
        </div>
        <div className="p-2 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center justify-center gap-1 text-[10px] text-gray-400 uppercase"><Activity className="w-3 h-3" />App</div>
          <div className="font-black text-emerald-300">{engine.App_Engagement_Points}</div>
        </div>
      </div>

      <div className="mt-3 text-[10px] text-gray-500 flex items-center gap-1"><Network className="w-3 h-3" /> unified object source</div>
    </div>
  );
}
