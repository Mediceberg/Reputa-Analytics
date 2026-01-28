import { ArrowLeft, Sparkles, TrendingUp, Activity, Clock, Wallet } from 'lucide-react';  
import { Button } from './ui/button';
import { Card } from './ui/card';
import { TrustGauge } from './TrustGauge';
import { TransactionList } from './TransactionList';
import { AuditReport } from './AuditReport';
import type { WalletData } from '../protocol/types';

interface WalletAnalysisProps {
  walletData: WalletData;
  isProUser: boolean;
  onReset: () => void;
  onUpgradePrompt: () => void;
}

export function WalletAnalysis({ 
  walletData, 
  isProUser, 
  onReset, 
  onUpgradePrompt 
}: WalletAnalysisProps) {
  
  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const getBadgeInfo = () => {
    const score = walletData.reputaScore || 0;
    if (score >= 600) return { label: 'Elite Wallet', color: 'text-emerald-600', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30', icon: '🛡️' };
    if (score >= 400) return { label: 'Trusted Wallet', color: 'text-cyan-600', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/30', icon: '✅' };
    if (score >= 200) return { label: 'Moderate Trust', color: 'text-amber-600', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30', icon: '⚖️' };
    return { label: 'Limited Trust', color: 'text-red-600', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30', icon: '⚠️' };
  };

  const badgeInfo = getBadgeInfo();

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onReset} className="gap-2 font-bold text-xs uppercase hover:bg-purple-50">
          <ArrowLeft className="w-4 h-4" />
          Check Another Wallet
        </Button>
        <Button 
          onClick={onUpgradePrompt} 
          className="gap-2 bg-gradient-to-r from-purple-600 via-purple-700 to-cyan-600 text-white font-bold text-xs uppercase shadow-lg shadow-purple-500/25 hover:shadow-xl"
        >
          <Sparkles className="w-4 h-4" />
          {isProUser ? 'Pro Explorer Active' : 'Upgrade to Pro'}
        </Button>
      </div>

      <Card className="p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700/50 shadow-2xl overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-pink-500/5"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-[10px] font-bold text-cyan-400 uppercase mb-1 tracking-widest">Blockchain Identity</p>
              <p className="font-mono font-bold text-white text-lg">{formatAddress(walletData.address)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-cyan-400 uppercase mb-1 tracking-widest">Available Balance</p>
              <p className="font-black text-3xl bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">{walletData.balance.toFixed(2)} π</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase">Reputa Score</p>
                <p className="font-bold text-white">{walletData.reputaScore}/1000</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase">Total Tx</p>
                <p className="font-bold text-white">{walletData.totalTransactions || 0}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase">Account Age</p>
                <p className="font-bold text-white">{walletData.accountAge} days</p>
              </div>
            </div>

            <div className={`flex items-center gap-3 p-4 rounded-2xl border ${badgeInfo.bgColor} ${badgeInfo.borderColor} backdrop-blur-sm`}>
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl shadow-lg">
                {badgeInfo.icon}
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase">Status</p>
                <p className={`font-bold text-xs uppercase ${badgeInfo.color}`}>{badgeInfo.label}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6">
        <TrustGauge 
          score={walletData.reputaScore ?? 500} 
          trustLevel={walletData.trustLevel ?? 'Medium'}
          consistencyScore={walletData.consistencyScore ?? 85}
          networkTrust={walletData.networkTrust ?? 90}
        />

        <TransactionList 
          transactions={walletData.transactions.slice(0, 8)} 
          walletAddress={walletData.address} 
        />

        <AuditReport 
          walletData={{
            ...walletData,
            transactions: walletData.transactions
          }} 
          isProUser={true} 
          onUpgradePrompt={onUpgradePrompt}
        />
      </div>
    </div>
  );
}
