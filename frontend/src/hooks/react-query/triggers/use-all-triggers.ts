import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export interface TriggerWithAgent {
  trigger_id: string;
  agent_id: string;
  agent_name: string;
  agent_description?: string;
  trigger_type: string;
  name: string;
  description?: string;
  is_active: boolean;
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
  last_execution?: string;
  next_execution?: string;
  execution_count: number;
  success_count: number;
  failure_count: number;
}

export interface TriggerListResponse {
  triggers: TriggerWithAgent[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

export interface TriggerStats {
  total_triggers: number;
  active_triggers: number;
  inactive_triggers: number;
  executions_today: number;
  executions_this_week: number;
  executions_this_month: number;
  success_rate: number;
  most_active_agent?: string;
  triggers_by_type: Record<string, number>;
}

interface UseAllTriggersParams {
  page?: number;
  per_page?: number;
  trigger_type?: string;
  agent_id?: string;
  is_active?: boolean;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

async function fetchAllTriggers(params: UseAllTriggersParams): Promise<TriggerListResponse> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }

  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.per_page) queryParams.append('per_page', params.per_page.toString());
  if (params.trigger_type && params.trigger_type !== 'all') {
    queryParams.append('trigger_type', params.trigger_type);
  }
  if (params.agent_id) queryParams.append('agent_id', params.agent_id);
  if (params.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
  if (params.search) queryParams.append('search', params.search);
  if (params.sort_by) queryParams.append('sort_by', params.sort_by);
  if (params.sort_order) queryParams.append('sort_order', params.sort_order);

  const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3008';
  
  const response = await fetch(`${API_URL}/triggers/all?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch triggers');
  }

  return response.json();
}

async function fetchTriggerStats(): Promise<TriggerStats> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }

  const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3008';
  
  const response = await fetch(`${API_URL}/triggers/stats`, {
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch trigger stats');
  }

  return response.json();
}

async function toggleTrigger(triggerId: string): Promise<{ success: boolean; is_active: boolean }> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }

  // Buscar o estado atual do trigger
  const { data: trigger, error: fetchError } = await supabase
    .from('agent_triggers')
    .select('is_active')
    .eq('trigger_id', triggerId)
    .single();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  // Alternar o estado
  const newState = !trigger.is_active;
  
  const { error: updateError } = await supabase
    .from('agent_triggers')
    .update({ is_active: newState, updated_at: new Date().toISOString() })
    .eq('trigger_id', triggerId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return { success: true, is_active: newState };
}

export function useAllTriggers(params: UseAllTriggersParams = {}) {
  return useQuery({
    queryKey: ['all-triggers', params],
    queryFn: () => fetchAllTriggers(params),
    staleTime: 30000, // 30 seconds
  });
}

export function useTriggerStats() {
  return useQuery({
    queryKey: ['trigger-stats'],
    queryFn: fetchTriggerStats,
    staleTime: 60000, // 1 minute
  });
}

export function useToggleTrigger() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: toggleTrigger,
    onSuccess: (data, triggerId) => {
      queryClient.invalidateQueries({ queryKey: ['all-triggers'] });
      queryClient.invalidateQueries({ queryKey: ['trigger-stats'] });
      queryClient.invalidateQueries({ queryKey: ['agent-triggers'] });
      
      toast.success(
        data.is_active 
          ? 'Automação ativada com sucesso' 
          : 'Automação desativada com sucesso'
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao alternar automação');
    },
  });
}