'use client';

import * as React from 'react';
import Link from 'next/link';
import { Bot, Menu, Plus, Plug, ChevronRight, Zap, Sun, Moon } from 'lucide-react';

import { NavAgents } from '@/components/sidebar/nav-agents';
import { NavUserWithTeams } from '@/components/sidebar/nav-user-with-teams';
import { BrandLogo } from '@/components/sidebar/brand-logo';
import { NavAutomations } from '@/components/sidebar/nav-automations';
import { NavTasks } from '@/components/sidebar/nav-tasks';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { usePathname, useSearchParams } from 'next/navigation';
import { useFeatureFlags } from '@/lib/feature-flags';
import { useCreateNewAgent } from '@/hooks/react-query/agents/use-agents';
import { useTheme } from 'next-themes';

export function SidebarLeft({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { state, setOpen, setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();
  const [user, setUser] = useState<{
    name: string;
    email: string;
    avatar: string;
  }>({
    name: 'Loading...',
    email: 'loading@example.com',
    avatar: '',
  });

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { flags, loading: flagsLoading } = useFeatureFlags(['custom_agents', 'agent_marketplace']);
  const customAgentsEnabled = flags.custom_agents;
  const createNewAgentMutation = useCreateNewAgent();
  const [showNewAgentDialog, setShowNewAgentDialog] = useState(false);
  const { theme, setTheme } = useTheme();

  
  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();

      if (data.user) {
        setUser({
          name:
            data.user.user_metadata?.name ||
            data.user.email?.split('@')[0] ||
            'User',
          email: data.user.email || '',
          avatar: data.user.user_metadata?.avatar_url || '',
        });
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'b') {
        event.preventDefault();
        setOpen(!state.startsWith('expanded'));
        window.dispatchEvent(
          new CustomEvent('sidebar-left-toggled', {
            detail: { expanded: !state.startsWith('expanded') },
          }),
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, setOpen]);


  const handleCreateNewAgent = () => {
    createNewAgentMutation.mutate();
  };

  return (
    <Sidebar
      collapsible="icon"
      className="border-r-0 bg-background/95 backdrop-blur-sm [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
      {...props}
    >
      <SidebarHeader className="px-2 py-2">
        <div className="flex h-[40px] items-center px-1 relative">
          <Link href="/dashboard">
            <BrandLogo />
          </Link>
          {state !== 'collapsed' && (
            <div className="ml-2 transition-all duration-200 ease-in-out whitespace-nowrap">
            </div>
          )}
          <div className="ml-auto flex items-center gap-2">
            {state !== 'collapsed' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarTrigger className="h-8 w-8" />
                </TooltipTrigger>
                <TooltipContent>Alternar barra lateral (CMD+B)</TooltipContent>
              </Tooltip>
            )}
            {state !== 'collapsed' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                    className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent"
                    title="Alternar tema"
                    aria-label="Alternar tema"
                  >
                    <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Alternar tema</TooltipContent>
              </Tooltip>
            )}
            {isMobile && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setOpenMobile(true)}
                    className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent"
                  >
                    <Menu className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Abrir menu</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="[&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        <SidebarGroup>
          <Link href="/dashboard">
            <SidebarMenuButton 
              className={cn({
                'bg-accent text-accent-foreground font-medium': pathname === '/dashboard',
              })}
              data-tour="new-chat-button"
            >
              <Plus className="h-4 w-4 mr-1" />
              <span className="flex items-center justify-between w-full">
                Nova Tarefa
              </span>
            </SidebarMenuButton>
          </Link>
          {!flagsLoading && customAgentsEnabled && (
            <SidebarMenu>
              <Collapsible
                defaultOpen={pathname?.includes('/agents')}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip="Agents"
                    >
                      <Bot className="h-4 w-4 mr-1" />
                      <span>Agentes</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton className={cn('pl-3', {
                          'bg-accent text-accent-foreground font-medium': pathname === '/agents' && searchParams.get('tab') === 'marketplace',
                        })} asChild>
                          <Link href="/agents?tab=marketplace">
                            <span>Explorar</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton className={cn('pl-3', {
                          'bg-accent text-accent-foreground font-medium': pathname === '/agents' && (searchParams.get('tab') === 'my-agents' || searchParams.get('tab') === null),
                        })} asChild>
                          <Link href="/agents?tab=my-agents">
                            <span>Meus Agentes</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton 
                          onClick={() => setShowNewAgentDialog(true)}
                          className="cursor-pointer pl-3"
                        >
                          <span>Novo Agente</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          )}
          {!flagsLoading && customAgentsEnabled && (
            <>
              <Link href="/automations">
                <SidebarMenuButton className={cn({
                  'bg-accent text-accent-foreground font-medium': pathname === '/automations',
                })}>
                  <Zap className="h-4 w-4 mr-1" />
                  <span className="flex items-center justify-between w-full">
                    Automações
                  </span>
                </SidebarMenuButton>
              </Link>
              <Link href="/settings/credentials">
                <SidebarMenuButton className={cn({
                  'bg-accent text-accent-foreground font-medium': pathname === '/settings/credentials',
                })}>
                  <Plug className="h-4 w-4 mr-1" />
                  <span className="flex items-center justify-between w-full">
                    Credenciais
                  </span>
                </SidebarMenuButton>
              </Link>
            </>
          )}
        </SidebarGroup>
        
        {/* Agentes/Projetos anteriores */}
        <NavAgents />
        
        {/* Seção de Tarefas */}
        <NavTasks />
        
        {/* Seção de Automações */}
        <NavAutomations />
      </SidebarContent>
      <SidebarFooter>
        {state === 'collapsed' && (
          <div className="mt-2 flex justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarTrigger className="h-8 w-8" />
              </TooltipTrigger>
              <TooltipContent>Expandir barra lateral (CMD+B)</TooltipContent>
            </Tooltip>
          </div>
        )}
        <NavUserWithTeams user={user} />
      </SidebarFooter>
      <SidebarRail />
      <AlertDialog open={showNewAgentDialog} onOpenChange={setShowNewAgentDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Criar Novo Agente</AlertDialogTitle>
            <AlertDialogDescription>
              Isso criará um novo agente com nome e descrição padrão.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreateNewAgent}>Criar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sidebar>
  );
}
