import React from 'react';
import { X, Sparkles, Lock, Check } from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
// استيراد خدمة الدفع
import { createVIPPayment } from '../services/piPayments';

interface AccessUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  currentUser?: any; // إضافة المستخدم للتعرف على الـ UID الخاص به
}

export function AccessUpgradeModal({ isOpen, onClose, onUpgrade, currentUser }: AccessUpgradeModalProps) {
  
  // --- وظيفة التعامل مع الدفع الفعلية ---
  const handlePaymentClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) {
      alert("Please wait for user authentication...");
      return;
    }

    // وضع الديمو للمعاينة
    if (currentUser.uid === "demo") {
      onUpgrade();
      onClose();
      alert("✅ VIP Unlocked (Demo Mode)");
      return;
    }

    try {
      // استدعاء دالة الدفع الرسمية من ملف piPayments
      await createVIPPayment(currentUser.uid, () => {
        // يتم استدعاء هذا الكود فقط بعد نجاح عملية الدفع على البلوكشين
        onUpgrade();
        onClose();
      });
    } catch (err) {
      console.error("Payment Initiation Failed:", err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* التنسيق المصغر مع خاصية التمرير */}
      <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto p-0 border-none bg-white rounded-3xl">
        
        {/* رأس النافذة */}
        <DialogHeader className="p-5 pb-2">
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
            Unlock Advanced Insights
          </DialogTitle>
          <DialogDescription className="text-xs">
            Access professional-grade wallet intelligence and behavioral analysis
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-5 py-2 mb-4">
          {/* المقارنة - عمود واحد للموبايل */}
          <div className="grid grid-cols-1 gap-3">
            {/* Explorer View */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-gray-700">Explorer View</h3>
              </div>
              <ul className="space-y-1.5 text-xs text-gray-600">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span>Basic Trust Score</span>
                </li>
                <li className="flex items-start gap-2 opacity-40">
                  <Lock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>Limited Analysis</span>
                </li>
              </ul>
            </div>

            {/* Advanced Access */}
            <div className="p-3 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl border-2 border-cyan-200 relative overflow-hidden">
              <div className="absolute top-2 right-2">
                <Sparkles className="w-4 h-4 text-cyan-500" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-cyan-700">Advanced Insights</h3>
              </div>
              <ul className="space-y-1.5 text-xs text-gray-700 font-medium">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-cyan-600 flex-shrink-0 mt-0.5" />
                  <span>Reputa Intelligence Score</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-cyan-600 flex-shrink-0 mt-0.5" />
                  <span>Behavioral AI Analysis</span>
                </li>
              </ul>
            </div>
          </div>

          {/* المميزات الإضافية */}
          <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
            <h3 className="text-sm font-semibold mb-2 text-gray-800">Premium Analysis</h3>
            <div className="grid grid-cols-1 gap-2 text-[11px]">
              <div className="flex items-start gap-2 text-gray-700">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 flex-shrink-0"></div>
                <span>Consistency Score & Stability Index</span>
              </div>
              <div className="flex items-start gap-2 text-gray-700">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 flex-shrink-0"></div>
                <span>Network Trust Mapping</span>
              </div>
            </div>
          </div>

          {/* قسم الدفع والسعر */}
          <div className="text-center p-5 bg-white rounded-xl border-2 border-gray-100 shadow-sm">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">One-time Access</p>
            <div className="flex items-center justify-center gap-1.5 mb-3">
              <span className="text-3xl font-black text-gray-900">1</span>
              <span className="text-xl font-bold text-purple-600 uppercase">Pi</span>
            </div>
            
            <Button 
              onClick={handlePaymentClick}
              className="w-full h-11 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-xl font-bold text-xs gap-2 shadow-lg shadow-blue-200"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Unlock Advanced Insights
            </Button>
          </div>

          {/* ملاحظة الأمان */}
          <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 pb-2">
            <Lock className="w-3 h-3" />
            <span>Secure payment via Pi Network</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
