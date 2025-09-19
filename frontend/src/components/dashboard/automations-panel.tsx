'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Clock, Zap, Bot, Settings2 } from 'lucide-react';
import { useAllUserTriggers } from '@/hooks/react-query/triggers/use-all-user-triggers';
import { useToggleTrigger } from '@/hooks/react-query/triggers/use-agent-triggers';
import { TriggerEditModal } from '@/components/sidebar/trigger-edit-modal';

type Props = {
  className?: string;
};

function getNextRunLabel(cron?: string): string {
  if (!cron || typeof cron !== 'string') return '';
  try {
    // Very small helper for common patterns only (frontend-only, no deps)
    // Supported: "*/N * * * *" (every N minutes)
    //            "m * * * *" (at minute m every hour)
    const parts = cron.trim().split(/\s+/);
    if (parts.length < 5) return cron;
    const [min, hour] = parts;
    const now = new Date();
    const nowMs = now.getTime();

    const toHuman = (ms: number) => {
      if (ms <= 0) return 'agora';
      const totalSec = Math.ceil(ms / 1000);
      const minutes = Math.floor(totalSec / 60);
      const seconds = totalSec % 60;
      if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const remMin = minutes % 60;
        return `em ${hours}h${remMin > 0 ? ` ${remMin}m` : ''}`;
      }
      if (minutes > 0) return `em ${minutes}m`;
      return `em ${seconds}s`;
    };

    // */N * * * *
    if (min.startsWith('*/') && (hour === '*' || hour === '*/1')) {
      const every = parseInt(min.slice(2), 10);
      if (!isNaN(every) && every > 0) {
        const next = new Date(now);
        const currentMinute = now.getMinutes();
        const nextMinute = Math.ceil((currentMinute + 0.0001) / every) * every; // avoid edge case
        if (nextMinute >= 60) {
          next.setHours(now.getHours() + 1, 0, 0, 0);
        } else {
          next.setMinutes(nextMinute, 0, 0);
        }
        return toHuman(next.getTime() - nowMs);
      }
    }

    // m * * * * (at minute m each hour)
    if (/^\d+$/.test(min) && (hour === '*' || hour === '*/1')) {
      const m = parseInt(min, 10);
      if (m >= 0 && m <= 59) {
        const next = new Date(now);
        if (now.getMinutes() > m || (now.getMinutes() === m && now.getSeconds() > 0)) {
          next.setHours(now.getHours() + 1, m, 0, 0);
        } else {
          next.setMinutes(m, 0, 0);
        }
        return toHuman(next.getTime() - nowMs);
      }
    }

    // Fallback: show cron string if not recognized
    return cron;
  } catch {
    return cron;
  }
}

export function AutomationsPanel({ className }: Props) {
  const router = useRouter();
  const { data: triggersData, isLoading, refetch } = useAllUserTriggers();
  const [selectedTrigger, setSelectedTrigger] = React.useState<any>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const toggleTriggerMutation = useToggleTrigger();

  const triggers = triggersData || [];

  const activeCount = triggers.filter((t: any) => t.is_active).length;

  const onEdit = (trigger: any) => {
    setSelectedTrigger(trigger);
    setIsModalOpen(true);
  };

  const onCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTrigger(null);
    refetch();
  };

  const handleToggle = async (trigger: any) => {
    await toggleTriggerMutation.mutateAsync({
      triggerId: trigger.trigger_id,
      isActive: !trigger.is_active,
    });
    refetch();
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="mx-auto max-w-3xl px-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-muted-foreground">Automações ({activeCount}/{triggers.length} ativas)</div>
        </div>

        <div className="rounded-xl border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] divide-y divide-black/5 dark:divide-white/10 overflow-hidden">
          {isLoading && (
            <div className="p-3 text-xs text-muted-foreground">Carregando…</div>
          )}
          {!isLoading && triggers.length === 0 && (
            <div className="p-4 text-xs text-muted-foreground">Nenhuma automação configurada</div>
          )}

          {triggers.map((trigger: any) => {
            const Icon = trigger.trigger_type === 'webhook' ? Zap : Clock;
            const cronStr = trigger.config?.cron_expression ?? trigger.config?.cron ?? trigger.config?.schedule;
            const nextLabel = getNextRunLabel(cronStr);
            const agentName = (trigger as any).agent?.name || (trigger as any).agents?.name || 'Agente';
            return (
              <div key={trigger.trigger_id} className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="shrink-0 w-7 h-7 rounded-md bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8 flex items-center justify-center">
                    <Icon className="h-3.5 w-3.5 opacity-60" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm leading-tight truncate">{trigger.name || 'Automação sem nome'}</div>
                    <div className="text-xs text-muted-foreground truncate flex items-center gap-2">
                      <span className="truncate">{agentName}{cronStr ? ` • ${cronStr}` : ''}</span>
                      {nextLabel && (
                        <span className="inline-flex items-center gap-1 text-muted-foreground/80">
                          <Clock className="h-3 w-3 opacity-60" />
                          <span>{nextLabel}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onEdit(trigger)}>Editar</Button>
                  <Switch
                    checked={trigger.is_active}
                    onCheckedChange={() => handleToggle(trigger)}
                    className="scale-75 data-[state=checked]:bg-emerald-500"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {selectedTrigger && (
          <TriggerEditModal trigger={selectedTrigger} isOpen={isModalOpen} onClose={onCloseModal} />
        )}
      </div>
    </div>
  );
}


