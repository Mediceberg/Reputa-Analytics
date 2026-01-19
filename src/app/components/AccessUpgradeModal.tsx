import { Sparkles, Lock, Check } from 'lucide-react';  
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
// استيراد دالة الدفع
import { createVIPPayment } from '../services/piPayments';

interface AccessUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  currentUser?: any; 
}

// ✅ التعديل الحاسم: استخدام export قبل الوظيفة مباشرة لحل مشكلة Vercel Build
export function AccessUpgradeModal({ isOpen, onClose, onUpgrade, currentUser }: AccessUpgradeModalProps) {
  
  // ✅ دالة التعامل مع الدفع مع تنبيهات لتتبع التنفيذ
  const handlePayment = async () => {
    console.log("Payment process started");
    
    if (!currentUser || currentUser.uid === "demo") {
      alert("Please link your Pi account first (Demo mode cannot process payments).");
      return;
    }

    try {
      // تنبيه لبدء العملية في متصفح Pi
      alert("Opening Pi Wallet for: " + currentUser.username);

      // استدعاء دالة الدفع
      await createVIPPayment(currentUser.uid, () => {
        // هذه الوظيفة تُنفذ فقط عند نجاح الدفع
        alert("✅ Transaction Successful! Unlocking VIP Features.");
        onUpgrade(); // تحديث حالة التطبيق في App.tsx
        onClose();   // إغلاق النافذة
      });
      
    } catch (err: any) {
      alert("Payment Error: " + (err.message || "Unknown error occurred"));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[95vh] flex flex-col p-0 overflow-hidden bg-white">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
            Unlock Advanced Insights
          </DialogTitle>
          <DialogDescription>
            Access professional-grade wallet intelligence and behavioral analysis
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Explorer View (Free) */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold text-xs">
                  FREE
                </div>
                <h3 className="font-semibold text-gray-700 text-sm">Explorer View</h3>
              </div>
              <ul className="space-y-2 text-xs text-gray-600">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span>Basic Trust Score</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span>General Metrics</span>
                </li>
                <li className="flex items-start gap-2 opacity-40">
                  <Lock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>No AI Behavior Analysis</span>
                </li>
              </ul>
            </div>

            {/* Advanced Access (Paid) */}
            <div className="p-4 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg border-2 border-cyan-200 relative overflow-hidden shadow-sm">
              <div className="absolute top-2 right-2">
                <Sparkles className="w-5 h-5 text-cyan-500" />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-cyan-700 text-sm">Advanced Insights</h3>
              </div>
              <ul className="space-y-2 text-xs text-gray-700 font-medium">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-cyan-600 flex-shrink-0 mt-0.5" />
                  <span>Behavioral AI Analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-cyan-600 flex-shrink-0 mt-0.5" />
                  <span>Risk Heatmap & Patterns</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-cyan-600 flex-shrink-0 mt-0.5" />
                  <span>Network Trust Mapping</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
            <h3 className="font-semibold mb-2 text-gray-800 text-sm">Why Upgrade?</h3>
            <p className="text-[11px] text-gray-600 leading-relaxed">
              Unlock the full power of Reputa Score. Our AI engine analyzes millions of transactions to provide a stability index and consistency score for any wallet.
            </p>
          </div>
        </div>

        <div className="p-6 bg-white border-t mt-auto shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
          <div className="text-center mb-4">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">One-time Access</p>
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-3xl font-black text-gray-900 leading-none">1</span>
              <span className="text-xl font-bold text-purple-600 leading-none">π</span>
            </div>
          </div>
          
          <Button 
            onClick={handlePayment}
            className="w-full h-14 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-700 hover:to-blue-800 gap-3 rounded-xl shadow-lg active:scale-[0.98] transition-all text-white"
          >
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span className="text-lg font-black uppercase tracking-tight">Unlock Now</span>
          </Button>

          <div className="flex items-center justify-center gap-2 mt-4 text-[10px] text-gray-400 font-medium">
            <Lock className="w-3 h-3" />
            <span>Secure payment via Pi Browser SDK</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
