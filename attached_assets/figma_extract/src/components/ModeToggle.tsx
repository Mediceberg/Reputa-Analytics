import { AppMode } from '@/types';
import { useLanguage } from '@/hooks/useLanguage';
import { Zap, TestTube } from 'lucide-react';

interface ModeToggleProps {
  mode: AppMode;
  onToggle: () => void;
}

export function ModeToggle({ mode, onToggle }: ModeToggleProps) {
  const { t } = useLanguage();

  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#131313] border border-gray-700 hover:border-[#FAC515] transition-colors"
    >
      {mode.mode === 'demo' ? (
        <>
          <TestTube className="size-4 text-[#FAC515]" />
          <span className="text-sm font-medium text-white">{t('app.mode.demo')}</span>
        </>
      ) : (
        <>
          <Zap className="size-4 text-green-400" />
          <span className="text-sm font-medium text-white">{t('app.mode.testnet')}</span>
        </>
      )}
      {mode.connected && mode.mode === 'testnet' && (
        <span className="size-2 rounded-full bg-green-400 ml-1" />
      )}
    </button>
  );
}
