import { useState, useEffect } from 'react';   
import { 
  X, Shield, FileText, Sparkles,
  LogOut, ChevronRight, Zap
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { getNavItemsBySection } from '../config/navigation';
import { FUTURE_TASKS_CONFIG } from '../protocol/futureTasks';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeItem: string;
  onItemClick: (item: string) => void;
  username?: string;
  walletAddress?: string;
  balance?: number;
  onLogout?: () => void;
}

export function SideDrawer({ 
  isOpen, 
  onClose, 
  activeItem, 
  onItemClick,
  username,
  walletAddress,
  balance,
  onLogout
}: SideDrawerProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(onClose, 200);
  };

  const handleItemClick = (id: string) => {
    onItemClick(id);
    handleClose();
  };

  const formatAddress = (address: string) => {
    if (!address || address.length < 16) return address || 'Not Connected';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const baseMenuItems = [
    ...getNavItemsBySection('pages'),
    ...getNavItemsBySection('transaction'),
  ];
  const hasEarnPoints = baseMenuItems.some((item) => item.id === 'earn-points');
  const menuItems = (hasEarnPoints || !FUTURE_TASKS_CONFIG.enabled
    ? baseMenuItems
    : [
        ...baseMenuItems,
        { id: 'earn-points', labelKey: 'sidebar.earnPoints', icon: Sparkles, section: 'pages' as const },
      ]).map((item) => ({
    ...item,
    description:
      item.id === 'dashboard'
        ? 'Main dashboard'
        : item.id === 'analytics'
          ? 'Charts & stats'
          : item.id === 'transactions'
            ? 'Transaction history'
            : item.id === 'wallet'
              ? 'Balance & details'
              : item.id === 'audit'
                ? 'Trust analysis'
                : item.id === 'network'
                  ? 'Pi ecosystem'
                  : item.id === 'earn-points'
                    ? 'Future missions'
                    : item.id === 'profile'
                      ? 'Your account'
                      : '',
  }));

  const bottomItems = [
    ...getNavItemsBySection('tools'),
    { id: 'privacy', icon: Shield, label: 'Privacy', onClick: () => window.open('https://reputa-score.vercel.app/privacy.html', '_blank') },
    { id: 'terms', icon: FileText, label: 'Terms', onClick: () => window.open('https://reputa-score.vercel.app/terms.html', '_blank') },
  ];

  if (!isOpen && !isAnimating) return null;

  return (
    <div className="fixed inset-0 z-[100] lg:hidden">
      <div 
        className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-200 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />
      
      <div 
        className={`absolute top-0 left-0 h-full w-[280px] max-w-[85vw] transition-transform duration-200 ease-out ${
          isAnimating ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'linear-gradient(180deg, rgba(15, 17, 23, 0.98) 0%, rgba(10, 11, 15, 1) 100%)',
          borderRight: '1px solid rgba(139, 92, 246, 0.2)',
        }}
      >
        <div className="flex flex-col h-full">
          <div 
            className="p-4 flex items-center justify-between"
            style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(0, 217, 255, 0.15) 100%)',
                  border: '1px solid rgba(139, 92, 246, 0.4)',
                }}
              >
                <Zap className="w-5 h-5 text-purple-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{username || 'Pioneer'}</p>
                <p className="text-[10px] font-mono text-gray-500 truncate">{formatAddress(walletAddress || '')}</p>
              </div>
            </div>
            <button 
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Wallet Balance removed for cleaner Pi Browser experience */}

          <nav className="flex-1 overflow-y-auto py-4 px-2">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const isActive = activeItem === item.id || 
                  (item.id === 'dashboard' && activeItem === 'overview');
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all active:scale-[0.98] ${
                      isActive ? 'bg-purple-500/20' : 'hover:bg-white/5'
                    }`}
                    style={isActive ? { border: '1px solid rgba(139, 92, 246, 0.3)' } : {}}
                  >
                    <div 
                      className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        isActive ? 'bg-purple-500/30' : 'bg-white/5'
                      }`}
                    >
                      <item.icon 
                        className={`w-4.5 h-4.5 ${isActive ? 'text-purple-400' : 'text-gray-400'}`}
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`text-sm font-semibold ${isActive ? 'text-purple-300' : 'text-white/80'}`}>
                        {t(item.labelKey)}
                      </p>
                      <p className="text-[10px] text-gray-500">{item.description}</p>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-gray-600'}`} />
                  </button>
                );
              })}
            </div>

            <div className="mt-6 pt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <p className="px-3 mb-2 text-[10px] uppercase tracking-wider text-gray-500">More</p>
              <div className="space-y-1">
                {bottomItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      if ('onClick' in item && typeof item.onClick === 'function') {
                        item.onClick();
                        handleClose();
                      } else {
                        handleItemClick(item.id);
                      }
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-all"
                  >
                    <item.icon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-400">
                      {'labelKey' in item ? t(item.labelKey) : item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </nav>

          {onLogout && (
            <div className="p-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all hover:bg-red-500/10"
                style={{ border: '1px solid rgba(239, 68, 68, 0.3)' }}
              >
                <LogOut className="w-4 h-4 text-red-400" />
                <span className="text-sm font-semibold text-red-400">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
