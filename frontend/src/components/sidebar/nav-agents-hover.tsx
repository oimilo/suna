'use client';

import * as React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Bot, ChevronRight, Store, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/hooks/use-translations';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export function NavAgentsHover() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useTranslations();
  const [isOpen, setIsOpen] = React.useState(pathname?.includes('/agents'));

  const handleNewAgent = () => {
    // TODO: Implement new agent dialog
    router.push('/agents?tab=my-agents');
  };

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="group/collapsible"
    >
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-between gap-2 h-10",
            "hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            <span>{t('sidebar.agents')}</span>
          </div>
          <ChevronRight className={cn(
            "h-4 w-4 transition-transform duration-200",
            isOpen && "rotate-90"
          )} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1 mt-1">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-full justify-start gap-2 h-9 pl-8",
            pathname === '/agents' && searchParams.get('tab') === 'marketplace' && "bg-accent text-accent-foreground"
          )}
          onClick={() => router.push('/agents?tab=marketplace')}
        >
          <Store className="h-3 w-3" />
          <span className="text-sm">{t('sidebar.explore')}</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-full justify-start gap-2 h-9 pl-8",
            pathname === '/agents' && (searchParams.get('tab') === 'my-agents' || !searchParams.get('tab')) && "bg-accent text-accent-foreground"
          )}
          onClick={() => router.push('/agents?tab=my-agents')}
        >
          <Bot className="h-3 w-3" />
          <span className="text-sm">{t('sidebar.myAgents')}</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 h-9 pl-8"
          onClick={handleNewAgent}
        >
          <Plus className="h-3 w-3" />
          <span className="text-sm">{t('sidebar.newAgent')}</span>
        </Button>
      </CollapsibleContent>
    </Collapsible>
  );
}