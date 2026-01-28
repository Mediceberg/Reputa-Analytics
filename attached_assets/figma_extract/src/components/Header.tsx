import { User, AppMode } from '@/types';
import { useLanguage } from '@/hooks/useLanguage';
import { LanguageSelector } from './LanguageSelector';
import { Search, Bell } from 'lucide-react';
import imgImage from 'figma:asset/c832911c86aced49a6140e5e7635c777abb39027.png';

interface HeaderProps {
  user: User | null;
  mode: AppMode;
}

export function Header({ user, mode }: HeaderProps) {
  const { t } = useLanguage();

  return (
    <header className="bg-black border-b border-[#1a1a1a]">
      <div className="max-w-[1296px] mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          {/* Logo & Title */}
          <div>
            <h1 className="font-['Roboto',sans-serif] font-semibold text-[28px] text-white tracking-tight" style={{ fontVariationSettings: "'wdth' 100" }}>
              {t('app.title')}
            </h1>
            <p className="font-['Roboto',sans-serif] text-[#d7d7d7] text-[14px] mt-0.5" style={{ fontVariationSettings: "'wdth' 100" }}>
              {t('app.subtitle')}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <LanguageSelector />

            {/* Search */}
            <button className="size-[49px] rounded-full bg-[#131313] flex items-center justify-center hover:bg-[#1a1a1a] transition-colors">
              <Search className="size-5 text-white" />
            </button>

            {/* Notifications */}
            <button className="size-[49px] rounded-full bg-[#131313] flex items-center justify-center hover:bg-[#1a1a1a] transition-colors relative">
              <Bell className="size-5 text-white" />
              {mode.connected && (
                <span className="absolute top-2 right-2 size-2 rounded-full bg-[#FAC515]" />
              )}
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-3">
              <img
                src={imgImage}
                alt="User"
                className="size-[49px] rounded-full object-cover"
              />
              <div>
                <p className="font-['Roboto',sans-serif] font-medium text-[16px] text-white" style={{ fontVariationSettings: "'wdth' 100" }}>
                  {user?.username || 'Guest'}
                </p>
                <p className="font-['Roboto',sans-serif] text-[#d7d7d7] text-[12px]" style={{ fontVariationSettings: "'wdth' 100" }}>
                  {mode.mode === 'demo' ? t('app.mode.demo') : t('app.mode.testnet')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
