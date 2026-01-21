import { Sparkles, Lock, Check } from 'lucide-react';  
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { createVIPPayment } from '../services/piPayments';
import { useState } from 'react';

interface AccessUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  currentUser?: any; 
}

export function AccessUpgradeModal({ isOpen, onClose, onUpgrade, currentUser }: AccessUpgradeModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // ---- Demo Mode: VIP opens directly ----
    if (!currentUser || currentUser.uid === "demo") {
      alert("⚡ Demo Mode: VIP unlocked for testing!");
      onUpgrade();
      onClose();
      return;
    }

    // ---- Real Mode ----
    if (!window.Pi) {
      alert("❌ Please open this app in Pi Browser");
      return;
    }

    if (isProcessing) return; // منع الضغط المتكرر
    setIsProcessing(true);

    try {
      await createVIPPayment(currentUser.uid, () => {
        // ✅ VIP فقط بعد إتمام الدفع
        onUpgrade();
        onClose();
        alert("✅ VIP Unlocked!");
      });
    } catch (err) {
      console.error(err);
      alert("❌ Payment failed. Try again.");
    } finally {
      setIsProcessing(false);
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
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 opacity-80">
              <h3 className="font-semibold text-gray-700 text-sm mb-3">Free Explorer</h3>
              <ul className="space-y-2 text-xs text-gray-600">
                <li className="flex items-center gap-2"><Check className="w-3 h-3"/> Basic Score</li>
                <li className="flex items-center gap-2"><Check className="w-3 h-3"/> Public Metrics</li>
              </ul>
            </div>

            <div className="p-4 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg border-2 border-cyan-200">
              <h3 className="font-semibold text-cyan-700 text-sm mb-3">VIP Insights</h3>
              <ul className="space-y-2 text-xs text-gray-700">
                <li className="flex items-center gap-2"><Check className="w-3 h-3 text-cyan-600"/> AI Behavior Analysis</li>
                <li className="flex items-center gap-2"><Check className="w-3 h-3 text-cyan-600"/> Risk Heatmaps</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border-t">
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-3xl font-black text-gray-900">1</span>
              <span className="text-xl font-bold text-purple-600">π</span>
            </div>
          </div>
          
          <Button 
            type="button"
            onClick={handlePayment}
            disabled={isProcessing}
            className={`w-full h-14 ${
              isProcessing ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-cyan-600 to-blue-700'
            } text-white rounded-xl shadow-lg font-black uppercase`}
          >
            <Sparkles className="w-5 h-5 mr-2" />
            {isProcessing ? 'Processing...' : 'Unlock Now'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
