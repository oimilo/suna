'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/hooks/use-translations';

interface NavSecondaryProps {
  className?: string;
}

export function NavSecondary({ className }: NavSecondaryProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslations();
  const isActive = pathname === '/dashboard';

  return (
    <div className={cn("", className)}>
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start gap-2 h-10",
          "bg-muted hover:bg-accent hover:text-accent-foreground",
          isActive && "bg-accent text-accent-foreground"
        )}
        onClick={() => router.push('/dashboard')}
      >
        <Plus className="h-4 w-4" />
        <span>{t('sidebar.newTask')}</span>
      </Button>
    </div>
  );
}