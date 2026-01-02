import { useState, useEffect } from 'react';
import { X, Upload, Download, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { generateCompleteReport } from '../protocol';
import { processYearWithPiImage } from '../protocol/mining';
import { createVIPSubscription } from '../services/piPayments';
import type { PiUser, ReputationReport, MiningData } from '../protocol/types';

interface ReputaDashboardProps {
  onClose: () => void;
  currentUser: PiUser | null;
}

export function ReputaDashboard({ onClose, currentUser }: ReputaDashboardProps) {
  const [report, setReport] = useState<ReputationReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [miningData, setMiningData] = useState<MiningData | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const result = await processYearWithPiImage(
        file,
        report?.walletData.createdAt || new Date()
      );

      if (result.extractedData) {
        setMiningData(result.extractedData);
        // Regenerate report with mining data
        if (report) {
          const newReport = await generateCompleteReport(
            report.walletAddress,
            currentUser?.uid,
            result.extractedData,
            report.isVIP
          );
          setReport(newReport);
        }
      }
    } catch (error) {
      console.error('Image upload failed:', error);
      alert('Failed to process image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleVIPUpgrade = async () => {
    try {
      await createVIPSubscription();
      alert('VIP subscription initiated! Please complete the payment in Pi Browser.');
    } catch (error) {
      console.error('VIP upgrade failed:', error);
      alert('Failed to initiate VIP subscription. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-6xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Reputa Dashboard</h2>
            <p className="text-sm text-gray-500">
              {currentUser?.username || 'Anonymous'} • Comprehensive Reputation Analysis
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Upload Mining Image */}
        <div className="mb-6">
          <Card className="p-4 border-2 border-dashed border-gray-300 hover:border-cyan-500 transition">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">Upload Year with Pi</h3>
                <p className="text-sm text-gray-600">
                  Add your mining screenshot to unlock bonus points (up to +10)
                </p>
              </div>
              <label htmlFor="mining-upload">
                <Button disabled={uploadingImage} className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadingImage ? 'Processing...' : 'Upload Image'}
                </Button>
                <input
                  id="mining-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
              </label>
            </div>
          </Card>
        </div>

        {/* VIP Upgrade CTA */}
        {!report?.isVIP && (
          <div className="mb-6">
            <Card className="p-4 bg-gradient-to-r from-cyan-50 to-blue-50 border-2 border-cyan-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-cyan-800 mb-1">
                    Unlock Full Analysis
                  </h3>
                  <p className="text-sm text-cyan-700">
                    Get detailed transaction breakdowns, advanced insights, and export capabilities
                  </p>
                </div>
                <Button
                  onClick={handleVIPUpgrade}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Upgrade for 1 Pi
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Report Display Placeholder */}
        <div className="text-center text-gray-500 py-12">
          <p>Dashboard content will be displayed here</p>
          <p className="text-sm mt-2">
            Complete report generation in progress...
          </p>
        </div>
      </Card>
    </div>
  );
}
