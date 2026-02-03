import React, { useState, useRef, useEffect } from 'react';  
import { Share2, Copy, X, Shield, Star, Trophy, Check, Download, Image, Send, MessageCircle, AlertCircle } from 'lucide-react';

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

/**
 * Enhanced Share Modal Component
 * - Safe-area support for notched devices
 * - Improved mobile responsiveness
 * - Direct social media sharing (WhatsApp, Telegram, X)
 * - PNG export with actual file download
 */
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
  const [shareSuccess, setShareSuccess] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const displayLevel = Math.min(Math.max(level, 1), 7);
  const levelName = levelNames[displayLevel - 1] || 'Pioneer';
  const levelColor = levelColors[displayLevel - 1] || '#8B5CF6';

  const shareText = `My Reputa Score on Pi Network:

🏆 Score: ${score.toLocaleString()} points
📊 Level: ${levelName} (Lv.${displayLevel})
⭐ Trust Rank: ${trustRank}

Check your own Reputa Score!
reputa-score.vercel.app`;

  /**
   * Handles copying the share text to clipboard
   */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      setShareError('فشل النسخ للحافظة');
      setTimeout(() => setShareError(null), 3000);
    }
  };

  /**
   * Generates PNG image of the reputa card using Canvas
   */
  const generateCardImage = (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Set canvas dimensions (1080x1350 for mobile optimal)
      canvas.width = 1080;
      canvas.height = 1350;

      // Fill background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#0F0A1F');
      gradient.addColorStop(0.3, '#1A0F2E');
      gradient.addColorStop(0.6, '#0F1A2E');
      gradient.addColorStop(1, '#050810');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add decorative elements
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.1)';
      ctx.lineWidth = 2;
      
      for (let i = 0; i < 15; i++) {
        const x = (i * canvas.width) / 15;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // Header
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 40px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
      ctx.textAlign = 'center';
      ctx.fillText('Reputa Score', canvas.width / 2, 80);

      ctx.font = '24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText('Pi Network', canvas.width / 2, 130);

      // Username
      ctx.font = 'bold 60px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(`@${username}`, canvas.width / 2, 240);

      // Wallet address if available
      if (walletAddress) {
        ctx.font = '20px monospace';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        const shortAddr = `${walletAddress.substring(0, 8)}...${walletAddress.slice(-6)}`;
        ctx.fillText(shortAddr, canvas.width / 2, 280);
      }

      // Score box
      ctx.fillStyle = 'rgba(139, 92, 246, 0.15)';
      ctx.fillRect(80, 320, canvas.width - 160, 200);
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
      ctx.lineWidth = 2;
      ctx.strokeRect(80, 320, canvas.width - 160, 200);

      ctx.font = 'bold 120px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
      ctx.fillStyle = '#8B5CF6';
      ctx.textAlign = 'center';
      ctx.fillText(score.toLocaleString(), canvas.width / 2, 420);

      ctx.font = '32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText('Reputation Points', canvas.width / 2, 480);

      // Level and Trust Rank
      const boxWidth = (canvas.width - 160) / 2 - 10;
      
      // Level box
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(80, 560, boxWidth, 150);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(80, 560, boxWidth, 150);

      ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
      ctx.fillStyle = levelColor;
      ctx.textAlign = 'center';
      ctx.fillText(`Lv.${displayLevel}`, 80 + boxWidth / 2, 650);

      ctx.font = '28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
      ctx.fillStyle = levelColor;
      ctx.fillText(levelName, 80 + boxWidth / 2, 710);

      // Trust Rank box
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(100 + boxWidth, 560, boxWidth, 150);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(100 + boxWidth, 560, boxWidth, 150);

      ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
      ctx.fillStyle = '#00D9FF';
      ctx.textAlign = 'center';
      ctx.fillText(trustRank, 100 + boxWidth + boxWidth / 2, 650);

      ctx.font = '28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillText('Trust Rank', 100 + boxWidth + boxWidth / 2, 710);

      // Footer
      ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.textAlign = 'center';
      ctx.fillText('reputa-score.vercel.app', canvas.width / 2, canvas.height - 80);

      ctx.font = '20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
      ctx.fillText('Powered by Pi Network', canvas.width / 2, canvas.height - 30);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        'image/png',
        0.95
      );
    });
  };

  /**
   * Downloads the card image as PNG
   */
  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      const imageBlob = await generateCardImage();

      // Check if browser supports native download via share API
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([imageBlob], `reputa-${username}.png`)] })) {
        try {
          await navigator.share({
            files: [new File([imageBlob], `reputa-${username}.png`, { type: 'image/png' })],
            title: 'My Reputa Score',
            text: shareText
          });
        } catch (error) {
          // User cancelled share, fall back to download
          throw new Error('share_cancelled');
        }
      } else {
        // Standard download for non-supporting browsers
        const url = URL.createObjectURL(imageBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reputa-${username}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    } catch (error) {
      console.error('Download error:', error);
      setShareError('فشل التنزيل. يرجى المحاولة مرة أخرى');
      setTimeout(() => setShareError(null), 3000);
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Shares the card image using native share API if available
   */
  const handleShareImage = async () => {
    try {
      setIsGenerating(true);
      const imageBlob = await generateCardImage();
      const imageFile = new File([imageBlob], `reputa-${username}.png`, { type: 'image/png' });

      if (navigator.share) {
        await navigator.share({
          title: 'My Reputa Score',
          text: shareText,
          files: [imageFile]
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      } else {
        setShareError('مشاركة الصور غير مدعومة على جهازك');
        setTimeout(() => setShareError(null), 3000);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Share error:', error);
        setShareError('فشلت المشاركة');
        setTimeout(() => setShareError(null), 3000);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Opens social media share links
   */
  const handleSocialShare = (platform: 'twitter' | 'telegram' | 'whatsapp') => {
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent('https://reputa-score.vercel.app');
    
    let shareUrl = '';
    const isMobile = /iPhone|iPad|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
      case 'telegram':
        shareUrl = isMobile 
          ? `tg://msg?text=${encodedText}%20${encodedUrl}`
          : `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
        break;
      case 'whatsapp':
        shareUrl = isMobile
          ? `whatsapp://send?text=${encodedText}%20${encodedUrl}`
          : `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
        break;
    }
    
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ 
        background: 'rgba(0, 0, 0, 0.95)',
        paddingTop: 'max(16px, env(safe-area-inset-top, 16px))',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
        paddingLeft: 'max(16px, env(safe-area-inset-left, 16px))',
        paddingRight: 'max(16px, env(safe-area-inset-right, 16px))'
      }}
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-sm animate-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button - Always Visible */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 z-10 w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-all active:scale-95"
          style={{ 
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
          aria-label="اغلق"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Main Card */}
        <div
          className="rounded-3xl p-6 overflow-hidden relative"
          style={{
            background: 'linear-gradient(145deg, #0F0A1F 0%, #1A0F2E 30%, #0F1A2E 60%, #050810 100%)',
            border: '2px solid rgba(139, 92, 246, 0.4)',
            boxShadow: '0 0 60px rgba(139, 92, 246, 0.3), 0 0 120px rgba(0, 217, 255, 0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}
        >
          {/* Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
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

          {/* Header */}
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

          {/* Username & Wallet */}
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

          {/* Score Display */}
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
            <div className="text-sm font-medium" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>نقاط السمعة</div>
          </div>

          {/* Level & Trust Rank */}
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
              <div className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>تصنيف الثقة</div>
            </div>
          </div>

          {/* Website Footer */}
          <div className="text-center pt-4 relative z-10" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <p className="text-xs font-medium" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
              reputa-score.vercel.app
            </p>
          </div>
        </div>

        {/* Status Messages */}
        {(shareSuccess || shareError) && (
          <div 
            className="mt-3 p-3 rounded-xl text-center text-sm font-medium animate-in fade-in"
            style={{
              background: shareSuccess ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              border: shareSuccess ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
              color: shareSuccess ? '#10B981' : '#EF4444',
            }}
          >
            {shareSuccess ? '✓ تم النسخ والمشاركة!' : shareError}
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2 mt-4 relative z-10">
          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50"
            style={{
              background: copied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.1)',
              border: copied ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.2)',
              color: copied ? '#10B981' : 'white',
            }}
            title="انسخ النص للحافظة"
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            <span className="text-xs">{copied ? 'تم النسخ' : 'نسخ'}</span>
          </button>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50"
            style={{
              background: 'rgba(0, 217, 255, 0.15)',
              border: '1px solid rgba(0, 217, 255, 0.3)',
              color: '#00D9FF',
              opacity: isGenerating ? 0.6 : 1
            }}
            title="حفظ الصورة"
          >
            <Download className="w-5 h-5" />
            <span className="text-xs">حفظ</span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleShareImage}
            disabled={isGenerating}
            className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50"
            style={{
              background: shareSuccess ? 'rgba(16, 185, 129, 0.3)' : 'linear-gradient(135deg, #8B5CF6 0%, #00D9FF 100%)',
              color: 'white',
              opacity: isGenerating ? 0.6 : 1
            }}
            title="شارك الصورة"
          >
            {shareSuccess ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
            <span className="text-xs">{shareSuccess ? 'تمام!' : 'شارك'}</span>
          </button>
        </div>

        {/* Social Media Share */}
        <div className="mt-3 pt-3 relative z-10" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <p className="text-xs text-center mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
            شارك على وسائل التواصل
          </p>
          <div className="grid grid-cols-3 gap-2">
            {/* Twitter/X */}
            <button
              onClick={() => handleSocialShare('twitter')}
              className="flex items-center justify-center gap-1.5 py-2 rounded-lg font-medium transition-all active:scale-95"
              style={{
                background: 'rgba(29, 155, 240, 0.15)',
                border: '1px solid rgba(29, 155, 240, 0.3)',
                color: '#1DA1F2',
              }}
              title="شارك على X"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span className="text-xs">X</span>
            </button>

            {/* Telegram */}
            <button
              onClick={() => handleSocialShare('telegram')}
              className="flex items-center justify-center gap-1.5 py-2 rounded-lg font-medium transition-all active:scale-95"
              style={{
                background: 'rgba(0, 136, 204, 0.15)',
                border: '1px solid rgba(0, 136, 204, 0.3)',
                color: '#0088CC',
              }}
              title="شارك على تليجرام"
            >
              <Send className="w-4 h-4" />
              <span className="text-xs">TG</span>
            </button>

            {/* WhatsApp */}
            <button
              onClick={() => handleSocialShare('whatsapp')}
              className="flex items-center justify-center gap-1.5 py-2 rounded-lg font-medium transition-all active:scale-95"
              style={{
                background: 'rgba(37, 211, 102, 0.15)',
                border: '1px solid rgba(37, 211, 102, 0.3)',
                color: '#25D366',
              }}
              title="شارك على واتساب"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs">WA</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hidden Canvas for image generation */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};
