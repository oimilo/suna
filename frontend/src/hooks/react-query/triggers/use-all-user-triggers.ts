import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export interface SimpleTrigger {
  trigger_id: string;
  agent_id: string;
  trigger_type: string;
  name: string;
  description?: string;
  is_active: boolean;
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
  agent?: {
    name: string;
    description?: string;
  };
}

async function fetchAllUserTriggers(): Promise<SimpleTrigger[]> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  // Buscar todos os triggers do usuário diretamente do Supabase
  const { data: triggers, error } = await supabase
    .from('agent_triggers')
    .select(`
      *,
      agents (
        name,
        description
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar triggers do Supabase:', error);
    throw error;
  }

  // console.log('[Supabase] Triggers encontrados:', triggers);
  
  return triggers || [];
}

export function useAllUserTriggers() {
  return useQuery({
    queryKey: ['user-triggers-supabase'],
    queryFn: fetchAllUserTriggers,
    staleTime: 30000, // 30 seconds
    retry: 1,
  });
}