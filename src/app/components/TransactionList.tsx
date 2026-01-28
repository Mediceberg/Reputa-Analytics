import { ArrowDownLeft, ArrowUpRight, ExternalLink, Activity } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import type { Transaction } from '../protocol/types';

interface TransactionListProps {
  transactions: Transaction[];
  walletAddress: string;
}

export function TransactionList({ transactions, walletAddress }: TransactionListProps) {
  
  const formatAddress = (address: string) => {
    if (!address) return "Unknown";
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const formatDate = (date: Date) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
    
    if (diffInSeconds < 0) return 'Just now';

    const minutes = Math.floor(diffInSeconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30.44);
    const years = Math.floor(days / 365.25);

    if (diffInSeconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ${minutes % 60}m ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (weeks < 4) return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    if (months < 12) return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 border border-cyan-500/20 shadow-2xl shadow-cyan-500/10 overflow-hidden relative backdrop-blur-xl">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2"></div>
      <div className="absolute bottom-0 right-0 w-48 h-48 bg-gradient-to-tl from-orange-500/10 to-yellow-500/10 rounded-full blur-3xl translate-y-1/2 translate-x-1/2"></div>
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `linear-gradient(rgba(0, 217, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 217, 255, 0.1) 1px, transparent 1px)`,
        backgroundSize: '20px 20px'
      }}></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-xl text-white">Recent Transactions</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Last {transactions.length} verified transactions
              </p>
            </div>
          </div>
          <Badge className="px-4 py-2 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-cyan-400 border-cyan-500/30 font-bold backdrop-blur-sm">
            {transactions.length} Transactions
          </Badge>
        </div>

        <div className="space-y-3">
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700/50">
                <ExternalLink className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-gray-500 font-medium">No recent transactions found.</p>
            </div>
          ) : (
            transactions.map((tx, index) => {
              const isReceived = tx.type === 'received';
              
              return (
                <div
                  key={tx.id}
                  className={`flex items-center gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-2xl border transition-all duration-200 group hover:scale-[1.01] ${
                    isReceived 
                      ? 'border-emerald-500/20 hover:border-emerald-400/40 hover:bg-emerald-500/10' 
                      : 'border-orange-500/20 hover:border-orange-400/40 hover:bg-orange-500/10'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                    isReceived 
                      ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/30' 
                      : 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-orange-500/30'
                  }`}>
                    {isReceived ? (
                      <ArrowDownLeft className="w-6 h-6 text-white" />
                    ) : (
                      <ArrowUpRight className="w-6 h-6 text-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-bold ${
                        isReceived ? 'text-emerald-400' : 'text-orange-400'
                      }`}>
                        {isReceived ? 'Received' : 'Sent'}
                      </span>
                      {tx.memo && (
                        <Badge variant="outline" className="text-xs max-w-[150px] truncate bg-slate-800/50 border-slate-700/50 text-gray-400">
                          {tx.memo}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        {isReceived ? 'From:' : 'To:'}
                        <code className="font-mono text-xs bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700/50 text-cyan-400">
                          {formatAddress(isReceived ? tx.from : tx.to)}
                        </code>
                      </span>
                      <span className="text-slate-600 hidden sm:inline">•</span>
                      <span className="text-gray-500 text-xs">{formatDate(tx.timestamp)}</span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className={`font-black text-lg ${
                      isReceived ? 'text-emerald-400' : 'text-gray-300'
                    }`} style={isReceived ? { textShadow: '0 0 10px rgba(16, 185, 129, 0.3)' } : {}}>
                      {isReceived ? '+' : '-'}{tx.amount.toFixed(2)} π
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Info Note */}
        <div className="mt-6 p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl border border-cyan-500/20 backdrop-blur-sm">
          <p className="text-[11px] text-cyan-400 leading-relaxed">
            <span className="font-bold uppercase mr-1">Note:</span> 
            Only non-zero transactions are displayed. Zero-value transactions are automatically filtered for accurate reputation analysis on the Mainnet.
          </p>
        </div>
      </div>
    </Card>
  );
}
