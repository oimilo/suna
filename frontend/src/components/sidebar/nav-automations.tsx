'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  Zap, 
  Clock, 
  Webhook, 
  MessageSquare, 
  ChevronRight, 
  Plus,
  Loader2,
  Activity
} from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AgentTriggersConfiguration } from '../agents/triggers/agent-triggers-configuration';
import { useAllTriggers } from '@/hooks/react-query/triggers';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NavAutomationsProps {
  className?: string;
}

export function NavAutomations({ className }: NavAutomationsProps) {
  const { state } = useSidebar();
  const [showAll, setShowAll] = React.useState(false);
  const [selectedTrigger, setSelectedTrigger] = useState<any>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  
  const isCollapsed = state === 'collapsed';
  
  // Fetch real data
  const { data: triggers = [], isLoading } = useAllTriggers();
  const activeTriggers = triggers.filter((trigger) => trigger.is_active);
  const displayedTriggers = showAll ? activeTriggers : activeTriggers.slice(0, 3);

  const handleTriggerClick = (trigger: any) => {
    setSelectedTrigger(trigger);
    setIsConfigOpen(true);
  };

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'schedule':
        return Clock;
      case 'webhook':
        return Webhook;
      case 'telegram':
      case 'slack':
      case 'discord':
        return MessageSquare;
      default:
        return Zap;
    }
  };

  const getScheduleText = (trigger: any) => {
    const cron = trigger.config?.cron_expression;
    if (!cron) return null;
    return cron;
  };

  const getUpdatedText = (trigger: any) => {
    if (!trigger.updated_at) return null;
    return formatDistanceToNow(new Date(trigger.updated_at), {
      addSuffix: true,
      locale: ptBR
    });
  };
  
  if (isCollapsed) {
    return (
      <SidebarGroup className={className}>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Automações"
              className="justify-center"
            >
              <Link href="/automations">
                <Zap className="h-4 w-4" />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    );
  }

  return (
    <>
      <SidebarGroup className={className}>
        <div className="flex items-center justify-between mb-2">
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">
            Automações Ativas
          </SidebarGroupLabel>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-xs"
            asChild
          >
            <Link href="/automations">
              <Plus className="h-3 w-3" />
            </Link>
          </Button>
        </div>
        
        <SidebarGroupContent>
          <SidebarMenu>
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 3 }).map((_, i) => (
                <SidebarMenuItem key={i}>
                  <div className="flex items-center gap-2 px-2 py-1.5">
                    <Skeleton className="h-4 w-4 rounded" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-2 w-16" />
                    </div>
                  </div>
                </SidebarMenuItem>
              ))
            ) : displayedTriggers.length > 0 ? (
              <>
                {displayedTriggers.map((trigger) => {
                  const Icon = getTriggerIcon(trigger.trigger_type);
                  const scheduleText = getScheduleText(trigger);
                  const updatedText = getUpdatedText(trigger);
                  
                  return (
                    <SidebarMenuItem key={trigger.trigger_id}>
                      <SidebarMenuButton
                        onClick={() => handleTriggerClick(trigger)}
                        className="w-full justify-start px-2 py-1.5 h-auto"
                      >
                        <div className="flex items-start gap-2 w-full">
                          <div className={cn(
                            "mt-0.5 p-1 rounded",
                            "bg-zinc-100 dark:bg-zinc-900/50"
                          )}>
                            <Icon className="h-3 w-3 text-zinc-600 dark:text-zinc-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-medium truncate">
                                {trigger.name}
                              </span>
                              {trigger.is_active && (
                                <Activity className="h-2.5 w-2.5 text-green-500 animate-pulse" />
                              )}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[10px] text-muted-foreground truncate">
                                {trigger.agent_name}
                              </span>
                              {(scheduleText || updatedText) && (
                                <span className="text-[10px] text-muted-foreground">
                                  {[
                                    scheduleText,
                                    updatedText ? `Atualizado ${updatedText}` : null,
                                  ]
                                    .filter(Boolean)
                                    .join(' • ')}
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="h-3 w-3 text-muted-foreground opacity-50" />
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
                
                {activeTriggers.length > 3 && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setShowAll(!showAll)}
                      className="w-full justify-center px-2 py-1 h-auto"
                    >
                      <span className="text-xs text-muted-foreground">
                        {showAll ? 'Mostrar menos' : `Ver mais ${activeTriggers.length - 3}`}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </>
            ) : (
              <SidebarMenuItem>
                <div className="px-2 py-3 text-center">
                  <p className="text-xs text-muted-foreground">
                    Nenhuma automação ativa
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs mt-1"
                    asChild
                  >
                    <Link href="/automations">
                      Criar primeira automação
                    </Link>
                  </Button>
                </div>
              </SidebarMenuItem>
            )}
            
            {/* Link para página de automações */}
            <SidebarMenuItem className="mt-2 pt-2 border-t">
              <SidebarMenuButton asChild>
                <Link href="/automations" className="w-full justify-between">
                  <span className="text-xs font-medium">Ver todas</span>
                  <Badge variant="secondary" className="text-[10px] px-1 h-4">
                    {activeTriggers.length}
                  </Badge>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Modal de configuração do trigger */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Configurar Automação: {selectedTrigger?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedTrigger && (
            <div className="mt-4">
              <AgentTriggersConfiguration agentId={selectedTrigger.agent_id} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
