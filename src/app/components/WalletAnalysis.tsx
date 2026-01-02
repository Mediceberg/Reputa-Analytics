import { ArrowLeft, Sparkles, TrendingUp, Activity, Clock, Shield } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { TrustGauge } from './TrustGauge';
import { TransactionList } from './TransactionList';
import { AuditReport } from './AuditReport';
import type { WalletData } from '../App';

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
    switch (walletData.trustLevel) {
      case 'Elite':
        return { 
          label: 'Elite Wallet', 
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-100',
          iconColor: 'text-emerald-600'
        };
      case 'High':
        return { 
          label: 'Trusted Wallet', 
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          iconColor: 'text-blue-600'
        };
      case 'Medium':
        return { 
          label: 'Moderate Trust', 
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          iconColor: 'text-yellow-600'
        };
      case 'Low':
        return { 
          label: 'Limited Trust', 
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          iconColor: 'text-red-600'
        };
    }
  };

  const badgeInfo = getBadgeInfo();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onReset} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Check Another Wallet
        </Button>
        {!isProUser && (
          <Button
            onClick={onUpgradePrompt}
            className="gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600"
          >
            <Sparkles className="w-4 h-4" />
            Upgrade to Pro
          </Button>
        )}
      </div>

      {/* Main Info Card */}
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-yellow-50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Wallet Address</p>
            <p className="font-mono font-semibold text-lg">{formatAddress(walletData.address)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 mb-1">Current Balance</p>
            <p className="font-bold text-2xl text-purple-600">
              {walletData.balance.toFixed(2)} π
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Reputa Score</p>
              <p className="font-bold">{walletData.reputaScore}/1000</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Transactions</p>
              <p className="font-bold">{walletData.totalTransactions}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Clock className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Account Age</p>
              <p className="font-bold">{walletData.accountAge} days</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              walletData.trustScore >= 60 ? 'bg-green-100' : 
              walletData.trustScore >= 40 ? 'bg-yellow-100' : 'bg-red-100'
            }`}>
              <svg className={`w-5 h-5 ${
                walletData.trustScore >= 60 ? 'text-green-600' : 
                walletData.trustScore >= 40 ? 'text-yellow-600' : 'text-red-600'
              }`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <p className={`font-bold text-sm ${badgeInfo.color}`}>{badgeInfo.label}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Trust Gauge */}
      <TrustGauge 
        score={walletData.reputaScore} 
        trustLevel={walletData.trustLevel}
        consistencyScore={walletData.consistencyScore}
        networkTrust={walletData.networkTrust}
      />

      {/* Transaction List */}
      <TransactionList transactions={walletData.transactions} walletAddress={walletData.address} />

      {/* Audit Report */}
      <AuditReport 
        walletData={walletData} 
        isProUser={isProUser}
        onUpgradePrompt={onUpgradePrompt}
      />
    </div>
  );
}