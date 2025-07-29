// Hook simplificado para usar apenas português
import { useCallback } from 'react';
import ptBR from '@/i18n/translations/pt-BR.json';

export function usePtTranslations() {
  const t = useCallback((key: string): string => {
    const keys = key.split('.');
    let value: any = ptBR;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key "${key}" not found`);
        return key;
      }
    }
    
    return typeof value === 'string' ? value : key;
  }, []);
  
  return { t };
}