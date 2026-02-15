import React, { useState, useRef, useEffect } from 'react';  
import { Share2, Copy, X, Shield, Star, Trophy, Check, Download, Image, Send, MessageCircle, AlertCircle, Globe, TestTube, Zap } from 'lucide-react';
import { ATOMIC_PROTOCOL_CONFIG, ATOMIC_TRUST_LEVEL_COLORS } from '../protocol/atomicProtocol';

interface ShareReputaCardProps {
  username: string;
  score: number;
  level: number;
  trustRank: string;
  walletAddress?: string;
  onClose: () => void;
  onNetworkToggle?: (network: 'mainnet' | 'testnet') => void;
  currentNetwork?: 'mainnet' | 'testnet';
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
  onClose,
  onNetworkToggle,
  currentNetwork = 'mainnet'
}) => {
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [network, setNetwork] = useState<'mainnet' | 'testnet'>(currentNetwork);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleNetworkToggle = () => {
    const newNetwork = network === 'mainnet' ? 'testnet' : 'mainnet';
    setNetwork(newNetwork);
    onNetworkToggle?.(newNetwork);
  };

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

      // Set canvas dimensions (400x500 optimized for mobile sharing)
      canvas.width = 400;
      canvas.height = 500;

      // Fill background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#0F0A1F');
      gradient.addColorStop(0.3, '#1A0F2E');
      gradient.addColorStop(0.6, '#0F1A2E');
      gradient.addColorStop(1, '#050810');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add decorative elements (reduced)
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.1)';
      ctx.lineWidth = 1;
      
      for (let i = 0; i < 8; i++) {
        const x = (i * canvas.width) / 8;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // Header
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
      ctx.textAlign = 'center';
      ctx.fillText('Reputa Score', canvas.width / 2, 40);

      ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText('Pi Network', canvas.width / 2, 60);

      // Username
      ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(`@${username}`, canvas.width / 2, 100);

      // Wallet address if available
      if (walletAddress) {
        ctx.font = '10px monospace';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        const shortAddr = `${walletAddress.substring(0, 8)}...${walletAddress.slice(-6)}`;
        ctx.fillText(shortAddr, canvas.width / 2, 120);
      }

      // Score box
      ctx.fillStyle = 'rgba(139, 92, 246, 0.15)';
      ctx.fillRect(30, 140, canvas.width - 60, 120);
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
      ctx.lineWidth = 2;
      ctx.strokeRect(30, 140, canvas.width - 60, 120);

      ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
      ctx.fillStyle = '#8B5CF6';
      ctx.textAlign = 'center';
      ctx.fillText(score.toLocaleString(), canvas.width / 2, 210);

      ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText('Reputation Points', canvas.width / 2, 245);

      // Level and Trust Rank
      const boxWidth = (canvas.width - 60) / 2 - 5;
      
      // Level box
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(30, 280, boxWidth, 100);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(30, 280, boxWidth, 100);

      ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
      ctx.fillStyle = levelColor;
      ctx.textAlign = 'center';
      ctx.fillText(`Lv.${displayLevel}`, 30 + boxWidth / 2, 340);

      ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
      ctx.fillStyle = levelColor;
      ctx.fillText(levelName, 30 + boxWidth / 2, 365);

      // Trust Rank box
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(35 + boxWidth, 280, boxWidth, 100);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(35 + boxWidth, 280, boxWidth, 100);

      ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
      ctx.fillStyle = '#00D9FF';
      ctx.textAlign = 'center';
      ctx.fillText(trustRank, 35 + boxWidth + boxWidth / 2, 330);

      ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillText('Trust Rank', 35 + boxWidth + boxWidth / 2, 355);

      // Footer
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.textAlign = 'center';
      ctx.fillText('reputa-score.vercel.app', canvas.width / 2, canvas.height - 25);

      ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
      ctx.fillText('Powered by Pi Network', canvas.width / 2, canvas.height - 10);

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

      // Enhanced native share support for Pi Browser and Android
      const imageFile = new File([imageBlob], `reputa-${username}.png`, { type: 'image/png' });
      
      if (navigator.share) {
        try {
          // Check if files sharing is supported
          if (navigator.canShare && navigator.canShare({ files: [imageFile] })) {
            await navigator.share({
              files: [imageFile],
              title: 'My Reputa Score',
              text: shareText
            });
            setShareSuccess(true);
            setTimeout(() => setShareSuccess(false), 3000);
            return;
          } else {
            // Fallback to text-only sharing
            await navigator.share({
              title: 'My Reputa Score',
              text: shareText,
              url: 'https://reputa-score.vercel.app'
            });
            setShareSuccess(true);
            setTimeout(() => setShareSuccess(false), 3000);
            return;
          }
        } catch (error: any) {
          if (error.name === 'AbortError') {
            // User cancelled, don't show error
            return;
          }
          // Continue to download fallback
        }
      }
      
      // Standard download fallback
      {
        // Download fallback for non-supporting browsers or when sharing fails
        const url = URL.createObjectURL(imageBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reputa-${username}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      if (!navigator.share) {
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      }
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
    // Haptic feedback if supported
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    try {
      setIsGenerating(true);
      const imageBlob = await generateCardImage();
      const imageFile = new File([imageBlob], `reputa-${username}.png`, { type: 'image/png' });

      if (navigator.share) {
        // Check if file sharing is supported
        if (navigator.canShare && navigator.canShare({ files: [imageFile] })) {
          await navigator.share({
            title: 'My Reputa Score',
            text: shareText,
            files: [imageFile]
          });
        } else {
          // Fallback to text-only share
          await navigator.share({
            title: 'My Reputa Score',
            text: shareText,
            url: `${window.location.origin}/register?ref=${username}`
          });
        }
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      } else {
        // Fallback: open social share links
        handleSocialShare('telegram');
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        // Fallback: copy text to clipboard
        try {
          await navigator.clipboard.writeText(shareText);
          setShareSuccess(true);
          setTimeout(() => setShareSuccess(false), 3000);
        } catch {
          setShareError('فشلت المشاركة');
          setTimeout(() => setShareError(null), 3000);
        }
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
      className="fixed inset-0 z-[60] flex items-center justify-center p-3"
      style={{ 
        background: 'rgba(0, 0, 0, 0.95)',
        paddingTop: 'max(16px, env(safe-area-inset-top, 16px))',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
        paddingLeft: 'max(16px, env(safe-area-inset-left, 16px))',
        paddingRight: 'max(16px, env(safe-area-inset-right, 16px))',
        overflowY: 'auto',
        maxHeight: '100vh'
      }}
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-[350px] animate-in zoom-in duration-300 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button - Always Visible */}
        <button
          onClick={onClose}
          className="absolute -top-9 right-0 z-10 w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-all active:scale-95"
          style={{ 
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
          aria-label="اغلق"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        {/* Main Card */}
        <div
          className="rounded-3xl p-5 overflow-hidden relative"
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
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-2">
              <div 
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #00D9FF 100%)', boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)' }}
              >
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-bold text-base">Reputa Score</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleNetworkToggle}
                className="p-2 rounded-lg transition-all duration-300 hover:scale-110"
                style={{
                  background: network === 'mainnet' 
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(16, 185, 129, 0.1) 100%)'
                    : 'linear-gradient(135deg, rgba(245, 158, 11, 0.3) 0%, rgba(245, 158, 11, 0.1) 100%)',
                  border: network === 'mainnet'
                    ? '1px solid rgba(16, 185, 129, 0.5)'
                    : '1px solid rgba(245, 158, 11, 0.5)',
                  boxShadow: network === 'mainnet'
                    ? '0 0 15px rgba(16, 185, 129, 0.2)'
                    : '0 0 15px rgba(245, 158, 11, 0.2)'
                }}
                title={`Switch to ${network === 'mainnet' ? 'Testnet' : 'Mainnet'}`}
              >
                {network === 'mainnet' ? (
                  <Globe className="w-5 h-5 text-green-400" />
                ) : (
                  <TestTube className="w-5 h-5 text-amber-400" />
                )}
              </button>
              <span className="text-xs px-2.5 py-1.5 rounded-full font-medium" style={{ 
                background: network === 'mainnet'
                  ? 'rgba(16, 185, 129, 0.2)'
                  : 'rgba(245, 158, 11, 0.2)',
                color: network === 'mainnet' ? '#10B981' : '#F59E0B',
                border: network === 'mainnet'
                  ? '1px solid rgba(16, 185, 129, 0.3)'
                  : '1px solid rgba(245, 158, 11, 0.3)'
              }}>
                {network === 'mainnet' ? 'Mainnet' : 'Testnet'}
              </span>
            </div>
          </div>

          {/* Username & Wallet */}
          <div className="text-center mb-4 relative z-10">
            <div 
              className="w-18 h-18 mx-auto mb-2 rounded-full flex items-center justify-center"
              style={{ 
                background: `linear-gradient(135deg, ${levelColor}50 0%, ${levelColor}20 100%)`, 
                border: `3px solid ${levelColor}`,
                boxShadow: `0 0 30px ${levelColor}40`
              }}
            >
              <Trophy className="w-9 h-9" style={{ color: levelColor }} />
            </div>
            <h2 className="text-white font-bold text-xl mb-1">@{username}</h2>
            {walletAddress && (
              <p className="text-xs font-mono" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                {walletAddress.substring(0, 8)}...{walletAddress.slice(-6)}
              </p>
            )}
          </div>

          {/* Score Display */}
          <div 
            className="rounded-2xl p-4 mb-4 text-center relative z-10"
            style={{ 
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(0, 217, 255, 0.1) 100%)', 
              border: '1px solid rgba(139, 92, 246, 0.3)',
              boxShadow: 'inset 0 2px 20px rgba(139, 92, 246, 0.1)'
            }}
          >
            <div 
              className="text-4xl font-black mb-1.5"
              style={{ 
                background: 'linear-gradient(135deg, #8B5CF6 0%, #00D9FF 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 20px rgba(139, 92, 246, 0.5))'
              }}
            >
              {score.toLocaleString()}
            </div>
            <div className="text-xs font-medium" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>نقاط السمعة</div>
          </div>

          {/* Level & Trust Rank */}
          <div className="grid grid-cols-2 gap-2 mb-4 relative z-10">
            <div 
              className="rounded-xl p-3 text-center"
              style={{ 
                background: 'rgba(255, 255, 255, 0.05)', 
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="w-4 h-4" style={{ color: levelColor }} />
                <span className="text-lg font-bold text-white">Lv.{displayLevel}</span>
              </div>
              <div className="text-xs font-medium" style={{ color: levelColor }}>{levelName}</div>
            </div>
            <div 
              className="rounded-xl p-3 text-center"
              style={{ 
                background: 'rgba(255, 255, 255, 0.05)', 
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <div className="text-lg font-bold text-white mb-1">{trustRank}</div>
              <div className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>تصنيف الثقة</div>
            </div>
          </div>

          {/* Website Footer */}
          <div className="text-center pt-3 relative z-10" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <p className="text-xs font-medium" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
              reputa-score.vercel.app
            </p>
          </div>
        </div>

        {/* Status Messages */}
        {(shareSuccess || shareError) && (
          <div 
            className="mt-2 p-2 rounded-xl text-center text-xs font-medium animate-in fade-in"
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
        <div className="grid grid-cols-3 gap-2 mt-3 relative z-10">
          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50"
            style={{
              background: copied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.1)',
              border: copied ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.2)',
              color: copied ? '#10B981' : 'white',
            }}
            title="انسخ النص للحافظة"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span className="text-xs">{copied ? 'تم النسخ' : 'نسخ'}</span>
          </button>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50"
            style={{
              background: 'rgba(0, 217, 255, 0.15)',
              border: '1px solid rgba(0, 217, 255, 0.3)',
              color: '#00D9FF',
              opacity: isGenerating ? 0.6 : 1
            }}
            title="حفظ الصورة"
          >
            <Download className="w-4 h-4" />
            <span className="text-xs">حفظ</span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleShareImage}
            disabled={isGenerating}
            className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50"
            style={{
              background: shareSuccess ? 'rgba(16, 185, 129, 0.3)' : 'linear-gradient(135deg, #8B5CF6 0%, #00D9FF 100%)',
              color: 'white',
              opacity: isGenerating ? 0.6 : 1
            }}
            title="شارك الصورة"
          >
            {shareSuccess ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            <span className="text-xs">{shareSuccess ? 'تمام!' : 'شارك'}</span>
          </button>
        </div>

        {/* Social Media Share */}
        <div className="mt-2 pt-2 relative z-10" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <p className="text-xs text-center mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
            شارك على وسائل التواصل
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {/* Twitter/X */}
            <button
              onClick={() => handleSocialShare('twitter')}
              className="flex items-center justify-center gap-1 py-1.5 rounded-lg font-medium transition-all active:scale-95"
              style={{
                background: 'rgba(29, 155, 240, 0.15)',
                border: '1px solid rgba(29, 155, 240, 0.3)',
                color: '#1DA1F2',
                fontSize: '11px'
              }}
              title="شارك على X"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span className="text-xs">X</span>
            </button>

            {/* Telegram */}
            <button
              onClick={() => handleSocialShare('telegram')}
              className="flex items-center justify-center gap-1 py-1.5 rounded-lg font-medium transition-all active:scale-95"
              style={{
                background: 'rgba(0, 136, 204, 0.15)',
                border: '1px solid rgba(0, 136, 204, 0.3)',
                color: '#0088CC',
                fontSize: '11px'
              }}
              title="شارك على تليجرام"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="text-xs">TG</span>
            </button>

            {/* WhatsApp */}
            <button
              onClick={() => handleSocialShare('whatsapp')}
              className="flex items-center justify-center gap-1 py-1.5 rounded-lg font-medium transition-all active:scale-95"
              style={{
                background: 'rgba(37, 211, 102, 0.15)',
                border: '1px solid rgba(37, 211, 102, 0.3)',
                color: '#25D366',
                fontSize: '11px'
              }}
              title="شارك على واتساب"
            >
              <MessageCircle className="w-3.5 h-3.5" />
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
