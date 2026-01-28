import { useLanguage } from '../hooks/useLanguage';
import { AppMode } from '../protocol/types';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  CreditCard, 
  FileText,
  Settings,
  MessageSquare,
  HelpCircle,
  TestTube,
  Zap
} from 'lucide-react';

interface SidebarProps {
  mode: AppMode;
  onModeToggle: () => void;
  activeItem?: string;
  onItemClick?: (item: string) => void;
}

export function DashboardSidebar({ mode, onModeToggle, activeItem = 'Dashboard', onItemClick }: SidebarProps) {
  const { t } = useLanguage();

  const mainItems = [
    { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
    { icon: Package, label: 'Products', id: 'products' },
    { icon: ShoppingCart, label: 'Orders', id: 'orders' },
    { icon: BarChart3, label: 'Reports', id: 'reports' },
  ];

  const transactionItems = [
    { icon: CreditCard, label: 'Transactions', id: 'transactions' },
    { icon: FileText, label: 'Invoice', id: 'invoice' },
  ];

  const toolsItems = [
    { icon: Settings, label: 'Settings', id: 'settings' },
    { icon: MessageSquare, label: 'Feedback', id: 'feedback' },
    { icon: HelpCircle, label: 'Help', id: 'help' },
  ];

  const handleClick = (id: string) => {
    onItemClick?.(id);
  };

  return (
    <aside className="bg-[#111] w-[257px] min-h-screen rounded-[15px] p-6 flex flex-col border border-white/10">
      <div className="mb-8">
        <h2 className="font-black italic text-[30px] text-white">
          Reputa Score
        </h2>
      </div>

      <button
        onClick={onModeToggle}
        className="mb-8 w-full bg-black rounded-lg p-4 hover:bg-[#1a1a1a] transition-colors border border-[#222] hover:border-[#FAC515]"
      >
        <div className="flex items-center gap-3">
          {mode.mode === 'demo' ? (
            <>
              <TestTube className="w-5 h-5 text-[#FAC515]" />
              <div className="text-left flex-1">
                <p className="text-white font-medium text-sm">{t('app.mode.demo')}</p>
                <p className="text-gray-500 text-xs">Click to switch to Testnet</p>
              </div>
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 text-[#10b981]" />
              <div className="text-left flex-1">
                <p className="text-white font-medium text-sm">{t('app.mode.testnet')}</p>
                <p className="text-gray-500 text-xs">Connected to Pi Network</p>
              </div>
              {mode.connected && (
                <span className="w-2 h-2 rounded-full bg-[#10b981]" />
              )}
            </>
          )}
        </div>
      </button>

      <nav className="flex-1 space-y-8">
        <div>
          <p className="font-medium text-[#a5a5a5] text-[13px] mb-4 uppercase">
            PAGES
          </p>
          <div className="space-y-1">
            {mainItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeItem === item.label
                    ? 'bg-black shadow-lg border border-[#FAC515]/30'
                    : 'hover:bg-[#1a1a1a]'
                }`}
              >
                <item.icon className="w-5 h-5 text-white" />
                <span className="text-[13px] text-white">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="font-medium text-[#adb8b8] text-[13px] mb-4 uppercase">
            TRANSACTION
          </p>
          <div className="space-y-1">
            {transactionItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeItem === item.label
                    ? 'bg-black shadow-lg border border-[#FAC515]/30'
                    : 'hover:bg-[#1a1a1a]'
                }`}
              >
                <item.icon className="w-5 h-5 text-white" />
                <span className="text-[13px] text-white">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="font-medium text-[#a5a5a5] text-[13px] mb-4 uppercase">
            TOOLS
          </p>
          <div className="space-y-1">
            {toolsItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeItem === item.label
                    ? 'bg-black shadow-lg border border-[#FAC515]/30'
                    : 'hover:bg-[#1a1a1a]'
                }`}
              >
                <item.icon className="w-5 h-5 text-white" />
                <span className="text-[13px] text-white">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </nav>
    </aside>
  );
}
