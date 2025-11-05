'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Plus, PanelLeft, Command, Calendar } from 'lucide-react';
import { NavUserHover } from './nav-user-hover';
import { NavThreads } from './nav-threads';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSidebarContext } from '@/contexts/sidebar-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function ScheduledTriggersList() {
  return (
    <NavThreads
      showOnlyTriggerThreads
      emptyState={(
        <>
          <Calendar className="h-8 w-8 mx-auto mb-2 opacity-20" />
          <p>Nenhuma automação agendada</p>
          <p className="text-xs mt-1">Automação iniciada por trigger aparece aqui</p>
        </>
      )}
    />
  );
}

export function HoverSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = React.useState('tarefas');
  const { isPinned, setIsPinned: setPinnedContext } = useSidebarContext();

  const togglePinned = React.useCallback(() => {
    setPinnedContext(!isPinned);
  }, [isPinned, setPinnedContext]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'b') {
        event.preventDefault();
        togglePinned();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePinned]);

  return (
    <>
      {!isPinned && (
        <div className="fixed top-3 left-3 z-[120]">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPinnedContext(true)}
                className="h-8 w-8"
                aria-label="Expandir barra lateral"
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Expandir barra lateral (CMD+B)</TooltipContent>
          </Tooltip>
        </div>
      )}

      {!pathname.includes('/thread/') && !pathname.includes('/agents/config/') && (
        <div className="fixed top-0 left-0 z-[100] h-14 flex items-center px-4 bg-transparent w-full">
          {!pathname.startsWith('/dashboard') && isPinned && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePinned}
                  className="h-8 w-8 mr-2"
                  aria-label="Recolher barra lateral"
                >
                  <PanelLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Recolher barra lateral (CMD+B)</TooltipContent>
            </Tooltip>
          )}

          <Link
            href="/dashboard"
            className={cn('flex items-center', pathname.startsWith('/dashboard') ? 'ml-2.5' : '')}
          >
            <span className="font-dancing font-bold text-2xl">Prophet</span>
          </Link>
        </div>
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-[110] h-full w-64 bg-background border-r border-black/6 dark:border-white/8 transition-transform duration-300 ease-in-out',
          isPinned ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          <div className="px-3 pt-3 pb-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePinned}
                  className="h-8 w-8 hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200"
                  aria-label={isPinned ? 'Recolher barra lateral' : 'Expandir barra lateral'}
                >
                  <PanelLeft className="h-4 w-4 opacity-60" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isPinned ? 'Recolher barra lateral (CMD+B)' : 'Expandir barra lateral (CMD+B)'}
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex-1 overflow-y-auto px-3">
            <div className="mb-4">
              <Button
                variant="default"
                className="w-full justify-between h-10 bg-black/[0.02] dark:bg-white/[0.03] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-foreground border border-black/6 dark:border-white/8 transition-all duration-200"
                onClick={() => router.push('/dashboard')}
              >
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  <span>Nova tarefa</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Command className="h-3 w-3" />
                  <span>K</span>
                </div>
              </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-black/[0.02] dark:bg-white/[0.03] p-1 rounded-lg border border-black/6 dark:border-white/8">
                <TabsTrigger
                  value="tarefas"
                  className="data-[state=active]:bg-background data-[state=active]:border data-[state=active]:border-black/6 dark:data-[state=active]:border-white/8 text-xs transition-all duration-200"
                >
                  Tarefas
                </TabsTrigger>
                <TabsTrigger
                  value="favoritos"
                  className="data-[state=active]:bg-background data-[state=active]:border data-[state=active]:border-black/6 dark:data-[state=active]:border-white/8 text-xs transition-all duration-200"
                >
                  Favoritos
                </TabsTrigger>
                <TabsTrigger
                  value="agendado"
                  className="data-[state=active]:bg-background data-[state=active]:border data-[state=active]:border-black/6 dark:data-[state=active]:border-white/8 text-xs transition-all duration-200"
                >
                  Agendado
                </TabsTrigger>
              </TabsList>

              <TabsContent value="tarefas" className="mt-4 space-y-2">
                <NavThreads
                  excludeTriggerThreads
                  emptyState={(
                    <>
                      <p>Nenhuma tarefa ainda</p>
                      <p className="text-xs mt-1">Crie uma nova tarefa para começar</p>
                    </>
                  )}
                />
              </TabsContent>

              <TabsContent value="favoritos" className="mt-4 space-y-2">
                <NavThreads showOnlyFavorites />
              </TabsContent>

              <TabsContent value="agendado" className="mt-4 space-y-1">
                <ScheduledTriggersList />
              </TabsContent>
            </Tabs>
          </div>

          <div className="mt-auto p-3">
            <NavUserHover />
          </div>
        </div>
      </aside>
    </>
  );
}
