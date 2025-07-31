'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Plug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/hooks/use-translations';

export function NavIntegrations() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslations();
  const isActive = pathname === '/settings/credentials';

  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start gap-2 h-10",
        isActive && "bg-accent text-accent-foreground"
      )}
      onClick={() => router.push('/settings/credentials')}
    >
      <Plug className="h-4 w-4" />
      <span>{t('sidebar.integrations')}</span>
    </Button>
  );
}