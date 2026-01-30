import React, { useState } from 'react';
import { Share2, Copy, X, Shield, Star, Trophy, Check } from 'lucide-react';

interface ShareReputaCardProps {
  username: string;
  score: number;
  level: number;
  trustRank: string;
  walletAddress?: string;
  onClose: () => void;
}

const levelNames = [
  'Newcomer',
  'Explorer', 
  'Builder',
  'Advocate',
  'Pioneer',
  'Ambassador',
  'Legend'
];

const levelColors = [
  '#6B7280',
  '#3B82F6',
  '#10B981',
  '#8B5CF6',
  '#F59E0B',
  '#EF4444',
  '#FFD700'
];

export const ShareReputaCard: React.FC<ShareReputaCardProps> = ({
  username,
  score,
  level,
  trustRank,
  walletAddress,
  onClose
}) => {
  const [copied, setCopied] = useState(false);

  const displayLevel = Math.min(Math.max(level, 1), 7);
  const levelName = levelNames[displayLevel - 1] || 'Pioneer';
  const levelColor = levelColors[displayLevel - 1] || '#8B5CF6';

  const shareText = `My Reputa Score on Pi Network:

Score: ${score.toLocaleString()} pts
Level: ${displayLevel} - ${levelName}
Trust Rank: ${trustRank}

Check yours at: reputa-score.vercel.app`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Reputa Score',
          text: shareText,
          url: 'https://reputa-score.vercel.app'
        });
      } catch (shareError: any) {
        if (shareError.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.85)' }}>
      <div className="relative w-full max-w-sm animate-in zoom-in duration-300">
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)' }}
        >
          <X className="w-4 h-4 text-white" />
        </button>

        <div
          className="rounded-2xl p-6 overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, #0F1117 0%, #1A1D26 50%, #0A0B0F 100%)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            boxShadow: '0 0 40px rgba(139, 92, 246, 0.2)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #00D9FF 100%)' }}
              >
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-bold text-lg">Reputa Score</span>
            </div>
            <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(0, 217, 255, 0.2)', color: '#00D9FF' }}>
              Pi Network
            </span>
          </div>

          <div className="text-center mb-4">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${levelColor}40 0%, ${levelColor}20 100%)`, border: `2px solid ${levelColor}` }}>
              <Trophy className="w-8 h-8" style={{ color: levelColor }} />
            </div>
            <h2 className="text-white font-bold text-xl mb-1">@{username}</h2>
            {walletAddress && (
              <p className="text-xs font-mono" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                {walletAddress.substring(0, 8)}...{walletAddress.slice(-6)}
              </p>
            )}
          </div>

          <div 
            className="rounded-xl p-4 mb-4 text-center"
            style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)' }}
          >
            <div className="text-5xl font-black mb-2" style={{ color: '#8B5CF6', textShadow: '0 0 20px rgba(139, 92, 246, 0.5)' }}>
              {score.toLocaleString()}
            </div>
            <div className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Reputation Points</div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-lg p-3 text-center" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="w-4 h-4" style={{ color: levelColor }} />
                <span className="text-lg font-bold text-white">Lv.{displayLevel}</span>
              </div>
              <div className="text-xs" style={{ color: levelColor }}>{levelName}</div>
            </div>
            <div className="rounded-lg p-3 text-center" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
              <div className="text-lg font-bold text-white mb-1">{trustRank}</div>
              <div className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Trust Rank</div>
            </div>
          </div>

          <div className="text-center pt-3" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
              reputa-score.vercel.app
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all active:scale-95"
            style={{
              background: copied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.1)',
              border: copied ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.2)',
              color: copied ? '#10B981' : 'white',
            }}
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #8B5CF6 0%, #00D9FF 100%)',
              color: 'white',
            }}
          >
            <Share2 className="w-5 h-5" />
            <span>Share</span>
          </button>
        </div>
      </div>
    </div>
  );
};
