"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, PlugZap } from 'lucide-react';
import { TriggerConfigDialog } from './trigger-config-dialog';
import { TriggerProvider } from './types';
import { Dialog } from '@/components/ui/dialog';
import { 
  useInstallOAuthIntegration, 
  useUninstallOAuthIntegration,
  useOAuthCallbackHandler 
} from '@/hooks/react-query/triggers/use-oauth-integrations';
import { 
  useAgentTriggers, 
  useCreateTrigger, 
  useDeleteTrigger 
} from '@/hooks/react-query/triggers';
import { toast } from 'sonner';
import { EventBasedTriggerDialog } from './event-based-trigger-dialog';

interface OneClickIntegrationsProps {
  agentId: string;
}

const OAUTH_PROVIDERS = {
  schedule: {
    name: 'Adicionar Gatilho',
    icon: <Plus className="h-3.5 w-3.5" />,
    isOAuth: false
  },
  event: {
    name: 'Gatilho de Evento',
    icon: <PlugZap className="h-3.5 w-3.5" />,
    isOAuth: false
  }
} as const;

type ProviderKey = keyof typeof OAUTH_PROVIDERS;

export const OneClickIntegrations: React.FC<OneClickIntegrationsProps> = ({
  agentId
}) => {
  const [configuringSchedule, setConfiguringSchedule] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const { data: triggers = [] } = useAgentTriggers(agentId);
  const installMutation = useInstallOAuthIntegration();
  const uninstallMutation = useUninstallOAuthIntegration();
  const createTriggerMutation = useCreateTrigger();
  const deleteTriggerMutation = useDeleteTrigger();
  const { handleCallback } = useOAuthCallbackHandler();

  useEffect(() => {
    handleCallback();
  }, [handleCallback]);

  const handleInstall = async (provider: ProviderKey) => {
    if (provider === 'schedule') {
      setConfiguringSchedule(true);
      return;
    }
    if (provider === 'event') {
      setShowEventDialog(true);
      return;
    }
    
    try {
      await installMutation.mutateAsync({
        agent_id: agentId,
        provider: provider
      });
    } catch (error) {
      console.error(`Error installing ${provider}:`, error);
    }
  };

  const handleUninstall = async (provider: ProviderKey, triggerId?: string) => {
    if (provider === 'schedule' && triggerId) {
      try {
        await deleteTriggerMutation.mutateAsync({
          triggerId,
          agentId
        });
        toast.success('Gatilho de agendamento removido com sucesso');
      } catch (error) {
        toast.error('Falha ao remover gatilho de agendamento');
        console.error('Error removing schedule trigger:', error);
      }
      return;
    }
    if (provider === 'event') {
      return;
    }
    
    try {
      await uninstallMutation.mutateAsync(triggerId!);
    } catch (error) {
      console.error('Error uninstalling integration:', error);
    }
  };

  const handleScheduleSave = async (config: any) => {
    try {
      await createTriggerMutation.mutateAsync({
        agentId,
        provider_id: 'schedule',
        name: config.name || 'Gatilho Agendado',
        description: config.description || 'Gatilho agendado automaticamente',
        config: config.config,
      });
      toast.success('Gatilho de agendamento criado com sucesso');
      setConfiguringSchedule(false);
    } catch (error: any) {
      toast.error(error.message || 'Falha ao criar gatilho de agendamento');
      console.error('Error creating schedule trigger:', error);
    }
  };

  const getIntegrationForProvider = (provider: ProviderKey) => {
    if (provider === 'schedule') {
      return triggers.find(trigger => trigger.trigger_type === 'schedule');
    }
    if (provider === 'event') {
      return undefined;
    }
  };

  const isProviderInstalled = (provider: ProviderKey) => {
    return !!getIntegrationForProvider(provider);
  };

  const getTriggerId = (provider: ProviderKey) => {
    const integration = getIntegrationForProvider(provider);
    if (provider === 'schedule') {
      return integration?.trigger_id;
    }
    return integration?.trigger_id;
  };

  const scheduleProvider: TriggerProvider = {
    provider_id: 'schedule',
    name: 'Agendamento',
    description: 'Configure agendamentos automáticos para executar seu agente ou fluxos de trabalho',
    trigger_type: 'schedule',
    webhook_enabled: true,
    config_schema: {}
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {Object.entries(OAUTH_PROVIDERS).map(([providerId, config]) => {
          const provider = providerId as ProviderKey;
          const isInstalled = isProviderInstalled(provider);
          const isLoading = installMutation.isPending || uninstallMutation.isPending || 
                           (provider === 'schedule' && (createTriggerMutation.isPending || deleteTriggerMutation.isPending));
          const triggerId = getTriggerId(provider);
          
          const buttonText = provider === 'schedule'
            ? config.name
            : provider === 'event'
              ? 'Gatilho de Evento'
              : (isInstalled ? `Disconnect ${config.name}` : `Connect ${config.name}`);
          
          return (
            <Button
              key={providerId}
              variant="default"
              size="sm"
              onClick={() => {
                if (provider === 'schedule') {
                  handleInstall(provider);
                } else if (provider === 'event') {
                  handleInstall(provider);
                } else {
                  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                  isInstalled ? handleUninstall(provider, triggerId) : handleInstall(provider);
                }
              }}
              disabled={isLoading}
              className="h-9 px-3 gap-1.5 text-sm font-medium"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                config.icon
              )}
              {buttonText}
            </Button>
          );
        })}
      </div>
      {configuringSchedule && (
        <Dialog open={configuringSchedule} onOpenChange={setConfiguringSchedule}>
          <TriggerConfigDialog
            provider={scheduleProvider}
            existingConfig={null}
            onSave={handleScheduleSave}
            onCancel={() => setConfiguringSchedule(false)}
            isLoading={createTriggerMutation.isPending}
            agentId={agentId}
          />
        </Dialog>
      )}
      <EventBasedTriggerDialog
        open={showEventDialog}
        onOpenChange={setShowEventDialog}
        agentId={agentId}
        onTriggerCreated={() => {
          setShowEventDialog(false);
          toast.success('Gatilho de evento criado com sucesso');
        }}
      />
    </div>
  );
};
