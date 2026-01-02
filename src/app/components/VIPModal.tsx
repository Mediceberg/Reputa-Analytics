import { Crown, Check, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';

interface VIPModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchase: () => void;
}

export function VIPModal({ isOpen, onClose, onPurchase }: VIPModalProps) {
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

  const handlePurchase = () => {
    // In a real implementation, this would integrate with Pi SDK
    // Example: window.Pi.createPayment({ amount: 1, memo: "Reputa VIP Upgrade" })
    onPurchase();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
              <Crown className="w-5 h-5 text-white" />
            </div>
            Upgrade to VIP Access
          </DialogTitle>
          <DialogDescription>
            Unlock professional audit reports and unlimited wallet analyses with lifetime VIP membership.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Pricing Card */}
          <div className="p-6 bg-gradient-to-br from-purple-50 to-yellow-50 rounded-lg border-2 border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-xl">VIP Membership</h3>
                <p className="text-sm text-gray-600">Lifetime access</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-purple-600">1 π</div>
                <p className="text-xs text-gray-500">One-time payment</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Benefits Section */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-1">Professional Reports</h4>
                <p className="text-xs text-gray-600">
                  Get detailed audit reports with behavioral analysis, risk scoring, and actionable insights.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-1">Unlimited Access</h4>
                <p className="text-xs text-gray-600">
                  Analyze as many wallets as you need without any restrictions or additional fees.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-1">Secure Payment</h4>
                <p className="text-xs text-gray-600">
                  Payment is processed securely through the official Pi Network payment system.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 gap-2"
            >
              <X className="w-4 h-4" />
              Maybe Later
            </Button>
            <Button
              onClick={handlePurchase}
              className="flex-1 gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600"
            >
              <Crown className="w-4 h-4" />
              Purchase VIP (1 π)
            </Button>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-center text-gray-500">
            By purchasing, you agree to our terms of service. VIP access is non-refundable.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}