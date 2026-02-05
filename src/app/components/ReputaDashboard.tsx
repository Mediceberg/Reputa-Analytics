import React, { useState, useEffect } from 'react';  
import { X, Upload, TrendingUp, Shield, Activity, Clock, Award, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { 
  generateCompleteReport, 
  processYearWithPiImage, 
  verifyImage,
  checkVIPStatus,
  type ReputationReport,
  type MiningData 
} from '../protocol';
import { createVIPPayment } from '../services/piPayments';
import { reputationService } from '../services/reputationService';

interface DashboardProps {
  walletAddress: string;
  userId?: string;
  onClose: () => void;
}

export function ReputaDashboard({ walletAddress, userId, onClose }: DashboardProps) {
  const [report, setReport] = useState<ReputationReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isVIP, setIsVIP] = useState(false);

  useEffect(() => {
    loadReport();
    if (userId) {
      // التحقق الحقيقي من حالة الـ VIP
      const checkRealVIP = async () => {
        try {
          const res = await fetch(`/api/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessToken: 'verify', user: { uid: userId } })
          });
          const data = await res.json();
          setIsVIP(data.session?.authenticated || checkVIPStatus(userId));
        } catch {
          setIsVIP(checkVIPStatus(userId));
        }
      };
      checkRealVIP();
    }
  }, [walletAddress, userId]);

  const loadReport = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/wallet?walletAddress=${walletAddress}&userId=${userId}`);
      const apiData = await response.json();
      
      const newReport = await generateCompleteReport(walletAddress, userId, report?.miningData, isVIP);
      
      if (apiData.success && apiData.wallet) {
        newReport.walletData.balance = apiData.wallet.balance;
      }
      
      setReport(newReport);
    } catch (error) {
      console.error('Failed to load report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = await verifyImage(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }
    setUploadingImage(true);
    try {
      const result = await processYearWithPiImage(file, report!.walletData.createdAt);
      if (result.verified && result.extractedData) {
        const updatedReport = await generateCompleteReport(walletAddress, userId, result.extractedData, isVIP);
        setReport(updatedReport);
        alert(`Mining bonus unlocked: +${result.extractedData.score} points!`);
      } else {
        alert('Image verification failed.');
      }
    } catch (error) {
      console.error('Image upload failed:', error);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUpgradeToVIP = async () => {
    if (!userId) {
      alert('Please authenticate first.');
      return;
    }
    try {
      await createVIPPayment(userId, () => {
        setIsVIP(true);
        loadReport();
      });
    } catch (error) {
      console.error('VIP upgrade failed:', error);
      alert('VIP upgrade failed. Please use Pi Browser.');
    }
  };

  if (isLoading || !report) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="p-8">
          <p>Loading reputation analysis...</p>
        </Card>
      </div>
    );
  }

  const { scores, walletData, stakingData, miningData, trustLevel, alerts } = report;

  // Prefer unified protocol score as single source of truth (use cached to avoid flicker)
  const cachedUnified = typeof window !== 'undefined' ? reputationService.getCachedUnifiedScore(userId) : null;
  const displayedTotalScore = cachedUnified?.totalScore ?? scores.totalScore;
  const displayedTrustLevel = cachedUnified?.atomicTrustLevel ?? trustLevel;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="max-w-6xl w-full p-6 my-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
              Reputation Dashboard
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {walletData.username} • {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <Card className="p-6 mb-6 bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Reputation Score</p>
              <p className="text-5xl font-bold text-cyan-600">{displayedTotalScore}</p>
              <p className="text-sm text-gray-500 mt-1">out of 1000</p>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                trustLevel === 'Elite' ? 'bg-emerald-100 text-emerald-700' :
                trustLevel === 'High' ? 'bg-blue-100 text-blue-700' :
                trustLevel === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                <Shield className="w-5 h-5" />
                <span className="font-semibold">{displayedTrustLevel} Trust</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold">Wallet Age</h3>
            </div>
            <Progress value={(scores.walletAgeScore / 20) * 100} className="mb-2" />
            <p className="text-2xl font-bold">{scores.walletAgeScore}/20</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold">Transactions</h3>
            </div>
            <Progress value={(scores.transactionScore / 40) * 100} className="mb-2" />
            <p className="text-2xl font-bold">{scores.transactionScore}/40</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <h3 className="font-semibold">Staking</h3>
            </div>
            <Progress value={(scores.stakingScore / 30) * 100} className="mb-2" />
            <p className="text-2xl font-bold">{scores.stakingScore}/30</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-5 h-5 text-yellow-500" />
              <h3 className="font-semibold">Mining Bonus</h3>
            </div>
            <Progress value={(scores.miningScore / 10) * 100} className="mb-2" />
            <p className="text-2xl font-bold">{scores.miningScore}/10</p>
          </Card>
        </div>

        {!miningData && (
          <Card className="p-4 mb-6 border-2 border-dashed border-gray-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">Upload Year with Pi</h3>
                <p className="text-sm text-gray-600">Add mining screenshot to unlock bonus points</p>
              </div>
              <label>
                <Button disabled={uploadingImage}>
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadingImage ? 'Processing...' : 'Upload'}
                </Button>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
              </label>
            </div>
          </Card>
        )}

        <Card className="p-4 mb-6">
          <h3 className="font-semibold mb-4">Recent Transactions</h3>
          <div className="space-y-2">
            {(isVIP ? walletData.transactions : walletData.transactions.slice(0, 3)).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 text-sm">
                  {tx.type} - {tx.amount} Pi
                </div>
              </div>
            ))}
          </div>
        </Card>

        {!isVIP && (
          <Card className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-yellow-800 mb-2">Unlock Full Analysis</h3>
                <p className="text-sm text-yellow-700">Get all transactions and advanced insights</p>
              </div>
              <Button onClick={handleUpgradeToVIP} className="bg-yellow-500 hover:bg-yellow-600">
                Upgrade for 1 Pi
              </Button>
            </div>
          </Card>
        )}
      </Card>
    </div>
  );
}
