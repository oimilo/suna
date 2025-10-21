import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { backendApi } from '@/lib/api-client';
import { TriggerConfiguration } from '@/components/agents/triggers/types';

export interface TriggerWithAgent extends TriggerConfiguration {
  agent_name?: string;
  agent_description?: string;
  icon_name?: string;
  icon_color?: string;
  icon_background?: string;
  execution_count?: number;
  success_count?: number;
  failure_count?: number;
  last_execution?: string;
  next_execution?: string;
}

// Legacy stats shape retained for downstream components that still expect it.
export interface TriggerStats {
  total_triggers: number;
  active_triggers: number;
  inactive_triggers: number;
  executions_today?: number;
  executions_this_week?: number;
  executions_this_month?: number;
  success_rate?: number;
  most_active_agent?: string;
  triggers_by_type?: Record<string, number>;
}

const parseConfig = (raw: any) => {
  if (!raw) return {};
  if (typeof raw !== 'string') return raw;

  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const fetchAllTriggers = async (): Promise<TriggerWithAgent[]> => {
  const response = await backendApi.get<TriggerWithAgent[]>(`/triggers/all`);

  if (!response.success) {
    const error = response.error?.message || 'Failed to fetch triggers';
    throw new Error(error);
  }

  const triggers = response.data ?? [];

  return triggers.map((trigger: any) => ({
    ...trigger,
    config: parseConfig(trigger.config),
  }));
};

export const useAllTriggers = () => {
  const query = useQuery({
    queryKey: ['all-triggers'],
    queryFn: fetchAllTriggers,
    staleTime: 60 * 1000,
    refetchInterval: 30 * 1000,
  });

  const data = useMemo(
    () =>
      (query.data ?? []).sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      ),
    [query.data],
  );

  return {
    ...query,
    data,
  };
};
