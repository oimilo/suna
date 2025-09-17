'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Edit, 
  Trash2, 
  Clock,
  Copy,
  Bot,
  Activity
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn, truncateString } from '@/lib/utils';
import { TriggerWithAgent } from '@/hooks/react-query/triggers/use-all-triggers';
import { getTriggerIcon } from '@/components/agents/triggers/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface TriggerCardProps {
  trigger: TriggerWithAgent;
  onEdit: () => void;
  onToggle: () => void;
  onDelete?: () => void;
  isToggling?: boolean;
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('URL copiada!');
  } catch (err) {
    console.error('Failed to copy text: ', err);
    toast.error('Erro ao copiar');
  }
};

const getCronDescription = (cron: string): string => {
  const cronDescriptions: Record<string, string> = {
    '0 9 * * *': 'Diariamente às 9h',
    '0 18 * * *': 'Diariamente às 18h',
    '0 9 * * 1-5': 'Dias úteis às 9h',
    '0 10 * * 1-5': 'Dias úteis às 10h',
    '0 9 * * 1': 'Toda segunda às 9h',
    '0 9 1 * *': 'Mensalmente no dia 1º às 9h',
    '0 9 1 1 *': 'Anualmente em 1º de Jan às 9h',
    '0 */2 * * *': 'A cada 2 horas',
    '*/30 * * * *': 'A cada 30 minutos',
    '*/15 * * * *': 'A cada 15 minutos',
    '0 0 * * *': 'Diariamente à meia-noite',
    '0 12 * * *': 'Diariamente ao meio-dia',
    '0 9 * * 0': 'Todo domingo às 9h',
    '0 9 * * 6': 'Todo sábado às 9h',
  };

  return cronDescriptions[cron] || cron;
};

export function TriggerCard({ 
  trigger, 
  onEdit, 
  onToggle,
  onDelete,
  isToggling = false 
}: TriggerCardProps) {
  const getNextRun = () => {
    if (trigger.next_execution) {
      return formatDistanceToNow(new Date(trigger.next_execution), { 
        addSuffix: true, 
        locale: ptBR 
      });
    }
    if (trigger.last_execution) {
      return `Última: ${formatDistanceToNow(new Date(trigger.last_execution), { 
        addSuffix: true, 
        locale: ptBR 
      })}`;
    }
    return null;
  };

  const nextRunText = getNextRun();
  const webhookUrl = trigger.webhook_url || 
    `${process.env.NEXT_PUBLIC_BACKEND_URL || ''}/api/triggers/${trigger.trigger_id}/webhook`;

  return (
    <TooltipProvider>
      <div className="p-4 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all duration-200">
        <div className="flex items-start gap-3">
          {/* Ícone */}
          <div className="p-2 rounded-md bg-transparent border-0 shrink-0 opacity-60">
            {getTriggerIcon(trigger.trigger_type)}
          </div>
          
          {/* Conteúdo */}
          <div className="flex-1 min-w-0">
            {/* Header */}
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
              
              {/* Ações */}
              <div className="flex items-center gap-2 ml-2 shrink-0">
                <Switch
                  checked={trigger.is_active}
                  onCheckedChange={onToggle}
                  disabled={isToggling}
                  className="scale-90"
                />
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={onEdit}
                      className="h-7 w-7 p-0 hover:bg-black/5 dark:hover:bg-white/5"
                      disabled={isToggling}
                    >
                      <Edit className="h-3.5 w-3.5 opacity-60" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Editar gatilho</p>
                  </TooltipContent>
                </Tooltip>
                
                {onDelete && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={onDelete}
                        className="h-7 w-7 p-0 hover:bg-red-500/10 text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
                        disabled={isToggling}
                      >
                        <Trash2 className="h-3.5 w-3.5 opacity-60" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Deletar gatilho</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
            
            {/* Nome do Agente */}
            <div className="flex items-center gap-1.5 mb-1">
              <Bot className="h-3 w-3 opacity-60" />
              <span className="text-xs text-muted-foreground">
                {trigger.agent_name}
              </span>
            </div>
            
            {/* Descrição */}
            {trigger.description && (
              <p className="text-xs text-muted-foreground truncate mb-2">
                {truncateString(trigger.description, 80)}
              </p>
            )}
            
            {/* Informações específicas do tipo */}
            {trigger.trigger_type === 'schedule' && trigger.config && (
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 inline mr-1 opacity-60" />
                  {getCronDescription(trigger.config.cron_expression)}
                  {nextRunText && ` • ${nextRunText}`}
                </div>
                {trigger.config.execution_type === 'agent' && trigger.config.agent_prompt && (
                  <p className="text-xs text-muted-foreground/70">
                    Prompt: {truncateString(trigger.config.agent_prompt, 60)}
                  </p>
                )}
              </div>
            )}
            
            {trigger.trigger_type === 'webhook' && (
              <div className="flex items-center gap-2 mt-2">
                <code className="text-xs bg-black/[0.02] dark:bg-white/[0.03] px-2 py-1 rounded-md font-mono truncate flex-1 border border-black/6 dark:border-white/8">
                  {webhookUrl}
                </code>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(webhookUrl)}
                      className="h-6 w-6 p-0 hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      <Copy className="h-3 w-3 opacity-60" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copiar URL</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
            
            {/* Estatísticas */}
            {trigger.execution_count > 0 && (
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Activity className="h-3 w-3 opacity-60" />
                  <span>{trigger.execution_count} execuções</span>
                </div>
                {trigger.success_count > 0 && (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {Math.round((trigger.success_count / trigger.execution_count) * 100)}% sucesso
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}