import React, { useEffect } from 'react'; 
import { X, Sparkles, Shield, Check, Zap } from 'lucide-react';
import { createVIPPayment } from '../services/piPayments';
import { isPiBrowser } from '../services/piSdk';

interface AccessUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  currentUser?: any;
}

export function AccessUpgradeModal({ isOpen, onClose, onUpgrade, currentUser }: AccessUpgradeModalProps) {
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handlePaymentClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isPiBrowser()) {
      alert("Please open this app in Pi Browser to make payments");
      return;
    }

    if (!currentUser) {
      alert("Please login with your Pi account first");
      return;
    }

    if (!currentUser.uid || currentUser.uid === "demo") {
      alert("Please login with your Pi account first to make real payments");
      return;
    }

    onClose();

    try {
      await createVIPPayment(currentUser.uid, () => {
        onUpgrade();
      });
    } catch (err: any) {
      console.error("Payment Initiation Failed:", err);
      alert("Payment failed: " + (err.message || 'Unknown error'));
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-sm bg-slate-900 rounded-2xl border-2 border-cyan-500/30 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '85vh', overflowY: 'auto' }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>

        {/* Content */}
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Unlock Advanced Insights</h2>
              <p className="text-xs text-gray-500">Professional wallet analysis</p>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3 mb-4">
            <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-semibold text-cyan-400">Advanced Features</span>
              </div>
              <ul className="space-y-1.5 text-xs text-gray-300">
                <li className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-cyan-400" />
                  <span>Reputa Intelligence Score</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-cyan-400" />
                  <span>Behavioral AI Analysis</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-cyan-400" />
                  <span>Network Trust Mapping</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Payment Section */}
          <div className="text-center p-4 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded-xl border border-purple-500/30 mb-4">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">One-time Access</p>
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-4xl font-black text-white">1</span>
              <span className="text-2xl font-bold text-purple-400">π</span>
            </div>
            
            <button 
              onClick={handlePaymentClick}
              className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              Unlock Now
            </button>
          </div>

          {/* Security Note */}
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <Shield className="w-3 h-3" />
            <span>Secure payment via Pi Network</span>
          </div>
        </div>
      </div>
    </div>
  );
}
