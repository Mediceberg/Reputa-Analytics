import React, { useState, useEffect } from 'react';
import {
  Copy,
  Share2,
  Gift,
  TrendingUp,
  Clock,
  CheckCircle,
  Zap,
  MoreVertical,
} from 'lucide-react';
import { useReferral, ReferralStats } from '../hooks/useReferral';
import { useLanguage } from '../hooks/useLanguage';

interface ReferralSectionProps {
  walletAddress: string;
  username: string;
}

export function ReferralSection({ walletAddress, username }: ReferralSectionProps) {
  const { t, language } = useLanguage();
  const { stats, loading, error, fetchStats, claimPoints } = useReferral();
  const [copying, setCopying] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const isRTL = language === 'ar';

  // Fetch stats on mount and when wallet changes
  useEffect(() => {
    if (walletAddress) {
      fetchStats(walletAddress);
    }
  }, [walletAddress, fetchStats]);

  const handleCopyLink = async () => {
    if (!stats?.referralLink) return;

    setCopying(true);
    try {
      await navigator.clipboard.writeText(stats.referralLink);
      // Show toast notification
      setTimeout(() => setCopying(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      setCopying(false);
    }
  };

  const handleShareLink = async () => {
    if (!stats?.referralLink) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: isRTL ? 'انضم إلى Reputa Score' : 'Join Reputa Score',
          text: isRTL
            ? `انضم إلي عبر كود الإحالة: ${stats.referralCode}`
            : `Join me with referral code: ${stats.referralCode}`,
          url: stats.referralLink,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback: copy link to clipboard and show message
      try {
        await navigator.clipboard.writeText(stats.referralLink);
        alert(isRTL ? 'تم نسخ الرابط!' : 'Link copied!');
      } catch (err) {
        console.error('Error copying link:', err);
        alert(isRTL ? 'الرابط: ' + stats.referralLink : 'Link: ' + stats.referralLink);
      }
    }
  };

  const handleClaimPoints = async () => {
    if (!walletAddress || stats?.claimablePoints === 0) return;

    setClaiming(true);
    try {
      const success = await claimPoints(walletAddress);
      if (success) {
        // Stats will be updated automatically
      }
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div
        className="rounded-2xl p-6 animate-pulse"
        style={{
          background: 'linear-gradient(145deg, rgba(15, 17, 23, 0.98) 0%, rgba(20, 24, 32, 0.95) 100%)',
          border: '1px solid rgba(148, 51, 234, 0.2)',
        }}
      >
        <div className="h-6 bg-white/10 rounded w-40 mb-4" />
        <div className="h-4 bg-white/10 rounded w-60 mb-2" />
      </div>
    );
  }

  const referralLink = stats?.referralLink || `https://reputa-score.vercel.app/?ref=CODE`;
  const referralCode = stats?.referralCode || 'XXXXXX';

  return (
    <div className={`space-y-4 ${isRTL ? 'rtl' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-bold text-white">
            {isRTL ? 'نظام الإحالات' : 'Referral Program'}
          </h3>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>
          {showMenu && (
            <div
              className="absolute top-10 right-0 bg-black/90 border border-white/10 rounded-lg shadow-xl z-50"
              style={{
                [isRTL ? 'right' : 'left']: 0,
              }}
            >
              <button className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                {isRTL ? 'معلومات' : 'Info'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Referral Code Card */}
      <div
        className="rounded-xl p-4 border transition-all"
        style={{
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          boxShadow: '0 4px 20px -8px rgba(168, 85, 247, 0.2)',
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-purple-400" />
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {isRTL ? 'كود إحالتك الفريد' : 'Your Unique Referral Code'}
          </p>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <code
            className="flex-1 px-3 py-2 bg-black/40 rounded-lg border border-white/10 font-mono text-sm font-bold text-purple-300 tracking-widest"
          >
            {referralCode}
          </code>
          <button
            onClick={handleCopyLink}
            className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 transition-all active:scale-95"
            title={isRTL ? 'نسخ الرابط' : 'Copy link'}
          >
            <Copy className="w-4 h-4" />
          </button>
          {(navigator.share || true) && (
            <button
              onClick={handleShareLink}
              className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-all active:scale-95"
              title={isRTL ? 'مشاركة' : 'Share'}
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <p className="text-xs text-gray-400 leading-relaxed">
          {isRTL ? 'شارك هذا الكود مع الأصدقاء لكسب نقاط مكافأة' : 'Share this code with friends to earn reward points'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Confirmed Referrals */}
        <div
          className="rounded-lg p-4 border"
          style={{
            background: 'rgba(16, 185, 129, 0.05)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-tight">
              {isRTL ? 'مؤكدة' : 'Confirmed'}
            </p>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{stats?.confirmedReferrals || 0}</p>
          <p className="text-xs text-gray-500 mt-1">
            {isRTL ? 'إحالات نشطة' : 'Active referrals'}
          </p>
        </div>

        {/* Pending Referrals */}
        <div
          className="rounded-lg p-4 border"
          style={{
            background: 'rgba(245, 158, 11, 0.05)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-tight">
              {isRTL ? 'معلقة' : 'Pending'}
            </p>
          </div>
          <p className="text-2xl font-bold text-amber-400">{stats?.pendingReferrals || 0}</p>
          <p className="text-xs text-gray-500 mt-1">
            {isRTL ? 'في الانتظار' : 'Awaiting confirmation'}
          </p>
        </div>

        {/* Total Earned */}
        <div
          className="rounded-lg p-4 border"
          style={{
            background: 'rgba(168, 85, 247, 0.05)',
            border: '1px solid rgba(168, 85, 247, 0.2)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Gift className="w-4 h-4 text-purple-400" />
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-tight">
              {isRTL ? 'مجموع النقاط' : 'Total Earned'}
            </p>
          </div>
          <p className="text-2xl font-bold text-purple-400">{stats?.totalPointsEarned || 0}</p>
          <p className="text-xs text-gray-500 mt-1">{isRTL ? 'نقاط' : 'Points'}</p>
        </div>

        {/* Claimable Points */}
        <div
          className="rounded-lg p-4 border"
          style={{
            background: 'rgba(59, 130, 246, 0.05)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-tight">
              {isRTL ? 'متاح' : 'Claimable'}
            </p>
          </div>
          <p className="text-2xl font-bold text-blue-400">{stats?.claimablePoints || 0}</p>
          <p className="text-xs text-gray-500 mt-1">{isRTL ? 'نقاط' : 'Points'}
          </p>
        </div>
      </div>

      {/* Claim Button */}
      {(stats?.claimablePoints ?? 0) > 0 && (
        <button
          onClick={handleClaimPoints}
          disabled={claiming}
          className="w-full py-3 px-4 rounded-lg font-semibold transition-all active:scale-95 flex items-center justify-center gap-2"
          style={{
            background: 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)',
            color: 'white',
            opacity: claiming ? 0.7 : 1,
            cursor: claiming ? 'not-allowed' : 'pointer',
          }}
        >
          <Gift className="w-4 h-4" />
          {claiming
            ? isRTL
              ? 'جاري جمع النقاط...'
              : 'Claiming...'
            : isRTL
              ? `جمع ${stats?.claimablePoints} نقطة`
              : `Claim ${stats?.claimablePoints} Points`}
        </button>
      )}

      {(stats?.claimablePoints ?? 0) === 0 && stats?.confirmedReferrals === 0 && stats?.pendingReferrals === 0 && (
        <div
          className="rounded-lg p-4 text-center border"
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <p className="text-sm text-gray-400">
            {isRTL
              ? 'لا توجد إحالات حالياً. شارك كودك للبدء!'
              : 'No referrals yet. Share your code to get started!'}
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-lg p-4 bg-gradient-to-r from-red-500/10 to-red-600/5 border border-red-500/30 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-red-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-red-400 text-xs font-bold">!</span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-red-300 font-medium mb-2">
                {isRTL ? 'خطأ في تحميل بيانات الإحالة' : 'Error loading referral data'}
              </p>
              <p className="text-xs text-red-400/80 mb-3">{error}</p>
              <button
                onClick={() => walletAddress && fetchStats(walletAddress)}
                className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors underline"
              >
                {isRTL ? 'إعادة المحاولة' : 'Retry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
