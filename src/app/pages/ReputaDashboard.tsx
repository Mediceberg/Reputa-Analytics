import React, { useState, useEffect } from 'react';  
import { X, Upload, Download, Sparkles, Loader2, Shield, Zap, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { generateCompleteReport, checkVIPStatus, createVIPPayment } from '../protocol';
import { processYearWithPiImage } from '../protocol/mining';
import type { PiUser, ReputationReport, MiningData } from '../protocol/types';

interface ReputaDashboardProps {
  onClose: () => void;
  currentUser: PiUser | null;
  walletAddress: string;
}

export function ReputaDashboard({ onClose, currentUser, walletAddress }: ReputaDashboardProps) {
  const [report, setReport] = useState<ReputationReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isVIP, setIsVIP] = useState(false);

  useEffect(() => {
    async function initDashboard() {
      setIsLoading(true);
      try {
        const vipStatus = checkVIPStatus(currentUser?.uid || '');
        setIsVIP(vipStatus);

        const initialReport = await generateCompleteReport(
          walletAddress,
          currentUser?.uid,
          undefined,
          vipStatus
        );
        setReport(initialReport);
      } catch (error) {
        console.error('Dashboard initialization failed:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (walletAddress) initDashboard();
  }, [walletAddress, currentUser]);

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
        const updatedReport = await generateCompleteReport(
          walletAddress,
          currentUser?.uid,
          result.extractedData,
          isVIP
        );
        setReport(updatedReport);
        alert('Mining bonus unlocked! Your score has been updated.');
      }
    } catch (error) {
      console.error('Image upload failed:', error);
      alert('Failed to process image. Make sure it is a valid "Year with Pi" screenshot.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleVIPUpgrade = async () => {
    if (!currentUser?.uid) return;
    
    try {
      const success = await createVIPPayment(currentUser.uid);
      if (success) {
        alert('Payment initiated! Check your Pi Wallet to confirm.');
      }
    } catch (error) {
      console.error('VIP upgrade failed:', error);
      alert('Payment failed to initialize. Please use Pi Browser.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-md">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <Card className="max-w-6xl w-full max-h-[90vh] overflow-y-auto p-6 bg-gradient-to-br from-slate-900/98 via-slate-800/98 to-slate-900/98 border-2 border-cyan-500/30 shadow-2xl shadow-cyan-500/20 relative backdrop-blur-xl">
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
          backgroundImage: `linear-gradient(rgba(0, 217, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 217, 255, 0.1) 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}></div>

        <div className="relative z-10">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-6 border-b border-cyan-500/20 pb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Reputa Dashboard
                </h2>
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  {currentUser?.username || 'Pioneer'} 
                  <span className="text-cyan-400">•</span>
                  {isVIP ? (
                    <span className="flex items-center gap-1 text-yellow-400">
                      <Shield className="w-3 h-3" /> VIP Member
                    </span>
                  ) : (
                    <span className="text-gray-500">Regular Member</span>
                  )}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose} 
              className="rounded-full hover:bg-red-500/20 hover:text-red-400 border border-transparent hover:border-red-500/30 transition-all"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Upload Mining Image Section */}
          <div className="mb-6">
            <Card className="p-4 border-2 border-dashed border-cyan-500/30 hover:border-cyan-400/50 transition-all bg-white/5 backdrop-blur-sm">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-center md:text-left">
                  <h3 className="font-semibold flex items-center justify-center md:justify-start gap-2 text-white">
                    <Upload className="w-4 h-4 text-cyan-400" />
                    Verify Mining History
                  </h3>
                  <p className="text-sm text-gray-500">
                    Upload your "Year with Pi" screenshot to gain up to +10 reputation points.
                  </p>
                </div>
                <label htmlFor="mining-upload">
                  <Button 
                    disabled={uploadingImage} 
                    variant="outline" 
                    className="relative cursor-pointer overflow-hidden border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-400"
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Select Screenshot'
                    )}
                    <input
                      id="mining-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />
                  </Button>
                </label>
              </div>
            </Card>
          </div>

          {/* VIP Upgrade CTA */}
          {!isVIP && (
            <div className="mb-6">
              <Card className="p-4 bg-gradient-to-r from-purple-600/90 to-indigo-700/90 text-white shadow-lg shadow-purple-500/30 border border-purple-400/30 backdrop-blur-sm">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-yellow-300" />
                      Upgrade to VIP Analytics
                    </h3>
                    <p className="text-purple-200 text-sm">
                      Unlock full transaction history, deep behavior insights, and PDF exports for just 1 Pi.
                    </p>
                  </div>
                  <Button
                    onClick={handleVIPUpgrade}
                    className="bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 hover:from-yellow-500 hover:to-amber-600 font-bold px-8 shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 hover:scale-105 transition-all"
                  >
                    Upgrade for 1 Pi
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Dashboard Content */}
          {isLoading ? (
            <div className="text-center py-20">
              <div className="relative inline-block">
                <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mx-auto mb-4" />
                <div className="absolute inset-0 w-12 h-12 mx-auto rounded-full bg-cyan-400/20 blur-xl"></div>
              </div>
              <p className="text-gray-400 font-medium">Decoding Blockchain Data...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-cyan-500/20 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <p className="text-gray-400 mb-2">
                  Report for <code className="text-cyan-400 font-mono bg-slate-800/50 px-2 py-1 rounded">{walletAddress.slice(0, 12)}...{walletAddress.slice(-8)}</code>
                </p>
                <p className="text-gray-500">
                  Current Trust Score: 
                  <span className="ml-2 text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    {report?.scores.totalScore}
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
