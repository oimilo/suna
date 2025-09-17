'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/hooks/use-translations';

export function NavAgentsHover() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslations();

  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start gap-2 h-10",
        "hover:bg-accent hover:text-accent-foreground",
        pathname === '/agents' && "bg-accent text-accent-foreground"
      )}
      onClick={() => router.push('/agents')}
    >
      <Bot className="h-4 w-4" />
      <span>{t('sidebar.agents')}</span>
    </Button>
  );
}