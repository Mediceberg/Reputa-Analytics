import { useState, useEffect } from 'react';  
import { X, Upload, Download, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { generateCompleteReport, checkVIPStatus, createVIPPayment } from '../protocol';
import { processYearWithPiImage } from '../protocol/mining';
import type { PiUser, ReputationReport, MiningData } from '../protocol/types';

interface ReputaDashboardProps {
  onClose: () => void;
  currentUser: PiUser | null;
  walletAddress: string; // أضفنا هذا لضمان جلب بيانات المحفظة الصحيحة
}

export function ReputaDashboard({ onClose, currentUser, walletAddress }: ReputaDashboardProps) {
  const [report, setReport] = useState<ReputationReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isVIP, setIsVIP] = useState(false);

  // 1. جلب التقرير الأولي عند فتح اللوحة
  useEffect(() => {
    async function initDashboard() {
      setIsLoading(true);
      try {
        // التأكد من حالة الـ VIP الحقيقية
        const vipStatus = checkVIPStatus(currentUser?.uid || '');
        setIsVIP(vipStatus);

        // توليد التقرير بناءً على بيانات البلوكشين الحقيقية (Testnet)
        const initialReport = await generateCompleteReport(
          walletAddress,
          currentUser?.uid,
          undefined, // لا توجد بيانات تعدين بعد
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

  // 2. معالجة رفع صورة تعدين Pi وتحديث السمعة
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      // معالجة الصورة لاستخراج بيانات "Year with Pi"
      const result = await processYearWithPiImage(
        file,
        report?.walletData.createdAt || new Date()
      );

      if (result.extractedData) {
        // إعادة توليد التقرير فوراً لدمج نقاط المكافأة الجديدة
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

  // 3. تفعيل عملية الدفع الحقيقية لترقية VIP
  const handleVIPUpgrade = async () => {
    if (!currentUser?.uid) return;
    
    try {
      // استدعاء دالة الدفع التي قمنا بربطها بـ Pi SDK
      const success = await createVIPPayment(currentUser.uid);
      if (success) {
        alert('Payment initiated! Check your Pi Wallet to confirm.');
        // ملاحظة: سيتم تحديث الحالة تلقائياً بعد نجاح المعاملة عبر المستمعين في piPayment.ts
      }
    } catch (error) {
      console.error('VIP upgrade failed:', error);
      alert('Payment failed to initialize. Please use Pi Browser.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <Card className="max-w-6xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border-2">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6 border-b pb-4">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Reputa Dashboard
            </h2>
            <p className="text-sm text-gray-500">
              {currentUser?.username || 'Pioneer'} • {isVIP ? '🛡️ VIP Member' : 'Regular Member'}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-red-50 hover:text-red-500">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Upload Mining Image Section */}
        <div className="mb-6">
          <Card className="p-4 border-2 border-dashed border-gray-200 hover:border-blue-400 transition-all bg-gray-50/50">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <h3 className="font-semibold flex items-center justify-center md:justify-start gap-2">
                  <Upload className="w-4 h-4 text-blue-500" />
                  Verify Mining History
                </h3>
                <p className="text-sm text-gray-600">
                  Upload your "Year with Pi" screenshot to gain up to +10 reputation points.
                </p>
              </div>
              <label htmlFor="mining-upload">
                <Button disabled={uploadingImage} variant="outline" className="relative cursor-pointer overflow-hidden">
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

        {/* VIP Upgrade CTA - تظهر فقط للأعضاء العاديين */}
        {!isVIP && (
          <div className="mb-6">
            <Card className="p-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-300" />
                    Upgrade to VIP Analytics
                  </h3>
                  <p className="text-blue-100 text-sm">
                    Unlock full transaction history, deep behavior insights, and PDF exports for just 1 Pi.
                  </p>
                </div>
                <Button
                  onClick={handleVIPUpgrade}
                  className="bg-white text-blue-700 hover:bg-yellow-50 font-bold px-8 shadow-inner"
                >
                  Upgrade for 1 Pi
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Dashboard Content Display */}
        {isLoading ? (
          <div className="text-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Decoding Blockchain Data...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {/* هنا يتم استدعاء مكونات التقرير الفرعية (ReportSummary, ScoreCharts, etc.) */}
            <div className="bg-gray-50 rounded-xl p-8 border border-gray-100 text-center">
              <p className="text-gray-400 italic">
                Report for {walletAddress} successfully generated. 
                <br /> 
                Current Trust Score: <span className="text-blue-600 font-bold text-xl">{report?.scores.totalScore}</span>
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
