'use client';

import React, { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Separator } from '@/components/ui/separator';
import {
  Clock,
  Power,
  PowerOff,
  Pencil,
  Trash2,
  Link2,
  CalendarClock,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TriggerEditModal } from '@/components/sidebar/trigger-edit-modal';
import { useDeleteTrigger, useToggleTrigger } from '@/hooks/react-query/triggers';
import { TriggerWithAgent } from '@/hooks/react-query/triggers';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TaskDetailPanelProps {
  trigger: TriggerWithAgent;
  onClose: () => void;
}

const formatCron = (cron?: string) => {
  if (!cron) return 'Sem agendamento definido';
  return cron;
};

export function TaskDetailPanel({ trigger, onClose }: TaskDetailPanelProps) {
  const toggleMutation = useToggleTrigger();
  const deleteMutation = useDeleteTrigger();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const handleToggle = async () => {
    try {
      await toggleMutation.mutateAsync({
        triggerId: trigger.trigger_id,
        isActive: !trigger.is_active,
      });
      toast.success(trigger.is_active ? 'Tarefa desativada' : 'Tarefa ativada');
    } catch (error: any) {
      toast.error(error?.message ?? 'Não foi possível alternar a tarefa');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({
        triggerId: trigger.trigger_id,
        agentId: trigger.agent_id,
      });
      toast.success('Tarefa removida com sucesso');
      setShowDeleteDialog(false);
      onClose();
    } catch (error: any) {
      toast.error(error?.message ?? 'Não foi possível remover a tarefa');
    }
  };

  return (
    <div
      className={cn(
        'flex h-full flex-col overflow-hidden rounded-3xl border border-border/60 bg-background/95 shadow-xl backdrop-blur'
      )}
    >
      <div className="relative overflow-hidden border-b border-border/60 bg-gradient-to-r from-primary/10 via-background to-background">
        <div className="absolute inset-0 opacity-40" aria-hidden>
          <div className="size-[120%] translate-x-1/3 -translate-y-1/3 rotate-12 bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.18),_transparent_60%)]" />
        </div>
        <div className="relative flex items-start justify-between gap-4 px-6 py-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold tracking-tight text-foreground break-words">
                {trigger.name}
              </h2>
              <Badge variant={trigger.is_active ? 'success' : 'neutral'} className="rounded-full px-3 py-1 text-xs">
              {trigger.is_active ? 'Ativa' : 'Inativa'}
            </Badge>
          </div>
          {trigger.description && (
              <p className="max-w-xl text-sm text-muted-foreground/80 break-words">
                {trigger.description}
              </p>
          )}
        </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
          <X className="h-4 w-4" />
        </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="flex h-full flex-col divide-y divide-border overflow-y-auto">
          <section className="px-6 py-6">
            <h3 className="text-sm font-medium text-foreground/80">Ações rápidas</h3>
            <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
                variant={trigger.is_active ? 'secondary' : 'default'}
              onClick={handleToggle}
              disabled={toggleMutation.isPending}
                className="rounded-xl px-4"
            >
              {trigger.is_active ? (
                <>
                  <PowerOff className="mr-2 h-4 w-4" />
                  Desativar
                </>
              ) : (
                <>
                  <Power className="mr-2 h-4 w-4" />
                  Ativar
                </>
              )}
            </Button>

              <Button size="sm" variant="outline" onClick={() => setEditOpen(true)} className="rounded-xl px-4">
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>

            <Button
              size="sm"
              variant="outline"
                className="rounded-xl px-4 text-destructive hover:bg-destructive/10"
              onClick={() => setShowDeleteDialog(true)}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </Button>
            </div>
          </section>

          <section className="space-y-4 px-6 py-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 text-foreground/80">
              <Clock className="h-4 w-4" />
              <span>{formatCron(trigger.config?.cron_expression)}</span>
            </div>
            {trigger.config?.timezone && (
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4" />
                <span>Fuso horário: {trigger.config.timezone}</span>
              </div>
            )}
          </section>

          <section className="px-6 py-6 text-sm text-muted-foreground">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="font-medium text-foreground">{trigger.agent_name ?? 'Sem nome'}</p>
                {trigger.agent_description && (
                  <p className="text-xs text-muted-foreground/90 break-words">{trigger.agent_description}</p>
                )}
              </div>
              <Button variant="secondary" size="sm" asChild className="rounded-xl px-3">
                <Link href={`/agents/config/${trigger.agent_id}`}>
                  <Link2 className="mr-2 h-4 w-4" />
                  Abrir agente
                </Link>
              </Button>
            </div>
          </section>

          <section className="px-6 py-6 text-sm text-muted-foreground">
            <div className="grid gap-3">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs uppercase tracking-wide text-muted-foreground/70">Tipo</span>
                <span className="font-mono text-foreground break-words">{trigger.trigger_type}</span>
            </div>
            <Separator />
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs uppercase tracking-wide text-muted-foreground/70">Provider</span>
                <span className="font-mono text-foreground break-words">{trigger.provider_id ?? 'schedule'}</span>
            </div>
            {trigger.webhook_url && (
              <>
                <Separator />
                  <div className="flex flex-col gap-2">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground/70">Webhook</span>
                  <a
                    href={trigger.webhook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                      className="break-all font-mono text-primary hover:underline"
                  >
                    {trigger.webhook_url}
                  </a>
                </div>
              </>
            )}
            </div>
          </section>
        </div>
      </div>

      <TriggerEditModal
        trigger={trigger as any}
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover tarefa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover "{trigger.name}"? Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {(toggleMutation.isError || deleteMutation.isError) && (
        <div className="border-t border-border/60 bg-destructive/10 px-6 py-4">
          <Alert variant="destructive">
            <AlertDescription>
              Não foi possível atualizar a automação. Tente novamente.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}

