'use client';

import { motion } from 'framer-motion';
import { 
  Clock, 
  Webhook, 
  MessageSquare, 
  Mail,
  Github,
  Activity,
  MoreVertical,
  Edit,
  Trash2,
  Power,
  PowerOff,
  ChevronRight,
  Calendar,
  CheckCircle,
  XCircle,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { TriggerWithAgent } from '@/hooks/react-query/triggers/use-all-triggers';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AutomationCardProps {
  trigger: TriggerWithAgent;
  onEdit: () => void;
  onToggle: () => void;
  onDelete?: () => void;
  isToggling?: boolean;
}

export function AutomationCard({ 
  trigger, 
  onEdit, 
  onToggle,
  onDelete,
  isToggling = false 
}: AutomationCardProps) {
  const getTriggerIcon = () => {
    switch (trigger.trigger_type) {
      case 'schedule':
        return Clock;
      case 'webhook':
        return Webhook;
      case 'telegram':
      case 'slack':
      case 'discord':
      case 'teams':
        return MessageSquare;
      case 'email':
        return Mail;
      case 'github':
        return Github;
      default:
        return Zap;
    }
  };

  const Icon = getTriggerIcon();
  
  const successRate = trigger.execution_count > 0 
    ? Math.round((trigger.success_count / trigger.execution_count) * 100)
    : 0;

  const getStatusColor = () => {
    if (!trigger.is_active) return 'text-muted-foreground';
    if (successRate >= 90) return 'text-green-500';
    if (successRate >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getNextRun = () => {
    if (trigger.trigger_type === 'schedule' && trigger.config?.cron_expression) {
      // TODO: Calculate next run from cron expression
      return trigger.next_execution 
        ? formatDistanceToNow(new Date(trigger.next_execution), { 
            addSuffix: true, 
            locale: ptBR 
          })
        : 'Calculando...';
    }
    return null;
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card className={cn(
        "group relative transition-all duration-200 hover:shadow-lg",
        !trigger.is_active && "opacity-60"
      )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={cn(
              "p-2 rounded-lg transition-colors",
              trigger.is_active 
                ? "bg-primary/10 text-primary" 
                : "bg-muted text-muted-foreground"
            )}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">
                {trigger.name}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                {trigger.agent_name}
              </p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggle}>
                {trigger.is_active ? (
                  <>
                    <PowerOff className="h-4 w-4 mr-2" />
                    Desativar
                  </>
                ) : (
                  <>
                    <Power className="h-4 w-4 mr-2" />
                    Ativar
                  </>
                )}
              </DropdownMenuItem>
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={onDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Description */}
        {trigger.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {trigger.description}
          </p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <Activity className={cn("h-3 w-3", getStatusColor())} />
            <span className="text-muted-foreground">
              {trigger.execution_count} execuções
            </span>
          </div>
          {successRate > 0 && (
            <div className="flex items-center gap-1.5">
              {successRate >= 70 ? (
                <CheckCircle className="h-3 w-3 text-green-500" />
              ) : (
                <XCircle className="h-3 w-3 text-red-500" />
              )}
              <span className="text-muted-foreground">
                {successRate}% sucesso
              </span>
            </div>
          )}
        </div>

        {/* Next run or last run */}
        <div className="flex items-center justify-between text-xs">
          {getNextRun() ? (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Próxima: {getNextRun()}</span>
            </div>
          ) : trigger.last_execution ? (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                Última: {formatDistanceToNow(new Date(trigger.last_execution), {
                  addSuffix: true,
                  locale: ptBR
                })}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">Nunca executado</span>
          )}
        </div>

        {/* Status Toggle */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs font-medium">
            {trigger.is_active ? 'Ativo' : 'Inativo'}
          </span>
          <Switch
            checked={trigger.is_active}
            onCheckedChange={onToggle}
            disabled={isToggling}
            className="scale-90"
          />
        </div>
      </CardContent>
    </Card>
    </motion.div>
  );
}