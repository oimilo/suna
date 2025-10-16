import { useQuery } from '@tanstack/react-query';
import { API_URL } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';

// Alinha com Suna: usar /billing/check e shape simplificado
export interface CreditsStatus {
  can_run: boolean;
  message: string;
  credit_balance: number;
  subscription?: {
    price_id?: string | null;
    plan_name?: string;
    display_name?: string;
    tier?: string;
    is_trial?: boolean;
  } | null;
}

async function fetchCreditsStatus(token: string | null): Promise<CreditsStatus | null> {
  if (!token) return null;
  
  try {
    const response = await fetch(`${API_URL}/billing/check`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch credits status');
    }

    const data = await response.json();
    return {
      can_run: !!data.can_run,
      message: data.message || '',
      credit_balance: typeof data.balance === 'number' ? data.balance : (data.credit_balance ?? 0),
      subscription: data.subscription ?? null,
    };
  } catch (error) {
    console.error('Error fetching credits status:', error);
    return null;
  }
}

export function useCreditsStatus() {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: ['credits-status', session?.access_token],
    queryFn: () => fetchCreditsStatus(session?.access_token || null),
    enabled: !!session?.access_token,
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Consider stale after 30 seconds
  });
}