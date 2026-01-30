import React, { useState, useRef, useEffect } from 'react';
import { Share2, Copy, X, Shield, Star, Trophy, Check, Download, Image } from 'lucide-react';

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
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const displayLevel = Math.min(Math.max(level, 1), 7);
  const levelName = levelNames[displayLevel - 1] || 'Pioneer';
  const levelColor = levelColors[displayLevel - 1] || '#8B5CF6';

  const shareText = `My Reputa Score on Pi Network:

Score: ${score.toLocaleString()} pts
Level: ${displayLevel} - ${levelName}
Trust Rank: ${trustRank}

Check yours at: reputa-score.vercel.app`;

  const generateCardImage = async (): Promise<Blob | null> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const width = 400;
    const height = 520;
    canvas.width = width;
    canvas.height = height;

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0F0A1F');
    gradient.addColorStop(0.3, '#1A0F2E');
    gradient.addColorStop(0.6, '#0F1A2E');
    gradient.addColorStop(1, '#050810');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const x = (i * 60) - 50;
      ctx.moveTo(x, 0);
      ctx.lineTo(x + height, height);
    }
    ctx.stroke();

    const glowGradient = ctx.createRadialGradient(200, 200, 0, 200, 200, 300);
    glowGradient.addColorStop(0, 'rgba(139, 92, 246, 0.15)');
    glowGradient.addColorStop(0.5, 'rgba(0, 217, 255, 0.08)');
    glowGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, width, height);

    const cornerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 150);
    cornerGlow.addColorStop(0, 'rgba(139, 92, 246, 0.25)');
    cornerGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = cornerGlow;
    ctx.fillRect(0, 0, 150, 150);

    const bottomGlow = ctx.createRadialGradient(width, height, 0, width, height, 150);
    bottomGlow.addColorStop(0, 'rgba(0, 217, 255, 0.25)');
    bottomGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = bottomGlow;
    ctx.fillRect(width - 150, height - 150, 150, 150);

    ctx.strokeStyle = 'rgba(139, 92, 246, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(10, 10, width - 20, height - 20, 20);
    ctx.stroke();

    const headerGradient = ctx.createLinearGradient(20, 25, 60, 65);
    headerGradient.addColorStop(0, '#8B5CF6');
    headerGradient.addColorStop(1, '#00D9FF');
    ctx.fillStyle = headerGradient;
    ctx.beginPath();
    ctx.roundRect(25, 25, 40, 40, 10);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px Inter, Arial, sans-serif';
    ctx.fillText('R', 38, 52);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px Inter, Arial, sans-serif';
    ctx.fillText('Reputa Score', 75, 52);

    ctx.fillStyle = 'rgba(0, 217, 255, 0.2)';
    ctx.beginPath();
    ctx.roundRect(300, 30, 80, 28, 14);
    ctx.fill();
    ctx.fillStyle = '#00D9FF';
    ctx.font = '12px Inter, Arial, sans-serif';
    ctx.fillText('Pi Network', 315, 49);

    const avatarGradient = ctx.createLinearGradient(160, 90, 240, 170);
    avatarGradient.addColorStop(0, levelColor + '60');
    avatarGradient.addColorStop(1, levelColor + '30');
    ctx.fillStyle = avatarGradient;
    ctx.beginPath();
    ctx.arc(200, 130, 45, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = levelColor;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = levelColor;
    ctx.font = 'bold 36px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏆', 200, 142);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`@${username}`, 200, 205);

    if (walletAddress) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '12px JetBrains Mono, monospace';
      const shortAddr = `${walletAddress.substring(0, 8)}...${walletAddress.slice(-6)}`;
      ctx.fillText(shortAddr, 200, 225);
    }

    ctx.fillStyle = 'rgba(139, 92, 246, 0.15)';
    ctx.beginPath();
    ctx.roundRect(30, 245, width - 60, 100, 15);
    ctx.fill();
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#8B5CF6';
    ctx.font = 'bold 48px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(139, 92, 246, 0.6)';
    ctx.shadowBlur = 20;
    ctx.fillText(score.toLocaleString(), 200, 300);
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '14px Inter, Arial, sans-serif';
    ctx.fillText('Reputation Points', 200, 325);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.roundRect(30, 365, 165, 70, 12);
    ctx.fill();

    ctx.fillStyle = levelColor;
    ctx.font = '18px Inter, Arial, sans-serif';
    ctx.fillText(`⭐ Lv.${displayLevel}`, 112, 400);
    ctx.fillStyle = levelColor;
    ctx.font = '13px Inter, Arial, sans-serif';
    ctx.fillText(levelName, 112, 420);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.roundRect(205, 365, 165, 70, 12);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px Inter, Arial, sans-serif';
    ctx.fillText(trustRank, 287, 400);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '13px Inter, Arial, sans-serif';
    ctx.fillText('Trust Rank', 287, 420);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, 455);
    ctx.lineTo(width - 30, 455);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '12px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('reputa-score.vercel.app', 200, 485);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const [shareSuccess, setShareSuccess] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const handleShareImage = async () => {
    setIsGenerating(true);
    setShareError(null);
    
    try {
      const imageBlob = await generateCardImage();
      if (!imageBlob) {
        throw new Error('Failed to generate image');
      }

      const file = new File([imageBlob], 'reputa-score.png', { type: 'image/png' });

      let shared = false;
      
      try {
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'My Reputa Score',
            text: shareText,
            files: [file]
          });
          shared = true;
          setShareSuccess(true);
          setTimeout(() => setShareSuccess(false), 3000);
        }
      } catch (fileShareError: any) {
        if ((fileShareError as any).name === 'AbortError') {
          shared = true;
        } else {
          console.log('[Share] File sharing not supported, trying text share');
        }
      }

      if (!shared) {
        try {
          if (navigator.share) {
            await navigator.share({
              title: 'My Reputa Score',
              text: shareText,
              url: 'https://reputa-score.vercel.app'
            });
            shared = true;
            setShareSuccess(true);
            setTimeout(() => setShareSuccess(false), 3000);
          }
        } catch (textShareError: any) {
          if (textShareError.name === 'AbortError') {
            shared = true;
          } else {
            console.log('[Share] Text sharing failed, falling back to download');
          }
        }
      }

      if (!shared) {
        // Use Data URL instead of Blob URL for better Pi Browser compatibility
        const reader = new FileReader();
        reader.onloadend = async () => {
          const dataUrl = reader.result as string;
          
          // Create download link with data URL
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = `reputa-score-${username}.png`;
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          
          // Also copy text to clipboard
          try {
            await navigator.clipboard.writeText(shareText);
          } catch (clipErr) {
            console.log('Clipboard copy failed, but download succeeded');
          }
          
          setShareSuccess(true);
          setTimeout(() => setShareSuccess(false), 3000);
        };
        reader.readAsDataURL(imageBlob);
        return; // Exit early since we're handling async
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Share failed:', error);
        setShareError('Share failed. Try Copy or Save instead.');
        setTimeout(() => setShareError(null), 3000);
        await handleCopy();
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const imageBlob = await generateCardImage();
      if (imageBlob) {
        // Use Data URL for better compatibility with Pi Browser
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = `reputa-score-${username}.png`;
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setIsGenerating(false);
          setShareSuccess(true);
          setTimeout(() => setShareSuccess(false), 3000);
        };
        reader.onerror = () => {
          console.error('Failed to convert image to data URL');
          setIsGenerating(false);
        };
        reader.readAsDataURL(imageBlob);
        return; // Exit early for async handling
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
    setIsGenerating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.9)' }}>
      <div className="relative w-full max-w-sm animate-in zoom-in duration-300">
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)' }}
        >
          <X className="w-4 h-4 text-white" />
        </button>

        <div
          className="rounded-2xl p-6 overflow-hidden relative"
          style={{
            background: 'linear-gradient(145deg, #0F0A1F 0%, #1A0F2E 30%, #0F1A2E 60%, #050810 100%)',
            border: '2px solid rgba(139, 92, 246, 0.4)',
            boxShadow: '0 0 60px rgba(139, 92, 246, 0.3), 0 0 120px rgba(0, 217, 255, 0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute h-full w-px"
                style={{
                  left: `${i * 15}%`,
                  background: 'linear-gradient(180deg, transparent 0%, rgba(139, 92, 246, 0.1) 50%, transparent 100%)',
                  transform: 'skewX(-15deg)',
                }}
              />
            ))}
          </div>

          <div className="absolute top-0 left-0 w-32 h-32 pointer-events-none" style={{ background: 'radial-gradient(circle at top left, rgba(139, 92, 246, 0.25) 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 right-0 w-32 h-32 pointer-events-none" style={{ background: 'radial-gradient(circle at bottom right, rgba(0, 217, 255, 0.25) 0%, transparent 70%)' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)' }} />

          <div className="flex items-center justify-between mb-5 relative z-10">
            <div className="flex items-center gap-2">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #00D9FF 100%)', boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)' }}
              >
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-white font-bold text-lg">Reputa Score</span>
            </div>
            <span className="text-xs px-3 py-1.5 rounded-full font-medium" style={{ background: 'rgba(0, 217, 255, 0.2)', color: '#00D9FF', border: '1px solid rgba(0, 217, 255, 0.3)' }}>
              Pi Network
            </span>
          </div>

          <div className="text-center mb-5 relative z-10">
            <div 
              className="w-20 h-20 mx-auto mb-3 rounded-full flex items-center justify-center"
              style={{ 
                background: `linear-gradient(135deg, ${levelColor}50 0%, ${levelColor}20 100%)`, 
                border: `3px solid ${levelColor}`,
                boxShadow: `0 0 30px ${levelColor}40`
              }}
            >
              <Trophy className="w-10 h-10" style={{ color: levelColor }} />
            </div>
            <h2 className="text-white font-bold text-2xl mb-1">@{username}</h2>
            {walletAddress && (
              <p className="text-xs font-mono" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                {walletAddress.substring(0, 8)}...{walletAddress.slice(-6)}
              </p>
            )}
          </div>

          <div 
            className="rounded-2xl p-5 mb-5 text-center relative z-10"
            style={{ 
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(0, 217, 255, 0.1) 100%)', 
              border: '1px solid rgba(139, 92, 246, 0.3)',
              boxShadow: 'inset 0 2px 20px rgba(139, 92, 246, 0.1)'
            }}
          >
            <div 
              className="text-5xl font-black mb-2"
              style={{ 
                background: 'linear-gradient(135deg, #8B5CF6 0%, #00D9FF 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 20px rgba(139, 92, 246, 0.5))'
              }}
            >
              {score.toLocaleString()}
            </div>
            <div className="text-sm font-medium" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Reputation Points</div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5 relative z-10">
            <div 
              className="rounded-xl p-4 text-center"
              style={{ 
                background: 'rgba(255, 255, 255, 0.05)', 
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="w-5 h-5" style={{ color: levelColor }} />
                <span className="text-xl font-bold text-white">Lv.{displayLevel}</span>
              </div>
              <div className="text-sm font-medium" style={{ color: levelColor }}>{levelName}</div>
            </div>
            <div 
              className="rounded-xl p-4 text-center"
              style={{ 
                background: 'rgba(255, 255, 255, 0.05)', 
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <div className="text-xl font-bold text-white mb-1">{trustRank}</div>
              <div className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Trust Rank</div>
            </div>
          </div>

          <div className="text-center pt-4 relative z-10" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <p className="text-xs font-medium" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
              reputa-score.vercel.app
            </p>
          </div>
        </div>

        {(shareSuccess || shareError) && (
          <div 
            className="mt-3 p-3 rounded-xl text-center text-sm font-medium"
            style={{
              background: shareSuccess ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              border: shareSuccess ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
              color: shareSuccess ? '#10B981' : '#EF4444',
            }}
          >
            {shareSuccess ? '✓ Image saved & text copied!' : shareError}
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 mt-4">
          <button
            onClick={handleCopy}
            className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl font-medium transition-all active:scale-95"
            style={{
              background: copied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.1)',
              border: copied ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.2)',
              color: copied ? '#10B981' : 'white',
            }}
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            <span className="text-xs">{copied ? 'Copied!' : 'Copy'}</span>
          </button>
          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl font-medium transition-all active:scale-95"
            style={{
              background: 'rgba(0, 217, 255, 0.15)',
              border: '1px solid rgba(0, 217, 255, 0.3)',
              color: '#00D9FF',
              opacity: isGenerating ? 0.6 : 1
            }}
          >
            <Download className="w-5 h-5" />
            <span className="text-xs">Save</span>
          </button>
          <button
            onClick={handleShareImage}
            disabled={isGenerating}
            className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl font-medium transition-all active:scale-95"
            style={{
              background: shareSuccess ? 'rgba(16, 185, 129, 0.3)' : 'linear-gradient(135deg, #8B5CF6 0%, #00D9FF 100%)',
              color: 'white',
              opacity: isGenerating ? 0.6 : 1
            }}
          >
            {shareSuccess ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
            <span className="text-xs">{shareSuccess ? 'Done!' : 'Share'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
