'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Plus, PanelLeft } from 'lucide-react';
import { NavSecondary } from './nav-secondary';
import { NavAgentsHover } from './nav-agents-hover';
import { NavUserHover } from './nav-user-hover';
import { NavAgents } from './nav-agents';
import { NavIntegrations } from './nav-integrations';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSidebarContext } from '@/contexts/sidebar-context';

export function HoverSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isHovered, setIsHovered] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const { isPinned, setIsPinned: setPinnedContext } = useSidebarContext();
  const hoverTimeoutRef = React.useRef<NodeJS.Timeout>();

  React.useEffect(() => {
    setIsExpanded(isPinned);
  }, [isPinned]);

  const handleMouseEnter = () => {
    if (!isPinned) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = setTimeout(() => {
        setIsHovered(true);
        setIsExpanded(true);
      }, 200);
    }
  };

  const handleMouseLeave = () => {
    if (!isPinned) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = setTimeout(() => {
        setIsHovered(false);
        setIsExpanded(false);
      }, 300);
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
      {/* Header com ícone e logo - esconde na página de chat */}
      {!pathname.includes('/thread/') && (
        <div className="fixed top-0 left-0 z-[100] h-14 flex items-center px-4 bg-background w-full">
          {/* Ícone de painel sempre visível */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePin}
                className="h-8 w-8 mr-2"
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="z-[120]">
              {isPinned ? 'Desacoplar' : 'Acoplar'}
            </TooltipContent>
          </Tooltip>
          
          {/* Logo sempre visível */}
          <Link href="/dashboard" className="flex items-center">
            <span className="font-dancing font-bold text-2xl">Prophet</span>
          </Link>
        </div>
      )}

      {/* Área invisível para detectar hover na lateral */}
      {!isPinned && (
        <div
          className="fixed left-0 top-0 h-full w-4 z-[100]"
          onMouseEnter={handleMouseEnter}
        />
      )}

      {/* Sidebar expandida - flutuante sobre TODO o conteúdo */}
      <aside
        className={cn(
          "fixed z-[110] bg-background transition-all duration-200",
          isPinned ? (
            "left-0 top-0 w-64 h-full"
          ) : (
            isExpanded ? "left-3 top-3 w-64 h-[calc(100vh-1.5rem)] shadow-2xl rounded-lg" : "left-0 top-0 w-0 h-0 overflow-hidden pointer-events-none"
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
                  className="h-8 w-8"
                >
                  <PanelLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="z-[120]">
                {isPinned ? 'Desacoplar' : 'Acoplar'}
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto px-3">
            <div className="space-y-2">
              {/* Nova Tarefa - sempre no topo */}
              <NavSecondary />
              
              {/* Agentes */}
              <NavAgentsHover />
              
              {/* Integrações */}
              <NavIntegrations />
            </div>
            
            {/* Últimos projetos */}
            <div className="mt-4 px-0">
              <NavAgents />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto p-3">
            <NavUserHover />
          </div>
        </div>
      </aside>

      {/* Spacer para o conteúdo não ficar embaixo do header */}
      {!pathname.includes('/thread/') && <div className="h-14" />}
    </>
  );
}