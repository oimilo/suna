import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { defaultLocale, type Locale, normalizeLocale } from './config';

async function buildResponse(locale: Locale) {
  return {
    locale,
    messages: (await import(`../../translations/${locale}.json`)).default
  };
}

export default getRequestConfig(async () => {
  let locale: Locale = defaultLocale;
  const cookieStore = await cookies();

  const resolveLocale = (value?: string | null) => {
    const normalized = normalizeLocale(value);
    if (normalized) {
      locale = normalized;
      return true;
    }
    return false;
  };

  // Priority 1: Check user profile preference (if authenticated)
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {
            // No-op for server-side
          }
        }
      }
    );

    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (user?.user_metadata?.locale && resolveLocale(user.user_metadata.locale)) {
      return buildResponse(locale);
    }
  } catch (error) {
    console.debug('Could not fetch user locale from profile:', error);
  }

  // Priority 2: Check cookie
  const localeCookie = cookieStore.get('locale')?.value;
  if (localeCookie && resolveLocale(localeCookie)) {
    return buildResponse(locale);
  }

  // Priority 3: Try to detect from Accept-Language header
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language');

  if (acceptLanguage) {
    const candidates = acceptLanguage
      .split(',')
      .map((part) => part.split(';')[0]?.trim())
      .filter(Boolean);

    for (const candidate of candidates) {
      if (resolveLocale(candidate)) {
        return buildResponse(locale);
      }
    }
  }

  return buildResponse(locale);
});

