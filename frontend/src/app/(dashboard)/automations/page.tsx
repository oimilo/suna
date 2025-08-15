'use client';

import { useState } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn, staggerContainer } from '@/lib/animations';
import { 
  Zap, 
  Search, 
  TrendingUp,
  Lightbulb,
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
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useAllTriggers, useTriggerStats, useToggleTrigger } from '@/hooks/react-query/triggers/use-all-triggers';
import { AutomationCard } from '@/components/automations/automation-card';
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

export default function AutomationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);
  const [isRotating, setIsRotating] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  // Fetch data
  const { data: triggersData, isLoading: isLoadingTriggers } = useAllTriggers({
    page,
    per_page: 12,
    trigger_type: filterType !== 'all' ? filterType : undefined,
    is_active: filterStatus === 'active' ? true : filterStatus === 'inactive' ? false : undefined,
    agent_id: undefined,
    search: searchQuery,
    sort_by: sortBy,
    sort_order: sortOrder,
  });

  const { data: statsData } = useTriggerStats();
  const toggleTriggerMutation = useToggleTrigger();

  const handleEditTrigger = (trigger: any) => {
    // TODO: Navigate to agent configuration
    console.log('Edit trigger:', trigger);
  };

  const rotateSuggestion = () => {
    setIsRotating(true);
    setTimeout(() => {
      setCurrentSuggestionIndex((prev) => (prev + 1) % AUTOMATION_SUGGESTIONS.length);
      setIsRotating(false);
    }, 300);
  };

  const handleToggleTrigger = async (triggerId: string) => {
    await toggleTriggerMutation.mutateAsync(triggerId);
  };

  return (
    <div className="container mx-auto max-w-7xl px-6 py-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-1">
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
          </div>
        </div>

        {/* Stats Cards */}
        {statsData && (
          <AutomationStats stats={statsData} />
        )}

        {/* Filters and Search */}
        <div className="p-4 rounded-lg border bg-card">
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
          <div className="flex flex-col items-center justify-center h-[400px] text-center space-y-8">
            {/* Ícone e título */}
            <div className="space-y-4">
              <div className="p-4 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-sm">
                <Zap className="h-8 w-8 text-primary/60" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Nenhuma automação encontrada</h3>
                <p className="text-sm text-muted-foreground">
                  Suas automações aparecerão aqui após serem criadas
                </p>
              </div>
            </div>
            
            {/* Card de dica */}
            <div className="relative max-w-xl w-full">
              <div className="rounded-xl border border-border/50 bg-gradient-to-b from-muted/30 to-muted/10 backdrop-blur-sm p-6 shadow-sm">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <Lightbulb className="h-4 w-4 text-primary/70" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-foreground mb-1">Dica</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      As automações são criadas conversando com qualquer agente em linguagem natural.
                    </p>
                  </div>
                </div>
                
                <div className="relative rounded-lg bg-background/50 border border-border/30 p-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <span className="text-xs text-muted-foreground font-medium block text-center">
                        Exemplos de comando que o Prophet entende:
                      </span>
                      <button
                        onClick={rotateSuggestion}
                        className="absolute right-0 top-0 group p-1 rounded-md hover:bg-muted/50 transition-all duration-200"
                        title="Próxima sugestão"
                      >
                        <RefreshCw className={cn(
                          "h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-foreground/70 transition-colors",
                          isRotating && "animate-spin"
                        )} />
                      </button>
                    </div>
                    <p className={cn(
                      "text-sm text-foreground/90 italic leading-relaxed transition-all duration-300 text-center",
                      isRotating ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0"
                    )}>
                      "{AUTOMATION_SUGGESTIONS[currentSuggestionIndex]}"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

    </div>
  );
}