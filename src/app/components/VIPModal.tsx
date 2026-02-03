import { Crown, Check, X, Sparkles, Shield, Zap } from 'lucide-react'; 
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { createVIPPayment } from '../services/piPayments';
import { isPiBrowser } from '../services/piSdk';

interface VIPModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchase: () => void;
  uid?: string;
}

export function VIPModal({ isOpen, onClose, onPurchase, uid }: VIPModalProps) {
  const features = [
    'Unlimited wallet analyses',
    'Professional audit reports',
    'Advanced risk assessment',
    'Behavioral pattern analysis',
    'Transaction flow insights',
    'Historical trend analysis',
    'Priority support',
    'Early access to new features',
  ];

  const handlePurchase = async () => {
    if (!isPiBrowser()) {
      alert('Please open this app in Pi Browser to make payments');
      return;
    }
    
    if (!uid) {
      alert('Please login with your Pi account first');
      return;
    }
    
    try {
      await createVIPPayment(uid, () => {
        onPurchase();
        onClose();
      });
    } catch (error: any) {
      console.error('VIP payment failed:', error);
      alert('Payment failed: ' + (error.message || 'Unknown error'));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl w-full sm:max-w-2xl bg-gradient-to-br from-slate-900/98 via-slate-800/98 to-slate-900/98 border-2 border-purple-500/30 shadow-2xl shadow-purple-500/20 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-yellow-500/10 to-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-500/10 to-pink-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
          backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}></div>

        <div className="relative z-10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl sm:text-2xl">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/30 flex-shrink-0">
                <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 bg-clip-text text-transparent font-bold line-clamp-2">
                VIP Premium
              </span>
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-sm">
              الوصول المهني غير محدود لتحليل المحافظ الرقمية
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            {/* Pricing Card */}
            <div className="p-4 sm:p-6 bg-gradient-to-br from-purple-500/20 via-yellow-500/10 to-amber-500/20 rounded-xl border-2 border-yellow-500/30 backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <h3 className="font-bold text-lg sm:text-xl text-white flex items-center gap-2 flex-wrap">
                    <Shield className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                    <span>VIP Premium</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">وصول مدى الحياة</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">1 π</div>
                  <p className="text-xs text-gray-500">دفعة لمرة واحدة</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-2 sm:gap-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0 border border-emerald-500/40">
                      <Check className="w-3 h-3 text-emerald-400" />
                    </div>
                    <span className="text-xs sm:text-sm text-gray-300 line-clamp-2">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Benefits Section */}
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-start gap-3 p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/30 backdrop-blur-sm">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg shadow-cyan-500/30">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-xs sm:text-sm mb-1 text-white">التقارير المهنية</h4>
                  <p className="text-xs text-gray-400">
                    احصل على تقارير مفصلة مع تحليل سلوكي وتقييم المخاطر.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-purple-500/10 rounded-xl border border-purple-500/30 backdrop-blur-sm">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg shadow-purple-500/30">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-xs sm:text-sm mb-1 text-white">وصول غير محدود</h4>
                  <p className="text-xs text-gray-400">
                    حلل عدد غير محدود من المحافظ دون أي قيود.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30 backdrop-blur-sm">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg shadow-emerald-500/30">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-xs sm:text-sm mb-1 text-white">الدفع الآمن</h4>
                  <p className="text-xs text-gray-400">
                    المعالجة الآمنة عبر نظام دفع شبكة Pi الرسمي.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-slate-700/50">
              <Button 
                variant="outline" 
                onClick={onClose} 
                className="flex-1 gap-2 border-slate-600 text-gray-400 hover:bg-slate-800 hover:text-white hover:border-slate-500 text-sm sm:text-base"
              >
                <X className="w-4 h-4" />
                لاحقا
              </Button>
              <Button
                onClick={handlePurchase}
                className="flex-1 gap-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-slate-900 font-bold shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 hover:scale-105 transition-all text-sm sm:text-base"
              >
                <Crown className="w-4 h-4" />
                اشتري VIP (1 π)
              </Button>
            </div>

            <p className="text-xs text-center text-gray-500">
              بالشراء، فأنت توافق على شروط الخدمة. وصول VIP غير قابل للاسترجاع.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
