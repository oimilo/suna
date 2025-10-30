'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
import { Plus, Zap, PlugZap } from 'lucide-react';

const TasksSkeleton = () => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base font-medium">Minhas tarefas</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center justify-between rounded-xl border p-4"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-4 w-14" />
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

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full rounded-xl border p-4 text-left transition-colors',
        isSelected ? 'border-primary bg-primary/5' : 'hover:border-primary/60 hover:bg-muted'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{trigger.name}</span>
            <Badge variant={trigger.is_active ? 'default' : 'secondary'} className="text-[10px]">
              {trigger.is_active ? 'Ativa' : 'Inativa'}
            </Badge>
          </div>
          {trigger.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {trigger.description}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Agente:&nbsp;
            <span className="font-medium text-foreground">
              {trigger.agent_name ?? 'Sem agente'}
            </span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
          <span className="capitalize">{trigger.trigger_type}</span>
          {isSchedule && trigger.config?.cron_expression && (
            <span>{trigger.config.cron_expression}</span>
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Tasks</h1>
          <p className="text-sm text-muted-foreground">
            Atalhos guiados para criar automações agendadas ou baseadas em eventos.
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova tarefa
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuItem onClick={() => setCreationType('schedule')} className="gap-3">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col">
                <span>Agendada</span>
                <span className="text-xs text-muted-foreground">Executa em horários definidos</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCreationType('event')} className="gap-3">
              <PlugZap className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col">
                <span>Por evento</span>
                <span className="text-xs text-muted-foreground">Dispara ao detectar integrações</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isLoading ? (
        <TasksSkeleton />
      ) : sortedTriggers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="rounded-full bg-muted p-4">
              <Zap className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Nenhuma tarefa configurada</h2>
              <p className="text-sm text-muted-foreground">
                Crie uma tarefa para automatizar execuções recorrentes.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base font-medium">
                {sortedTriggers.length} tarefa{sortedTriggers.length > 1 ? 's' : ''}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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
            <Card className="h-full border-dashed">
              <CardContent className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                <Zap className="h-6 w-6" />
                <p className="text-sm">Selecione uma tarefa para ver os detalhes.</p>
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

