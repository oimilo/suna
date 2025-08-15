'use client';

import { TriggerStats } from '@/hooks/react-query/triggers/use-all-triggers';

interface AutomationStatsProps {
  stats: TriggerStats;
}

export function AutomationStats({ stats }: AutomationStatsProps) {
  const statsCards = [
    {
      label: 'Automações',
      value: stats.total_triggers.toString(),
      detail: stats.active_triggers > 0 ? `${stats.active_triggers} ativas` : 'Nenhuma ativa',
    },
    {
      label: 'Execuções hoje',
      value: stats.executions_today.toString(),
      detail: stats.executions_this_week > 0 
        ? `${stats.executions_this_week} esta semana`
        : 'Nenhuma execução',
    },
    {
      label: 'Taxa de sucesso',
      value: `${Math.round(stats.success_rate)}%`,
      detail: stats.executions_today > 0 
        ? `${stats.executions_today} execuções`
        : 'Sem dados',
    },
    {
      label: 'Agente mais ativo',
      value: stats.most_active_agent || '—',
      detail: stats.most_active_agent 
        ? `${Object.values(stats.triggers_by_type || {}).reduce((a, b) => a + b, 0)} triggers`
        : 'Sem agentes',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {statsCards.map((stat, index) => (
        <div 
          key={index} 
          className="group rounded-lg border bg-card overflow-hidden transition-all hover:shadow-md"
        >
          <div className="p-4 space-y-3">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {stat.label}
            </div>
            <div className="w-full h-px bg-border" />
            <div className="space-y-1">
              <div className="text-2xl font-semibold tracking-tight">
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground">
                {stat.detail}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}