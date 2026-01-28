import { ArrowDownLeft, ArrowUpRight, ExternalLink } from 'lucide-react';
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
    <Card className="p-6 bg-gradient-to-br from-white to-slate-50/50 border-slate-200/50 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-bold text-xl text-gray-900">Recent Transactions</h2>
          <p className="text-sm text-gray-500 mt-1">
            Last {transactions.length} verified transactions
          </p>
        </div>
        <Badge className="px-4 py-2 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 text-purple-700 border-purple-200/50 font-bold">
          {transactions.length} Transactions
        </Badge>
      </div>

      <div className="space-y-3">
        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ExternalLink className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-400 font-medium">No recent transactions found.</p>
          </div>
        ) : (
          transactions.map((tx, index) => {
            const isReceived = tx.type === 'received';
            
            return (
              <div
                key={tx.id}
                className="flex items-center gap-4 p-4 bg-gradient-to-r from-white to-gray-50/50 rounded-2xl border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all duration-200 group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                  isReceived 
                    ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' 
                    : 'bg-gradient-to-br from-orange-500 to-orange-600'
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
                      isReceived ? 'text-emerald-600' : 'text-orange-600'
                    }`}>
                      {isReceived ? 'Received' : 'Sent'}
                    </span>
                    {tx.memo && (
                      <Badge variant="outline" className="text-xs max-w-[150px] truncate bg-white">
                        {tx.memo}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      {isReceived ? 'From:' : 'To:'}
                      <code className="font-mono text-xs bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                        {formatAddress(isReceived ? tx.from : tx.to)}
                      </code>
                    </span>
                    <span className="text-gray-300 hidden sm:inline">•</span>
                    <span className="text-gray-400 text-xs">{formatDate(tx.timestamp)}</span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className={`font-black text-lg ${
                    isReceived ? 'text-emerald-600' : 'text-gray-900'
                  }`}>
                    {isReceived ? '+' : '-'}{tx.amount.toFixed(2)} π
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-6 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl border border-cyan-200/50">
        <p className="text-[11px] text-cyan-800 leading-relaxed">
          <span className="font-bold uppercase mr-1">Note:</span> 
          Only non-zero transactions are displayed. Zero-value transactions are automatically filtered for accurate reputation analysis on the Mainnet.
        </p>
      </div>
    </Card>
  );
}
