import { X, Sparkles, Lock, Check } from 'lucide-react';  
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

interface AccessUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;


export function AccessUpgradeModal({ isOpen, onClose, onUpgrade }: AccessUpgradeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* تعديل max-w ليكون مناسباً للجوال مع إضافة max-h لضمان ظهور زر الدفع */}
      <DialogContent className="max-w-2xl max-h-[95vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
            Unlock Advanced Insights
          </DialogTitle>
          <DialogDescription>
            Access professional-grade wallet intelligence and behavioral analysis
          </DialogDescription>
        </DialogHeader>

        {/* إضافة حاوية قابلة للتمرير للميزات لكي لا تدفع زر الدفع خارج الشاشة */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Current vs Advanced */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Explorer View */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
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
                  <span>Last 10 Transactions</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span>General Metrics</span>
                </li>
                <li className="flex items-start gap-2 opacity-40">
                  <Lock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>Limited Analysis</span>
                </li>
              </ul>
            </div>

            {/* Advanced Access */}
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
                  <span>Reputa Intelligence Score</span>
                </li>
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
                  <span>Full Audit Reports</span>
                </li>
              </ul>
            </div>
          </div>

          {/* What You Get */}
          <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
            <h3 className="font-semibold mb-3 text-gray-800 text-sm">What Your Wallet Says About You</h3>
            <div className="grid grid-cols-1 gap-2 text-[12px]">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0"></div>
                <p className="text-gray-700">Consistency Score & Stability Index</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0"></div>
                <p className="text-gray-700">Network Trust Mapping</p>
              </div>
            </div>
          </div>
        </div>

        {/* قسم الدفع: تم تثبيته في الأسفل بخلفية بيضاء ليكون سهل الوصول */}
        <div className="p-6 bg-white border-t mt-auto shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
          <div className="text-center mb-4">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">One-time Access</p>
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-3xl font-black text-gray-900 leading-none">1</span>
              <span className="text-xl font-bold text-purple-600 leading-none">π</span>
            </div>
          </div>
          
          <Button 
            onClick={onUpgrade}
            className="w-full h-14 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-700 hover:to-blue-800 gap-3 rounded-xl shadow-lg active:scale-[0.98] transition-all"
          >
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
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

