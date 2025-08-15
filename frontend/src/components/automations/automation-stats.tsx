'use client';

import { 
  Activity, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  Zap,
  Bot
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { TriggerStats } from '@/hooks/react-query/triggers/use-all-triggers';
import { cn } from '@/lib/utils';

interface AutomationStatsProps {
  stats: TriggerStats;
}

export function AutomationStats({ stats }: AutomationStatsProps) {
  const statsCards = [
    {
      label: 'Total de Automações',
      value: stats.total_triggers,
      icon: Zap,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      subLabel: `${stats.active_triggers} ativas`,
    },
    {
      label: 'Execuções Hoje',
      value: stats.executions_today,
      icon: Activity,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      trend: stats.executions_this_week > 0 
        ? `${stats.executions_this_week} esta semana`
        : undefined,
    },
    {
      label: 'Taxa de Sucesso',
      value: `${stats.success_rate}%`,
      icon: CheckCircle,
      color: stats.success_rate >= 90 ? 'text-green-500' : 
             stats.success_rate >= 70 ? 'text-yellow-500' : 'text-red-500',
      bgColor: stats.success_rate >= 90 ? 'bg-green-500/10' : 
               stats.success_rate >= 70 ? 'bg-yellow-500/10' : 'bg-red-500/10',
    },
    {
      label: 'Agente Mais Ativo',
      value: stats.most_active_agent || 'Nenhum',
      icon: Bot,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      isText: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {stat.label}
                  </p>
                  <p className={cn(
                    "font-bold",
                    stat.isText ? "text-lg" : "text-2xl"
                  )}>
                    {stat.value}
                  </p>
                  {(stat.subLabel || stat.trend) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.subLabel || stat.trend}
                    </p>
                  )}
                </div>
                <div className={cn(
                  "p-2 rounded-lg",
                  stat.bgColor
                )}>
                  <Icon className={cn("h-4 w-4", stat.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}