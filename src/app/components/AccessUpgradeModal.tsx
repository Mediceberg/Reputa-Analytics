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
}

export function AccessUpgradeModal({ isOpen, onClose, onUpgrade }: AccessUpgradeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
            Unlock Advanced Insights
          </DialogTitle>
          <DialogDescription>
            Access professional-grade wallet intelligence and behavioral analysis
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current vs Advanced */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Explorer View */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-700">Explorer View</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span>Basic Trust Score</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span>Last 10 Transactions</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span>General Metrics</span>
                </li>
                <li className="flex items-start gap-2 opacity-40">
                  <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Limited Analysis</span>
                </li>
              </ul>
            </div>

            {/* Advanced Access */}
            <div className="p-4 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg border-2 border-cyan-200 relative overflow-hidden">
              <div className="absolute top-2 right-2">
                <Sparkles className="w-5 h-5 text-cyan-500" />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-cyan-700">Advanced Insights</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-cyan-600 flex-shrink-0 mt-0.5" />
                  <span className="font-medium">Reputa Intelligence Score</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-cyan-600 flex-shrink-0 mt-0.5" />
                  <span className="font-medium">Behavioral AI Analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-cyan-600 flex-shrink-0 mt-0.5" />
                  <span className="font-medium">Risk Heatmap & Patterns</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-cyan-600 flex-shrink-0 mt-0.5" />
                  <span className="font-medium">Full Audit Reports</span>
                </li>
              </ul>
            </div>
          </div>

          {/* What You Get */}
          <div className="p-5 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
            <h3 className="font-semibold mb-3 text-gray-800">What Your Wallet Says About You</h3>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">Consistency Score & Stability Index</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">Network Trust Mapping</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">Transaction Flow Intelligence</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">Predictability & Risk Signals</p>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="text-center p-6 bg-white rounded-lg border-2 border-gray-200">
            <p className="text-sm text-gray-500 mb-2">One-time Access</p>
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-4xl font-bold text-gray-900">1</span>
              <span className="text-2xl font-semibold text-purple-600">π</span>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Lifetime access to advanced wallet intelligence
            </p>
            <Button 
              onClick={onUpgrade}
              className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Unlock Advanced Insights
            </Button>
          </div>

          {/* Security Note */}
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <Lock className="w-3 h-3" />
            <span>Secure payment via Pi Network • No personal data stored</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
