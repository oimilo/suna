'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { TriggerConfigDialog } from '@/components/agents/triggers/trigger-config-dialog';
import { useTriggerProviders } from '@/hooks/react-query/triggers/use-trigger-providers';
import { useUpdateTrigger } from '@/hooks/react-query/triggers/use-agent-triggers';
import { toast } from 'sonner';

interface TriggerEditModalProps {
  trigger: any;
  isOpen: boolean;
  onClose: () => void;
}

export function TriggerEditModal({ trigger, isOpen, onClose }: TriggerEditModalProps) {
  const { data: providers = [] } = useTriggerProviders();
  const updateTriggerMutation = useUpdateTrigger();
  const [provider, setProvider] = useState<any>(null);

  useEffect(() => {
    if (trigger && providers.length > 0) {
      // Encontrar o provider baseado no tipo do trigger
      const foundProvider = providers.find(p => 
        p.provider_id === trigger.trigger_type || 
        p.provider_id === trigger.provider_id ||
        (trigger.trigger_type === 'schedule' && p.provider_id === 'schedule')
      );
      setProvider(foundProvider);
    }
  }, [trigger, providers]);

  const handleSave = async (updatedConfig: any) => {
    try {
      await updateTriggerMutation.mutateAsync({
        triggerId: trigger.trigger_id,
        name: updatedConfig.name,
        description: updatedConfig.description,
        config: updatedConfig.config,
        is_active: updatedConfig.is_active,
      });
      
      toast.success('Gatilho atualizado com sucesso!');
      onClose();
    } catch (error) {
      toast.error('Erro ao atualizar gatilho');
      console.error('Erro ao atualizar trigger:', error);
    }
  };

  if (!provider || !trigger) {
    return null;
  }

  // Converter o trigger para o formato esperado pelo TriggerConfigDialog
  const triggerConfig = {
    trigger_id: trigger.trigger_id,
    agent_id: trigger.agent_id,
    provider_id: trigger.trigger_type || trigger.provider_id || 'schedule',
    name: trigger.name,
    description: trigger.description,
    config: trigger.config || {},
    is_active: trigger.is_active,
    created_at: trigger.created_at,
    updated_at: trigger.updated_at,
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <TriggerConfigDialog
        provider={provider}
        existingConfig={triggerConfig}
        onSave={handleSave}
        onCancel={onClose}
        isLoading={updateTriggerMutation.isPending}
        agentId={trigger.agent_id}
      />
    </Dialog>
  );
}