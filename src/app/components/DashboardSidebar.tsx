import { useLanguage } from '../hooks/useLanguage';
import { AppMode, MODE_IMPACTS } from '../protocol/types';
import { 
  LayoutDashboard, 
  LineChart, 
  Activity, 
  BarChart3, 
  CreditCard, 
  FileText,
  Settings,
  MessageSquare,
  HelpCircle,
  TestTube,
  Zap,
  PieChart,
  Shield,
  Wallet,
  User,
  Globe,
  Play
} from 'lucide-react';
import logoImage from '../../assets/logo-new.png';
import { SidebarFutureTasks } from './SidebarFutureTasks';

interface SidebarProps {
  mode: AppMode;
  onModeToggle: () => void;
  activeItem?: string;
  onItemClick?: (item: string) => void;
}

export function DashboardSidebar({ mode, onModeToggle, activeItem = 'dashboard', onItemClick }: SidebarProps) {
  const { t } = useLanguage();

  const mainItems = [
    { icon: LayoutDashboard, labelKey: 'sidebar.dashboard', id: 'dashboard' },
    { icon: LineChart, labelKey: 'sidebar.analytics', id: 'analytics' },
    { icon: Activity, labelKey: 'sidebar.transactions', id: 'transactions' },
    { icon: FileText, labelKey: 'sidebar.audit', id: 'audit' },
  ];

  const transactionItems = [
    { icon: PieChart, labelKey: 'sidebar.portfolio', id: 'portfolio' },
    { icon: Wallet, labelKey: 'sidebar.wallet', id: 'wallet' },
    { icon: Globe, labelKey: 'Network', id: 'network' },
    { icon: User, labelKey: 'sidebar.profile', id: 'profile' },
  ];

  const toolsItems = [
    { icon: Settings, labelKey: 'sidebar.settings', id: 'settings' },
    { icon: MessageSquare, labelKey: 'sidebar.feedback', id: 'feedback' },
    { icon: HelpCircle, labelKey: 'sidebar.help', id: 'help' },
  ];

  const handleClick = (id: string) => {
    onItemClick?.(id);
  };

  return (
    <aside 
      className="w-[260px] h-full p-6 flex flex-col relative z-20"
      style={{
        background: 'linear-gradient(180deg, rgba(15, 17, 23, 0.95) 0%, rgba(10, 11, 15, 0.98) 100%)',
        borderRight: '1px solid rgba(139, 92, 246, 0.15)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="mb-8 flex items-center gap-3">
        <div 
          className="relative w-10 h-10 flex items-center justify-center rounded-xl"
          style={{
            background: 'linear-gradient(145deg, rgba(15, 17, 23, 0.95) 0%, rgba(20, 22, 30, 0.9) 100%)',
            boxShadow: '0 0 20px rgba(0, 217, 255, 0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
          }}
        >
          <img 
            src={logoImage} 
            alt="logo" 
            className="w-7 h-7 object-contain"
            style={{ filter: 'drop-shadow(0 0 6px rgba(0, 217, 255, 0.5))', mixBlendMode: 'screen' }}
          />
        </div>
        <h2 
          className="font-bold text-lg tracking-tight"
          style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-display)', textShadow: '0 0 20px rgba(0, 217, 255, 0.4)' }}
        >
          Reputa Score
        </h2>
      </div>

      <button
        onClick={onModeToggle}
        className="mb-8 w-full rounded-xl p-4 transition-all active:scale-98"
        style={{
          background: MODE_IMPACTS[mode.mode].bgColor,
          border: `1px solid ${MODE_IMPACTS[mode.mode].borderColor}`,
        }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${MODE_IMPACTS[mode.mode].color}20` }}
          >
            {mode.mode === 'mainnet' && <Globe className="w-5 h-5" style={{ color: MODE_IMPACTS[mode.mode].color }} />}
            {mode.mode === 'testnet' && <TestTube className="w-5 h-5" style={{ color: MODE_IMPACTS[mode.mode].color }} />}
            {mode.mode === 'demo' && <Play className="w-5 h-5" style={{ color: MODE_IMPACTS[mode.mode].color }} />}
          </div>
          <div className="text-left flex-1">
            <p className="font-bold text-sm" style={{ color: MODE_IMPACTS[mode.mode].color }}>
              {MODE_IMPACTS[mode.mode].label}
            </p>
            <p className="text-[10px] uppercase tracking-wide" style={{ color: 'rgba(160, 164, 184, 0.6)' }}>
              {mode.mode === 'mainnet' 
                ? (t('app.mode.impact.full') || '100% Impact')
                : mode.mode === 'testnet' 
                  ? (t('app.mode.impact.partial') || '25% Impact')
                  : (t('app.mode.impact.none') || 'No Impact')
              }
            </p>
          </div>
          {mode.connected && (
            <span 
              className="w-2 h-2 rounded-full animate-pulse" 
              style={{ 
                backgroundColor: MODE_IMPACTS[mode.mode].color,
                boxShadow: `0 0 10px ${MODE_IMPACTS[mode.mode].color}` 
              }} 
            />
          )}
        </div>
      </button>

      <nav className="flex-1 space-y-8">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4" style={{ color: 'rgba(139, 92, 246, 0.7)' }}>
            {t('sidebar.section.pages')}
          </p>
          <div className="space-y-1">
            {mainItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeItem === item.id
                    ? 'neon-glow-purple'
                    : 'hover:bg-white/5'
                }`}
                style={activeItem === item.id ? {
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(0, 217, 255, 0.1) 100%)',
                  border: '1px solid rgba(139, 92, 246, 0.4)',
                } : {}}
              >
                <item.icon className={`w-5 h-5 ${activeItem === item.id ? 'text-purple-400' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${activeItem === item.id ? 'text-white' : 'text-gray-400'}`}>
                  {t(item.labelKey)}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4" style={{ color: 'rgba(0, 217, 255, 0.7)' }}>
            {t('sidebar.section.transaction')}
          </p>
          <div className="space-y-1">
            {transactionItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeItem === item.id
                    ? 'neon-glow-cyan'
                    : 'hover:bg-white/5'
                }`}
                style={activeItem === item.id ? {
                  background: 'linear-gradient(135deg, rgba(0, 217, 255, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)',
                  border: '1px solid rgba(0, 217, 255, 0.4)',
                } : {}}
              >
                <item.icon className={`w-5 h-5 ${activeItem === item.id ? 'text-cyan-400' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${activeItem === item.id ? 'text-white' : 'text-gray-400'}`}>
                  {t(item.labelKey)}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4" style={{ color: 'rgba(160, 164, 184, 0.5)' }}>
            {t('sidebar.section.tools')}
          </p>
          <div className="space-y-1">
            {toolsItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeItem === item.id
                    ? ''
                    : 'hover:bg-white/5'
                }`}
                style={activeItem === item.id ? {
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                } : {}}
              >
                <item.icon className={`w-5 h-5 ${activeItem === item.id ? 'text-white' : 'text-gray-500'}`} />
                <span className={`text-sm font-medium ${activeItem === item.id ? 'text-white' : 'text-gray-500'}`}>
                  {t(item.labelKey)}
                </span>
              </button>
            ))}
          </div>
        </div>

        <SidebarFutureTasks />
      </nav>

      <div 
        className="mt-6 p-4 rounded-xl text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(0, 217, 255, 0.1) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
        }}
      >
        <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'rgba(160, 164, 184, 0.5)' }}>
          Reputa Score v2
        </p>
      </div>
    </aside>
  );
}
