import { useCallback } from 'react';
import { useLocale } from './use-locale';
import ptBR from '@/i18n/translations/pt-BR.json';
import en from '@/i18n/translations/en.json';
import { Locale } from '@/i18n/config';

const translations: Record<Locale, any> = {
  'pt-BR': ptBR,
  'en': en
};

export function useTranslations() {
  const { locale } = useLocale();
  
  const t = useCallback((key: string): string => {
    const keys = key.split('.');
    let value: any = translations[locale];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key "${key}" not found for locale "${locale}"`);
        return key;
      }
    }
    
    return typeof value === 'string' ? value : key;
  }, [locale]);
  
  return { t, locale };
}