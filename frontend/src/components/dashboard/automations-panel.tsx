'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Clock, Zap, Bot, Settings2 } from 'lucide-react';
import { useAllUserTriggers } from '@/hooks/react-query/triggers/use-all-user-triggers';
import { useToggleTrigger } from '@/hooks/react-query/triggers/use-agent-triggers';
import { TriggerEditModal } from '@/components/sidebar/trigger-edit-modal';
import { useDeleteTrigger } from '@/hooks/react-query/triggers/use-agent-triggers';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2, Pencil } from 'lucide-react';
// no sidebar coupling here; positioning handled by parent

type Props = {
  className?: string;
  maxHeight?: number; // altura máxima da lista interna
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

export function AutomationsPanel({ className, maxHeight = 260 }: Props) {
  const router = useRouter();
  const { data: triggersData, isLoading, refetch } = useAllUserTriggers();
  const [selectedTrigger, setSelectedTrigger] = React.useState<any>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const toggleTriggerMutation = useToggleTrigger();
  const deleteTriggerMutation = useDeleteTrigger();
  // simple panel, no draggable sheet

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

  const handleDelete = async (trigger: any) => {
    const name = trigger.name || 'automação';
    if (typeof window !== 'undefined') {
      const ok = window.confirm(`Remover “${name}”? Esta ação não poderá ser desfeita.`);
      if (!ok) return;
    }
    await deleteTriggerMutation.mutateAsync({ triggerId: trigger.trigger_id, agentId: trigger.agent_id });
    refetch();
  };

  return (
    <div className={cn('rounded-2xl border border-black/10 dark:border-white/10 shadow-2xl backdrop-blur bg-white/75 dark:bg-black/40 px-4 py-3', className)} role="region" aria-label="Automações">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="text-sm font-medium">Automações</div>
            <div className="h-6 px-2 rounded-full text-xs bg-black/5 dark:bg-white/10 flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>{activeCount} ativas</span>
            </div>
            <div className="h-6 px-2 rounded-full text-xs bg-black/5 dark:bg-white/10 flex items-center">
              {triggers.length} no total
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
              <Link href="/automations">Ver todas</Link>
            </Button>
          </div>
        </div>
        <div className={cn('grid grid-cols-1 gap-3 pr-1 overflow-y-auto')} style={{ maxHeight }}>
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
              <div key={trigger.trigger_id} className="rounded-lg border border-black/5 dark:border-white/10 bg-white/70 dark:bg-black/30 backdrop-blur px-3 py-3 flex items-start justify-between shadow-sm">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="shrink-0 w-8 h-8 rounded-md bg-black/[0.03] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 opacity-70" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium leading-tight truncate">{trigger.name || 'Automação sem nome'}</div>
                    <div className="text-xs text-muted-foreground truncate flex items-center gap-2">
                      <span className="truncate">{agentName}</span>
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
                  <Switch
                    checked={trigger.is_active}
                    onCheckedChange={() => handleToggle(trigger)}
                    className="scale-75 data-[state=checked]:bg-emerald-500"
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem onClick={() => onEdit(trigger)} className="text-xs">
                        <Pencil className="h-3.5 w-3.5 mr-2" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(trigger)} className="text-xs text-red-600 focus:text-red-600">
                        <Trash2 className="h-3.5 w-3.5 mr-2" /> Remover
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>

        {selectedTrigger && (
          <TriggerEditModal trigger={selectedTrigger} isOpen={isModalOpen} onClose={onCloseModal} />
        )}
    </div>
  );
}


