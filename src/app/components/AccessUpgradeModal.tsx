import React from 'react'; 
import { X, Sparkles, Lock, Check, Shield, Zap } from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { createVIPPayment } from '../services/piPayments';
import { isPiBrowser } from '../services/piSdk';

interface AccessUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  currentUser?: any;
}

export function AccessUpgradeModal({ isOpen, onClose, onUpgrade, currentUser }: AccessUpgradeModalProps) {
  
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

    try {
      await createVIPPayment(currentUser.uid, () => {
        onUpgrade();
        onClose();
      });
    } catch (err: any) {
      console.error("Payment Initiation Failed:", err);
      alert("Payment failed: " + (err.message || 'Unknown error'));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] p-0 border-2 border-cyan-500/30 bg-gradient-to-br from-slate-900/98 via-slate-800/98 to-slate-900/98 rounded-3xl shadow-2xl shadow-cyan-500/20 backdrop-blur-xl overflow-y-auto">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-purple-500/10 to-pink-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
          backgroundImage: `linear-gradient(rgba(0, 217, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 217, 255, 0.1) 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}></div>
        
        <div className="relative z-10">
          {/* Header */}
          <DialogHeader className="p-5 pb-2">
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              Unlock Advanced Insights
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Access professional-grade wallet intelligence and behavioral analysis
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-5 py-2 mb-4">
            {/* Comparison Cards */}
            <div className="grid grid-cols-1 gap-3">
              {/* Explorer View */}
              <div className="p-3 bg-white/5 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 bg-slate-700 rounded-full flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-400">Explorer View</h3>
                </div>
                <ul className="space-y-1.5 text-xs text-gray-500">
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mt-0.5" />
                    <span>Basic Trust Score</span>
                  </li>
                  <li className="flex items-start gap-2 opacity-40">
                    <Lock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>Limited Analysis</span>
                  </li>
                </ul>
              </div>

              {/* Advanced Access */}
              <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl border-2 border-cyan-500/40 relative overflow-hidden backdrop-blur-sm">
                <div className="absolute top-2 right-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/30">
                    <Zap className="w-3.5 h-3.5 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-cyan-400">Advanced Insights</h3>
                </div>
                <ul className="space-y-1.5 text-xs text-gray-300 font-medium">
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span>Reputa Intelligence Score</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span>Behavioral AI Analysis</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Premium Features */}
            <div className="p-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl border border-purple-500/30 backdrop-blur-sm">
              <h3 className="text-sm font-semibold mb-2 text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-400" />
                Premium Analysis
              </h3>
              <div className="grid grid-cols-1 gap-2 text-[11px]">
                <div className="flex items-start gap-2 text-gray-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 flex-shrink-0 shadow-lg shadow-purple-500/50"></div>
                  <span>Consistency Score & Stability Index</span>
                </div>
                <div className="flex items-start gap-2 text-gray-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 flex-shrink-0 shadow-lg shadow-purple-500/50"></div>
                  <span>Network Trust Mapping</span>
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div className="text-center p-5 bg-white/5 rounded-xl border-2 border-cyan-500/30 backdrop-blur-sm shadow-lg shadow-cyan-500/10">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">One-time Access</p>
              <div className="flex items-center justify-center gap-1.5 mb-3">
                <span className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">1</span>
                <span className="text-xl font-bold text-purple-400 uppercase">Pi</span>
              </div>
              
              <Button 
                onClick={handlePaymentClick}
                className="w-full h-11 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-xl font-bold text-xs gap-2 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Unlock Advanced Insights
              </Button>
            </div>

            {/* Security Note */}
            <div className="flex items-center justify-center gap-2 text-[10px] text-gray-500 pb-2">
              <Lock className="w-3 h-3" />
              <span>Secure payment via Pi Network</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
