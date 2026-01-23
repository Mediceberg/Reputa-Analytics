import React from 'react';
import { Sparkles, Lock, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { createVIPPayment } from '../services/piPayments';

interface AccessUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  currentUser?: any; 
}

// التعديل الجوهري هنا: استخدام export function ليتطابق مع import { AccessUpgradeModal }
export function AccessUpgradeModal({ isOpen, onClose, onUpgrade, currentUser }: AccessUpgradeModalProps) {
  
  const handlePayment = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) return;

    // ---- Demo Mode ----
    if (currentUser.uid === "demo") {
      onUpgrade();
      onClose();
      alert("✅ VIP Unlocked (Demo)!");
      return;
    }

    try {
      // نعتمد كلياً على الوظيفة الموجودة في piPayments.ts
      await createVIPPayment(currentUser.uid, () => {
        onUpgrade();
        onClose();
        alert("✅ VIP Access Granted Successfully!");
      });
    } catch (err: any) {
      console.error("Modal Payment Error:", err);
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

        <div className="p-4 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg border-2 border-cyan-200 mt-4 mx-6">
          <h3 className="font-semibold text-cyan-700 text-sm mb-3">VIP Insights</h3>
          <ul className="space-y-2 text-xs text-gray-700">
            <li className="flex items-center gap-2">
              <Check className="w-3 h-3 text-cyan-600" /> AI Behavior Analysis
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3 h-3 text-cyan-600" /> Risk Heatmaps
            </li>
          </ul>
        </div>

        <DialogFooter className="p-6">
          <Button onClick={handlePayment} className="w-full flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" /> Upgrade to VIP
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
