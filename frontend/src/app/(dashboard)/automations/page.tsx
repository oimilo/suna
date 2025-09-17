'use client';

import React, { useState } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn, staggerContainer } from '@/lib/animations';
import { 
  Search, 
  TrendingUp,
  Lightbulb,
  Workflow,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useAllTriggers, useTriggerStats, useToggleTrigger } from '@/hooks/react-query/triggers/use-all-triggers';
import { TriggerCard } from '@/components/automations/trigger-card';
import { AutomationStats } from '@/components/automations/automation-stats';

const AUTOMATION_SUGGESTIONS = [
  "Monitore pushs no meu GitHub e envie no meu email todo dia às 6h",
  "Poste no Discord todo movimento de cards do meu quadro do Trello",
  "Me avise no WhatsApp sempre que o Shopify concluir uma compra",
  "Crie tarefas no Notion quando receber emails importantes",
  "Faça backup dos meus repositórios toda sexta-feira",
  "Me lembre de revisar PRs abertas às 14h",
  "Sincronize meu Google Calendar com o Slack",
  "Envie relatório semanal de vendas para o time",
  "Monitore menções da marca no Twitter",
  "Archive emails antigos automaticamente",
  "Crie issues no GitHub de mensagens do Discord",
  "Atualize planilha com dados do banco toda manhã",
  "Me avise quando o servidor ficar offline",
  "Publique no Instagram stories novos posts do blog",
  "Compile métricas de performance diariamente",
  "Envie boas-vindas para novos usuários",
  "Faça scraping de preços dos concorrentes",
  "Gere relatórios de bugs semanalmente",
  "Sincronize dados entre APIs diferentes",
  "Me notifique sobre deploys em produção"
];

import { TriggerEditModal } from '@/components/sidebar/trigger-edit-modal';

export default function AutomationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrigger, setSelectedTrigger] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);
  const [isRotating, setIsRotating] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  // Fetch data
  const { data: triggersData, isLoading: isLoadingTriggers } = useAllTriggers({
    page,
    per_page: 12,
    trigger_type: undefined,
    is_active: filterStatus === 'active' ? true : filterStatus === 'inactive' ? false : undefined,
    agent_id: undefined,
    search: searchQuery,
    sort_by: sortBy,
    sort_order: sortOrder,
  });

  const { data: statsData } = useTriggerStats();
  const toggleTriggerMutation = useToggleTrigger();

  const handleEditTrigger = (trigger: any) => {
    setSelectedTrigger(trigger);
    setIsEditModalOpen(true);
  };

  const rotateSuggestion = (direction: 'next' | 'prev' = 'next') => {
    setIsRotating(true);
    setTimeout(() => {
      setCurrentSuggestionIndex((prev) => {
        if (direction === 'next') {
          return (prev + 1) % AUTOMATION_SUGGESTIONS.length;
        } else {
          return prev === 0 ? AUTOMATION_SUGGESTIONS.length - 1 : prev - 1;
        }
      });
      setIsRotating(false);
    }, 200);
  };

  const handleToggleTrigger = async (triggerId: string) => {
    await toggleTriggerMutation.mutateAsync(triggerId);
  };

  const handleDeleteTrigger = (trigger: any) => {
    // TODO: Implementar exclusão de trigger
    console.log('Delete trigger:', trigger);
  };

  return (
    <div className="container mx-auto max-w-7xl px-6 py-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                <Workflow className="h-5 w-5 opacity-60" />
                Automações
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Gerencie todas as suas automações e triggers em um só lugar
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {statsData && (
          <AutomationStats stats={statsData} />
        )}

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-60" />
            <Input
              placeholder="Buscar automações..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9 bg-black/[0.02] dark:bg-white/[0.03] border-black/6 dark:border-white/8 focus:border-black/10 dark:focus:border-white/12"
            />
          </div>
          
          {/* Filter Pills */}
          <div className="flex gap-2">
            {/* Status Filter */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-9 w-auto gap-2 bg-black/[0.02] dark:bg-white/[0.03] border-black/6 dark:border-white/8 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors">
                <span className="text-xs text-muted-foreground">Status:</span>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-9 gap-1.5 bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                >
                  <TrendingUp className={cn(
                    "h-3.5 w-3.5 opacity-60",
                    sortOrder === 'desc' && "rotate-180"
                  )} />
                  <span className="text-xs">
                    {sortBy === 'created_at' && 'Data de criação'}
                    {sortBy === 'updated_at' && 'Última atualização'}
                    {sortBy === 'name' && 'Nome'}
                    {sortBy === 'execution_count' && 'Execuções'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem 
                  onClick={() => { setSortBy('created_at'); setSortOrder('desc'); }}
                  className={cn(sortBy === 'created_at' && "bg-black/5 dark:bg-white/5")}
                >
                  <span className="text-sm">Data de criação</span>
                  {sortBy === 'created_at' && (
                    <TrendingUp className={cn(
                      "ml-auto h-3 w-3 opacity-60",
                      sortOrder === 'desc' && "rotate-180"
                    )} />
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => { setSortBy('updated_at'); setSortOrder('desc'); }}
                  className={cn(sortBy === 'updated_at' && "bg-black/5 dark:bg-white/5")}
                >
                  <span className="text-sm">Última atualização</span>
                  {sortBy === 'updated_at' && (
                    <TrendingUp className={cn(
                      "ml-auto h-3 w-3 opacity-60",
                      sortOrder === 'desc' && "rotate-180"
                    )} />
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => { setSortBy('name'); setSortOrder('asc'); }}
                  className={cn(sortBy === 'name' && "bg-black/5 dark:bg-white/5")}
                >
                  <span className="text-sm">Nome</span>
                  {sortBy === 'name' && (
                    <TrendingUp className={cn(
                      "ml-auto h-3 w-3 opacity-60",
                      sortOrder === 'desc' && "rotate-180"
                    )} />
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => { setSortBy('execution_count'); setSortOrder('desc'); }}
                  className={cn(sortBy === 'execution_count' && "bg-black/5 dark:bg-white/5")}
                >
                  <span className="text-sm">Execuções</span>
                  {sortBy === 'execution_count' && (
                    <TrendingUp className={cn(
                      "ml-auto h-3 w-3 opacity-60",
                      sortOrder === 'desc' && "rotate-180"
                    )} />
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Automations Grid */}
        <div className="space-y-6">
          {isLoadingTriggers ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="h-[200px]">
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-20" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : triggersData?.triggers && triggersData.triggers.length > 0 ? (
          <>
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              <AnimatePresence mode="popLayout">
                {triggersData.triggers.map((trigger, index) => (
                  <motion.div
                    key={trigger.trigger_id}
                    variants={fadeIn}
                    layout
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    custom={index}
                  >
                    <TriggerCard
                      trigger={trigger}
                      onEdit={() => handleEditTrigger(trigger)}
                      onToggle={() => handleToggleTrigger(trigger.trigger_id)}
                      onDelete={() => handleDeleteTrigger(trigger)}
                      isToggling={toggleTriggerMutation.isPending}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Pagination */}
            {triggersData.has_more && (
              <div className="mt-8 flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => setPage(page + 1)}
                  className="gap-2"
                >
                  Carregar mais
                  <TrendingUp className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[500px] py-12">
            {/* Ícone principal */}
            <div className="mb-6">
              <div className="w-14 h-14 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8 flex items-center justify-center">
                <Workflow className="h-6 w-6 opacity-50" />
              </div>
            </div>

            {/* Título e descrição */}
            <div className="text-center space-y-2 mb-10 max-w-sm">
              <h3 className="text-lg font-semibold">Nenhuma automação encontrada</h3>
              <p className="text-sm text-muted-foreground/70">
                Suas automações aparecerão aqui após serem criadas
              </p>
            </div>
            
            {/* Card de dica interativo */}
            <div className="relative max-w-lg w-full px-4">
              <div className="rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8 p-5">
                {/* Header simples */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1 rounded bg-black/[0.04] dark:bg-white/[0.06]">
                    <Lightbulb className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Dica</span>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  As automações são criadas conversando com qualquer agente em linguagem natural.
                </p>

                <div className="border-t border-black/6 dark:border-white/8 pt-4">
                  {/* Box de exemplo */}
                  <div className="rounded-lg bg-black/[0.01] dark:bg-white/[0.02] border border-black/4 dark:border-white/6 p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground/80 uppercase tracking-wider font-medium">
                          Exemplo de comando
                        </span>
                        <button
                          onClick={() => rotateSuggestion('next')}
                          className="p-1 rounded-md hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-all duration-200"
                          title="Próximo exemplo"
                        >
                          <RefreshCw className={cn(
                            "h-3 w-3 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity",
                            isRotating && "animate-spin"
                          )} />
                        </button>
                      </div>
                      
                      <div className="min-h-[2.5rem] flex items-center">
                        <p className={cn(
                          "text-sm text-foreground/70 italic leading-relaxed transition-all duration-300",
                          isRotating ? "opacity-0 translate-x-2" : "opacity-100 translate-x-0"
                        )}>
                          "{AUTOMATION_SUGGESTIONS[currentSuggestionIndex]}"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Modal de edição do trigger */}
      {selectedTrigger && (
        <TriggerEditModal
          trigger={selectedTrigger}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedTrigger(null);
          }}
        />
      )}
    </div>
  );
}