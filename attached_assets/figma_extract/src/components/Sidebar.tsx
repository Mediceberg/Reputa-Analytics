import { useLanguage } from '@/hooks/useLanguage';
import { AppMode } from '@/types';
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
}

export function Sidebar({ mode, onModeToggle }: SidebarProps) {
  const { t } = useLanguage();

  const mainItems = [
    { icon: LayoutDashboard, label: 'Dashboard', active: true },
    { icon: Package, label: 'Products', active: false },
    { icon: ShoppingCart, label: 'Orders', active: false },
    { icon: BarChart3, label: 'Reports', active: false },
  ];

  const transactionItems = [
    { icon: CreditCard, label: 'Transactions', active: false },
    { icon: FileText, label: 'Invoice', active: false },
  ];

  const toolsItems = [
    { icon: Settings, label: 'Settings', active: false },
    { icon: MessageSquare, label: 'Feedback', active: false },
    { icon: HelpCircle, label: 'Help', active: false },
  ];

  return (
    <aside className="bg-[#111] w-[257px] min-h-screen rounded-[15px] p-6 flex flex-col">
      {/* Logo Section */}
      <div className="mb-8">
        <h2 className="font-['Inter',sans-serif] font-black italic text-[30px] text-white">
          Reputa Score
        </h2>
      </div>

      {/* Mode Toggle */}
      <button
        onClick={onModeToggle}
        className="mb-8 w-full bg-black rounded-lg p-4 hover:bg-[#1a1a1a] transition-colors border border-[#222] hover:border-[#FAC515]"
      >
        <div className="flex items-center gap-3">
          {mode.mode === 'demo' ? (
            <>
              <TestTube className="size-5 text-[#FAC515]" />
              <div className="text-left flex-1">
                <p className="text-white font-medium text-sm">{t('app.mode.demo')}</p>
                <p className="text-gray-500 text-xs">Click to switch to Testnet</p>
              </div>
            </>
          ) : (
            <>
              <Zap className="size-5 text-[#10b981]" />
              <div className="text-left flex-1">
                <p className="text-white font-medium text-sm">{t('app.mode.testnet')}</p>
                <p className="text-gray-500 text-xs">Connected to Pi Network</p>
              </div>
              {mode.connected && (
                <span className="size-2 rounded-full bg-[#10b981]" />
              )}
            </>
          )}
        </div>
      </button>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-8">
        {/* PAGES Section */}
        <div>
          <p className="font-['Roboto',sans-serif] font-medium text-[#a5a5a5] text-[13px] mb-4 uppercase" style={{ fontVariationSettings: "'wdth' 100" }}>
            PAGES
          </p>
          <div className="space-y-1">
            {mainItems.map((item, index) => (
              <button
                key={index}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  item.active
                    ? 'bg-black shadow-lg'
                    : 'hover:bg-[#1a1a1a]'
                }`}
              >
                <item.icon className="size-5 text-white" />
                <span className="font-['Roboto',sans-serif] text-[13px] text-white" style={{ fontVariationSettings: "'wdth' 100" }}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* TRANSACTION Section */}
        <div>
          <p className="font-['Roboto',sans-serif] font-medium text-[#adb8b8] text-[13px] mb-4 uppercase" style={{ fontVariationSettings: "'wdth' 100" }}>
            TRANSACTION
          </p>
          <div className="space-y-1">
            {transactionItems.map((item, index) => (
              <button
                key={index}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#1a1a1a] transition-colors"
              >
                <item.icon className="size-5 text-white" />
                <span className="font-['Roboto',sans-serif] text-[13px] text-white" style={{ fontVariationSettings: "'wdth' 100" }}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* TOOLS Section */}
        <div>
          <p className="font-['Roboto',sans-serif] font-medium text-[#a5a5a5] text-[13px] mb-4 uppercase" style={{ fontVariationSettings: "'wdth' 100" }}>
            TOOLS
          </p>
          <div className="space-y-1">
            {toolsItems.map((item, index) => (
              <button
                key={index}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#1a1a1a] transition-colors"
              >
                <item.icon className="size-5 text-white" />
                <span className="font-['Roboto',sans-serif] text-[13px] text-white" style={{ fontVariationSettings: "'wdth' 100" }}>
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