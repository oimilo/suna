'use client';

import { NextIntlClientProvider } from 'next-intl';
import { ReactNode, useEffect, useState, useCallback, useRef } from 'react';
import { locales, defaultLocale, type Locale, normalizeLocale } from '@/i18n/config';
import { detectBestLocale } from '@/lib/utils/geo-detection';
import { createClient } from '@/lib/supabase/client';

async function getMessages(locale: Locale) {
  try {
    return (await import(`../../translations/${locale}.json`)).default;
  } catch (error) {
    console.error(`Failed to load messages for locale ${locale}:`, error);
    return (await import(`../../translations/${defaultLocale}.json`)).default;
  }
}

const resolveLocale = (value?: string | null): Locale | null => normalizeLocale(value) ?? null;

function getImmediateLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale;

  try {
    const cookies = document.cookie.split(';');
    const localeCookie = cookies.find((c) => c.trim().startsWith('locale='));
    if (localeCookie) {
      const value = localeCookie.split('=')[1].trim();
      const normalized = resolveLocale(value);
      if (normalized) {
        return normalized;
      }
    }

    const stored = resolveLocale(localStorage.getItem('locale'));
    if (stored) {
      return stored;
    }

    const browserLanguages = [navigator.language, ...(navigator.languages ?? [])];
    for (const lang of browserLanguages) {
      const normalized = resolveLocale(lang);
      if (normalized) {
        return normalized;
      }
    }
  } catch {
    // Ignore errors - we'll fall back to default locale
  }

  return defaultLocale;
}

async function getStoredLocale() {
  if (typeof window === 'undefined') {
    return { locale: defaultLocale, hasExplicitPreference: false };
  }

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userLocale = resolveLocale(user?.user_metadata?.locale);
    if (userLocale) {
      return { locale: userLocale, hasExplicitPreference: true };
    }
  } catch {
    // User might not be authenticated
  }

  const cookies = document.cookie.split(';');
  const localeCookie = cookies.find((c) => c.trim().startsWith('locale='));
  if (localeCookie) {
    const value = localeCookie.split('=')[1].trim();
    const normalized = resolveLocale(value);
    if (normalized) {
      return { locale: normalized, hasExplicitPreference: true };
    }
  }

  const stored = resolveLocale(localStorage.getItem('locale'));
  if (stored) {
    return { locale: stored, hasExplicitPreference: true };
  }

  const geoDetected = resolveLocale(detectBestLocale());
  if (geoDetected) {
    return { locale: geoDetected, hasExplicitPreference: false };
  }

  return { locale: defaultLocale, hasExplicitPreference: false };
}

const LOCALE_CHANGE_EVENT = 'locale-change';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window !== 'undefined') {
      return getImmediateLocale();
    }
    return defaultLocale;
  });
  const [messages, setMessages] = useState<any>(null);
  const [, setIsLoading] = useState(true);
  const localeRef = useRef(locale);

  useEffect(() => {
    localeRef.current = locale;
  }, [locale]);

  const loadMessages = useCallback(async (targetLocale: Locale) => {
    setIsLoading(true);
    try {
      const msgs = await getMessages(targetLocale);
      if (!msgs || typeof msgs !== 'object') {
        throw new Error(`Invalid messages object for locale ${targetLocale}`);
      }
      if (!msgs.common || !msgs.suna) {
        console.warn(`Missing sections in ${targetLocale}:`, {
          hasCommon: !!msgs.common,
          hasSuna: !!msgs.suna,
          keys: Object.keys(msgs).slice(0, 10),
        });
      }
      setMessages(msgs);
      setLocale(targetLocale);
      localeRef.current = targetLocale;
    } catch (error) {
      console.error(`Failed to load messages for ${targetLocale}:`, error);
      try {
        const fallback = await getMessages(defaultLocale);
        setMessages(fallback);
        setLocale(defaultLocale);
        localeRef.current = defaultLocale;
      } catch (fallbackError) {
        console.error('Failed to load default locale messages:', fallbackError);
        setMessages({});
        setLocale(defaultLocale);
        localeRef.current = defaultLocale;
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function initializeLocale() {
      const result = await getStoredLocale();
      if (!active) return;

      if (!result.hasExplicitPreference && result.locale !== defaultLocale) {
        const cookieValue = `locale=${result.locale}; path=/; max-age=31536000; SameSite=Lax`;
        document.cookie = cookieValue;
        try {
          localStorage.setItem('locale', result.locale);
        } catch {
          // Ignore storage errors
        }
      }

      loadMessages(result.locale);
    }

    initializeLocale();

    return () => {
      active = false;
    };
  }, [loadMessages]);

  useEffect(() => {
    const handleLocaleChange = (e: CustomEvent<Locale>) => {
      const newLocale = e.detail;
      if (newLocale !== localeRef.current && locales.includes(newLocale)) {
        loadMessages(newLocale);
      }
    };

    window.addEventListener(LOCALE_CHANGE_EVENT as any, handleLocaleChange as EventListener);
    return () => {
      window.removeEventListener(LOCALE_CHANGE_EVENT as any, handleLocaleChange as EventListener);
    };
  }, [loadMessages]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'locale' && e.newValue) {
        const normalized = resolveLocale(e.newValue);
        if (normalized) {
          loadMessages(normalized);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadMessages]);

  const safeMessages = messages || {};

  if (!messages || Object.keys(messages).length === 0) {
    return (
      <NextIntlClientProvider locale={defaultLocale} messages={{}}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </NextIntlClientProvider>
    );
  }

  return (
    <NextIntlClientProvider locale={locale} messages={safeMessages}>
      {children}
    </NextIntlClientProvider>
  );
}

