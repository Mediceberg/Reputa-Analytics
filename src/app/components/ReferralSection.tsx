import React, { useState, useEffect, useCallback } from 'react';
import {
  Copy,
  Share2,
  Gift,
  TrendingUp,
  Clock,
  CheckCircle,
  Zap,
  MoreVertical,
  Info,
  X,
  Twitter,
  Facebook,
  Linkedin,
  Mail,
  Link
} from 'lucide-react';
import { useReferral, ReferralStats } from '../hooks/useReferral';
import { toast } from 'react-hot-toast';

interface ReferralSectionProps {
  walletAddress: string;
  username: string;
}

export function ReferralSection({ walletAddress, username }: ReferralSectionProps) {
  const { stats, loading, error, fetchStats, claimPoints } = useReferral();
  const [copying, setCopying] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Fetch stats on mount and when wallet changes or after retry
  useEffect(() => {
    if (walletAddress) {
      fetchStats(walletAddress)
        .catch(err => {
          console.error('Failed to fetch referral stats:', err);
          // Will show error message through the error state from useReferral
        });
    }
  }, [walletAddress, fetchStats, retryCount]);

  const handleCopyLink = async () => {
    if (!stats?.referralLink) return;

    setCopying(true);
    try {
      await navigator.clipboard.writeText(stats.referralLink);
      toast.success('Link copied successfully');
      setTimeout(() => setCopying(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy link');
      setCopying(false);
    }
  };

  const handleShareLink = async () => {
    if (!stats?.referralLink) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Reputa Score',
          text: `Join me using my referral code: ${stats.referralCode}`,
          url: stats.referralLink,
        });
        toast.success('Link shared successfully');
      } catch (err) {
        console.error('Error sharing:', err);
        if (err.name !== 'AbortError') { // Don't show error if user cancelled
          toast.error('Failed to share link');
        }
      }
    } else {
      // Fallback: copy link to clipboard and show message
      try {
        await navigator.clipboard.writeText(stats.referralLink);
        toast.success('Link copied for sharing');
      } catch (err) {
        console.error('Error copying link:', err);
        toast.error('Failed to copy link: ' + stats.referralLink);
      }
    }
  };
  
  // Social media sharing functions
  const shareOnTwitter = () => {
    const text = `Join me on Reputa Score using my referral code: ${stats?.referralCode}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(stats?.referralLink || '')}`;
    window.open(url, '_blank');
  };
  
  const shareOnFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(stats?.referralLink || '')}`;
    window.open(url, '_blank');
  };
  
  const shareOnLinkedin = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(stats?.referralLink || '')}`;
    window.open(url, '_blank');
  };
  
  const shareViaEmail = () => {
    const subject = "Join me on Reputa Score";
    const body = `Hey there! Join me on Reputa Score using my referral code: ${stats?.referralCode}\n\n${stats?.referralLink || ''}`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  const handleClaimPoints = async () => {
    if (!walletAddress || stats?.claimablePoints === 0) return;

    setClaiming(true);
    try {
      const success = await claimPoints(walletAddress);
      if (success) {
        // Stats will be updated automatically
        toast.success('Points claimed successfully');
      } else {
        toast.error('Failed to claim points');
      }
    } catch (err) {
      console.error('Error claiming points:', err);
      toast.error('An error occurred while claiming points');
    } finally {
      setClaiming(false);
    }
  };
  
  const handleRetry = useCallback(() => {
    if (walletAddress) {
      setRetryCount(prev => prev + 1);
    }
  }, [walletAddress]);
  
  const handleInfoClick = () => {
    setShowInfoModal(true);
    setShowMenu(false);
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-bold text-white">
            Referral Program
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
              style={{ width: '150px' }}
            >
              <button 
                onClick={handleInfoClick}
                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
              >
                <Info className="w-4 h-4" /> 
                Information
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
            Your Unique Referral Code
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
            className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 transition-all active:scale-95 disabled:opacity-50"
            title="Copy Link"
            disabled={copying}
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={handleShareLink}
            className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-all active:scale-95"
            title="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-gray-400 leading-relaxed">
          Share this code with friends to earn reward points
        </p>
      </div>

      {/* Stats Grid */}
      {/* Social Media Sharing */}
      <div className="rounded-xl p-3 border mb-3 flex flex-wrap justify-center gap-2" 
        style={{
          background: 'rgba(15, 23, 42, 0.3)',
          border: '1px solid rgba(148, 163, 184, 0.2)'
        }}>
        <button 
          onClick={shareOnTwitter}
          className="p-2 rounded-lg bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 text-[#1DA1F2] transition-all active:scale-95 flex flex-col items-center gap-1">
          <Twitter className="w-5 h-5" />
          <span className="text-xs">Twitter</span>
        </button>
        <button 
          onClick={shareOnFacebook}
          className="p-2 rounded-lg bg-[#4267B2]/10 hover:bg-[#4267B2]/20 text-[#4267B2] transition-all active:scale-95 flex flex-col items-center gap-1">
          <Facebook className="w-5 h-5" />
          <span className="text-xs">Facebook</span>
        </button>
        <button 
          onClick={shareOnLinkedin}
          className="p-2 rounded-lg bg-[#0077B5]/10 hover:bg-[#0077B5]/20 text-[#0077B5] transition-all active:scale-95 flex flex-col items-center gap-1">
          <Linkedin className="w-5 h-5" />
          <span className="text-xs">LinkedIn</span>
        </button>
        <button 
          onClick={shareViaEmail}
          className="p-2 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 transition-all active:scale-95 flex flex-col items-center gap-1">
          <Mail className="w-5 h-5" />
          <span className="text-xs">Email</span>
        </button>
      </div>

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
              Confirmed
            </p>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{stats?.confirmedReferrals || 0}</p>
          <p className="text-xs text-gray-500 mt-1">
            Active Referrals
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
              Pending
            </p>
          </div>
          <p className="text-2xl font-bold text-amber-400">{stats?.pendingReferrals || 0}</p>
          <p className="text-xs text-gray-500 mt-1">
            Awaiting Confirmation
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
              Total Earned
            </p>
          </div>
          <p className="text-2xl font-bold text-purple-400">{stats?.totalPointsEarned || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Points</p>
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
              Claimable
            </p>
          </div>
          <p className="text-2xl font-bold text-blue-400">{stats?.claimablePoints || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Points</p>
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
          {claiming ? 'Claiming...' : `Claim ${stats?.claimablePoints} Points`}
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
            No referrals yet. Share your code to get started!
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
                Error loading referral data
              </p>
              <p className="text-xs text-red-400/80 mb-3">{error}</p>
              <button
                onClick={handleRetry}
                className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors underline"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-gray-900 border border-purple-500/20 rounded-xl p-5 max-w-md w-full max-h-[90vh] overflow-y-auto"
            style={{
              boxShadow: '0 8px 32px rgba(168, 85, 247, 0.2)'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Info className="w-4 h-4 text-purple-400" />
                Referral System
              </h3>
              <button 
                onClick={() => setShowInfoModal(false)}
                className="p-1 rounded-full hover:bg-white/10"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-4 text-sm">
              <p className="text-gray-300">
                Share your referral code with friends and earn points when they join Reputa Score!
              </p>
              
              <div className="border-t border-white/10 pt-3">
                <h4 className="font-medium text-purple-400 mb-2">How it works</h4>
                <ol className="space-y-2 text-gray-400 list-decimal list-inside">
                  <li>Share your referral code or link with friends</li>
                  <li>When they join, they enter your code during registration</li>
                  <li>When they complete their first wallet analysis, you earn 500 points</li>
                  <li>Collect points and redeem them for rewards</li>
                </ol>
              </div>
              
              <div className="border-t border-white/10 pt-3">
                <h4 className="font-medium text-purple-400 mb-2">Bonus Rewards</h4>
                <ul className="space-y-1 text-gray-400">
                  <li>• 5 referrals = 250 bonus points</li>
                  <li>• 10 referrals = 500 bonus points</li>
                </ul>
              </div>
            </div>
            
            <button 
              onClick={() => setShowInfoModal(false)}
              className="w-full mt-5 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
