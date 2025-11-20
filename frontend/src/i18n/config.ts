import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

export const locales = ['en', 'de', 'it', 'zh', 'ja', 'pt', 'fr', 'es'] as const;
export type Locale = (typeof locales)[number];

const localeAliasMap: Record<string, Locale> = {
  'pt-br': 'pt'
};

export function normalizeLocale(value?: string | null): Locale | null {
  if (!value) return null;

  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;

  const directMatch = locales.find(
    (locale) => locale.toLowerCase() === normalized
  );
  if (directMatch) {
    return directMatch;
  }

  if (localeAliasMap[normalized]) {
    return localeAliasMap[normalized];
  }

  const base = normalized.split(/[-_]/)[0];
  if (!base) return null;

  if (localeAliasMap[base]) {
    return localeAliasMap[base];
  }

  const baseMatch = locales.find(
    (locale) => locale.toLowerCase().split(/[-_]/)[0] === base
  );

  return baseMatch ?? null;
}

export const defaultLocale: Locale = 'en';

export default getRequestConfig(async ({ locale }) => {
  const normalized = normalizeLocale(locale);
  if (!normalized) {
    notFound();
  }

  return {
    locale: normalized,
    messages: (await import(`../../translations/${normalized}.json`)).default
  };
});

