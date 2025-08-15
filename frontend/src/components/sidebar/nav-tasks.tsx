'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  CheckCircle2, 
  Circle, 
  Clock,
  ChevronRight,
  Plus,
  Loader2,
  ListTodo
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

// Mock data - será substituído por dados reais
const mockTasks = [
  {
    id: '1',
    title: 'Revisar proposta comercial',
    project: 'Cliente ABC',
    status: 'pending',
    priority: 'high',
    dueDate: 'Hoje',
  },
  {
    id: '2',
    title: 'Atualizar documentação API',
    project: 'Sistema interno',
    status: 'in_progress',
    priority: 'medium',
    dueDate: 'Amanhã',
  },
  {
    id: '3',
    title: 'Call com equipe de vendas',
    project: 'Marketing',
    status: 'completed',
    priority: 'low',
    dueDate: 'Concluído',
  },
  {
    id: '4',
    title: 'Implementar nova feature',
    project: 'App Mobile',
    status: 'pending',
    priority: 'high',
    dueDate: 'Esta semana',
  },
  {
    id: '5',
    title: 'Teste de integração',
    project: 'Backend',
    status: 'pending',
    priority: 'medium',
    dueDate: 'Próxima semana',
  },
  {
    id: '6',
    title: 'Deploy em produção',
    project: 'DevOps',
    status: 'pending',
    priority: 'high',
    dueDate: 'Sexta-feira',
  },
];

interface NavTasksProps {
  className?: string;
}

export function NavTasks({ className }: NavTasksProps) {
  const { state } = useSidebar();
  const [isLoading, setIsLoading] = React.useState(false);
  const [showAll, setShowAll] = React.useState(false);
  
  const isCollapsed = state === 'collapsed';
  
  // TODO: Substituir por dados reais via React Query
  // Por enquanto usando mock data para demonstração
  const tasks = mockTasks;
  const displayedTasks = showAll ? tasks : tasks.slice(0, 5);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircle2;
      case 'in_progress':
        return Clock;
      default:
        return Circle;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-500 dark:text-red-400';
      case 'medium':
        return 'text-yellow-500 dark:text-yellow-400';
      case 'low':
        return 'text-green-500 dark:text-green-400';
      default:
        return 'text-muted-foreground';
    }
  };

  if (isCollapsed) {
    return (
      <SidebarGroup className={className}>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Tarefas"
              className="justify-center"
            >
              <Link href="/tasks">
                <ListTodo className="h-4 w-4" />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup className={className}>
      <div className="flex items-center justify-between mb-2">
        <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">
          Tarefas Recentes
        </SidebarGroupLabel>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-1.5 text-xs"
          asChild
        >
          <Link href="/tasks/new">
            <Plus className="h-3 w-3" />
          </Link>
        </Button>
      </div>
      
      <SidebarGroupContent>
        <SidebarMenu>
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 5 }).map((_, i) => (
              <SidebarMenuItem key={i}>
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-2 w-20" />
                  </div>
                </div>
              </SidebarMenuItem>
            ))
          ) : displayedTasks.length > 0 ? (
            <>
              {displayedTasks.map((task) => {
                const StatusIcon = getStatusIcon(task.status);
                return (
                  <SidebarMenuItem key={task.id}>
                    <SidebarMenuButton
                      asChild
                      className="w-full justify-start px-2 py-1.5 h-auto"
                    >
                      <Link href={`/tasks/${task.id}`}>
                        <div className="flex items-start gap-2 w-full">
                          <StatusIcon 
                            className={cn(
                              "mt-0.5 h-3.5 w-3.5",
                              task.status === 'completed' 
                                ? "text-green-500 dark:text-green-400" 
                                : getPriorityColor(task.priority)
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <span className={cn(
                                "text-xs font-medium truncate",
                                task.status === 'completed' && "line-through opacity-60"
                              )}>
                                {task.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[10px] text-muted-foreground truncate">
                                {task.project}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                • {task.dueDate}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="h-3 w-3 text-muted-foreground opacity-50" />
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              
              {tasks.length > 5 && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setShowAll(!showAll)}
                    className="w-full justify-center px-2 py-1 h-auto"
                  >
                    <span className="text-xs text-muted-foreground">
                      {showAll ? 'Mostrar menos' : `Ver mais ${tasks.length - 5}`}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </>
          ) : (
            <SidebarMenuItem>
              <div className="px-2 py-3 text-center">
                <p className="text-xs text-muted-foreground">
                  Nenhuma tarefa pendente
                </p>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs mt-1"
                  asChild
                >
                  <Link href="/tasks/new">
                    Criar nova tarefa
                  </Link>
                </Button>
              </div>
            </SidebarMenuItem>
          )}
          
          {/* Link para página de tarefas */}
          <SidebarMenuItem className="mt-2 pt-2 border-t">
            <SidebarMenuButton asChild>
              <Link href="/tasks" className="w-full justify-between">
                <span className="text-xs font-medium">Ver todas</span>
                <Badge variant="secondary" className="text-[10px] px-1 h-4">
                  {tasks.filter(t => t.status !== 'completed').length}
                </Badge>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}