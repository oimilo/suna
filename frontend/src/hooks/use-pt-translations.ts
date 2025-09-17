// Hook simplificado para usar apenas português
import { useCallback } from 'react';
import ptBR from '@/i18n/translations/pt-BR.json';

export function usePtTranslations() {
  const t = useCallback((key: string, params?: Record<string, any>): string => {
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
    
    if (typeof value !== 'string') {
      return key;
    }
    
    // Handle interpolations
    if (params) {
      return value.replace(/\{(\w+)\}/g, (match, paramName) => {
        return params[paramName] !== undefined ? String(params[paramName]) : match;
      });
    }
    
    return value;
  }, []);
  
  return { t };
}