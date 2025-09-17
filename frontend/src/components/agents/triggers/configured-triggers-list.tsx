"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Edit, 
  Trash2, 
  ExternalLink, 
  MessageSquare, 
  Webhook, 
  Clock, 
  Mail,
  Github,
  Gamepad2,
  Activity,
  Copy
} from 'lucide-react';
import { TriggerConfiguration } from './types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getTriggerIcon } from './utils';
import { truncateString, cn } from '@/lib/utils';

interface ConfiguredTriggersListProps {
  triggers: TriggerConfiguration[];
  onEdit: (trigger: TriggerConfiguration) => void;
  onRemove: (trigger: TriggerConfiguration) => void;
  onToggle: (trigger: TriggerConfiguration) => void;
  isLoading?: boolean;
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
};

const getCronDescription = (cron: string): string => {
  const cronDescriptions: Record<string, string> = {
    '0 9 * * *': 'Daily at 9:00 AM',
    '0 18 * * *': 'Daily at 6:00 PM',
    '0 9 * * 1-5': 'Weekdays at 9:00 AM',
    '0 10 * * 1-5': 'Weekdays at 10:00 AM',
    '0 9 * * 1': 'Every Monday at 9:00 AM',
    '0 9 1 * *': 'Monthly on the 1st at 9:00 AM',
    '0 9 1 1 *': 'Yearly on Jan 1st at 9:00 AM',
    '0 */2 * * *': 'Every 2 hours',
    '*/30 * * * *': 'Every 30 minutes',
    '0 0 * * *': 'Daily at midnight',
    '0 12 * * *': 'Daily at noon',
    '0 9 * * 0': 'Every Sunday at 9:00 AM',
    '0 9 * * 6': 'Every Saturday at 9:00 AM',
  };

  return cronDescriptions[cron] || cron;
};

export const ConfiguredTriggersList: React.FC<ConfiguredTriggersListProps> = ({
  triggers,
  onEdit,
  onRemove,
  onToggle,
  isLoading = false,
}) => {
  return (
    <TooltipProvider>
      <div className="space-y-2">
        {triggers.map((trigger) => (
          <div
            key={trigger.trigger_id}
            className="p-4 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all duration-200"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-md bg-transparent border-0 shrink-0 opacity-60">
                {getTriggerIcon(trigger.trigger_type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium truncate">
                      {trigger.name}
                    </h4>
                    <div className={cn(
                      "px-2 py-0.5 rounded text-xs font-medium",
                      trigger.is_active 
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" 
                        : "bg-muted text-muted-foreground border border-border"
                    )}>
                      {trigger.is_active ? "Ativo" : "Inativo"}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-2 shrink-0">
                    <Switch
                      checked={trigger.is_active}
                      onCheckedChange={() => onToggle(trigger)}
                      disabled={isLoading}
                      className="scale-90"
                    />
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEdit(trigger)}
                          className="h-7 w-7 p-0 hover:bg-black/5 dark:hover:bg-white/5"
                          disabled={isLoading}
                        >
                          <Edit className="h-3.5 w-3.5 opacity-60" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Editar gatilho</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onRemove(trigger)}
                          className="h-7 w-7 p-0 hover:bg-red-500/10 text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
                          disabled={isLoading}
                        >
                          <Trash2 className="h-3.5 w-3.5 opacity-60" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Deletar gatilho</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                
                {trigger.description && (
                  <p className="text-xs text-muted-foreground truncate">
                    {truncateString(trigger.description, 50)}
                  </p>
                )}
                {trigger.trigger_type === 'schedule' && trigger.config && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {trigger.config.execution_type === 'agent' && trigger.config.agent_prompt && (
                      <p>Prompt: {truncateString(trigger.config.agent_prompt, 40)}</p>
                    )}
                    {trigger.config.execution_type === 'workflow' && trigger.config.workflow_id && (
                      <p>Workflow: {trigger.config.workflow_id}</p>
                    )}
                  </div>
                )}
                {trigger.webhook_url && (
                  <div className="flex items-center gap-2 mt-2">
                    <code className="text-xs bg-black/[0.02] dark:bg-white/[0.03] px-2 py-1 rounded-md font-mono truncate flex-1 max-w-full border border-black/6 dark:border-white/8">
                      {trigger.webhook_url}
                    </code>
                    <div className="flex items-center gap-1 shrink-0">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 hover:bg-black/5 dark:hover:bg-white/5"
                            onClick={() => copyToClipboard(trigger.webhook_url!)}
                          >
                            <Copy className="h-3 w-3 opacity-60" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Copiar URL</p>
                        </TooltipContent>
                      </Tooltip>
                      {trigger.webhook_url.startsWith('http') && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 hover:bg-black/5 dark:hover:bg-white/5"
                              onClick={() => window.open(trigger.webhook_url, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3 opacity-60" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Abrir URL</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
}; 