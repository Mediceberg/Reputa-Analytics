import { ArrowLeft, ArrowRight } from 'lucide-react'; 
import { Card } from './ui/card';
import { Badge } from './ui/badge';

// تعريف الواجهة لتشمل الحقول الجديدة القادمة من Redis
interface Transaction {
  id: string;
  type: string;
  subType?: string; // الحقل الجديد
  amount: number | string;
  status: string;
  exactTime?: string; // الحقل الجديد
  dateLabel?: string; // الحقل الجديد
  timestamp: string | Date;
  from?: string;
  to: string;
  memo?: string;
}

interface TransactionListProps {
  transactions: Transaction[];
  walletAddress: string;
}

export function TransactionList({ transactions, walletAddress }: TransactionListProps) {
  const formatAddress = (address: string) => {
    if (!address) return "Unknown";
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  // تحديث دالة التوقيت لتدعم العرض الدقيق
  const getDisplayDate = (tx: Transaction) => {
    if (tx.dateLabel && tx.exactTime) {
      return `${tx.dateLabel}, ${tx.exactTime}`;
    }
    // fallback في حال كانت المعاملة قديمة
    return "Recently";
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-bold text-xl">Recent Activity</h2>
          <p className="text-sm text-gray-500 mt-1">
            Real-time verified blockchain transactions
          </p>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          {transactions.length} Activity Logs
        </Badge>
      </div>

      <div className="space-y-3">
        {transactions.map((tx) => {
          // التحقق من نوع المعاملة (Sent/Received أو DEX)
          const isReceived = tx.type.toLowerCase() === 'received';
          const isSwap = tx.type.includes('DEX') || tx.subType?.includes('Ecosystem');
          
          return (
            <div
              key={tx.id}
              className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
            >
              {/* Icon - تم تغيير اللون للبرتقالي ليطابق الصورة في حالة Sent/Swap */}
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
                  <span className={`font-bold ${
                    isReceived ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {tx.type} {/* سيظهر هنا Pi DEX Swap أو Sent */}
                  </span>
                  <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border text-gray-400">
                    {tx.id.substring(0, 8)}
                  </span>
                </div>
                
                <div className="flex flex-col text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    {isReceived ? 'From:' : 'To:'}
                    <code className="font-mono text-xs text-gray-500">
                      {formatAddress(isReceived ? tx.from! : tx.to)}
                    </code>
                  </span>
                  {/* عرض التوقيت الدقيق والنوع الفرعي */}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">{getDisplayDate(tx)}</span>
                    {tx.subType && (
                      <>
                        <span className="text-gray-300">•</span>
                        <span className="text-xs text-purple-500 font-medium">{tx.subType}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div className="text-right flex-shrink-0">
                <p className={`font-black ${
                  isReceived ? 'text-green-600' : 'text-gray-900'
                }`}>
                  {isReceived ? '+' : '-'}{typeof tx.amount === 'number' ? tx.amount.toFixed(2) : tx.amount} π
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
        <p className="text-[11px] text-blue-800 leading-relaxed">
          <span className="font-bold uppercase mr-1">Network Note:</span> 
          All transactions are fetched directly from Pi Mainnet. Time reflects your local timezone.
        </p>
      </div>
    </Card>
  );
}
