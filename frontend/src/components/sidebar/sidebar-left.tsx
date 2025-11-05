'use client';

import * as React from 'react';
import Link from 'next/link';
import { Menu, Plus, Calendar, Bot, Zap, BookOpen, Plug } from 'lucide-react';
import { NavUserWithTeams } from '@/components/sidebar/nav-user-with-teams';
import { BrandLogo } from '@/components/sidebar/brand-logo';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NavThreads } from './nav-threads';

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

  const [activeTab, setActiveTab] = useState<'tarefas' | 'favoritos' | 'agendado'>('tarefas');
  const scheduledEmptyState = (
    <>
      <Calendar className="mx-auto mb-2 h-8 w-8 opacity-20" />
      <p>Nenhuma automação agendada</p>
      <p className="mt-1 text-xs text-muted-foreground">Automação iniciada por trigger aparece aqui</p>
    </>
  );
  const isCollapsed = state === 'collapsed';

  
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
  return (
    <Sidebar
      collapsible="icon"
      className="border-r-0 bg-background/95 backdrop-blur-sm [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
      {...props}
    >
      <SidebarHeader className={cn('px-2 py-2', isCollapsed && 'px-0 py-4')}>
        {isCollapsed ? (
          <div className="flex w-full flex-col items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarTrigger className="h-9 w-9 rounded-2xl border border-border/40 bg-background/80 shadow-sm backdrop-blur-sm hover:bg-accent hover:text-accent-foreground" />
              </TooltipTrigger>
              <TooltipContent>Expandir barra lateral (CMD+B)</TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <div className="relative flex h-[40px] items-center px-1">
            <Link href="/dashboard">
              <BrandLogo />
            </Link>
            <div className="ml-auto flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarTrigger className="h-8 w-8" />
                </TooltipTrigger>
                <TooltipContent>Alternar barra lateral (CMD+B)</TooltipContent>
              </Tooltip>
              {isMobile && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setOpenMobile(true)}
                      className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
                    >
                      <Menu className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Abrir menu</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent
        className={cn(
          '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:\'none\'] [scrollbar-width:\'none\']',
          isCollapsed && 'items-center gap-4 px-0 pt-2'
        )}
      >
        {!isCollapsed && (
          <div className="px-3 pb-4">
            <Link
              href="/dashboard"
              className="mb-4 flex h-10 items-center justify-between rounded-2xl border border-border/60 bg-background/90 px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <span className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nova tarefa
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                ⌘K
              </span>
            </Link>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="w-full">
              <TabsList className="grid w-full grid-cols-3 rounded-xl border border-border/60 bg-background/80 p-1 text-xs">
                <TabsTrigger value="tarefas">Tarefas</TabsTrigger>
                <TabsTrigger value="favoritos">Favoritos</TabsTrigger>
                <TabsTrigger value="agendado">Agendado</TabsTrigger>
              </TabsList>
              <TabsContent value="tarefas" className="mt-4 space-y-2">
                <NavThreads excludeTriggerThreads />
              </TabsContent>
              <TabsContent value="favoritos" className="mt-4 space-y-2">
                <NavThreads showOnlyFavorites excludeTriggerThreads />
              </TabsContent>
              <TabsContent value="agendado" className="mt-4 space-y-2">
                <NavThreads showOnlyTriggerThreads emptyState={scheduledEmptyState} />
              </TabsContent>
            </Tabs>

            <SidebarMenu className="mt-6 space-y-1">
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/agents" className="flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    <span>Agentes</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/automations" className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    <span>Automações</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/knowledge" className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    <span>Base de Conhecimento</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/settings/credentials" className="flex items-center gap-2">
                    <Plug className="h-4 w-4" />
                    <span>Credenciais</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>
        )}
      </SidebarContent>
      <SidebarFooter className={cn('mt-auto', isCollapsed && 'items-center gap-4 px-0 pb-4 pt-0')}>
        <NavUserWithTeams user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
