import { useState, useEffect } from 'react';
import { Locale, defaultLocale, locales } from '@/i18n/config';

const LOCALE_STORAGE_KEY = 'prophet-locale';

export function useLocale() {
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  
  useEffect(() => {
    // Check localStorage
    const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale;
    if (savedLocale && locales.includes(savedLocale)) {
      setLocale(savedLocale);
      return;
    }
    
    // Check browser language
    const browserLang = navigator.language.toLowerCase();
    const matchedLocale = locales.find(loc => 
      browserLang.startsWith(loc.toLowerCase().replace('-', '_'))
    );
    
    if (matchedLocale) {
      setLocale(matchedLocale);
      localStorage.setItem(LOCALE_STORAGE_KEY, matchedLocale);
    }
  }, []);
  
  const changeLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    // Reload page to apply changes
    window.location.reload();
  };
  
  return { locale, changeLocale };
}

export function useChangeLocale() {
  const { changeLocale } = useLocale();
  return changeLocale;
}