import { Language } from '@/types';
import { useLanguage } from '@/hooks/useLanguage';
import { Globe } from 'lucide-react';

export function LanguageSelector() {
  const { language, changeLanguage, t } = useLanguage();

  const languages: { code: Language; label: string; native: string }[] = [
    { code: 'en', label: 'language.en', native: 'English' },
    { code: 'ar', label: 'language.ar', native: 'العربية' },
    { code: 'fr', label: 'language.fr', native: 'Français' },
    { code: 'zh', label: 'language.zh', native: '中文' },
  ];

  return (
    <div className="relative">
      <select
        value={language}
        onChange={(e) => changeLanguage(e.target.value as Language)}
        className="appearance-none bg-[#131313] text-white border border-[#333] rounded-lg pl-10 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FAC515] focus:border-transparent hover:border-[#FAC515] transition-colors cursor-pointer"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.native}
          </option>
        ))}
      </select>
      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
      <svg 
        className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}