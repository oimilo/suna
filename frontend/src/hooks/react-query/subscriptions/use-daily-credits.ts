import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export interface DailyCreditsInfo {
  available: number;
  available_credits: number;
  total: number;
  total_credits: number;
  expires_in_hours: number;
  has_daily_credits: boolean;
}

async function fetchDailyCredits(): Promise<DailyCreditsInfo> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    return {
      available: 0,
      available_credits: 0,
      total: 0,
      total_credits: 0,
      expires_in_hours: 0,
      has_daily_credits: false
    };
  }

  // API está em produção: https://prophet-milo-f3hr5.ondigitalocean.app/api
  const response = await fetch(`https://prophet-milo-f3hr5.ondigitalocean.app/api/billing/credits-status`, {
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    return {
      available: 0,
      available_credits: 0,
      total: 0,
      total_credits: 0,
      expires_in_hours: 0,
      has_daily_credits: false
    };
  }

  return response.json();
}

export function useDailyCredits() {
  return useQuery({
    queryKey: ['daily-credits'],
    queryFn: fetchDailyCredits,
    refetchInterval: 60000, // Atualiza a cada minuto
    staleTime: 30000, // Considera stale após 30 segundos
  });
}