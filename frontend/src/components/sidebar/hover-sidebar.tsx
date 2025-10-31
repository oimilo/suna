'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Plus, PanelLeft, Command, Calendar, ChevronRight } from 'lucide-react';
import { NavUserHover } from './nav-user-hover';
import { NavThreads } from './nav-threads';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSidebarContext } from '@/contexts/sidebar-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Componente para mostrar triggers agendados
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
  const [isHovered, setIsHovered] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('tarefas');
  const { isPinned, setIsPinned: setPinnedContext } = useSidebarContext();
  const hoverTimeoutRef = React.useRef<NodeJS.Timeout>();
  const leaveTimeoutRef = React.useRef<NodeJS.Timeout>();

  React.useEffect(() => {
    setIsExpanded(isPinned);
  }, [isPinned]);

  // Cleanup timeouts on unmount
  React.useEffect(() => {
    return () => {
      clearTimeout(hoverTimeoutRef.current);
      clearTimeout(leaveTimeoutRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    if (!isPinned) {
      // Clear any pending leave timeout
      clearTimeout(leaveTimeoutRef.current);
      
      // Only start hover timer if not already expanded
      if (!isExpanded) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = setTimeout(() => {
          setIsHovered(true);
          setIsExpanded(true);
        }, 100); // Faster open on hover for more responsive UX
      }
    }
  };

  const handleMouseLeave = () => {
    if (!isPinned) {
      // Clear any pending enter timeout
      clearTimeout(hoverTimeoutRef.current);
      
      // Add small delay before closing to prevent flickering
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = setTimeout(() => {
        setIsHovered(false);
        setIsExpanded(false);
      }, 150); // Small delay to prevent flickering when moving mouse quickly
    }
  };

  const togglePin = () => {
    const newPinned = !isPinned;
    setPinnedContext(newPinned);
    if (!newPinned) {
      setIsHovered(false);
      setIsExpanded(false);
    }
  };

  return (
    <>
      {/* Header com ícone e logo - esconde na página de chat e na página de config de agentes */}
      {!pathname.includes('/thread/') && !pathname.includes('/agents/config/') && (
        <div className="fixed top-0 left-0 z-[100] h-14 flex items-center px-4 bg-transparent w-full">
          {/* Ícone de painel: ocultar no /dashboard */}
          {!pathname.startsWith('/dashboard') && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePin}
                  onMouseEnter={!isPinned ? handleMouseEnter : undefined}
                  className="h-8 w-8 mr-2"
                >
                  <PanelLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="z-[120]">
                {isPinned ? 'Desacoplar' : 'Acoplar'}
              </TooltipContent>
            </Tooltip>
          )}
          
          {/* Logo sempre visível */}
          <Link href="/dashboard" className={cn("flex items-center", pathname.startsWith('/dashboard') ? 'ml-2.5' : '')}>
            <span className="font-dancing font-bold text-2xl">Prophet</span>
          </Link>
        </div>
      )}

      {/* Faixa de ativação na borda esquerda (full height, estreita) */}
      {!isPinned && !isExpanded && (
        <div
          className="fixed left-0 top-0 bottom-0 w-6 z-[99] hidden md:block group"
          onMouseEnter={handleMouseEnter}
          tabIndex={0}
          onFocus={handleMouseEnter}
          onBlur={handleMouseLeave}
          aria-label="Abrir barra lateral"
        >
          {/* Linha sutil indicando área ativa */}
          <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-foreground/15 to-transparent" />
          {/* Setinha discreta que sugere abertura */}
          <div className="absolute top-1/2 -translate-y-1/2 left-[5px] text-foreground/30 transition-all duration-200 group-hover:text-foreground/60 group-focus:text-foreground/60 group-hover:left-[6px] pointer-events-none">
            <ChevronRight className="h-3 w-3" />
          </div>
        </div>
      )}

      {/* Sidebar expandida - flutuante sobre TODO o conteúdo */}
      <aside
        className={cn(
          "fixed z-[110] bg-background",
          "border-r border-black/6 dark:border-white/8",
          isPinned ? (
            "left-0 top-0 w-64 h-full transition-all duration-200"
          ) : (
            isExpanded ? 
              "left-3 top-3 w-64 h-[calc(100vh-1.5rem)] shadow-2xl rounded-lg border border-black/6 dark:border-white/8 transition-all duration-300 ease-out" : 
              "left-0 top-0 w-0 h-0 overflow-hidden pointer-events-none transition-all duration-200"
          )
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className={cn(
          "flex h-full flex-col",
          !isExpanded && "opacity-0"
        )}>
          {/* Ícone sempre visível no canto superior esquerdo da sidebar */}
          <div className="px-3 pt-3 pb-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePin}
                  className="h-8 w-8 hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200"
                >
                  <PanelLeft className="h-4 w-4 opacity-60" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="z-[120]">
                {isPinned ? 'Desacoplar' : 'Acoplar'}
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto px-3">
            {/* Nova Tarefa Button com ações rápidas */}
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

            {/* Tabs System */}
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
                <NavThreads showOnlyFavorites={true} />
              </TabsContent>

              <TabsContent value="agendado" className="mt-4 space-y-1">
                <ScheduledTriggersList />
              </TabsContent>
            </Tabs>

            {/* Links removidos - movidos para o menu do usuário */}
          </div>

          {/* Footer */}
          <div className="mt-auto p-3">
            <NavUserHover />
          </div>
        </div>
      </aside>

    </>
  );
}