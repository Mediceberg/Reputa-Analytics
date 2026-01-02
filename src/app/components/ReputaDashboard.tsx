import { useState, useEffect } from 'react';
import { X, Upload, TrendingUp, Shield, Activity, Clock, Award, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { 
  generateCompleteReport, 
  processYearWithPiImage, 
  verifyImage,
  createVIPPayment,
  checkVIPStatus,
  type ReputationReport,
  type MiningData 
} from '../protocol';

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
      setIsVIP(checkVIPStatus(userId));
    }
  }, [walletAddress, userId]);

  const loadReport = async () => {
    setIsLoading(true);
    try {
      const newReport = await generateCompleteReport(walletAddress, userId, undefined, isVIP);
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
        const updatedReport = await generateCompleteReport(
          walletAddress,
          userId,
          result.extractedData,
          isVIP
        );
        setReport(updatedReport);
        alert(`Mining bonus unlocked: +${result.extractedData.score} points!`);
      } else {
        alert('Image verification failed. Please try another image.');
      }
    } catch (error) {
      console.error('Image upload failed:', error);
      alert('Failed to process image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUpgradeToVIP = async () => {
    if (!userId) {
      alert('Please authenticate with Pi Network first.');
      return;
    }

    try {
      await createVIPPayment(userId);
      alert('Payment initiated! Please complete in Pi Browser.');
    } catch (error) {
      console.error('VIP upgrade failed:', error);
      alert('Failed to initiate payment. Please try again.');
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="max-w-6xl w-full p-6 my-8">
        {/* Header */}
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

        {/* Trust Score Card */}
        <Card className="p-6 mb-6 bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Reputation Score</p>
              <p className="text-5xl font-bold text-cyan-600">{scores.totalScore}</p>
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
                <span className="font-semibold">{trustLevel} Trust</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Trust Level</p>
            </div>
          </div>
        </Card>

        {/* Score Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Wallet Age */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold">Wallet Age</h3>
            </div>
            <Progress value={(scores.walletAgeScore / 20) * 100} className="mb-2" />
            <p className="text-2xl font-bold">{scores.walletAgeScore}/20</p>
            <p className="text-xs text-gray-600 mt-1">{scores.breakdown.walletAge.explanation}</p>
          </Card>

          {/* Transactions */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold">Transactions</h3>
            </div>
            <Progress value={(scores.transactionScore / 40) * 100} className="mb-2" />
            <p className="text-2xl font-bold">{scores.transactionScore}/40</p>
            <p className="text-xs text-gray-600 mt-1">
              {scores.breakdown.transactions.internal} internal, {scores.breakdown.transactions.external} external
            </p>
          </Card>

          {/* Staking */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <h3 className="font-semibold">Staking</h3>
            </div>
            <Progress value={(scores.stakingScore / 30) * 100} className="mb-2" />
            <p className="text-2xl font-bold">{scores.stakingScore}/30</p>
            <p className="text-xs text-gray-600 mt-1">
              {stakingData ? `${stakingData.amount.toFixed(2)} Pi staked` : 'No staking'}
            </p>
          </Card>

          {/* Mining Bonus */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-5 h-5 text-yellow-500" />
              <h3 className="font-semibold">Mining Bonus</h3>
            </div>
            <Progress value={(scores.miningScore / 10) * 100} className="mb-2" />
            <p className="text-2xl font-bold">{scores.miningScore}/10</p>
            <p className="text-xs text-gray-600 mt-1">
              {miningData ? `${miningData.totalDays} days` : 'Upload image to unlock'}
            </p>
          </Card>
        </div>

        {/* Upload Mining Image */}
        {!miningData && (
          <Card className="p-4 mb-6 border-2 border-dashed border-gray-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">Upload Year with Pi</h3>
                <p className="text-sm text-gray-600">
                  Add mining screenshot to unlock bonus points (up to +10)
                </p>
              </div>
              <label>
                <Button disabled={uploadingImage}>
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadingImage ? 'Processing...' : 'Upload'}
                </Button>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
              </label>
            </div>
          </Card>
        )}

        {/* Transactions */}
        <Card className="p-4 mb-6">
          <h3 className="font-semibold mb-4">Recent Transactions</h3>
          <div className="space-y-2">
            {(isVIP ? walletData.transactions : walletData.transactions.slice(0, 3)).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      tx.type === 'internal' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {tx.type}
                    </span>
                    <span className="text-sm font-mono">{tx.amount} Pi</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {tx.timestamp.toLocaleDateString()}
                  </p>
                </div>
                {tx.score && (
                  <div className="text-right">
                    <span className={`text-sm font-semibold ${
                      tx.score.totalPoints > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {tx.score.totalPoints > 0 ? '+' : ''}{tx.score.totalPoints}
                    </span>
                    {isVIP && (
                      <p className="text-xs text-gray-500 mt-1">{tx.score.explanation}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
            {!isVIP && walletData.transactions.length > 3 && (
              <Button onClick={handleUpgradeToVIP} variant="outline" className="w-full">
                Upgrade to VIP to see all {walletData.transactions.length} transactions
              </Button>
            )}
          </div>
        </Card>

        {/* Alerts */}
        {alerts.length > 0 && (
          <Card className="p-4 mb-6">
            <h3 className="font-semibold mb-4">Alerts</h3>
            <div className="space-y-2">
              {alerts.map((alert, i) => (
                <div key={i} className={`p-3 rounded-lg ${
                  alert.type === 'success' ? 'bg-green-50 text-green-700' :
                  alert.type === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                  alert.type === 'error' ? 'bg-red-50 text-red-700' :
                  'bg-blue-50 text-blue-700'
                }`}>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold">{alert.message}</p>
                      {alert.details && (
                        <p className="text-xs mt-1">{alert.details}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* VIP Upgrade CTA */}
        {!isVIP && (
          <Card className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-yellow-800 mb-2">
                  Unlock Full Analysis
                </h3>
                <p className="text-sm text-yellow-700">
                  Get all transactions, detailed breakdowns, and advanced insights
                </p>
              </div>
              <Button 
                onClick={handleUpgradeToVIP}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
              >
                Upgrade for 1 Pi
              </Button>
            </div>
          </Card>
        )}
      </Card>
    </div>
  );
}