'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowRight, Clock, PlugZap } from 'lucide-react';
import { useAgents } from '@/hooks/react-query/agents/use-agents';
import { useTriggerProviders } from '@/hooks/react-query/triggers';
import { TriggerProvider, TriggerConfiguration, ScheduleTriggerConfig } from '@/components/agents/triggers/types';
import { TriggerConfigDialog } from '@/components/agents/triggers/trigger-config-dialog';
import { useCreateTrigger } from '@/hooks/react-query/triggers';
import { toast } from 'sonner';
import { EventBasedTriggerDialog } from '@/components/agents/triggers/event-based-trigger-dialog';
import { AgentSelectionDropdown } from '@/components/agents/agent-selection-dropdown';

type CreationType = 'schedule' | 'event';

interface TriggerCreationDialogProps {
  open: boolean;
  type: CreationType;
  onOpenChange: (open: boolean) => void;
  onTriggerCreated?: (triggerId: string) => void;
}

const DEFAULT_SCHEDULE_CONFIG: ScheduleTriggerConfig = {
  cron_expression: '0 9 * * *',
  execution_type: 'agent',
  agent_prompt: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC',
};

export function TriggerCreationDialog({
  open,
  type,
  onOpenChange,
  onTriggerCreated,
}: TriggerCreationDialogProps) {
  const { data: agentsResponse, isLoading: isLoadingAgents, error: agentsError } = useAgents();
  const { data: providers = [] } = useTriggerProviders();
  const createTriggerMutation = useCreateTrigger();

  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [step, setStep] = useState<'agent' | 'schedule'>('agent');
  const [eventDialogOpen, setEventDialogOpen] = useState(false);

  const scheduleProvider = useMemo<TriggerProvider | undefined>(() => {
    return providers.find((provider) => provider.provider_id === 'schedule');
  }, [providers]);

  const agents = agentsResponse?.agents ?? [];

  const resetState = () => {
    setSelectedAgentId('');
    setStep('agent');
    setEventDialogOpen(false);
  };

  useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open]);

  const handleAgentContinue = () => {
    if (!selectedAgentId) {
      return;
    }

    if (type === 'event') {
      setEventDialogOpen(true);
    } else {
      setStep('schedule');
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleScheduleSave = async (payload: {
    name: string;
    description: string;
    config: ScheduleTriggerConfig;
    is_active: boolean;
  }) => {
    if (!selectedAgentId || !scheduleProvider) {
      toast.error('Selecione um agente antes de salvar');
      return;
    }

    try {
      const result = await createTriggerMutation.mutateAsync({
        agentId: selectedAgentId,
        provider_id: scheduleProvider.provider_id,
        name: payload.name,
        description: payload.description,
        config: payload.config,
      });

      toast.success('Tarefa criada com sucesso');
      onTriggerCreated?.(result?.trigger_id ?? '');
      onOpenChange(false);
      resetState();
    } catch (error: any) {
      const message = error?.message ?? 'Não foi possível criar a tarefa';
      toast.error(message);
    }
  };

  const scheduleDialogConfig: TriggerConfiguration | undefined = useMemo(() => {
    if (!scheduleProvider || !selectedAgentId) {
      return undefined;
    }

    return {
      trigger_id: '__new__',
      agent_id: selectedAgentId,
      trigger_type: scheduleProvider.trigger_type,
      provider_id: scheduleProvider.provider_id,
      name: '',
      description: '',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      config: DEFAULT_SCHEDULE_CONFIG,
    };
  }, [scheduleProvider, selectedAgentId]);

  return (
    <>
      {/* Agent selection & schedule step */}
      {type === 'schedule' && step === 'schedule' && scheduleProvider && scheduleDialogConfig ? (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <TriggerConfigDialog
            provider={scheduleProvider}
            existingConfig={scheduleDialogConfig}
            onSave={handleScheduleSave}
            onCancel={handleCancel}
            isLoading={createTriggerMutation.isPending}
            agentId={selectedAgentId}
          />
        </Dialog>
      ) : (
        <Dialog open={open && step === 'agent'} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {type === 'schedule' ? (
                  <>
                    <Clock className="h-5 w-5" />
                    Nova tarefa agendada
                  </>
                ) : (
                  <>
                    <PlugZap className="h-5 w-5" />
                    Nova tarefa baseada em evento
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                Escolha qual agente será responsável por esta automação.
              </DialogDescription>
            </DialogHeader>

            {agentsError ? (
              <Alert variant="destructive" className="mt-2">
                <AlertDescription>
                  Não foi possível carregar os agentes. Tente novamente mais tarde.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3 py-4">
                <label className="text-sm font-medium text-muted-foreground">
                  Selecionar agente
                </label>
                <AgentSelectionDropdown
                  selectedAgentId={selectedAgentId}
                  onAgentSelect={setSelectedAgentId}
                  placeholder={isLoadingAgents ? 'Carregando agentes...' : 'Escolha um agente'}
                  agents={agents}
                  isLoading={isLoadingAgents}
                  showCreateOption
                />
                {!isLoadingAgents && agents.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Crie um agente para habilitar esta automação.
                  </p>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="ghost" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button
                onClick={handleAgentContinue}
                disabled={!selectedAgentId || isLoadingAgents}
              >
                Continuar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {type === 'event' && selectedAgentId && (
        <EventBasedTriggerDialog
          open={eventDialogOpen}
          onOpenChange={(nextOpen) => {
            setEventDialogOpen(nextOpen);
            if (!nextOpen) {
              onOpenChange(false);
              resetState();
            }
          }}
          agentId={selectedAgentId}
          onTriggerCreated={(triggerId) => {
            onTriggerCreated?.(triggerId);
            toast.success('Tarefa criada com sucesso');
            setEventDialogOpen(false);
            onOpenChange(false);
            resetState();
          }}
        />
      )}
    </>
  );
}

