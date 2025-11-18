'use client';

import { useLanguage } from '@/hooks/use-language';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Globe } from 'lucide-react';
import { type Locale } from '@/i18n/config';
import { useTranslations } from 'next-intl';

export function LanguageSwitcher() {
  const { locale, setLanguage, availableLanguages } = useLanguage();
  const languageCopy = useTranslations('settings.general.language');
  const languageNames = useTranslations('languages');

  const getLanguageName = (lang: Locale) => {
    try {
      return languageNames(lang);
    } catch {
      return lang;
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="language-select" className="flex items-center gap-2">
        <Globe className="h-4 w-4" />
        {languageCopy('title')}
      </Label>
      <p className="text-sm text-muted-foreground">{languageCopy('description')}</p>
      <Select value={locale} onValueChange={(value) => setLanguage(value as Locale)}>
        <SelectTrigger id="language-select" className="w-full">
          <SelectValue placeholder={languageCopy('select')}>
            {getLanguageName(locale as Locale)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {availableLanguages.map((lang) => (
            <SelectItem key={lang} value={lang}>
              {getLanguageName(lang)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        {languageCopy('current')}: {getLanguageName(locale as Locale)}
      </p>
    </div>
  );
}

