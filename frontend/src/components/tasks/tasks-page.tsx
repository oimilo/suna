'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { TriggerCreationDialog } from './trigger-creation-dialog';
import { TaskDetailPanel } from './task-detail-panel';
import { useAllTriggers, type TriggerWithAgent } from '@/hooks/react-query/triggers';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Plus, Zap, PlugZap, Calendar, Activity } from 'lucide-react';

const TasksSkeleton = () => (
  <Card className="overflow-hidden border-none bg-gradient-to-br from-muted/50 via-background to-background shadow-sm">
    <CardHeader className="pb-4">
      <CardTitle className="text-lg font-semibold text-foreground">Minhas automações</CardTitle>
      <p className="text-sm text-muted-foreground">
        Carregando automações configuradas...
      </p>
    </CardHeader>
    <CardContent className="space-y-3 pt-0">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/80 px-4 py-4"
        >
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </CardContent>
  </Card>
);

const TaskListItem = ({
  trigger,
  isSelected,
  onSelect,
}: {
  trigger: TriggerWithAgent;
  isSelected: boolean;
  onSelect: () => void;
}) => {
  const isSchedule = trigger.trigger_type?.toLowerCase() === 'schedule';
  const Icon = isSchedule ? Calendar : Zap;
  const lastUpdated = trigger.updated_at
    ? formatDistanceToNow(new Date(trigger.updated_at), { locale: ptBR, addSuffix: true })
    : null;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group w-full overflow-hidden rounded-2xl border border-border/60 bg-background px-4 py-4 text-left shadow-sm transition-all duration-200',
        isSelected
          ? 'border-primary/60 ring-2 ring-primary/20'
          : 'hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-1 items-start gap-3">
          <Avatar className="size-10 rounded-xl border border-border/80 bg-muted text-muted-foreground">
            <AvatarFallback className="bg-transparent">
              <Icon className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-sm font-semibold text-foreground">
                {trigger.name}
              </span>
              <Badge
                variant={trigger.is_active ? 'success' : 'neutral'}
                className="rounded-full px-2 py-0 text-[10px] font-semibold uppercase tracking-wide"
              >
                {trigger.is_active ? 'Ativa' : 'Inativa'}
              </Badge>
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground/80">
                {trigger.provider_id ?? (isSchedule ? 'Schedule' : 'Webhook')}
              </span>
            </div>
            {trigger.description && (
              <p className="line-clamp-2 text-xs text-muted-foreground/90">
                {trigger.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                {trigger.agent_name ?? 'Sem agente'}
              </span>
              {lastUpdated && <span>Atualizada {lastUpdated}</span>}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
          <span className="rounded-lg bg-muted px-2 py-1 font-medium capitalize tracking-wide text-foreground/80">
            {trigger.trigger_type}
          </span>
          {isSchedule && trigger.config?.cron_expression && (
            <span className="font-mono text-[11px] text-muted-foreground/70">
              {trigger.config.cron_expression}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export function TasksPage() {
  const { data: triggers = [], isLoading, error } = useAllTriggers();
  const [selectedTriggerId, setSelectedTriggerId] = useState<string | null>(null);
  const [creationType, setCreationType] = useState<'schedule' | 'event' | null>(null);
  const [pendingTriggerId, setPendingTriggerId] = useState<string | null>(null);

  const sortedTriggers = useMemo(() => {
    return [...triggers].sort((a, b) => {
      if (a.is_active !== b.is_active) {
        return a.is_active ? -1 : 1;
      }
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  }, [triggers]);

  useEffect(() => {
    if (pendingTriggerId) {
      const fresh = sortedTriggers.find((t) => t.trigger_id === pendingTriggerId);
      if (fresh) {
        setSelectedTriggerId(fresh.trigger_id);
        setPendingTriggerId(null);
      }
    }
  }, [pendingTriggerId, sortedTriggers]);

  const selectedTrigger = useMemo(() => {
    if (!selectedTriggerId) return null;
    return sortedTriggers.find((trigger) => trigger.trigger_id === selectedTriggerId) ?? null;
  }, [selectedTriggerId, sortedTriggers]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Não foi possível carregar as tarefas. Tente novamente em instantes.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-10">
      <div className="overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-background via-background to-muted/40 p-[1px] shadow-lg">
        <div className="flex flex-col gap-6 rounded-[28px] bg-background/95 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
              Automations
            </p>
            <h1 className="text-3xl font-semibold text-foreground">Central de automações do Prophet</h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Veja, edite e monitore todas as rotinas criadas pelo agente. Agendamentos e webhooks ficam reunidos aqui,
              com estado em tempo real e atalhos rápidos para ajustes.
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="lg" className="h-12 gap-2 rounded-2xl px-6 shadow-sm">
                <Plus className="h-4 w-4" />
                Nova automação
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2">
              <DropdownMenuItem onClick={() => setCreationType('schedule')} className="gap-3 rounded-xl px-3 py-3">
                <Calendar className="h-4 w-4 text-primary" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">Agendada</span>
                  <span className="text-xs text-muted-foreground">Configure horários, frequências e fusos personalizados.</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCreationType('event')} className="gap-3 rounded-xl px-3 py-3">
                <PlugZap className="h-4 w-4 text-primary" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">Por evento</span>
                  <span className="text-xs text-muted-foreground">Dispare automações com integrações e webhooks.</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isLoading ? (
        <TasksSkeleton />
      ) : sortedTriggers.length === 0 ? (
        <Card className="overflow-hidden border-none bg-gradient-to-br from-muted/70 via-background to-background shadow-sm">
          <CardContent className="flex flex-col items-center gap-6 py-20 text-center">
            <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-6">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">Nenhuma automação configurada</h2>
              <p className="text-sm text-muted-foreground">
                Crie uma rotina para executar tarefas recorrentes ou disparar ações a partir de integrações.
              </p>
            </div>
            <Button onClick={() => setCreationType('schedule')} className="gap-2">
              <Plus className="h-4 w-4" />
              Começar agora
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <Card className="h-full overflow-hidden border-none bg-gradient-to-b from-background to-muted/30 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-foreground">
                {sortedTriggers.length} automação{sortedTriggers.length > 1 ? 'es' : ''}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Prioridade para as automações ativas e mais recentes.
              </p>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {sortedTriggers.map((trigger) => (
                <TaskListItem
                  key={trigger.trigger_id}
                  trigger={trigger}
                  isSelected={selectedTrigger?.trigger_id === trigger.trigger_id}
                  onSelect={() => {
                    setSelectedTriggerId((current) =>
                      current === trigger.trigger_id ? null : trigger.trigger_id,
                    );
                  }}
                />
              ))}
            </CardContent>
          </Card>

          {selectedTrigger ? (
            <TaskDetailPanel
              trigger={selectedTrigger}
              onClose={() => setSelectedTriggerId(null)}
            />
          ) : (
            <Card className="h-full border border-dashed border-border/60 bg-background/90">
              <CardContent className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                <Zap className="h-6 w-6" />
                <p className="text-sm">Selecione uma automação para visualizar detalhes, configurações e histórico.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {creationType && (
        <TriggerCreationDialog
          open={creationType !== null}
          type={creationType}
          onOpenChange={(open) => {
            if (!open) {
              setCreationType(null);
            }
          }}
          onTriggerCreated={(triggerId) => {
            if (triggerId) {
              setPendingTriggerId(triggerId);
            }
            setCreationType(null);
          }}
        />
      )}
    </div>
  );
}

