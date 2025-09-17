/**
 * Utilitários para formatação de datas com suporte ao timezone de São Paulo
 */

export const BRAZIL_TIMEZONE = 'America/Sao_Paulo';
export const BRAZIL_LOCALE = 'pt-BR';

/**
 * Formata uma data completa (data e hora) no padrão brasileiro
 */
export function formatDateTime(date: Date | string | number): string {
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'Data inválida';
    
    return dateObj.toLocaleString(BRAZIL_LOCALE, {
      timeZone: BRAZIL_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (e) {
    return 'Data inválida';
  }
}

/**
 * Formata apenas a data no padrão brasileiro
 */
export function formatDate(date: Date | string | number): string {
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'Data inválida';
    
    return dateObj.toLocaleDateString(BRAZIL_LOCALE, {
      timeZone: BRAZIL_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (e) {
    return 'Data inválida';
  }
}

/**
 * Formata apenas a hora no padrão brasileiro
 */
export function formatTime(date: Date | string | number): string {
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'Hora inválida';
    
    return dateObj.toLocaleTimeString(BRAZIL_LOCALE, {
      timeZone: BRAZIL_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (e) {
    return 'Hora inválida';
  }
}

/**
 * Formata números no padrão brasileiro
 */
export function formatNumber(value: number): string {
  return value.toLocaleString(BRAZIL_LOCALE);
}

/**
 * Retorna a data/hora atual no timezone de São Paulo
 */
export function getCurrentBrazilTime(): Date {
  const now = new Date();
  const brazilTime = new Date(now.toLocaleString('en-US', { timeZone: BRAZIL_TIMEZONE }));
  return brazilTime;
}

/**
 * Formata data relativa (ex: "há 2 horas", "ontem")
 */
export function formatRelativeTime(date: Date | string | number): string {
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'Data inválida';
    
    const now = getCurrentBrazilTime();
    const diffInMs = now.getTime() - dateObj.getTime();
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInSeconds < 60) {
      return 'agora mesmo';
    } else if (diffInMinutes < 60) {
      return `há ${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minutos'}`;
    } else if (diffInHours < 24) {
      return `há ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`;
    } else if (diffInDays === 1) {
      return 'ontem';
    } else if (diffInDays < 7) {
      return `há ${diffInDays} dias`;
    } else {
      return formatDate(dateObj);
    }
  } catch (e) {
    return 'Data inválida';
  }
}