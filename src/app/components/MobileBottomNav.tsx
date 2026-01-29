import { 
  LayoutDashboard, 
  LineChart, 
  Activity, 
  User,
  Globe,
  Menu
} from 'lucide-react';

interface MobileBottomNavProps {
  activeItem: string;
  onItemClick: (item: string) => void;
  onMenuClick?: () => void;
}

export function MobileBottomNav({ activeItem, onItemClick, onMenuClick }: MobileBottomNavProps) {
  const navItems = [
    { icon: LayoutDashboard, id: 'dashboard', label: 'Home' },
    { icon: LineChart, id: 'analytics', label: 'Analytics' },
    { icon: Activity, id: 'transactions', label: 'Activity' },
    { icon: Globe, id: 'network', label: 'Network' },
    { icon: User, id: 'profile', label: 'Profile' },
  ];

  return (
    <nav 
      className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-50 lg:hidden safe-area-bottom"
      style={{
        background: 'linear-gradient(180deg, rgba(15, 17, 23, 0.98) 0%, rgba(10, 11, 15, 1) 100%)',
        borderTop: '1px solid rgba(139, 92, 246, 0.2)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        paddingBottom: 'env(safe-area-inset-bottom, 8px)',
      }}
    >
      <div className="flex items-center justify-around px-1 py-1.5">
        {navItems.map((item) => {
          const isActive = activeItem === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onItemClick(item.id)}
              className="flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all active:scale-95"
              style={{ 
                minWidth: '56px', 
                minHeight: '48px', 
                padding: '6px 8px',
                ...(isActive && { background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(0, 217, 255, 0.1) 100%)' })
              }}
            >
              <item.icon 
                className="w-5 h-5 transition-colors"
                style={{ 
                  color: isActive ? '#8B5CF6' : 'rgba(160, 164, 184, 0.6)',
                  filter: isActive ? 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.5))' : 'none'
                }}
              />
              <span 
                className="text-[9px] font-bold uppercase tracking-wide"
                style={{ 
                  color: isActive ? '#8B5CF6' : 'rgba(160, 164, 184, 0.5)'
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all active:scale-95"
            style={{ minWidth: '56px', minHeight: '48px', padding: '6px 8px' }}
          >
            <Menu 
              className="w-5 h-5"
              style={{ color: 'rgba(160, 164, 184, 0.6)' }}
            />
            <span 
              className="text-[9px] font-bold uppercase tracking-wide"
              style={{ color: 'rgba(160, 164, 184, 0.5)' }}
            >
              More
            </span>
          </button>
        )}
      </div>
    </nav>
  );
}
