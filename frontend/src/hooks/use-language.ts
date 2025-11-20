'use client';

import { locales, defaultLocale, type Locale, normalizeLocale } from '@/i18n/config';
import { useCallback, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { detectBestLocale } from '@/lib/utils/geo-detection';

const resolveLocale = (value?: string | null): Locale | null =>
  normalizeLocale(value) ?? null;

async function getStoredLocale(): Promise<Locale> {
  if (typeof window === 'undefined') return defaultLocale;

  try {
    const supabase = createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (user?.user_metadata?.locale) {
      const normalized = resolveLocale(user.user_metadata.locale);
      if (normalized) {
        return normalized;
      }
    }
  } catch (error) {
    console.debug('Could not fetch user locale:', error);
  }

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

  return detectBestLocale();
}

const LOCALE_CHANGE_EVENT = 'locale-change';

export function useLanguage() {
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [isChanging, setIsChanging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    getStoredLocale().then((storedLocale) => {
      if (mounted) {
        setLocale(storedLocale);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const handleLocaleChange = (e: CustomEvent<Locale>) => {
      const newLocale = e.detail;
      if (newLocale !== locale) {
        setLocale(newLocale);
        setIsChanging(false);
      }
    };

    window.addEventListener(LOCALE_CHANGE_EVENT as any, handleLocaleChange as EventListener);

    return () => {
      window.removeEventListener(LOCALE_CHANGE_EVENT as any, handleLocaleChange as EventListener);
    };
  }, [locale]);

  const setLanguage = useCallback(
    async (newLocale: Locale) => {
      if (newLocale === locale) return;

      setIsChanging(true);

      try {
        const supabase = createClient();
        const {
          data: { user }
        } = await supabase.auth.getUser();

        if (user) {
          try {
            const { error: updateError } = await supabase.auth.updateUser({
              data: { locale: newLocale }
            });

            if (updateError) {
              console.warn('Failed to save locale to user profile:', updateError);
            } else {
              console.log(`💾 Saved locale to user profile: ${newLocale}`);
            }
          } catch (error) {
            console.warn('Error saving locale to user profile:', error);
          }
        }
      } catch (error) {
        console.debug('User not authenticated, skipping profile save:', error);
      }

      const cookieValue = `locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
      document.cookie = cookieValue;
      console.log(`🍪 Setting locale cookie: ${cookieValue}`);

      if (typeof window !== 'undefined') {
        localStorage.setItem('locale', newLocale);
        console.log(`💾 Setting locale in localStorage: ${newLocale}`);
      }

      setLocale(newLocale);

      const event = new CustomEvent(LOCALE_CHANGE_EVENT, { detail: newLocale });
      window.dispatchEvent(event);

      console.log(`🌍 Language changed to: ${newLocale}`);

      setTimeout(() => {
        setIsChanging(false);
      }, 100);
    },
    [locale]
  );

  return {
    locale,
    setLanguage,
    availableLanguages: locales,
    isChanging,
    isLoading
  };
}

