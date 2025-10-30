"use client";

import React, { useState, useEffect } from 'react';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Activity,
  Copy,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { TriggerProvider, TriggerConfiguration, ScheduleTriggerConfig, EventTriggerConfig } from './types';
import { ScheduleTriggerConfigForm } from './providers/schedule-config';
import { EventTriggerConfigForm } from './providers/event-config';


interface TriggerConfigDialogProps {
  provider: TriggerProvider;
  existingConfig?: TriggerConfiguration;
  onSave: (config: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
  agentId: string;
}

export const TriggerConfigDialog: React.FC<TriggerConfigDialogProps> = ({
  provider,
  existingConfig,
  onSave,
  onCancel,
  isLoading = false,
  agentId,
}) => {
  const [name, setName] = useState(existingConfig?.name || '');
  const [description, setDescription] = useState(existingConfig?.description || '');
  const [isActive, setIsActive] = useState(existingConfig?.is_active ?? true);
  const [config, setConfig] = useState(existingConfig?.config || {});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!name && !existingConfig) {
      setName(`Gatilho ${provider.name}`);
    }
  }, [provider, existingConfig, name]);

  useEffect(() => {
    if (provider.provider_id === 'composio' || provider.trigger_type === 'webhook') {
      setConfig((prev) => {
        const executionType = prev?.execution_type ?? 'agent';
        return {
          execution_type: executionType,
          trigger_slug: prev?.trigger_slug ?? '',
          profile_id: prev?.profile_id ?? '',
          agent_prompt: executionType === 'agent' ? prev?.agent_prompt ?? '' : undefined,
          workflow_id: executionType === 'workflow' ? prev?.workflow_id ?? '' : undefined,
          workflow_input: prev?.workflow_input ?? (executionType === 'workflow' ? { prompt: '' } : undefined),
          ...prev,
        } as EventTriggerConfig;
      });
    }
  }, [provider.provider_id, provider.trigger_type]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }
    if (provider.provider_id === 'telegram') {
      if (!config.bot_token) {
        newErrors.bot_token = 'Token do bot é obrigatório';
      }
    } else if (provider.provider_id === 'slack') {
      if (!config.signing_secret) {
        newErrors.signing_secret = 'Secret de assinatura é obrigatório';
      }
    } else if (provider.provider_id === 'schedule') {
      if (!config.cron_expression) {
        newErrors.cron_expression = 'Expressão cron é obrigatória';
      }
      const executionType: 'agent' | 'workflow' = config.execution_type ?? 'agent';
      if (executionType === 'workflow') {
        if (!config.workflow_id) {
          newErrors.workflow_id = 'Seleção de fluxo de trabalho é obrigatória';
        }
      } else {
        if (!config.agent_prompt) {
          newErrors.agent_prompt = 'Prompt do agente é obrigatório';
        }
      }
    } else if (provider.provider_id === 'composio' || provider.trigger_type === 'webhook') {
      if (!config.trigger_slug) {
        newErrors.trigger_slug = 'Selecione um evento';
      }
      if (!config.profile_id) {
        newErrors.profile_id = 'Selecione uma credencial conectada';
      }
      const executionType: 'agent' | 'workflow' = config.execution_type ?? 'agent';
      if (executionType === 'workflow') {
        if (!config.workflow_id) {
          newErrors.workflow_id = 'Selecione um fluxo de trabalho';
        }
      } else {
        if (!config.agent_prompt) {
          newErrors.agent_prompt = 'Informe um prompt para o agente';
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave({
        name: name.trim(),
        description: description.trim(),
        is_active: isActive,
        config,
      });
    }
  };

  const renderProviderSpecificConfig = () => {
    switch (provider.provider_id) {
      case 'schedule':
        return (
          <ScheduleTriggerConfigForm
            provider={provider}
            config={config as ScheduleTriggerConfig}
            onChange={setConfig}
            errors={errors}
            agentId={agentId}
            name={name}
            description={description}
            onNameChange={setName}
            onDescriptionChange={setDescription}
            isActive={isActive}
            onActiveChange={setIsActive}
          />
        );
      case 'composio':
        return (
          <EventTriggerConfigForm
            provider={provider}
            config={config as EventTriggerConfig}
            onChange={(value) => setConfig(value)}
            errors={errors}
            agentId={agentId}
            name={name}
            description={description}
            onNameChange={setName}
            onDescriptionChange={setDescription}
          />
        );
      default:
        if (provider.trigger_type === 'webhook') {
          return (
            <EventTriggerConfigForm
              provider={provider}
              config={config as EventTriggerConfig}
              onChange={(value) => setConfig(value)}
              errors={errors}
              agentId={agentId}
              name={name}
              description={description}
              onNameChange={setName}
              onDescriptionChange={setDescription}
            />
          );
        }
        return (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4" />
            <p>Formulário de configuração para {provider.name} ainda não foi implementado.</p>
          </div>
        );
    }
  };

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
      <DialogHeader>
        <DialogTitle>
          Configurar {provider.provider_id === 'schedule' ? 'Agendamento' : provider.name}
        </DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground">
          {provider.description}
        </DialogDescription>
      </DialogHeader>
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="space-y-6 pr-2">
          {provider.provider_id === 'schedule' || provider.provider_id === 'composio' || provider.trigger_type === 'webhook' ? (
            renderProviderSpecificConfig()
          ) : (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="trigger-name">Nome *</Label>
                <Input
                  id="trigger-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Digite um nome para este gatilho"
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="trigger-description">Descrição</Label>
                <Textarea
                  id="trigger-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição opcional para este gatilho"
                  rows={2}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="trigger-active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <Label htmlFor="trigger-active">
                  Ativar gatilho imediatamente
                </Label>
              </div>
            </div>
            <div className="border-t border-black/6 dark:border-white/8 pt-6">
              <h3 className="text-sm font-medium mb-4">
                Configuração do {provider.name}
              </h3>
              {renderProviderSpecificConfig()}
            </div>
            </>
          )}
          {provider.webhook_enabled && existingConfig?.webhook_url && (
          <div className="border-t border-black/6 dark:border-white/8 pt-6">
            <h3 className="text-sm font-medium mb-4">Informações do Webhook</h3>
            <div className="space-y-2">
              <Label>URL do Webhook</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={existingConfig.webhook_url}
                  readOnly
                  className="font-mono text-sm bg-black/[0.02] dark:bg-white/[0.03] border-black/6 dark:border-white/8"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigator.clipboard.writeText(existingConfig.webhook_url!)}
                  className="h-8 w-8 p-0 hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <Copy className="h-3.5 w-3.5 opacity-60" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => window.open(existingConfig.webhook_url, '_blank')}
                  className="h-8 w-8 p-0 hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Use esta URL para configurar o webhook no {provider.name}
              </p>
            </div>
            </div>
          )}
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="animate-spin rounded-full h-4 w-4" />
              {existingConfig ? 'Atualizando...' : 'Criando...'}
            </>
          ) : (
            `${existingConfig ? 'Atualizar' : 'Criar'} Gatilho`
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}; 