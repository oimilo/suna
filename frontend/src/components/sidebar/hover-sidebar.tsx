'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Plus, PanelLeft, Command, Calendar, Clock, Zap, Bot, Trash2 } from 'lucide-react';
import { NavUserHover } from './nav-user-hover';
import { NavThreads } from './nav-threads';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSidebarContext } from '@/contexts/sidebar-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAllUserTriggers } from '@/hooks/react-query/triggers/use-all-user-triggers';
import { TriggerEditModal } from './trigger-edit-modal';
import { useToggleTrigger, useDeleteTrigger } from '@/hooks/react-query/triggers/use-agent-triggers';
import { toast } from 'sonner';
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
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Componente para mostrar triggers agendados
function ScheduledTriggersList() {
  // Usar apenas o hook direto do Supabase
  const { data: triggers, isLoading, refetch } = useAllUserTriggers();
  const [selectedTrigger, setSelectedTrigger] = React.useState<any>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [triggerToDelete, setTriggerToDelete] = React.useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  
  const toggleTriggerMutation = useToggleTrigger();
  const deleteTriggerMutation = useDeleteTrigger();
  
  // Dados para compatibilidade com o código existente
  const data = triggers ? { triggers } : null;
  
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTrigger(null);
    refetch(); // Atualizar lista após edição
  };
  
  const handleToggle = async (e: React.MouseEvent, trigger: any) => {
    e.stopPropagation();
    try {
      await toggleTriggerMutation.mutateAsync({
        triggerId: trigger.trigger_id,
        isActive: !trigger.is_active
      });
      toast.success(
        trigger.is_active ? 'Automação desativada' : 'Automação ativada'
      );
      refetch();
    } catch (error) {
      toast.error('Erro ao alterar status da automação');
    }
  };
  
  const handleDeleteClick = (e: React.MouseEvent, trigger: any) => {
    e.stopPropagation();
    setTriggerToDelete(trigger);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!triggerToDelete) return;
    
    try {
      await deleteTriggerMutation.mutateAsync({
        triggerId: triggerToDelete.trigger_id,
        agentId: triggerToDelete.agent_id
      });
      toast.success('Automação excluída com sucesso');
      setIsDeleteDialogOpen(false);
      setTriggerToDelete(null);
      refetch();
    } catch (error) {
      toast.error('Erro ao excluir automação');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2 px-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-start gap-2 py-1.5">
            <div className="w-7 h-7 rounded-md bg-black/[0.02] dark:bg-white/[0.03] animate-pulse" />
            <div className="flex-1 space-y-1">
              <div className="h-4 bg-black/[0.02] dark:bg-white/[0.03] rounded animate-pulse w-3/4" />
              <div className="h-3 bg-black/[0.02] dark:bg-white/[0.03] rounded animate-pulse w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Filtrar apenas triggers ativos
  const activeTriggers = (data?.triggers || []).filter(t => t.is_active);

  if (activeTriggers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm px-3">
        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-20" />
        <p>Nenhuma automação agendada</p>
        <p className="text-xs mt-1">Configure automações para agendar tarefas</p>
      </div>
    );
  }

  // Função para determinar o ícone do trigger
  const getTriggerIcon = (trigger: any) => {
    // Verifica se é um agendamento por várias condições
    if (trigger.trigger_type === 'schedule' || 
        trigger.config?.schedule || 
        trigger.config?.cron ||
        trigger.name?.toLowerCase().includes('agend')) {
      return Clock;
    }
    if (trigger.trigger_type === 'webhook') {
      return Zap;
    }
    return Bot;
  };

  return (
    <div className="space-y-1">
      {activeTriggers.map((trigger) => {
        const Icon = getTriggerIcon(trigger);
        
        return (
          <div
            key={trigger.trigger_id}
            className="group relative flex items-start gap-2 px-2 py-2 rounded-lg transition-all duration-200 bg-black/[0.01] dark:bg-white/[0.02] hover:bg-black/[0.03] dark:hover:bg-white/[0.04] border border-black/4 dark:border-white/6 cursor-pointer"
            onClick={() => {
              setSelectedTrigger(trigger);
              setIsModalOpen(true);
            }}
          >
            {/* Ícone do trigger */}
            <div className="shrink-0 w-7 h-7 rounded-md bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8 flex items-center justify-center">
              <Icon className="h-3.5 w-3.5 opacity-60" />
            </div>

            {/* Conteúdo e ações */}
            <div className="flex-1 min-w-0">
              {/* Nome do trigger */}
              <h4 className="text-sm font-medium truncate leading-tight">
                {trigger.name || 'Automação sem nome'}
              </h4>
              
              {/* Segunda linha com detalhes e ações */}
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">
                  {(trigger as any).agent?.name || (trigger as any).agents?.name || 'Agente'}
                  {trigger.config?.schedule && ` • ${trigger.config.schedule}`}
                </p>
                
                {/* Ações */}
                <div className="flex items-center gap-1">
                  {/* Switch de ativar/desativar */}
                  <Switch
                    checked={trigger.is_active}
                    onCheckedChange={() => handleToggle({ stopPropagation: () => {} } as any, trigger)}
                    className="scale-75 data-[state=checked]:bg-emerald-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                  
                  {/* Botão de deletar no hover */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10 text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
                    onClick={(e) => handleDeleteClick(e, trigger)}
                  >
                    <Trash2 className="h-3 w-3 opacity-60" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      
      {/* Modal de edição de trigger */}
      {selectedTrigger && (
        <TriggerEditModal
          trigger={selectedTrigger}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
      
      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir automação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a automação "{triggerToDelete?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function HoverSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isHovered, setIsHovered] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('todos');
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
      {/* Header com ícone e logo - esconde na página de chat e na página de config de agentes */}
      {!pathname.includes('/thread/') && !pathname.includes('/agents/config/') && (
        <div className="fixed top-0 left-0 z-[100] h-14 flex items-center px-4 bg-transparent w-full">
          {/* Ícone de painel sempre visível */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePin}
                onMouseEnter={handleMouseEnter}
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

      {/* Área invisível para detectar hover na lateral - apenas metade superior */}
      {!isPinned && (
        <div
          className="fixed left-0 top-0 h-[50vh] w-12 z-[99]"
          onMouseEnter={handleMouseEnter}
        />
      )}

      {/* Sidebar expandida - flutuante sobre TODO o conteúdo */}
      <aside
        className={cn(
          "fixed z-[110] bg-background transition-all duration-200",
          "border-r border-black/6 dark:border-white/8",
          isPinned ? (
            "left-0 top-0 w-64 h-full"
          ) : (
            isExpanded ? "left-3 top-3 w-64 h-[calc(100vh-1.5rem)] shadow-2xl rounded-lg border border-black/6 dark:border-white/8" : "left-0 top-0 w-0 h-0 overflow-hidden pointer-events-none"
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
                  value="todos" 
                  className="data-[state=active]:bg-background data-[state=active]:border data-[state=active]:border-black/6 dark:data-[state=active]:border-white/8 text-xs transition-all duration-200"
                >
                  Todos
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

              <TabsContent value="todos" className="mt-4 space-y-2">
                <NavThreads />
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