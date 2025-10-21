'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  Clock,
  ExternalLink,
  Globe,
  Hash,
  MessageSquare,
  Pencil,
  Plus,
  Repeat,
  Trash2,
  Link2,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  TriggerWithAgent,
  useAllTriggers,
} from '@/hooks/react-query/triggers';
import {
  useDeleteTrigger,
  useToggleTrigger,
} from '@/hooks/react-query/triggers/use-agent-triggers';
import { TriggerEditModal } from '@/components/sidebar/trigger-edit-modal';
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
import { toast } from 'sonner';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  schedule: Repeat,
  scheduled: Repeat,
  telegram: MessageSquare,
  slack: MessageSquare,
  discord: Hash,
  webhook: Globe,
};

const TriggerListSkeleton = () => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base font-medium">Automações</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center justify-between gap-4 rounded-lg border p-3"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </CardContent>
  </Card>
);

const formatCron = (cron?: string) => {
  if (!cron) return 'Cron não configurado';
  return cron;
};

const TriggerListItem = ({
  trigger,
  isSelected,
  onSelect,
}: {
  trigger: TriggerWithAgent;
  isSelected: boolean;
  onSelect: () => void;
}) => {
  const Icon = iconMap[trigger.trigger_type?.toLowerCase()] ?? Globe;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full rounded-xl border p-4 text-left transition-all',
        isSelected
          ? 'border-primary bg-primary/5'
          : 'hover:border-primary/60 hover:bg-muted/60',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-muted p-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{trigger.name}</span>
            <Badge variant={trigger.is_active ? 'default' : 'secondary'} className="text-[10px]">
              {trigger.is_active ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Agente:&nbsp;
            <span className="font-medium">
              {trigger.agent_name ?? 'Sem agente'}
            </span>
          </p>
          {trigger.config?.cron_expression && (
            <p className="text-xs text-muted-foreground">
              <Clock className="mr-1 inline h-3 w-3" />
              {formatCron(trigger.config.cron_expression)}
            </p>
          )}
        </div>
      </div>
    </button>
  );
};

const TriggerDetail = ({
  trigger,
  onEdit,
  onToggle,
  onDelete,
  toggleLoading,
  deleteLoading,
}: {
  trigger: TriggerWithAgent;
  onEdit: () => void;
  onToggle: () => Promise<void>;
  onDelete: () => void;
  toggleLoading: boolean;
  deleteLoading: boolean;
}) => {
  const Icon = iconMap[trigger.trigger_type?.toLowerCase()] ?? Globe;

  return (
    <Card className="h-full">
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1 text-[11px]">
                <Icon className="h-3 w-3" />
                {trigger.trigger_type}
              </Badge>
              {trigger.webhook_url && (
              <Badge variant="secondary" className="gap-1 text-[11px]">
                  <Link2 className="h-3 w-3" />
                  Webhook
                </Badge>
              )}
            </div>
            <h2 className="mt-2 text-lg font-semibold">{trigger.name}</h2>
            {trigger.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {trigger.description}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <Switch
              checked={trigger.is_active}
              onCheckedChange={() => {
                onToggle().catch(() => undefined);
              }}
              disabled={toggleLoading}
            />
            <span className="text-xs text-muted-foreground">
              {trigger.is_active ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={onEdit}>
            <Pencil className="mr-2 h-3.5 w-3.5" />
            Editar
          </Button>
          <Button
            size="sm"
            variant="outline"
            asChild
          >
            <Link href="/agents">
              <Zap className="mr-2 h-3.5 w-3.5" />
              Gerenciar agentes
            </Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-destructive hover:bg-destructive/10"
            onClick={onDelete}
            disabled={deleteLoading}
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Excluir
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div>
          <h3 className="text-xs font-semibold uppercase text-muted-foreground">
            Agente
          </h3>
          <p className="mt-1 text-sm font-medium text-foreground">
            {trigger.agent_name ?? 'Sem agente'}
          </p>
          {trigger.agent_description && (
            <p className="text-xs text-muted-foreground">
              {trigger.agent_description}
            </p>
          )}
        </div>

        {trigger.config?.cron_expression && (
          <div>
            <h3 className="text-xs font-semibold uppercase text-muted-foreground">
              Agendamento
            </h3>
            <p className="mt-1 text-sm text-foreground">
              {formatCron(trigger.config.cron_expression)}
            </p>
            {trigger.config?.timezone && (
              <p className="text-xs text-muted-foreground">
                Fuso horário: {trigger.config.timezone}
              </p>
            )}
          </div>
        )}

        {trigger.config?.agent_prompt && (
          <div>
            <h3 className="text-xs font-semibold uppercase text-muted-foreground">
              Prompt do agente
            </h3>
            <p className="mt-1 whitespace-pre-wrap rounded-md border bg-muted/40 p-3 text-sm text-foreground">
              {trigger.config.agent_prompt}
            </p>
          </div>
        )}

        {trigger.webhook_url && (
          <div>
            <h3 className="text-xs font-semibold uppercase text-muted-foreground">
              Webhook
            </h3>
            <a
              href={trigger.webhook_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              {trigger.webhook_url}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export function TriggersPage() {
  const { data: triggers = [], isLoading, error } = useAllTriggers();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const toggleMutation = useToggleTrigger();
  const deleteMutation = useDeleteTrigger();

  const sortedTriggers = useMemo(
    () =>
      [...triggers].sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      ),
    [triggers],
  );

  const selectedTrigger =
    sortedTriggers.find((trigger) => trigger.trigger_id === selectedId) ??
    sortedTriggers[0] ??
    null;

  const handleToggle = async (trigger: TriggerWithAgent) => {
    try {
      await toggleMutation.mutateAsync({
        triggerId: trigger.trigger_id,
        isActive: !trigger.is_active,
      });
      toast.success(
        `Automação ${trigger.is_active ? 'desativada' : 'ativada'} com sucesso`,
      );
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao alternar automação');
    }
  };

  const handleDelete = async (trigger: TriggerWithAgent) => {
    try {
      await deleteMutation.mutateAsync({
        triggerId: trigger.trigger_id,
        agentId: trigger.agent_id,
      });
      toast.success('Automação removida com sucesso');
      setShowDeleteConfirm(false);
      if (selectedId === trigger.trigger_id) {
        setSelectedId(null);
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao remover automação');
    }
  };

  if (error) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Não foi possível carregar as automações. Tente recarregar a página.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10 space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Automações</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie todos os gatilhos agendados e baseados em eventos.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild>
            <Link href="/agents">
              <Plus className="mr-2 h-4 w-4" />
              Criar automação
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <TriggerListSkeleton />
      ) : sortedTriggers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="rounded-full bg-muted p-4">
              <Zap className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Nenhuma automação configurada</h2>
              <p className="text-sm text-muted-foreground">
                Crie um gatilho agendado para iniciar fluxos automaticamente.
              </p>
            </div>
            <Button asChild>
              <Link href="/agents">
                <Plus className="mr-2 h-4 w-4" />
                Criar automação
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base font-medium">
                {sortedTriggers.length} automação{sortedTriggers.length > 1 ? 's' : ''}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sortedTriggers.map((trigger) => (
                <TriggerListItem
                  key={trigger.trigger_id}
                  trigger={trigger}
                  isSelected={selectedTrigger?.trigger_id === trigger.trigger_id}
                  onSelect={() => setSelectedId(trigger.trigger_id)}
                />
              ))}
            </CardContent>
          </Card>
          {selectedTrigger ? (
            <TriggerDetail
              trigger={selectedTrigger}
              onEdit={() => setIsEditModalOpen(true)}
              onToggle={() => handleToggle(selectedTrigger)}
              onDelete={() => setShowDeleteConfirm(true)}
              toggleLoading={toggleMutation.isPending}
              deleteLoading={deleteMutation.isPending}
            />
          ) : (
            <Card className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Selecione uma automação para ver os detalhes.
            </Card>
          )}
        </div>
      )}

      {selectedTrigger && (
        <TriggerEditModal
          trigger={{
            ...selectedTrigger,
            provider_id: selectedTrigger.provider_id ?? selectedTrigger.trigger_type,
          }}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir automação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja excluir esta automação? Essa ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (selectedTrigger) {
                  void handleDelete(selectedTrigger);
                }
              }}
              disabled={deleteMutation.isPending}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
