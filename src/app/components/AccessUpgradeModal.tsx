import { Sparkles, Lock, Check } from 'lucide-react';  
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { createVIPPayment } from '../services/piPayments';

interface AccessUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  currentUser?: any; 
}

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
      // 1️⃣ إنشاء عملية دفع على backend
      const paymentId = await createVIPPayment(currentUser.uid);
      if (!paymentId) throw new Error("Could not start Pi payment");

      // 2️⃣ الموافقة على الدفع
      const approveRes = await fetch('/api/piPayment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', paymentId })
      });
      if (!approveRes.ok) throw new Error("Payment approval failed");

      // 3️⃣ انتظار الـ txid من Pi Network (تستبدل بالوظيفة الصحيحة لجلب txid)
      const txid = await getTxidFromPi(paymentId); // dummy function placeholder
      if (!txid) throw new Error("Transaction ID not found");

      // 4️⃣ إتمام الدفع
      const completeRes = await fetch('/api/piPayment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete', paymentId, txid, uid: currentUser.uid })
      });
      const completeData = await completeRes.json();

      if (completeRes.ok && completeData.success) {
        onUpgrade();
        onClose();
        alert("✅ VIP Unlocked!");
      } else {
        throw new Error("Payment completion failed");
      }

    } catch (err: any) {
      console.error(err);
      alert(`❌ VIP could not be unlocked: ${err.message}`);
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
                <li className="flex items-center gap-2"><Check className="w-3 h-3 text-cyan-600"/> AI Beha
