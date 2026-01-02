import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import type { Transaction } from '../App';

interface TransactionListProps {
  transactions: Transaction[];
  walletAddress: string;
}

export function TransactionList({ transactions, walletAddress }: TransactionListProps) {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-bold text-xl">Recent Transactions</h2>
          <p className="text-sm text-gray-500 mt-1">
            Last 10 verified transactions (zero-value excluded)
          </p>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          {transactions.length} Transactions
        </Badge>
      </div>

      <div className="space-y-3">
        {transactions.map((tx) => {
          const isReceived = tx.type === 'received';
          
          return (
            <div
              key={tx.id}
              className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {/* Icon */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                isReceived ? 'bg-green-100' : 'bg-orange-100'
              }`}>
                {isReceived ? (
                  <ArrowLeft className="w-5 h-5 text-green-600" />
                ) : (
                  <ArrowRight className="w-5 h-5 text-orange-600" />
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-semibold ${
                    isReceived ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {isReceived ? 'Received' : 'Sent'}
                  </span>
                  {tx.memo && (
                    <Badge variant="outline" className="text-xs">
                      {tx.memo}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    {isReceived ? 'From:' : 'To:'}
                    <code className="font-mono text-xs bg-white px-2 py-0.5 rounded">
                      {formatAddress(isReceived ? tx.from : tx.to)}
                    </code>
                  </span>
                  <span className="text-gray-400 hidden sm:inline">•</span>
                  <span className="text-gray-500">{formatDate(tx.timestamp)}</span>
                </div>
              </div>

              {/* Amount */}
              <div className="text-right flex-shrink-0">
                <p className={`font-bold ${
                  isReceived ? 'text-green-600' : 'text-gray-900'
                }`}>
                  {isReceived ? '+' : '-'}{tx.amount.toFixed(2)} π
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
        <p className="text-xs text-blue-800">
          <span className="font-semibold">Note:</span> Only non-zero transactions are displayed. 
          Zero-value transactions are automatically filtered for accurate analysis.
        </p>
      </div>
    </Card>
  );
}
