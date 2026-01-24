import { ArrowLeft, ArrowRight } from 'lucide-react'; 
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import type { Transaction } from '../App';

interface TransactionListProps {
  transactions: any[]; // تم تغيير النوع لـ any لتقبل الحقول الجديدة دون أخطاء
  walletAddress: string;
}

export function TransactionList({ transactions, walletAddress }: TransactionListProps) {
  const formatAddress = (address: string) => {
    if (!address) return "...";
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const formatDate = (tx: any) => {
    // إذا وجد التوقيت الدقيق من السيرفر نستخدمه، وإلا نعود للدالة الأصلية
    if (tx.dateLabel && tx.exactTime) {
      return `${tx.dateLabel}, ${tx.exactTime}`;
    }

    const date = new Date(tx.timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
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
          // الحفاظ على منطق الألوان الأصلي تماماً
          const isReceived = tx.type === 'received';
          
          return (
            <div
              key={tx.id}
              className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {/* Icon - الحفاظ على نفس الأيقونات الأصلية */}
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
                    {tx.type === 'received' ? 'Received' : tx.type} 
                  </span>
                  {/* إضافة النوع الفرعي (DEX مثلاً) فقط إذا وجد دون تغيير الأساس */}
                  {tx.subType && (
                    <Badge variant="outline" className="text-[10px] py-0 bg-white">
                      {tx.subType}
                    </Badge>
                  )}
                  {tx.memo && (
                    <Badge variant="outline" className="text-xs">
                      {tx.memo}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    {isReceived ? 'From:' : 'To:'}
                    <code className="font-mono text-xs bg-white px-2 py-0.5 rounded border border-gray-100">
                      {formatAddress(isReceived ? tx.from : tx.to)}
                    </code>
                  </span>
                  <span className="text-gray-400 hidden sm:inline">•</span>
                  {/* هنا يظهر الوقت الدقيق كما طلبت */}
                  <span className="text-gray-500 font-medium">{formatDate(tx)}</span>
                </div>
              </div>

              {/* Amount - الحفاظ على نفس التنسيق الأصلي */}
              <div className="text-right flex-shrink-0">
                <p className={`font-bold ${
                  isReceived ? 'text-green-600' : 'text-gray-900'
                }`}>
                  {isReceived ? '+' : '-'}{typeof tx.amount === 'number' ? tx.amount.toFixed(2) : tx.amount} π
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note - الحفاظ على الرسالة الأصلية تماماً */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
        <p className="text-xs text-blue-800">
          <span className="font-semibold">Note:</span> Only non-zero transactions are displayed. 
          Zero-value transactions are automatically filtered for accurate analysis.
        </p>
      </div>
    </Card>
  );
}
