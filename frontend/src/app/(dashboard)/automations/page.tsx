'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn, staggerContainer } from '@/lib/animations';
import { 
  Zap, 
  Plus, 
  Filter, 
  Search, 
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Calendar,
  Bot
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useAllTriggers, useTriggerStats, useToggleTrigger } from '@/hooks/react-query/triggers/use-all-triggers';
import { AutomationCard } from '@/components/automations/automation-card';
import { AutomationStats } from '@/components/automations/automation-stats';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AgentTriggersConfiguration } from '@/components/agents/triggers/agent-triggers-configuration';

export default function AutomationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAgent, setFilterAgent] = useState<string>('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [selectedTrigger, setSelectedTrigger] = useState<any>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Fetch data
  const { data: triggersData, isLoading: isLoadingTriggers } = useAllTriggers({
    page,
    per_page: 12,
    trigger_type: filterType !== 'all' ? filterType : undefined,
    is_active: filterStatus === 'active' ? true : filterStatus === 'inactive' ? false : undefined,
    agent_id: filterAgent !== 'all' ? filterAgent : undefined,
    search: searchQuery,
    sort_by: sortBy,
    sort_order: sortOrder,
  });

  const { data: statsData, isLoading: isLoadingStats } = useTriggerStats();
  const toggleTriggerMutation = useToggleTrigger();

  const handleCreateNew = () => {
    // TODO: Open create new automation modal
    setIsConfigOpen(true);
  };

  const handleEditTrigger = (trigger: any) => {
    setSelectedTrigger(trigger);
    setIsConfigOpen(true);
  };

  const handleToggleTrigger = async (triggerId: string) => {
    await toggleTriggerMutation.mutateAsync(triggerId);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Zap className="h-6 w-6 text-primary" />
                Automações
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Gerencie todas as suas automações e triggers em um só lugar
              </p>
            </div>
            <Button onClick={handleCreateNew} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Automação
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {statsData && (
        <div className="px-6 py-4 border-b">
          <AutomationStats stats={statsData} />
        </div>
      )}

      {/* Filters and Search */}
      <div className="px-6 py-4 border-b bg-muted/30">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar automações..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="schedule">Agendamento</SelectItem>
                <SelectItem value="webhook">Webhook</SelectItem>
                <SelectItem value="telegram">Telegram</SelectItem>
                <SelectItem value="slack">Slack</SelectItem>
                <SelectItem value="discord">Discord</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Data de criação</SelectItem>
                <SelectItem value="updated_at">Última atualização</SelectItem>
                <SelectItem value="name">Nome</SelectItem>
                <SelectItem value="execution_count">Execuções</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              <TrendingUp className={cn(
                "h-4 w-4 transition-transform",
                sortOrder === 'desc' && "rotate-180"
              )} />
            </Button>
          </div>
        </div>
      </div>

      {/* Automations Grid */}
      <div className="flex-1 overflow-auto p-6">
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
                    <AutomationCard
                      trigger={trigger}
                      onEdit={() => handleEditTrigger(trigger)}
                      onToggle={() => handleToggleTrigger(trigger.trigger_id)}
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
          <div className="flex flex-col items-center justify-center h-[400px] text-center">
            <div className="p-4 rounded-full bg-muted mb-4">
              <Zap className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhuma automação encontrada</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md">
              Crie sua primeira automação para começar a automatizar tarefas e processos
            </p>
            <Button onClick={handleCreateNew} className="gap-2">
              <Plus className="h-4 w-4" />
              Criar primeira automação
            </Button>
          </div>
        )}
      </div>

      {/* Configuration Modal */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTrigger 
                ? `Configurar: ${selectedTrigger.name}`
                : 'Nova Automação'
              }
            </DialogTitle>
          </DialogHeader>
          {selectedTrigger && (
            <div className="mt-4">
              <AgentTriggersConfiguration agentId={selectedTrigger.agent_id} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}