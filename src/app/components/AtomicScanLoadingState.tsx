/**
 * 🔥 Atomic Scan Loading State Component
 * 
 * واجهة التحليل الذري مع شريط التقدم ومعلومات المسح المباشر
 * تظهر أثناء Deep Scanning أو Incremental Sync
 */

import React, { useState, useEffect } from 'react';
import { Loader2, Search, Database, Calculator, Trophy, Zap } from 'lucide-react';

export interface AtomicScanLoadingStateProps {
  isVisible: boolean;
  scanType: 'initial_deep_scan' | 'incremental_sync' | 'genesis_calculation';
  progress: number; // 0-100
  currentStep: string;
  estimatedTimeRemaining?: number; // in seconds
  transactionsScanned?: number;
  totalTransactions?: number;
  onCancel?: () => void;
}

const AtomicScanLoadingState: React.FC<AtomicScanLoadingStateProps> = ({
  isVisible,
  scanType,
  progress,
  currentStep,
  estimatedTimeRemaining,
  transactionsScanned = 0,
  totalTransactions,
  onCancel
}) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [scanningText, setScanningText] = useState('');

  useEffect(() => {
    if (isVisible) {
      // Smooth progress animation
      const progressTimer = setInterval(() => {
        setAnimatedProgress(prev => {
          const diff = progress - prev;
          if (Math.abs(diff) < 0.1) return progress;
          return prev + (diff * 0.1);
        });
      }, 50);

      // Animated scanning text
      const textTimer = setInterval(() => {
        setScanningText(prev => {
          if (prev.endsWith('...')) return 'جاري المسح';
          return prev + '.';
        });
      }, 500);

      return () => {
        clearInterval(progressTimer);
        clearInterval(textTimer);
      };
    }
  }, [isVisible, progress]);

  useEffect(() => {
    if (isVisible) {
      setScanningText('جاري المسح');
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const getScanTypeConfig = () => {
    switch (scanType) {
      case 'initial_deep_scan':
        return {
          title: 'المسح الشامل للمحفظة',
          subtitle: 'جاري تحليل تاريخ محفظتك بالكامل لبناء سمعتك الذرية',
          icon: <Database className="w-8 h-8" />,
          color: 'from-blue-600 to-cyan-600',
          stages: [
            'جلب المعاملات التاريخية',
            'تحليل البيانات المالية',
            'حساب نقاط Genesis Boost',
            'حفظ الملف الشخصي الذري'
          ]
        };
      case 'incremental_sync':
        return {
          title: 'مزامنة المعاملات الجديدة',
          subtitle: 'جاري البحث عن المعاملات الجديدة وتحديث النقاط',
          icon: <Zap className="w-8 h-8" />,
          color: 'from-green-600 to-emerald-600',
          stages: [
            'فحص المعاملات الجديدة',
            'حساب النقاط المكتسبة',
            'تحديث السجل الشخصي'
          ]
        };
      case 'genesis_calculation':
        return {
          title: 'حساب نقاط التأسيس',
          subtitle: 'تحليل نشاطك التاريخي لحساب مكافأة Genesis',
          icon: <Calculator className="w-8 h-8" />,
          color: 'from-purple-600 to-pink-600',
          stages: [
            'تحليل عمر الحساب',
            'حساب النشاط التاريخي',
            'تقييم حجم المعاملات',
            'تطبيق مكافأة Genesis'
          ]
        };
    }
  };

  const config = getScanTypeConfig();
  const currentStageIndex = Math.floor((animatedProgress / 100) * config.stages.length);
  const currentStage = config.stages[currentStageIndex] || config.stages[config.stages.length - 1];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center">
        {/* Header Icon */}
        <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${config.color} rounded-full text-white mb-4`}>
          {config.icon}
        </div>

        {/* Title & Subtitle */}
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {config.title}
        </h2>
        <p className="text-gray-600 text-sm mb-6 leading-relaxed">
          {config.subtitle}
        </p>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>{Math.round(animatedProgress)}%</span>
            {estimatedTimeRemaining && estimatedTimeRemaining > 0 && (
              <span>
                {estimatedTimeRemaining > 60 
                  ? `${Math.round(estimatedTimeRemaining / 60)} د`
                  : `${estimatedTimeRemaining} ث`
                }
              </span>
            )}
          </div>
          
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${config.color} rounded-full transition-all duration-300 ease-out`}
              style={{ width: `${animatedProgress}%` }}
            />
          </div>

          {/* Transaction Counter */}
          {transactionsScanned > 0 && (
            <div className="text-xs text-gray-500 mt-2">
              تم فحص {transactionsScanned.toLocaleString('ar-SA')} معاملة
              {totalTransactions && ` من أصل ${totalTransactions.toLocaleString('ar-SA')}`}
            </div>
          )}
        </div>

        {/* Current Stage */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-700 mb-3">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="font-medium">{currentStage}</span>
          </div>

          {/* Stage Progress Indicators */}
          <div className="flex justify-center gap-2">
            {config.stages.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index <= currentStageIndex
                    ? `bg-gradient-to-r ${config.color}`
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-xs text-gray-500 mb-4 space-y-1">
          <div className="flex items-center justify-center gap-2">
            <Search className="w-3 h-3" />
            <span>يتم الاتصال بشبكة Pi Blockchain</span>
          </div>
          {scanType === 'initial_deep_scan' && (
            <div className="flex items-center justify-center gap-2">
              <Trophy className="w-3 h-3" />
              <span>ستحصل على مكافأة Genesis عند الانتهاء</span>
            </div>
          )}
        </div>

        {/* Cancel Button */}
        {onCancel && scanType === 'incremental_sync' && (
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 text-sm underline transition-colors"
          >
            إلغاء المزامنة
          </button>
        )}
      </div>
    </div>
  );
};

export default AtomicScanLoadingState;
