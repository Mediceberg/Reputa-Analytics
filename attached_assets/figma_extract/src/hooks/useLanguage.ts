import { useState, useEffect } from 'react';
import { Language } from '@/types';
import { getTranslation } from '@/locales/translations';

const LANGUAGE_KEY = 'reputa_language';

export function useLanguage() {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const stored = localStorage.getItem(LANGUAGE_KEY) as Language;
    if (stored && ['ar', 'fr', 'zh', 'en'].includes(stored)) {
      setLanguage(stored);
      updateDocumentDir(stored);
    }
  }, []);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem(LANGUAGE_KEY, lang);
    updateDocumentDir(lang);
  };

  const t = (key: string): string => getTranslation(language, key);

  const updateDocumentDir = (lang: Language) => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  return { language, changeLanguage, t, isRTL: language === 'ar' };
}
