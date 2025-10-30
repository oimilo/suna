'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div className={cn('flex h-full flex-col border-l bg-background')}> 
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-foreground">{trigger.name}</h2>
            <Badge variant={trigger.is_active ? 'default' : 'secondary'}>
              {trigger.is_active ? 'Ativa' : 'Inativa'}
            </Badge>
          </div>
          {trigger.description && (
            <p className="text-sm text-muted-foreground">{trigger.description}</p>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Ações rápidas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={trigger.is_active ? 'outline' : 'default'}
              onClick={handleToggle}
              disabled={toggleMutation.isPending}
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

            <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:bg-destructive/10"
              onClick={() => setShowDeleteDialog(true)}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Detalhes do agendamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{formatCron(trigger.config?.cron_expression)}</span>
            </div>
            {trigger.config?.timezone && (
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4" />
                <span>Fuso horário: {trigger.config.timezone}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Agente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">{trigger.agent_name ?? 'Sem nome'}</p>
                {trigger.agent_description && (
                  <p className="text-xs text-muted-foreground">{trigger.agent_description}</p>
                )}
              </div>
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/agents/config/${trigger.agent_id}`}>
                  <Link2 className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Detalhes técnicos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Tipo</span>
              <span className="font-mono text-foreground">{trigger.trigger_type}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span>Provider</span>
              <span className="font-mono text-foreground">{trigger.provider_id ?? 'schedule'}</span>
            </div>
            {trigger.webhook_url && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <span>Webhook</span>
                  <a
                    href={trigger.webhook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-primary hover:underline"
                  >
                    {trigger.webhook_url}
                  </a>
                </div>
              </>
            )}
          </CardContent>
        </Card>
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
        <div className="px-6 pb-4">
          <Alert variant="destructive">
            <AlertDescription>
              Não foi possível atualizar a tarefa. Tente novamente.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}

