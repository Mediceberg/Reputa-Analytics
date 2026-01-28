import { ArrowLeft, Sparkles, TrendingUp, Activity, Clock, Wallet, Shield, Zap } from 'lucide-react';  
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
    if (score >= 600) return { label: 'Elite Wallet', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', borderColor: 'border-emerald-500/50', icon: '🛡️', glow: 'shadow-emerald-500/30' };
    if (score >= 400) return { label: 'Trusted Wallet', color: 'text-cyan-400', bgColor: 'bg-cyan-500/20', borderColor: 'border-cyan-500/50', icon: '✅', glow: 'shadow-cyan-500/30' };
    if (score >= 200) return { label: 'Moderate Trust', color: 'text-amber-400', bgColor: 'bg-amber-500/20', borderColor: 'border-amber-500/50', icon: '⚖️', glow: 'shadow-amber-500/30' };
    return { label: 'Limited Trust', color: 'text-red-400', bgColor: 'bg-red-500/20', borderColor: 'border-red-500/50', icon: '⚠️', glow: 'shadow-red-500/30' };
  };

  const badgeInfo = getBadgeInfo();

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={onReset} 
          className="gap-2 font-bold text-xs uppercase text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/30 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Check Another Wallet
        </Button>
        <Button 
          onClick={onUpgradePrompt} 
          className="gap-2 bg-gradient-to-r from-purple-600 via-purple-700 to-cyan-600 text-white font-bold text-xs uppercase shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 transition-all border border-purple-400/30"
        >
          <Sparkles className="w-4 h-4" />
          {isProUser ? 'Pro Explorer Active' : 'Upgrade to Pro'}
        </Button>
      </div>

      {/* Main Wallet Info Card */}
      <Card className="p-6 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 border border-cyan-500/20 shadow-2xl shadow-cyan-500/10 overflow-hidden relative backdrop-blur-xl">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-pink-500/5"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-500/10 to-cyan-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `linear-gradient(rgba(0, 217, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 217, 255, 0.1) 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}></div>
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-4 h-4 text-cyan-400" />
                <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Blockchain Identity</p>
              </div>
              <p className="font-mono font-bold text-white text-lg tracking-wide">{formatAddress(walletData.address)}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-2 mb-2">
                <Zap className="w-4 h-4 text-purple-400" />
                <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Available Balance</p>
              </div>
              <p className="font-black text-3xl bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">{walletData.balance.toFixed(2)} π</p>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Reputa Score */}
            <div className="flex items-center gap-3 p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-purple-500/30 hover:border-purple-400/50 hover:bg-purple-500/10 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-all">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Reputa Score</p>
                <p className="font-bold text-white">{walletData.reputaScore}<span className="text-gray-500 text-xs">/1000</span></p>
              </div>
            </div>

            {/* Total Transactions */}
            <div className="flex items-center gap-3 p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-cyan-500/30 hover:border-cyan-400/50 hover:bg-cyan-500/10 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 group-hover:shadow-cyan-500/50 transition-all">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Total Tx</p>
                <p className="font-bold text-white">{walletData.totalTransactions || 0}</p>
              </div>
            </div>

            {/* Account Age */}
            <div className="flex items-center gap-3 p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-emerald-500/30 hover:border-emerald-400/50 hover:bg-emerald-500/10 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:shadow-emerald-500/50 transition-all">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Account Age</p>
                <p className="font-bold text-white">{walletData.accountAge} <span className="text-gray-500 text-xs">days</span></p>
              </div>
            </div>

            {/* Trust Status Badge */}
            <div className={`flex items-center gap-3 p-4 rounded-2xl border ${badgeInfo.bgColor} ${badgeInfo.borderColor} backdrop-blur-sm hover:scale-[1.02] transition-all shadow-lg ${badgeInfo.glow}`}>
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl shadow-lg backdrop-blur-sm">
                {badgeInfo.icon}
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Status</p>
                <p className={`font-bold text-xs uppercase ${badgeInfo.color}`}>{badgeInfo.label}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Analysis Components */}
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
